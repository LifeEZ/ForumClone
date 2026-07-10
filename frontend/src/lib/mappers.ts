import { Community, Post, User, Comment } from '@/types';
import {
  ApiComment,
  ApiCommunity,
  ApiPostFeedItem,
  ApiUser,
  ApiUserPublic,
} from '@/lib/api';
import {
  DEFAULT_COMMUNITY_AVATAR,
  DEFAULT_COMMUNITY_BANNER,
} from '@/lib/constants';

export function mapAuthUser(api: ApiUser): User {
  return {
    id: api.id,
    username: api.username,
    avatarUrl: api.avatar_url,
    karma: api.karma,
  };
}

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

export function mapApiComment(api: ApiComment): Comment {
  const upvotes = api.score >= 0 ? api.score : 0;
  const downvotes = api.score < 0 ? -api.score : 0;
  return {
    id: api.id,
    postId: api.post_id,
    parentId: api.parent_id,
    author: mapApiUserPublic(api.author),
    createdAt: api.created_at,
    content: api.content,
    upvotes,
    downvotes,
    userVote: (api.user_vote ?? 0) as 1 | -1 | 0,
    replies: (api.replies ?? []).map(mapApiComment),
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

export function updateCommentVote(
  comments: Comment[],
  commentId: string,
  vote: 1 | -1 | 0,
): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      let newUpvotes = c.upvotes;
      let newDownvotes = c.downvotes;
      if (c.userVote === 1) newUpvotes--;
      if (c.userVote === -1) newDownvotes--;
      if (vote === 1) newUpvotes++;
      if (vote === -1) newDownvotes++;
      return {
        ...c,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: vote,
      };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentVote(c.replies, commentId, vote) };
    }
    return c;
  });
}
