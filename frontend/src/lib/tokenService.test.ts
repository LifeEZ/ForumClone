import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ACCESS_KEY = 'hiver_access_token';
const REFRESH_KEY = 'hiver_refresh_token';

async function importFresh() {
  vi.resetModules();
  return (await import('@/lib/tokenService')) as typeof import('@/lib/tokenService');
}

describe('TokenService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns null when nothing is stored', async () => {
    const ts = await importFresh();
    expect(ts.TokenService.getAccessToken()).toBeNull();
    expect(ts.TokenService.getRefreshToken()).toBeNull();
    expect(ts.TokenService.hasAccessToken()).toBe(false);
  });

  it('set() stores tokens in memory and localStorage', async () => {
    const ts = await importFresh();
    ts.TokenService.set({
      access_token: 'a1',
      refresh_token: 'r1',
      token_type: 'bearer',
    });
    expect(ts.TokenService.getAccessToken()).toBe('a1');
    expect(ts.TokenService.getRefreshToken()).toBe('r1');
    expect(ts.TokenService.hasAccessToken()).toBe(true);
    expect(localStorage.getItem(ACCESS_KEY)).toBe('a1');
    expect(localStorage.getItem(REFRESH_KEY)).toBe('r1');
  });

  it('clear() removes tokens from memory and storage', async () => {
    const ts = await importFresh();
    ts.TokenService.set({
      access_token: 'a1',
      refresh_token: 'r1',
      token_type: 'bearer',
    });
    ts.TokenService.clear();
    expect(ts.TokenService.getAccessToken()).toBeNull();
    expect(ts.TokenService.getRefreshToken()).toBeNull();
    expect(ts.TokenService.hasAccessToken()).toBe(false);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('rehydrates from localStorage on module import', async () => {
    localStorage.setItem(ACCESS_KEY, 'stored-access');
    localStorage.setItem(REFRESH_KEY, 'stored-refresh');
    const ts = await importFresh();
    expect(ts.TokenService.getAccessToken()).toBe('stored-access');
    expect(ts.TokenService.getRefreshToken()).toBe('stored-refresh');
    expect(ts.TokenService.hasAccessToken()).toBe(true);
  });

  it('rehydrates when set() is called on a fresh import after prior set', async () => {
    const ts = await importFresh();
    ts.TokenService.set({
      access_token: 'a2',
      refresh_token: 'r2',
      token_type: 'bearer',
    });
    const ts2 = await importFresh();
    expect(ts2.TokenService.getAccessToken()).toBe('a2');
  });

  it('outgoing token_type is accepted and ignored', async () => {
    const ts = await importFresh();
    ts.TokenService.set({
      access_token: 'a3',
      refresh_token: 'r3',
      token_type: 'bearer',
    });
    expect(ts.TokenService.getAccessToken()).toBe('a3');
  });

  it('set() overwrites previous tokens', async () => {
    const ts = await importFresh();
    ts.TokenService.set({
      access_token: 'a3',
      refresh_token: 'r3',
      token_type: 'bearer',
    });
    ts.TokenService.set({
      access_token: 'a4',
      refresh_token: 'r4',
      token_type: 'bearer',
    });
    expect(ts.TokenService.getAccessToken()).toBe('a4');
    expect(ts.TokenService.getRefreshToken()).toBe('r4');
    expect(localStorage.getItem(ACCESS_KEY)).toBe('a4');
  });
});
