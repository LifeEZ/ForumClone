'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, createCommunity } from '@/lib/api';
import { validateCommunityName } from '@/lib/communityName';
import { useAuth } from '@/context/AuthContext';

export function CreateCommunityView() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-20 bg-forest-surface border border-forest-border rounded-2xl">
        <h2 className="text-xl font-bold text-forest-text mb-2">
          Log in to create a community
        </h2>
        <p className="text-forest-muted mb-6">
          You need an account to start a new community.
        </p>
        <Link
          href="/login"
          className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover transition-colors"
        >
          Log in
        </Link>
      </div>
    );
  }

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(value.length === 0 ? null : validateCommunityName(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameIssue = validateCommunityName(name);
    if (nameIssue) {
      setNameError(nameIssue);
      return;
    }
    if (!displayName.trim()) {
      setFormError('Display name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCommunity({
        name,
        display_name: displayName.trim(),
        description: description.trim() || null,
      });
      router.push(`/c/${name}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNameError('That name is already taken.');
      } else if (err instanceof ApiError && err.status === 422) {
        setNameError(err.message || 'Invalid name.');
      } else if (err instanceof ApiError && err.status === 401) {
        setFormError('Your session has expired. Please log in again.');
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-forest-bg border border-forest-border rounded-xl px-4 py-2.5 text-forest-text placeholder:text-forest-muted focus:outline-none focus:border-forest-accent focus:ring-1 focus:ring-forest-accent';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-forest-text mb-6">
        Create a community
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-forest-surface border border-forest-border rounded-2xl p-4 sm:p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-forest-text mb-1.5"
          >
            Name
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 whitespace-nowrap text-forest-muted text-sm">
              /c/
            </span>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="community-name"
              required
              minLength={3}
              maxLength={30}
              className={`${inputClass} flex-1 min-w-0`}
              aria-invalid={nameError !== null}
            />
          </div>
          {nameError ? (
            <p className="text-sm text-red-400 mt-1.5">{nameError}</p>
          ) : (
            <p className="text-xs text-forest-muted mt-1.5">
              Lowercase letters, digits, and single hyphens. 3–30 characters.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium text-forest-text mb-1.5"
          >
            Display name
          </label>
          <input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Community title"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-forest-text mb-1.5"
          >
            Description <span className="text-forest-muted">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this community about?"
            maxLength={500}
            className={`${inputClass} resize-none min-h-[100px]`}
          />
          <p className="text-xs text-forest-muted mt-1.5">
            Up to 500 characters.
          </p>
        </div>

        {formError && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
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
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl font-semibold bg-forest-accent text-white hover:bg-forest-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
