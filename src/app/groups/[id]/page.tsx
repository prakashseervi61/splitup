import { getSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import {
  getGroup,
  getGroupMembers,
  findUsersByIds,
  computeBalances,
  getGroupExpenses,
  getExpenseSplitsBatch,
  getGroupSettlements,
  isGroupMember,
} from '@/lib/db/store';
import { simplifyDebts } from '@/lib/utils/split';
import GroupDetailClient from '@/components/groups/GroupDetailClient';

function collectUserIds(
  members: { user_id: string }[],
  expenses: { paid_by: string; splits: { user_id: string }[] }[],
  settlements: { from_user: string; to_user: string }[],
): string[] {
  const set = new Set<string>();
  for (const m of members) set.add(m.user_id);
  for (const e of expenses) {
    set.add(e.paid_by);
    for (const s of e.splits) set.add(s.user_id);
  }
  for (const s of settlements) {
    set.add(s.from_user);
    set.add(s.to_user);
  }
  return [...set];
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const [group, isMember] = await Promise.all([
    getGroup(id),
    isGroupMember(id, session.user.id),
  ]);

  if (!group || !isMember) notFound();

  const [members, balances, rawExpenses, settlements] = await Promise.all([
    getGroupMembers(id),
    computeBalances(id),
    getGroupExpenses(id),
    getGroupSettlements(id),
  ]);

  const expenseIds = rawExpenses.map(e => e.id);
  const splitsBatch = expenseIds.length > 0 ? await getExpenseSplitsBatch(expenseIds) : [];
  const splitMap: Record<string, typeof splitsBatch> = {};
  for (const s of splitsBatch) {
    if (!splitMap[s.expense_id]) splitMap[s.expense_id] = [];
    splitMap[s.expense_id].push(s);
  }
  const expensesWithSplits = rawExpenses.map(exp => ({
    ...exp,
    splits: splitMap[exp.id] || [],
  }));

  const simplified = simplifyDebts(balances);

  const userIds = collectUserIds(members, expensesWithSplits, settlements);
  const users = await findUsersByIds(userIds);
  const userMap: Record<string, { id: string; name: string; phone: string; default_vpa: string }> = {};
  for (const u of users) {
    userMap[u.id] = { id: u.id, name: u.name, phone: u.phone, default_vpa: u.default_vpa ?? '' };
  }

  return (
    <GroupDetailClient
      group={{
        ...group,
        members,
        balances,
      }}
      expenses={expensesWithSplits}
      balances={balances}
      simplified={simplified}
      settlements={settlements}
      userId={session.user.id}
      users={userMap}
    />
  );
}
