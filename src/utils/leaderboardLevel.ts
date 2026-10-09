/** Resolve API levels and, for older responses, the signed-in user's baseline. */
export function resolveLeaderboardLevel(...sources: unknown[]): string | null {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    const user = source as Record<string, unknown>;
    for (const value of [user.aiCefrLevel, user.cefrLevel]) {
      if (typeof value !== 'string') continue;
      const level = value.trim().toUpperCase();
      if (/^(A1|A2|B1|B2|C1|C2)$/.test(level)) return level;
    }
  }
  return null;
}
