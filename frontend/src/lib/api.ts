const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ApiUser {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  karma: number;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

const ACCESS_TOKEN_KEY = 'hiver_access_token';
const REFRESH_TOKEN_KEY = 'hiver_refresh_token';

export function getStoredTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseError(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as
      | { detail?: string | Array<{ msg?: string; message?: string }> };
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      return first?.msg ?? first?.message ?? resp.statusText;
    }
  } catch {
    // ignore parse errors
  }
  return resp.statusText || 'Request failed';
}

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

function backoffDelay(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
  }
  return BASE_BACKOFF_MS * 2 ** attempt;
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const resp = await fetch(input, init);
    if (resp.status === 429 || resp.status >= 500) {
      if (attempt < MAX_RETRIES) {
        const delay = backoffDelay(attempt, resp.headers.get('retry-after'));
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
    return resp;
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  signal?: AbortSignal,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await fetchWithRetry(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers,
    cache: 'no-store',
    signal: signal ?? options.signal,
  });

  if (!resp.ok) {
    throw new ApiError(resp.status, await parseError(resp));
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  return (await resp.json()) as T;
}

let refreshInFlight: Promise<TokenPair> | null = null;

async function refreshStoredTokens(): Promise<TokenPair> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    throw new ApiError(401, 'Not authenticated');
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshTokens(refreshToken)
      .then((tokens) => {
        storeTokens(tokens);
        return tokens;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function requestWithAuth<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const { accessToken, refreshToken } = getStoredTokens();
  if (!accessToken) {
    throw new SessionExpiredError();
  }

  try {
    return await request<T>(path, options, accessToken, signal);
  } catch (err) {
    if (isAbortError(err)) throw err;
    if (!(err instanceof ApiError) || err.status !== 401 || !refreshToken) {
      throw err;
    }
    try {
      const tokens = await refreshStoredTokens();
      return await request<T>(path, options, tokens.access_token, signal);
    } catch (refreshErr) {
      if (refreshErr instanceof ApiError && refreshErr.status === 401) {
        throw new SessionExpiredError();
      }
      throw refreshErr;
    }
  }
}

async function requestWithOptionalAuth<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const { accessToken } = getStoredTokens();
  try {
    return await request<T>(path, options, accessToken ?? undefined, signal);
  } catch (err) {
    if (isAbortError(err)) throw err;
    if (err instanceof ApiError && err.status === 401 && accessToken) {
      return await request<T>(path, options, undefined, signal);
    }
    throw err;
  }
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<TokenPair> {
  return request<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  username: string;
  password: string;
}): Promise<TokenPair> {
  return request<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return request<TokenPair>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await request<void>(
    '/auth/logout',
    {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    null,
  );
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  return requestWithAuth<ApiUser>('/users/me');
}

export interface ApiUserPublic {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ApiCommunity {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  rules: unknown[] | null;
  icon_url: string | null;
  banner_url: string | null;
  creator_id: string;
  member_count: number;
  created_at: string;
  is_member?: boolean | null;
}

export interface ApiPostFeedItem {
  id: string;
  title: string;
  content: string | null;
  community_id: string;
  author: ApiUserPublic;
  score: number;
  upvotes: number;
  downvotes: number;
  user_vote: number;
  comment_count: number;
  created_at: string;
  is_deleted: boolean;
}

export async function fetchCommunities(signal?: AbortSignal): Promise<ApiCommunity[]> {
  return request<ApiCommunity[]>('/communities', {}, undefined, signal);
}

export async function fetchCommunity(
  name: string,
  options: { authenticated?: boolean; signal?: AbortSignal } = {},
): Promise<ApiCommunity> {
  const path = `/communities/${encodeURIComponent(name)}`;
  if (options.authenticated) {
    return requestWithAuth<ApiCommunity>(path, {}, options.signal);
  }
  return request<ApiCommunity>(path, {}, undefined, options.signal);
}

export async function fetchGlobalPosts(
  params: { limit?: number; offset?: number; signal?: AbortSignal } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return requestWithOptionalAuth<ApiPostFeedItem[]>(
    `/posts${qs ? `?${qs}` : ''}`,
    {},
    params.signal,
  );
}

export async function fetchCommunityPosts(
  name: string,
  params: { limit?: number; offset?: number } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return requestWithOptionalAuth<ApiPostFeedItem[]>(
    `/communities/${encodeURIComponent(name)}/posts${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchPost(postId: string, signal?: AbortSignal): Promise<ApiPostFeedItem> {
  return requestWithOptionalAuth<ApiPostFeedItem>(
    `/posts/${encodeURIComponent(postId)}`,
    {},
    signal,
  );
}

export async function fetchHomePosts(
  params: { limit?: number; offset?: number; signal?: AbortSignal } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return requestWithAuth<ApiPostFeedItem[]>(
    `/posts/home${qs ? `?${qs}` : ''}`,
    {},
    params.signal,
  );
}

export async function fetchJoinedCommunities(signal?: AbortSignal): Promise<ApiCommunity[]> {
  return requestWithAuth<ApiCommunity[]>('/communities/mine', {}, signal);
}

export async function joinCommunity(name: string): Promise<ApiCommunity> {
  return requestWithAuth<ApiCommunity>(
    `/communities/${encodeURIComponent(name)}/join`,
    { method: 'POST' },
  );
}

export async function leaveCommunity(name: string): Promise<ApiCommunity> {
  return requestWithAuth<ApiCommunity>(
    `/communities/${encodeURIComponent(name)}/join`,
    { method: 'DELETE' },
  );
}

export async function createCommunity(payload: {
  name: string;
  display_name: string;
  description?: string | null;
}): Promise<ApiCommunity> {
  return requestWithAuth<ApiCommunity>('/communities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createPost(
  communityName: string,
  payload: { title: string; content?: string | null },
): Promise<ApiPostFeedItem> {
  return requestWithAuth<ApiPostFeedItem>(
    `/communities/${encodeURIComponent(communityName)}/posts`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export interface ApiComment {
  id: string;
  content: string;
  post_id: string;
  author: ApiUserPublic;
  parent_id: string | null;
  depth: number;
  score: number;
  created_at: string;
  is_deleted: boolean;
  user_vote: number | null;
  replies: ApiComment[];
}

export async function fetchComments(postId: string, signal?: AbortSignal): Promise<ApiComment[]> {
  return requestWithOptionalAuth<ApiComment[]>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    {},
    signal,
  );
}

export async function createComment(
  postId: string,
  payload: { content: string; parent_id?: string | null },
): Promise<ApiComment> {
  return requestWithAuth<ApiComment>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export interface ApiVoteResponse {
  target_type: 'post' | 'comment';
  target_id: string;
  value: number;
}

export async function castVote(payload: {
  target_type: 'post' | 'comment';
  target_id: string;
  value: 1 | -1 | 0;
}): Promise<ApiVoteResponse> {
  return requestWithAuth<ApiVoteResponse>('/votes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
