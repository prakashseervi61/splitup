// E2E test via the Next.js dev server — tests mock auth + all API flows
const BASE = 'http://localhost:3000';
const PASS = []; const FAIL = [];
function p(msg) { PASS.push(msg); console.log(`  ✅ ${msg}`); }
function f(msg) { FAIL.push(msg); console.log(`  ❌ ${msg}`); }

async function main() {
  // 1. Test login page loads
  const loginRes = await fetch(`${BASE}/login`);
  if (loginRes.ok) p('Login page responds 200'); else f('Login page: ' + loginRes.status);

  // 2. Send OTP
  const sendRes = await fetch(`${BASE}/api/auth/send-otp`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ phone: '+919999999999' }),
  });
  const sendData = await sendRes.json();
  if (sendRes.ok && sendData.success) p('Send OTP succeeds'); else f('Send OTP: ' + JSON.stringify(sendData));

  // 3. Verify with any 6-digit OTP
  const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ phone: '+919999999999', otp: '123456' }),
  });
  const verifyData = await verifyRes.json();
  if (verifyRes.ok && verifyData.user) p(`Verify OTP: logged in as ${verifyData.user.name} (${verifyData.user.id.slice(0,8)}...)`);
  else f('Verify OTP: ' + JSON.stringify(verifyData));

  const cookies = verifyRes.headers.get('set-cookie') || '';
  if (cookies.includes('mock_session')) p('Mock session cookie set');
  else f('No mock_session cookie');

  // 4. Use the session cookie to access protected routes
  const cookieHeader = cookies.split(';')[0]; // get the mock_session=xxx part

  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { 'Cookie': cookieHeader } });
  const meData = await meRes.json();
  if (meRes.ok && meData.id) p(`/api/auth/me returns user: ${meData.name}`); else f('/api/auth/me: ' + JSON.stringify(meData));

  // 5. Create a group
  const groupRes = await fetch(`${BASE}/api/groups`, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'Cookie': cookieHeader},
    body: JSON.stringify({
      name: 'E2E Test PG', type: 'pg', created_by: meData.id,
      newMembers: [{ name: 'Alice', phone: '+919999999991' }, { name: 'Bob', phone: '+919999999992' }],
    }),
  });
  const group = await groupRes.json();
  if (groupRes.ok && group.id) p(`Group created: "${group.name}" (${group.members.length} members)`); else f('Create group: ' + JSON.stringify(group));

  // 6. Add expense with equal split
  const expRes = await fetch(`${BASE}/api/groups/${group.id}/expenses`, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'Cookie': cookieHeader},
    body: JSON.stringify({ paid_by: meData.id, amount: 600, description: 'Dinner', category: 'Food', split_method: 'equal' }),
  });
  const expense = await expRes.json();
  if (expRes.ok && expense.id) p(`Expense added: ₹${expense.amount} "${expense.description}" (${expense.splits.length}-way split)`); else f('Add expense: ' + JSON.stringify(expense));

  // 7. Get balances
  const balRes = await fetch(`${BASE}/api/groups/${group.id}/balances?simplified=true`, { headers: { 'Cookie': cookieHeader } });
  const balances = await balRes.json();
  if (balRes.ok && balances.balances) p(`Balances computed: ${Object.keys(balances.balances).length} members`); else f('Balances: ' + JSON.stringify(balances));

  // 8. Create and confirm settlement
  if (balances.simplified && balances.simplified.length > 0) {
    const debt = balances.simplified[0];
    const settleRes = await fetch(`${BASE}/api/groups/${group.id}/settlements`, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'Cookie': cookieHeader},
      body: JSON.stringify({ from_user: debt.from, to_user: debt.to, amount: debt.amount }),
    });
    const settlement = await settleRes.json();
    if (settleRes.ok) p(`Settlement created: ${settlement.id.slice(0,8)}... (${settlement.status})`); else f('Create settlement: ' + JSON.stringify(settlement));

    const confirmRes = await fetch(`${BASE}/api/groups/${group.id}/settlements/${settlement.id}`, {
      method: 'PATCH', headers: {'Content-Type': 'application/json', 'Cookie': cookieHeader},
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const confirmed = await confirmRes.json();
    if (confirmRes.ok) p(`Settlement confirmed: ${confirmed.status}`); else f('Confirm: ' + JSON.stringify(confirmed));
  }

  // 9. List groups
  const listRes = await fetch(`${BASE}/api/groups?userId=${meData.id}`, { headers: { 'Cookie': cookieHeader } });
  const list = await listRes.json();
  if (listRes.ok && Array.isArray(list)) p(`List groups: ${list.length} group(s)`); else f('List groups: ' + JSON.stringify(list));

  // 10. Logout
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: { 'Cookie': cookieHeader } });
  const logout = await logoutRes.json();
  if (logoutRes.ok && logout.success) p('Logout succeeds'); else f('Logout: ' + JSON.stringify(logout));

  // Summary
  console.log(`\n📊 RESULTS: ${PASS.length} passed, ${FAIL.length} failed`);
  if (FAIL.length === 0) console.log('\n🎉 FULL E2E FLOW VERIFIED!');
  else process.exit(1);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
