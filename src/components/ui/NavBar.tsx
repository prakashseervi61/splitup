'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/types';

export default function NavBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const isLoginPage = pathname === '/login';

  // ponytail: hide entirely on login page — auth layout doesn't need nav
  if (isLoginPage) return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          Splitup
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {!isHome && (
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
            >
              Dashboard
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-body">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Logout
              </button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
