/** Stable number formatting for SSR (avoids locale hydration mismatches). */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
