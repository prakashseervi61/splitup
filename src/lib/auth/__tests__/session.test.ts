import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/store', () => ({
  findUserById: vi.fn(),
}));

vi.mock('@/lib/auth/mock-session', () => ({
  getMockSessionUserIdServer: vi.fn(),
}));

import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/db/store';
import { getMockSessionUserIdServer } from '@/lib/auth/mock-session';

const mockGetMockSession = getMockSessionUserIdServer as ReturnType<typeof vi.fn>;
const mockFindUser = findUserById as ReturnType<typeof vi.fn>;

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('returns null when no mock session userId', async () => {
      mockGetMockSession.mockResolvedValue(null);
      const result = await getSession();
      expect(result).toBeNull();
      expect(mockFindUser).not.toHaveBeenCalled();
    });

    it('returns null when userId exists but user not found', async () => {
      mockGetMockSession.mockResolvedValue('user-123');
      mockFindUser.mockResolvedValue(null);
      const result = await getSession();
      expect(result).toBeNull();
    });

    it('returns session when user is found', async () => {
      const fakeUser = { id: 'u1', name: 'Alice' };
      mockGetMockSession.mockResolvedValue('u1');
      mockFindUser.mockResolvedValue(fakeUser);
      const result = await getSession();
      expect(result).toEqual({ user: fakeUser });
    });

    it('returns null on thrown error', async () => {
      mockGetMockSession.mockRejectedValue(new Error('db down'));
      const result = await getSession();
      expect(result).toBeNull();
    });
  });
});
