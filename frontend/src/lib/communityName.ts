// Mirrors the Content service `CommunityCreate.name` validator so the form can
// give immediate inline feedback that matches the server's 422 rules.

export const RESERVED_SLUGS: readonly string[] = [
  'mine',
  'api',
  'admin',
  'mod',
  'all',
  'popular',
  'new',
  'home',
  'create-community',
  'login',
  'register',
  'auth',
  'users',
  'posts',
  'c',
];

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateCommunityName(name: string): string | null {
  if (name.length < 3 || name.length > 30) {
    return 'Name must be 3–30 characters.';
  }
  if (!SLUG_RE.test(name)) {
    return 'Use lowercase letters, digits, and single hyphens only.';
  }
  if (RESERVED_SLUGS.includes(name)) {
    return 'That name is reserved.';
  }
  return null;
}
