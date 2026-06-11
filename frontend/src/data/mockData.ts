import { Community, Post, Comment, User } from '../types';

export const currentUser: User = {
  id: 'u1',
  username: 'forest_dweller',
  avatarUrl: 'https://i.pravatar.cc/150?u=forest_dweller'
};

export const mockCommunities: Community[] = [
{
  id: 'c1',
  name: 'Design Patterns',
  handle: 'designpatterns',
  description:
  'A place to discuss UI/UX design patterns, component architecture, and frontend aesthetics.',
  memberCount: 14200,
  isJoined: true,
  avatarUrl:
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=150&q=80',
  bannerUrl:
  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80'
},
{
  id: 'c2',
  name: 'React Developers',
  handle: 'reactdevs',
  description:
  'Everything React. Hooks, server components, state management, and more.',
  memberCount: 85000,
  isJoined: true,
  avatarUrl:
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80',
  bannerUrl:
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'
},
{
  id: 'c3',
  name: 'Nature Photography',
  handle: 'naturephoto',
  description: 'Share your best shots of the great outdoors.',
  memberCount: 32400,
  isJoined: false,
  avatarUrl:
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=150&q=80',
  bannerUrl:
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80'
}];


export const mockPosts: Post[] = [
{
  id: 'p1',
  communityId: 'c1',
  author: {
    id: 'u2',
    username: 'ui_wizard',
    avatarUrl: 'https://i.pravatar.cc/150?u=ui_wizard'
  },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  title: 'Stop using pure black for dark mode backgrounds',
  content:
  'I see this mistake all the time. Pure black (#000000) causes eye strain because of the extreme contrast with white text. Instead, use a very dark gray or a tinted dark color (like a dark forest green or midnight blue). It softens the contrast and makes the UI feel much more premium and readable.',
  upvotes: 342,
  downvotes: 12,
  userVote: 1,
  commentCount: 45
},
{
  id: 'p2',
  communityId: 'c2',
  author: {
    id: 'u3',
    username: 'hook_master',
    avatarUrl: 'https://i.pravatar.cc/150?u=hook_master'
  },
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  title: 'My mental model for useEffect finally clicked',
  content:
  "After years of fighting with dependency arrays, I finally realized: useEffect is for synchronizing with external systems, NOT for managing data flow within your app. If you can calculate it during render, do it. If it's responding to a user event, put it in the event handler.",
  upvotes: 890,
  downvotes: 45,
  userVote: 0,
  commentCount: 128
},
{
  id: 'p3',
  communityId: 'c3',
  author: {
    id: 'u4',
    username: 'pine_cone',
    avatarUrl: 'https://i.pravatar.cc/150?u=pine_cone'
  },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  title: 'Morning fog in the Redwoods',
  imageUrl:
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80',
  upvotes: 1205,
  downvotes: 8,
  userVote: 0,
  commentCount: 32
}];


export const mockComments: Record<string, Comment[]> = {
  p1: [
  {
    id: 'cm1',
    postId: 'p1',
    parentId: null,
    author: {
      id: 'u5',
      username: 'contrast_checker',
      avatarUrl: 'https://i.pravatar.cc/150?u=contrast_checker'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
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
        username: 'ui_wizard',
        avatarUrl: 'https://i.pravatar.cc/150?u=ui_wizard'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      content:
      'Exactly! Tinting the background makes the whole theme feel cohesive.',
      upvotes: 24,
      downvotes: 0,
      userVote: 1
    }]

  },
  {
    id: 'cm3',
    postId: 'p1',
    parentId: null,
    author: {
      id: 'u6',
      username: 'oled_fan',
      avatarUrl: 'https://i.pravatar.cc/150?u=oled_fan'
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    content:
    'But pure black saves battery on OLED screens! I prefer the true black look.',
    upvotes: 12,
    downvotes: 45,
    userVote: -1
  }]

};