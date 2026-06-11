'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { getCommunityByName } from '@/data/mockData';

export function SubmitPostView({ name }: { name: string }) {
  const router = useRouter();
  const { communities, addPost } = useAppContext();
  const community = getCommunityByName(communities, name);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!community) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>
    );
  }

  if (!community.isJoined) {
    return (
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
        <h2 className="text-xl font-bold text-forest-text mb-2">
          Join this community first
        </h2>
        <p className="text-forest-muted mb-6">
          You need to be a member of c/{community.name} to post here.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/c/${community.name}`)}
          className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover transition-colors"
        >
          Go to c/{community.name}
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPostId = addPost({
      communityId: community.id,
      title: title.trim(),
      content: content.trim() || undefined,
    });

    router.push(`/c/${community.name}/posts/${newPostId}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-forest-text mb-2">Create a post</h1>
      <p className="text-forest-muted mb-6">
        Posting to c/{community.name}
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-forest-surface border border-forest-border rounded-2xl p-4 sm:p-6"
      >
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={300}
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-lg font-semibold text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent"
            required
          />
        </div>

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Body (optional)"
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[150px]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-forest-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-xl font-semibold text-forest-text hover:bg-forest-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
