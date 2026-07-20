'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@/types';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function NavBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === '/';
  const isLoginPage = pathname === '/login';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          href="/"
          onClick={handleBrandClick}
          className="text-lg font-bold tracking-tight text-primary"
        >
          <span className="font-display">Splitup</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-sm md:flex">
          {user ? (
            <div className="flex items-center gap-1">
              {!pathname.startsWith('/dashboard') && (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                {user.name}
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

        {/* Mobile: logged-in nav (always visible on small screens) */}
        {user && (
          <div className="flex items-center gap-1 text-sm md:hidden">
            {!pathname.startsWith('/dashboard') && (
              <Link
                href="/dashboard"
                className="rounded-lg px-2 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/profile"
              className="rounded-lg px-2 py-2.5 text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
            >
              {user.name}
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-border px-2 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile hamburger button (landing, not logged in) */}
        {!user && isLanding && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-text-body transition-colors hover:bg-surface-secondary md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all duration-[250ms] ease-in-out" style={{ transform: menuOpen ? 'rotate(45deg)' : 'translateY(-4px)' }} />
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all duration-[250ms] ease-in-out" style={{ opacity: menuOpen ? 0 : 1 }} />
            <span className="absolute h-0.5 w-5 rounded bg-current transition-all duration-[250ms] ease-in-out" style={{ transform: menuOpen ? 'rotate(-45deg)' : 'translateY(4px)' }} />
          </button>
        )}

        {/* Mobile sign-in button (non-landing pages, non-logged-in) */}
        {!user && !isLanding && (
          <Link
            href="/login"
            className="rounded-lg border border-border px-3 py-2.5 text-sm text-text-body transition-colors hover:bg-surface-secondary hover:text-text-heading md:hidden"
          >
            Sign In
          </Link>
        )}

        {/* Mobile menu panel */}
        {isLanding && !user && (
          <div
            ref={menuRef}
            className={`absolute left-0 top-14 w-full overflow-hidden border-b border-border bg-white shadow-lg transition-all duration-[250ms] ease-in-out md:hidden ${
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
