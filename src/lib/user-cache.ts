const nameCache: Record<string, string> = { "user-1": "You" };
const vpaCache: Record<string, string> = { "user-1": "you@upi" };

export function getUserName(userId: string): string {
  return nameCache[userId] ?? userId.slice(0, 8);
}

export function setUserName(userId: string, name: string): void {
  nameCache[userId] = name;
}

export function getUserVpa(userId: string): string {
  return vpaCache[userId] ?? "";
}

export function setUserVpa(userId: string, vpa: string): void {
  vpaCache[userId] = vpa;
}
