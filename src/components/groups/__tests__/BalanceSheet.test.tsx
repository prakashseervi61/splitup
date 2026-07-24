import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProvider } from '@/lib/user-context';
import BalanceSheet from '@/components/groups/BalanceSheet';
import { type ReactNode } from 'react';

vi.mock('@/components/settlements/SettleFlow', () => ({
  default: () => <div data-testid="settle-flow" />,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

describe('BalanceSheet', () => {
  describe('arrow indicators', () => {
    it('renders up arrow with aria-label for positive balance', () => {
      render(
        <BalanceSheet
          balances={{ u1: 500 }}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[{ user_id: 'u1' }]}
        />,
        { wrapper }
      );
      expect(screen.getByLabelText('gets money back')).toBeInTheDocument();
    });

    it('renders down arrow with aria-label for negative balance', () => {
      render(
        <BalanceSheet
          balances={{ u1: -300 }}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[{ user_id: 'u1' }]}
        />,
        { wrapper }
      );
      expect(screen.getByLabelText('owes money')).toBeInTheDocument();
    });

    it('does not render arrows for settled balance', () => {
      render(
        <BalanceSheet
          balances={{ u1: 0 }}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[{ user_id: 'u1' }]}
        />,
        { wrapper }
      );
      expect(screen.queryByLabelText('gets money back')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('owes money')).not.toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('shows loading skeletons', () => {
      render(
        <BalanceSheet
          balances={{}}
          simplified={null}
          loading={true}
          error=""
          groupId="g1"
          members={[]}
        />,
        { wrapper }
      );
      expect(screen.queryByText('Net Balances')).not.toBeInTheDocument();
    });

    it('shows error message', () => {
      render(
        <BalanceSheet
          balances={{}}
          simplified={null}
          loading={false}
          error="Something went wrong"
          groupId="g1"
          members={[]}
        />,
        { wrapper }
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows all-settled when no balances', () => {
      render(
        <BalanceSheet
          balances={{}}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[]}
        />,
        { wrapper }
      );
      expect(screen.getByText('All settled up')).toBeInTheDocument();
    });
  });

  describe('CSS variables', () => {
    it('uses var(--color-success) for positive balance text', () => {
      render(
        <BalanceSheet
          balances={{ u1: 100 }}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[{ user_id: 'u1' }]}
        />,
        { wrapper }
      );
      const balSpan = screen.getByText((_, element) => {
        return element?.tagName === 'SPAN' && element.textContent?.includes('100.00') === true;
      });
      expect(balSpan).toHaveStyle({ color: 'var(--color-success)' });
    });

    it('uses var(--color-danger) for negative balance text', () => {
      render(
        <BalanceSheet
          balances={{ u1: -100 }}
          simplified={null}
          loading={false}
          error=""
          groupId="g1"
          members={[{ user_id: 'u1' }]}
        />,
        { wrapper }
      );
      const balSpan = screen.getByText((_, element) => {
        return element?.tagName === 'SPAN' && element.textContent?.includes('100.00') === true;
      });
      expect(balSpan).toHaveStyle({ color: 'var(--color-danger)' });
    });
  });
});
