// ---------------------------------------------------------------------------
// Client-side cache for user display names and VPAs.
// Populated by components when they receive user/member data from API calls.
// ---------------------------------------------------------------------------

const nameCache: Record<string, string> = {};
const vpaCache: Record<string, string> = {};

export function setUserName(id: string, name: string): void {
  nameCache[id] = name;
}

export function getUserName(id: string): string {
  return nameCache[id] ?? `User ${id.slice(0, 6)}`;
}

export function getUserVpa(id: string): string {
  return vpaCache[id] ?? '';
}
