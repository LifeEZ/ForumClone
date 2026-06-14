import { Community, Post, Comment, User } from '@/types';

export const currentUser: User = {
  id: 'u1',
  username: 'forest_dweller',
  avatarUrl: null,
  karma: 42,
};

export const mockCommunities: Community[] = [
  {
    id: 'c1',
    name: 'films',
    displayName: 'Films',
    description: 'Discuss movies, directors, and everything on screen.',
    memberCount: 14200,
    isJoined: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=150&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'c2',
    name: 'music',
    displayName: 'Music',
    description: 'Albums, artists, genres, and live shows.',
    memberCount: 85000,
    isJoined: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'c3',
    name: 'webdev',
    displayName: 'Web Dev',
    description: 'Frontend, backend, and shipping things on the web.',
    memberCount: 32400,
    isJoined: false,
    avatarUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    communityId: 'c1',
    author: {
      id: 'u2',
      username: 'cinema_fan',
      avatarUrl: null,
      karma: 128,
    },
    createdAt: '2026-06-11T18:00:00.000Z',
    title: 'Stop using pure black for dark mode backgrounds',
    content:
      'Pure black (#000000) causes eye strain because of extreme contrast with white text. Use a tinted dark color instead — like a dark forest green — for a softer, more readable UI.',
    upvotes: 342,
    downvotes: 12,
    userVote: 1,
    commentCount: 45,
  },
  {
    id: 'p2',
    communityId: 'c2',
    author: {
      id: 'u3',
      username: 'vinyl_head',
      avatarUrl: null,
      karma: 890,
    },
    createdAt: '2026-06-11T20:30:00.000Z',
    title: 'Albums that sound better on vinyl',
    content:
      'Some mixes are mastered differently for vinyl. What records do you think benefit most from the format?',
    upvotes: 890,
    downvotes: 45,
    userVote: 0,
    commentCount: 128,
  },
  {
    id: 'p3',
    communityId: 'c3',
    author: {
      id: 'u4',
      username: 'css_wizard',
      avatarUrl: null,
      karma: 456,
    },
    createdAt: '2026-06-10T20:00:00.000Z',
    title: 'Container queries changed how I write responsive components',
    content:
      'Component-level breakpoints beat viewport-only media queries for reusable UI. Worth learning if you have not tried them yet.',
    upvotes: 1205,
    downvotes: 8,
    userVote: 0,
    commentCount: 32,
  },
];

export const mockComments: Record<string, Comment[]> = {
  p1: [
    {
      id: 'cm1',
      postId: 'p1',
      parentId: null,
      author: {
        id: 'u5',
        username: 'contrast_checker',
        avatarUrl: null,
        karma: 56,
      },
      createdAt: '2026-06-11T19:10:00.000Z',
      content:
        'Absolutely agree. I usually start with #121212 as a base and tint it slightly towards the brand primary color.',
      upvotes: 56,
      downvotes: 2,
      userVote: 0,
      replies: [
        {
          id: 'cm2',
          postId: 'p1',
          parentId: 'cm1',
          author: {
            id: 'u2',
            username: 'cinema_fan',
            avatarUrl: null,
            karma: 128,
          },
          createdAt: '2026-06-11T19:15:00.000Z',
          content:
            'Exactly! Tinting the background makes the whole theme feel cohesive.',
          upvotes: 24,
          downvotes: 0,
          userVote: 1,
        },
      ],
    },
    {
      id: 'cm3',
      postId: 'p1',
      parentId: null,
      author: {
        id: 'u6',
        username: 'oled_fan',
        avatarUrl: null,
        karma: 12,
      },
      createdAt: '2026-06-11T19:20:00.000Z',
      content:
        'But pure black saves battery on OLED screens! I prefer the true black look.',
      upvotes: 12,
      downvotes: 45,
      userVote: -1,
    },
  ],
};

export function getCommunityByName(
  communities: Community[],
  name: string,
): Community | undefined {
  return communities.find((c) => c.name === name);
}

export function getPostPath(post: Post, communities: Community[]): string {
  const community = communities.find((c) => c.id === post.communityId);
  if (!community) return '/';
  return `/c/${community.name}/posts/${post.id}`;
}
