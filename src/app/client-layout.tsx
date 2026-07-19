'use client';

import { UserProvider } from '@/lib/user-context';
import { type ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
