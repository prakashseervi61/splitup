'use client';

import { useState } from 'react';
import Link from 'next/link';
import GroupExpenseList from './GroupExpenseList';
import BalanceSheet from './BalanceSheet';
import SettlementList from '@/components/settlements/SettlementList';

interface ExpenseSplit {
  user_id: string;
  share_amount: number;
}

interface Expense {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  splits: ExpenseSplit[];
}

interface Settlement {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'disputed';
  note: string;
  created_at: string;
}

interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}

interface GroupMember {
  user_id: string;
  joined_at: string;
}

type Tab = 'expenses' | 'balances' | 'settlements';

const tabs: { key: Tab; label: string }[] = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'balances', label: 'Balances' },
  { key: 'settlements', label: 'Settlements' },
];

interface GroupTabsProps {
  expenses: Expense[];
  balances: Record<string, number>;
  simplified: SimplifiedDebt[] | null;
  settlements: Settlement[];
  groupId: string;
  members: GroupMember[];
  userId: string;
  onRefresh: () => void;
  refreshing?: boolean;
}

export default function GroupTabs({
  expenses,
  balances,
  simplified,
  settlements,
  groupId,
  members,
  userId,
  onRefresh,
  refreshing = false,
}: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('expenses');

  return (
    <>
      <div className="mb-6 flex items-end justify-between border-b border-border">
        <div className="flex gap-6" role="tablist" style={{ overflowX: "auto", scrollbarWidth: "none" as const }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-body'
              }`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link
          href={`/groups/${groupId}/recurring`}
          className="pb-3 pt-2 text-xs font-medium text-text-muted transition-colors hover:text-text-body"
        >
          Recurring
        </Link>
      </div>

      <div>
        {activeTab === 'expenses' && (
          <GroupExpenseList
            initialExpenses={expenses}
            groupId={groupId}
            members={members}
            userId={userId}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'balances' && (
          <BalanceSheet
            balances={balances}
            simplified={simplified}
            loading={refreshing}
            error=""
            groupId={groupId}
            members={members}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementList
            settlements={settlements}
            loading={refreshing}
            error=""
            groupId={groupId}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </>
  );
}
