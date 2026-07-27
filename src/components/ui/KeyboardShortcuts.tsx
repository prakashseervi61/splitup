'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const SHORTCUTS = [
  { keys: 'g then g', action: 'Go to Dashboard' },
  { keys: 'g then i', action: 'Go to Inbox' },
  { keys: 'g then p', action: 'Go to Profile' },
  { keys: 'n', action: 'Create new group' },
  { keys: 'e', action: 'Add expense' },
  { keys: '?', action: 'Show keyboard shortcuts' },
];

function isEditable(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const pendingRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearPending = useCallback(() => {
    pendingRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const showHelpHandler = () => setShowHelp(true);
    window.addEventListener('shortcut:show-help', showHelpHandler);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (showHelp) {
        if (e.key === 'Escape') {
          setShowHelp(false);
          e.preventDefault();
        }
        return;
      }

      const key = e.key.toLowerCase();

      if (key === '?') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      if (key === 'escape') {
        clearPending();
        return;
      }

      if (pendingRef.current) {
        if (key === 'g' || key === 'i' || key === 'p') {
          e.preventDefault();
          clearPending();
          if (key === 'g') router.push('/dashboard');
          else if (key === 'i') router.push('/inbox');
          else if (key === 'p') router.push('/profile');
          return;
        }
        clearPending();
      }

      if (key === 'g') {
        e.preventDefault();
        pendingRef.current = 'g';
        timeoutRef.current = setTimeout(clearPending, 500);
        return;
      }

      if (key === 'n') {
        e.preventDefault();
        if (pathname === '/dashboard') {
          window.dispatchEvent(new CustomEvent('shortcut:new-group'));
        } else {
          router.push('/dashboard');
        }
        return;
      }

      if (key === 'e') {
        if (/^\/groups\/[\w-]+$/.test(pathname)) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('shortcut:add-expense'));
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('shortcut:show-help', showHelpHandler);
    };
  }, [router, pathname, showHelp, clearPending]);

  return (
    <>
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <div
            className="w-full max-w-md scale-95 rounded-2xl bg-surface shadow-2xl transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-text-heading">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-body"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between">
                    <span className="text-sm text-text-body">{s.action}</span>
                    <kbd className="rounded-md border border-border bg-surface-secondary px-2 py-1 text-xs font-medium text-text-muted">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-text-muted">
                Press <kbd className="rounded border border-border bg-surface-secondary px-1 py-0.5 text-xs">?</kbd> anytime to show this help.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
