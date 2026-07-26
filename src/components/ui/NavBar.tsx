'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@/types';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- prop required by caller
export default function NavBar({ user: _user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === '/';
  const isLoginPage = pathname === '/login';
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setUser(data && !data.error ? data : null);
        setHydrated(true);
      })
      .catch(() => {
        setUser(null);
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/invites/count')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setInviteCount(d.count); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    closeMenu();
  }, [pathname, closeMenu]);

  // ponytail: hide entirely on login page — auth layout doesn't need nav
  if (isLoginPage) return null;

  const handleLogout = async () => {
    closeMenu();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLanding) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md ${isLanding ? 'border-transparent' : ''}`}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          onClick={handleBrandClick}
          className="text-lg font-bold tracking-tight text-primary"
        >
          <span className="font-display">Splitup</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-sm md:flex">
          {!hydrated ? (
            <div className="h-9 w-48 bg-gray-100 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Dashboard
              </Link>
              <Link
                href="/inbox"
                className="relative rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Invite
                {inviteCount > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-bold text-white" style={{ fontSize: "10px" }}>
                    {inviteCount > 9 ? '9+' : inviteCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Logout
              </button>
            </div>
          ) : isLanding ? (
            <>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                How it works
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                FAQ
              </button>
              <Link
                href="/login"
                className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Sign In
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile hamburger button (logged-in users OR landing page) */}
        {(hydrated && (user || (!user && isLanding))) && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-text-body transition-colors hover:bg-surface-secondary md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all ease-in-out" style={{ transitionDuration: "250ms", transform: menuOpen ? 'rotate(45deg)' : 'translateY(-4px)' }} />
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all ease-in-out" style={{ transitionDuration: "250ms", opacity: menuOpen ? 0 : 1 }} />
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all ease-in-out" style={{ transitionDuration: "250ms", transform: menuOpen ? 'rotate(-45deg)' : 'translateY(4px)' }} />
          </button>
        )}

        {/* Mobile sign-in button (non-landing pages, non-logged-in) */}
        {hydrated && !user && !isLanding && (
          <Link
            href="/login"
            className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading md:hidden"
          >
            Sign In
          </Link>
        )}

        {/* Mobile menu panel — logged-in users */}
        {hydrated && user && (
          <div
            ref={menuRef}
            className={`absolute left-0 top-14 w-full overflow-hidden border-b border-border bg-white shadow-lg transition-all ease-in-out md:hidden ${
              menuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 border-b-0'
            }`}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-left text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Dashboard
              </Link>
              <Link
                href="/inbox"
                onClick={closeMenu}
                className="relative flex items-center gap-2 rounded-lg px-3 py-3 text-left text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Invite
                {inviteCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white" style={{ fontSize: "10px" }}>
                    {inviteCount > 9 ? '9+' : inviteCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-left text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-3 text-center text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Mobile menu panel — landing page, not logged in */}
        {hydrated && isLanding && !user && (
          <div
            ref={menuRef}
            className={`absolute left-0 top-14 w-full overflow-hidden border-b border-border bg-white shadow-lg transition-all ease-in-out md:hidden ${
              menuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 border-b-0'
            }`}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <button
                onClick={() => { scrollToSection('how-it-works'); closeMenu(); }}
                className="rounded-lg px-3 py-3 text-left text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                How it works
              </button>
              <button
                onClick={() => { scrollToSection('faq'); closeMenu(); }}
                className="rounded-lg px-3 py-3 text-left text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                FAQ
              </button>
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-lg border border-border px-3 py-3 text-center text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
