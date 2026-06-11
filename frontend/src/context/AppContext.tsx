import React, { useState, createContext, useContext } from 'react';
import { Post, Community, Comment, User } from '../types';
import {
  mockPosts,
  mockCommunities,
  mockComments,
  currentUser } from
'../data/mockData';
interface AppContextType {
  posts: Post[];
  communities: Community[];
  comments: Record<string, Comment[]>;
  user: User;
  toggleJoinCommunity: (communityId: string) => void;
  votePost: (postId: string, vote: 1 | -1 | 0) => void;
  voteComment: (postId: string, commentId: string, vote: 1 | -1 | 0) => void;
  addPost: (
  post: Omit<
    Post,
    'id' |
    'createdAt' |
    'upvotes' |
    'downvotes' |
    'userVote' |
    'commentCount' |
    'author'>)

  => string;
  addComment: (postId: string, parentId: string | null, content: string) => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppProvider = ({ children }: {children: ReactNode;}) => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [communities, setCommunities] = useState<Community[]>(mockCommunities);
  const [comments, setComments] =
  useState<Record<string, Comment[]>>(mockComments);
  const toggleJoinCommunity = (communityId: string) => {
    setCommunities((prev) =>
    prev.map((c) =>
    c.id === communityId ?
    {
      ...c,
      isJoined: !c.isJoined,
      memberCount: c.isJoined ? c.memberCount - 1 : c.memberCount + 1
    } :
    c
    )
    );
  };
  const votePost = (postId: string, vote: 1 | -1 | 0) => {
    setPosts((prev) =>
    prev.map((p) => {
      if (p.id !== postId) return p;
      let newUpvotes = p.upvotes;
      let newDownvotes = p.downvotes;
      // Remove old vote
      if (p.userVote === 1) newUpvotes--;
      if (p.userVote === -1) newDownvotes--;
      // Add new vote
      if (vote === 1) newUpvotes++;
      if (vote === -1) newDownvotes++;
      return {
        ...p,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        userVote: vote
      };
    })
    );
  };
  const voteCommentRecursive = (
  commentList: Comment[],
  commentId: string,
  vote: 1 | -1 | 0)
  : Comment[] => {
    return commentList.map((c) => {
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
          userVote: vote
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: voteCommentRecursive(c.replies, commentId, vote)
        };
      }
      return c;
    });
  };
  const voteComment = (postId: string, commentId: string, vote: 1 | -1 | 0) => {
    setComments((prev) => ({
      ...prev,
      [postId]: voteCommentRecursive(prev[postId] || [], commentId, vote)
    }));
  };
  const addPost = (
  postData: Omit<
    Post,
    'id' |
    'createdAt' |
    'upvotes' |
    'downvotes' |
    'userVote' |
    'commentCount' |
    'author'>) =>

  {
    const newPost: Post = {
      ...postData,
      id: `p_${Date.now()}`,
      author: currentUser,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
      commentCount: 0
    };
    setPosts((prev) => [newPost, ...prev]);
    return newPost.id;
  };
  const addCommentRecursive = (
  commentList: Comment[],
  parentId: string,
  newComment: Comment)
  : Comment[] => {
    return commentList.map((c) => {
      if (c.id === parentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newComment]
        };
      }
      if (c.replies) {
        return {
          ...c,
          replies: addCommentRecursive(c.replies, parentId, newComment)
        };
      }
      return c;
    });
  };
  const addComment = (
  postId: string,
  parentId: string | null,
  content: string) =>
  {
    const newComment: Comment = {
      id: `cm_${Date.now()}`,
      postId,
      parentId,
      author: currentUser,
      createdAt: new Date().toISOString(),
      content,
      upvotes: 1,
      downvotes: 0,
      userVote: 1
    };
    setComments((prev) => {
      const postComments = prev[postId] || [];
      if (parentId === null) {
        return {
          ...prev,
          [postId]: [...postComments, newComment]
        };
      }
      return {
        ...prev,
        [postId]: addCommentRecursive(postComments, parentId, newComment)
      };
    });
    // Update post comment count
    setPosts((prev) =>
    prev.map((p) =>
    p.id === postId ?
    {
      ...p,
      commentCount: p.commentCount + 1
    } :
    p
    )
    );
  };
  return (
    <AppContext.Provider
      value={{
        posts,
        communities,
        comments,
        user: currentUser,
        toggleJoinCommunity,
        votePost,
        voteComment,
        addPost,
        addComment
      }}>
      
      {children}
    </AppContext.Provider>);

};
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};