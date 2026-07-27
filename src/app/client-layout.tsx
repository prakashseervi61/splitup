'use client';

import { UserProvider } from '@/lib/user-context';
import { type ReactNode } from 'react';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <KeyboardShortcuts />
      {children}
    </UserProvider>
  );
}
