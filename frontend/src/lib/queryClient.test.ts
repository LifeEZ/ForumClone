import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { isTransientQueryError, makeQueryClient } from '@/lib/queryClient';
import { ApiError, SessionExpiredError } from '@/lib/api';

function retryOf(qc: QueryClient) {
  return qc.getDefaultOptions().queries!.retry as (
    failureCount: number,
    error: unknown,
  ) => boolean;
}

function retryDelayOf(qc: QueryClient) {
  return qc.getDefaultOptions().queries!.retryDelay as (
    failureCount: number,
    error: unknown,
  ) => number;
}

describe('makeQueryClient', () => {
  it('retries transient ApiError (429/5xx) up to 3 attempts', () => {
    const qc = makeQueryClient();
    const r = retryOf(qc);
    expect(r(0, new ApiError(429, 'slow'))).toBe(true);
    expect(r(2, new ApiError(500, 'boom'))).toBe(true);
    expect(r(3, new ApiError(503, 'boom'))).toBe(false);
  });

  it('does not retry 4xx client errors', () => {
    const qc = makeQueryClient();
    const r = retryOf(qc);
    expect(r(0, new ApiError(403, 'nope'))).toBe(false);
    expect(r(0, new ApiError(404, 'missing'))).toBe(false);
  });

  it('does not retry SessionExpiredError', () => {
    const qc = makeQueryClient();
    const r = retryOf(qc);
    expect(r(0, new SessionExpiredError())).toBe(false);
  });

  it('retries non-ApiError (network) errors', () => {
    const qc = makeQueryClient();
    const r = retryOf(qc);
    expect(r(0, new TypeError('failed to fetch'))).toBe(true);
  });

  it('retryDelay grows exponentially', () => {
    const qc = makeQueryClient();
    const d = retryDelayOf(qc);
    const d0 = d(0, new ApiError(500, 'x'));
    const d1 = d(1, new ApiError(500, 'x'));
    const d2 = d(2, new ApiError(500, 'x'));
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
    expect(d0).toBeGreaterThan(0);
  });

  it('mutations do not retry', () => {
    const qc = makeQueryClient();
    expect(qc.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('default staleTime is 0 and refetchOnWindowFocus is true', () => {
    const qc = makeQueryClient();
    expect(qc.getDefaultOptions().queries?.staleTime).toBe(0);
    expect(qc.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(true);
  });

  it('returns a fresh QueryClient each call', () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient());
  });
});

describe('isTransientQueryError', () => {
  it('classifies 429 and 5xx as transient', () => {
    expect(isTransientQueryError(new ApiError(429, 'x'))).toBe(true);
    expect(isTransientQueryError(new ApiError(500, 'x'))).toBe(true);
  });
  it('classifies 4xx and SessionExpiredError as non-transient', () => {
    expect(isTransientQueryError(new ApiError(403, 'x'))).toBe(false);
    expect(isTransientQueryError(new SessionExpiredError())).toBe(false);
  });
});
