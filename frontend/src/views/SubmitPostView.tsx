'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, createPost, fetchCommunity, type ApiCommunity } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type LoadState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'ready'; community: ApiCommunity };

export function SubmitPostView({ name }: { name: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [communityState, setCommunityState] = useState<LoadState>({
    status: 'loading',
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity() {
      try {
        const community = await fetchCommunity(name, { authenticated: true });
        if (!cancelled) {
          setCommunityState({ status: 'ready', community });
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setCommunityState({ status: 'not_found' });
        } else {
          setFormError(
            err instanceof ApiError ? err.message : 'Could not load community.',
          );
          setCommunityState({ status: 'not_found' });
        }
      }
    }

    void loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (communityState.status === 'loading' || authLoading) {
    return (
      <div className="text-center py-20 text-forest-muted">Loading…</div>
    );
  }

  if (communityState.status === 'not_found') {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-forest-text">
          Community not found
        </h2>
      </div>
    );
  }

  const community = communityState.community;

  if (!user) {
    return (
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
        <h2 className="text-xl font-bold text-forest-text mb-2">
          Log in to post
        </h2>
        <p className="text-forest-muted mb-6">
          You need an account to post in c/{community.name}.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover transition-colors"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/c/${community.name}`)}
            className="px-6 py-2 rounded-xl font-semibold text-forest-text hover:bg-forest-bg transition-colors"
          >
            Back to c/{community.name}
          </button>
        </div>
      </div>
    );
  }

  if (!community.is_member) {
    return (
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
        <h2 className="font-display text-xl font-semibold text-forest-text mb-2">
          Join this community first
        </h2>
        <p className="text-forest-muted mb-6">
          Become a member of c/{community.name} before you post here.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setFormError(null);
    setIsSubmitting(true);
    try {
      const post = await createPost(community.name, {
        title: trimmedTitle,
        content: content.trim() || null,
      });
      router.push(`/c/${community.name}/posts/${post.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError('Your session has expired. Please log in again.');
      } else if (err instanceof ApiError && err.status === 403) {
        setFormError('You must be a member of this community to post.');
      } else if (err instanceof ApiError && err.status === 404) {
        setFormError('This community no longer exists.');
      } else if (err instanceof ApiError && err.status === 422) {
        setFormError(err.message || 'Invalid post.');
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-forest-text mb-2">
        Start a post
      </h1>
      <p className="text-forest-muted mb-6">Sharing in c/{community.name}</p>

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
          <p className="text-xs text-forest-muted mt-1.5">
            Up to 300 characters.
          </p>
        </div>

        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Body (optional)"
            className="w-full bg-forest-bg border border-forest-border rounded-xl p-4 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent resize-none min-h-[150px]"
          />
          <p className="text-xs text-forest-muted mt-1.5">
            Up to 40,000 characters.
          </p>
        </div>

        {formError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-4">
            {formError}
          </p>
        )}

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
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
