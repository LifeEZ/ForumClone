export interface User {
  id: string;
  username: string;
  /** null until user uploads a custom avatar (later slice). */
  avatarUrl: string | null;
  karma?: number;
}

export interface Community {
  id: string;
  /** URL slug — maps to backend `name` (e.g. films → /c/films) */
  name: string;
  displayName: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  avatarUrl: string;
  bannerUrl: string;
}

export interface Post {
  id: string;
  communityId: string;
  author: User;
  createdAt: string;
  title: string;
  content?: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | 0;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: User;
  createdAt: string;
  content: string;
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | 0;
  replies?: Comment[];
}

export type SortOption = 'Hot' | 'New' | 'Top';
