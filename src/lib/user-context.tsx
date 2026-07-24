'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface UserInfo {
  id: string;
  name: string;
  phone: string;
  default_vpa: string;
}

type UserMap = Record<string, UserInfo>;

interface UserContextValue {
  /** Get a user's display name, falling back to a truncated ID */
  getUserName: (id: string) => string;
  /** Get a user's saved VPA */
  getUserVpa: (id: string) => string;
  /** Cache multiple users at once from API response */
  cacheUsers: (users: UserMap) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserMap>({});

  const getUserName = useCallback(
    (id: string) => users[id]?.name ?? `User ${id.slice(0, 6)}`,
    [users],
  );

  const getUserVpa = useCallback(
    (id: string) => users[id]?.default_vpa ?? '',
    [users],
  );

  const cacheUsers = useCallback((newUsers: UserMap) => {
    setUsers((prev) => ({ ...prev, ...newUsers }));
  }, []);

  return (
    <UserContext.Provider value={{ getUserName, getUserVpa, cacheUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
