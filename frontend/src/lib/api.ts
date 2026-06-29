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
    const data = (await resp.json()) as { detail?: string };
    if (typeof data.detail === 'string') return data.detail;
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

export async function fetchCurrentUser(accessToken: string): Promise<ApiUser> {
  return request<ApiUser>('/users/me', {}, accessToken);
}

export interface ApiUserPublic {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  karma: number;
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
  accessToken?: string | null,
): Promise<ApiCommunity> {
  return request<ApiCommunity>(
    `/communities/${encodeURIComponent(name)}`,
    {},
    accessToken,
  );
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
  accessToken: string,
  params: { limit?: number; offset?: number } = {},
): Promise<ApiPostFeedItem[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  return request<ApiPostFeedItem[]>(
    `/posts/home${qs ? `?${qs}` : ''}`,
    {},
    accessToken,
  );
}

export async function fetchJoinedCommunities(
  accessToken: string,
): Promise<ApiCommunity[]> {
  return request<ApiCommunity[]>('/communities/mine', {}, accessToken);
}

export async function joinCommunity(
  accessToken: string,
  name: string,
): Promise<ApiCommunity> {
  return request<ApiCommunity>(
    `/communities/${encodeURIComponent(name)}/join`,
    { method: 'POST' },
    accessToken,
  );
}

export async function leaveCommunity(
  accessToken: string,
  name: string,
): Promise<ApiCommunity> {
  return request<ApiCommunity>(
    `/communities/${encodeURIComponent(name)}/join`,
    { method: 'DELETE' },
    accessToken,
  );
}
