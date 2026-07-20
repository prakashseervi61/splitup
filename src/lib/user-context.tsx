'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

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
  /** Get full user info */
  getUser: (id: string) => UserInfo | undefined;
  /** Cache multiple users at once from API response */
  cacheUsers: (users: UserMap) => void;
  /** Fetch a batch of user IDs from the API and cache them */
  ensureUsers: (ids: string[]) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserMap>({});
  // ponytail: ref avoids stale closure in ensureUsers
  const usersRef = useRef(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const getUserName = useCallback(
    (id: string) => users[id]?.name ?? `User ${id.slice(0, 6)}`,
    [users],
  );

  const getUserVpa = useCallback(
    (id: string) => users[id]?.default_vpa ?? '',
    [users],
  );

  const getUser = useCallback((id: string) => users[id], [users]);

  const cacheUsers = useCallback((newUsers: UserMap) => {
    setUsers((prev) => ({ ...prev, ...newUsers }));
  }, []);

  const ensureUsers = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => !usersRef.current[id]);
    if (missing.length === 0) return;
    try {
      const res = await fetch(`/api/users/batch?ids=${missing.join(',')}`);
      if (res.ok) {
        const data: UserMap = await res.json();
        setUsers((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // silently fail — names will show truncated IDs
    }
  }, []);

  return (
    <UserContext.Provider value={{ getUserName, getUserVpa, getUser, cacheUsers, ensureUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
