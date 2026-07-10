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

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const resp = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers,
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

/** Authenticated request — refreshes access token once on 401, then retries. */
async function requestWithAuth<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, refreshToken } = getStoredTokens();
  if (!accessToken) {
    throw new ApiError(401, 'Not authenticated');
  }

  try {
    return await request<T>(path, options, accessToken);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || !refreshToken) {
      throw err;
    }
    const tokens = await refreshStoredTokens();
    return await request<T>(path, options, tokens.access_token);
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

export async function fetchCommunities(): Promise<ApiCommunity[]> {
  return request<ApiCommunity[]>('/communities');
}

export async function fetchCommunity(
  name: string,
  options: { authenticated?: boolean } = {},
): Promise<ApiCommunity> {
  const path = `/communities/${encodeURIComponent(name)}`;
  if (options.authenticated) {
    return requestWithAuth<ApiCommunity>(path);
  }
  return request<ApiCommunity>(path);
}

export async function fetchGlobalPosts(
  params: { limit?: number; offset?: number } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return request<ApiPostFeedItem[]>(`/posts${qs ? `?${qs}` : ''}`);
}

export async function fetchCommunityPosts(
  name: string,
  params: { limit?: number; offset?: number } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return request<ApiPostFeedItem[]>(
    `/communities/${encodeURIComponent(name)}/posts${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchPost(postId: string): Promise<ApiPostFeedItem> {
  return request<ApiPostFeedItem>(`/posts/${encodeURIComponent(postId)}`);
}

export async function fetchHomePosts(
  params: { limit?: number; offset?: number } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return requestWithAuth<ApiPostFeedItem[]>(
    `/posts/home${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchJoinedCommunities(): Promise<ApiCommunity[]> {
  return requestWithAuth<ApiCommunity[]>('/communities/mine');
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
