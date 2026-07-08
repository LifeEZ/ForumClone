import { Community, Post, User } from '@/types';
import {
  ApiCommunity,
  ApiPostFeedItem,
  ApiUserPublic,
} from '@/lib/api';
import {
  DEFAULT_COMMUNITY_AVATAR,
  DEFAULT_COMMUNITY_BANNER,
} from '@/lib/constants';

export function mapApiUserPublic(api: ApiUserPublic): User {
  return {
    id: api.id,
    username: api.username,
    avatarUrl: api.avatar_url,
  };
}

export function mapApiCommunity(api: ApiCommunity, isJoined?: boolean): Community {
  const joined = isJoined ?? api.is_member ?? false;
  return {
    id: api.id,
    name: api.name,
    displayName: api.display_name,
    description: api.description ?? '',
    memberCount: api.member_count,
    isJoined: joined,
    avatarUrl: api.icon_url ?? DEFAULT_COMMUNITY_AVATAR,
    bannerUrl: api.banner_url ?? DEFAULT_COMMUNITY_BANNER,
  };
}

export function mapApiPost(api: ApiPostFeedItem): Post {
  return {
    id: api.id,
    communityId: api.community_id,
    author: mapApiUserPublic(api.author),
    createdAt: api.created_at,
    title: api.title,
    content: api.content ?? undefined,
    upvotes: api.upvotes,
    downvotes: api.downvotes,
    userVote: (api.user_vote ?? 0) as 1 | -1 | 0,
    commentCount: api.comment_count,
  };
}

export function getCommunityByName(
  communities: Community[],
  name: string,
): Community | undefined {
  return communities.find((c) => c.name === name);
}

export function updatePostVote(
  posts: Post[],
  postId: string,
  vote: 1 | -1 | 0,
): Post[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    let newUpvotes = p.upvotes;
    let newDownvotes = p.downvotes;
    if (p.userVote === 1) newUpvotes--;
    if (p.userVote === -1) newDownvotes--;
    if (vote === 1) newUpvotes++;
    if (vote === -1) newDownvotes++;
    return {
      ...p,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: vote,
    };
  });
}
