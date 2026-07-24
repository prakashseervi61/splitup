import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UserProvider, useUser } from '@/lib/user-context';
import { type ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

describe('user-context', () => {
  describe('useUser', () => {
    it('throws when used outside UserProvider', () => {
      expect(() => renderHook(() => useUser())).toThrow(
        'useUser must be used within a UserProvider'
      );
    });

    it('returns context when used inside UserProvider', () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      expect(result.current).toBeDefined();
      expect(typeof result.current.getUserName).toBe('function');
      expect(typeof result.current.getUserVpa).toBe('function');
      expect(typeof result.current.cacheUsers).toBe('function');
    });
  });

  describe('getUserName', () => {
    it('returns truncated ID fallback for unknown user', () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      expect(result.current.getUserName('abc123xyz')).toBe('User abc123');
    });
  });

  describe('getUserVpa', () => {
    it('returns empty string for unknown user', () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      expect(result.current.getUserVpa('unknown-id')).toBe('');
    });
  });

  describe('cacheUsers', () => {
    it('caches users and getUserName resolves them', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      act(() => {
        result.current.cacheUsers({
          u1: { id: 'u1', name: 'Alice', phone: '123', default_vpa: 'alice@upi' },
        });
      });
      expect(result.current.getUserName('u1')).toBe('Alice');
    });

    it('caches users and getUserVpa resolves them', async () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      act(() => {
        result.current.cacheUsers({
          u1: { id: 'u1', name: 'Alice', phone: '123', default_vpa: 'alice@upi' },
        });
      });
      expect(result.current.getUserVpa('u1')).toBe('alice@upi');
    });
  });
});
