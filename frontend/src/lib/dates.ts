const HAS_TIMEZONE = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** Parse API timestamps stored as naive UTC ISO strings. */
export function parseApiDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(HAS_TIMEZONE.test(value) ? value : `${value}Z`);
}
