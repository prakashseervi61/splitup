// E2E test: create group → add expense → balance → settle → confirm → verify
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const PASS = [];
const FAIL = [];

function pass(msg) { PASS.push(msg); console.log(`  ✅ ${msg}`); }
function fail(msg) { FAIL.push(msg); console.log(`  ❌ ${msg}`); }

async function cleanup() {
  // Clean up test data
  await supabase.from('expense_splits').delete().neq('expense_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('settlements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('group_members').delete().neq('group_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

async function main() {
  console.log('\n🧪 SPLITUP E2E TEST\n');
  console.log('--- Setup ---');

  // Create test users
  const { data: user1 } = await supabase.from('users').insert({ name: 'Alice', phone: '+919999999990', default_vpa: 'alice@paytm' }).select().single();
  if (user1) pass(`Created user Alice (${user1.id.slice(0,8)}...)`); else fail('Failed to create Alice');
  
  const { data: user2 } = await supabase.from('users').insert({ name: 'Bob', phone: '+919999999991', default_vpa: 'bob@paytm' }).select().single();
  if (user2) pass(`Created user Bob (${user2.id.slice(0,8)}...)`); else fail('Failed to create Bob');

  const { data: user3 } = await supabase.from('users').insert({ name: 'Charlie', phone: '+919999999992', default_vpa: '' }).select().single();
  if (user3) pass(`Created user Charlie (${user3.id.slice(0,8)}...)`); else fail('Failed to create Charlie');

  console.log('\n--- 1. Create Group ---');
  const { data: group, error: grpErr } = await supabase.from('groups').insert({ name: 'Test PG', type: 'pg', created_by: user1.id }).select().single();
  if (grpErr) { fail(`Group create: ${grpErr.message}`); return; }
  pass(`Group "${group.name}" created`);

  // Add members
  const members = [user1.id, user2.id, user3.id];
  for (const uid of members) {
    const { error: me } = await supabase.from('group_members').insert({ group_id: group.id, user_id: uid });
    if (me) fail(`Add member ${uid.slice(0,8)}: ${me.message}`);
  }
  pass(`3 members added`);

  console.log('\n--- 2. Add Expense (equal split ₹300) ---');
  const { data: exp, error: expErr } = await supabase.from('expenses').insert({
    group_id: group.id, paid_by: user1.id, amount: 300, description: 'Groceries', category: 'Food'
  }).select().single();
  if (expErr) { fail(`Expense: ${expErr.message}`); return; }
  pass(`Expense ₹${exp.amount} - "${exp.description}" created`);

  // Equal splits: ₹100 each
  for (const uid of members) {
    const { error: se } = await supabase.from('expense_splits').insert({ expense_id: exp.id, user_id: uid, share_amount: 100 });
    if (se) fail(`Split for ${uid.slice(0,8)}: ${se.message}`);
  }
  pass(`3 equal splits (₹100 each) created`);

  console.log('\n--- 3. Verify Balances ---');
  const { data: splits } = await supabase.from('expense_splits').select('*').eq('expense_id', exp.id);
  const { data: allExpenses } = await supabase.from('expenses').select('*').eq('group_id', group.id);
  const { data: allSettlements } = await supabase.from('settlements').select('*').eq('group_id', group.id);

  // Alice paid 300, each owes 100 => Alice: +200, Bob: -100, Charlie: -100  
  const balances = {};
  for (const e of allExpenses) {
    balances[e.paid_by] = (balances[e.paid_by] || 0) + e.amount;
  }
  for (const s of splits) {
    balances[s.user_id] = (balances[s.user_id] || 0) - s.share_amount;
  }
  for (const s of allSettlements || []) {
    if (s.status === 'confirmed') {
      balances[s.from_user] = (balances[s.from_user] || 0) + s.amount;
      balances[s.to_user] = (balances[s.to_user] || 0) - s.amount;
    }
  }
  
  if (Math.abs(balances[user1.id] - 200) < 0.01 && Math.abs(balances[user2.id] + 100) < 0.01 && Math.abs(balances[user3.id] + 100) < 0.01) {
    pass(`Balances correct: Alice +₹200, Bob -₹100, Charlie -₹100`);
  } else {
    fail(`Balances incorrect: ${JSON.stringify(balances)}`);
  }

  console.log('\n--- 4. Create Pending Settlement (Bob → Alice ₹100) ---');
  const { data: settle, error: setErr } = await supabase.from('settlements').insert({
    group_id: group.id, from_user: user2.id, to_user: user1.id, amount: 100, status: 'pending', note: 'Groceries share'
  }).select().single();
  if (setErr) { fail(`Settlement: ${setErr.message}`); return; }
  pass(`Pending settlement Bob → Alice ₹100 created`);

  console.log('\n--- 5. Confirm Settlement ---');
  const { error: confErr } = await supabase.from('settlements').update({ status: 'confirmed', settled_at: new Date().toISOString() }).eq('id', settle.id);
  if (confErr) { fail(`Confirm: ${confErr.message}`); return; }
  pass(`Settlement confirmed`);

  console.log('\n--- 6. Verify Updated Balances ---');
  // After settlement (confirmed): Bob paid Alice 100
  // Alice: +200 - 100 = +100, Bob: -100 + 100 = 0, Charlie: -100
  const { data: updatedSettlements } = await supabase.from('settlements').select('*').eq('group_id', group.id);
  
  const balances2 = {};
  for (const e of allExpenses) {
    balances2[e.paid_by] = (balances2[e.paid_by] || 0) + e.amount;
  }
  for (const s of splits) {
    balances2[s.user_id] = (balances2[s.user_id] || 0) - s.share_amount;
  }
  for (const s of updatedSettlements) {
    if (s.status === 'confirmed') {
      balances2[s.from_user] = (balances2[s.from_user] || 0) + s.amount;
      balances2[s.to_user] = (balances2[s.to_user] || 0) - s.amount;
    }
  }

  if (Math.abs(balances2[user1.id] - 100) < 0.01 && Math.abs(balances2[user2.id]) < 0.01 && Math.abs(balances2[user3.id] + 100) < 0.01) {
    pass(`Updated balances correct: Alice +₹100, Bob ₹0, Charlie -₹100`);
  } else {
    fail(`Updated balances incorrect: ${JSON.stringify(balances2)}`);
  }

  console.log('\n--- Results ---');
  console.log(`  ✅ ${PASS.length} passed`);
  console.log(`  ❌ ${FAIL.length} failed`);
  
  if (FAIL.length === 0) {
    console.log('\n🎉 END-TO-END FLOW VERIFIED!');
  } else {
    console.log(`\n⚠️ ${FAIL.length} failures`);
  }

  // Cleanup
  await cleanup();
}

main().catch(e => {
  console.error('\n💥 Fatal error:', e.message);
  process.exit(1);
});
