import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProvider } from '@/lib/user-context';
import GroupTabs from '@/components/groups/GroupTabs';
import { type ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/components/groups/GroupExpenseList', () => ({
  default: () => <div data-testid="group-expense-list" />,
}));

vi.mock('@/components/groups/BalanceSheet', () => ({
  default: () => <div data-testid="balance-sheet" />,
}));

vi.mock('@/components/settlements/SettlementList', () => ({
  default: () => <div data-testid="settlement-list" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

const defaultProps = {
  expenses: [],
  balances: {},
  simplified: null,
  settlements: [],
  groupId: 'g1',
  members: [],
  userId: 'u1',
  onRefresh: vi.fn(),
};

describe('GroupTabs', () => {
  it('renders tablist container', () => {
    render(<GroupTabs {...defaultProps} />, { wrapper });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders all three tabs', () => {
    render(<GroupTabs {...defaultProps} />, { wrapper });
    expect(screen.getByRole('tab', { name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Balances' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Settlements' })).toBeInTheDocument();
  });

  it('marks Expenses tab as selected by default', () => {
    render(<GroupTabs {...defaultProps} />, { wrapper });
    expect(screen.getByRole('tab', { name: 'Expenses' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Balances' })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches active tab on click', () => {
    render(<GroupTabs {...defaultProps} />, { wrapper });
    fireEvent.click(screen.getByRole('tab', { name: 'Balances' }));
    expect(screen.getByRole('tab', { name: 'Balances' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Expenses' })).toHaveAttribute('aria-selected', 'false');
  });

  it('tablist has overflowX style', () => {
    render(<GroupTabs {...defaultProps} />, { wrapper });
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveStyle({ overflowX: 'auto' });
  });
});
