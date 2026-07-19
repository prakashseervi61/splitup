const nameCache: Record<string, string> = { "user-1": "You" };

export function getUserName(userId: string): string {
  return nameCache[userId] ?? userId.slice(0, 8);
}

export function setUserName(userId: string, name: string): void {
  nameCache[userId] = name;
}
