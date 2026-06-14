/** Muted avatar palette — distinct hues, calm on dark UI. Order: green, orange, red, blue, purple. */
const AVATAR_COLORS = [
  '#3d7a5c', // green (sage)
  '#c47a3a', // orange (amber)
  '#b85c5c', // red (terracotta)
  '#4a7a9a', // blue (slate)
  '#7a6a9a', // purple (dusty)
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Stable color from user id (fallback username for mock-only paths). */
export function getAvatarColor(seed: string): string {
  return AVATAR_COLORS[hashSeed(seed) % AVATAR_COLORS.length];
}

export function getAvatarLetter(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}
