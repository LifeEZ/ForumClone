'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { RemoteImage } from '@/components/RemoteImage';

export function LeftSidebar() {
  const { communities } = useAppContext();
  const pathname = usePathname() ?? '';
  const joinedCommunities = communities.filter((c) => c.isJoined);
  const firstJoined = joinedCommunities[0];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] border-r border-forest-border bg-forest-bg overflow-y-auto py-6 px-4">
      <nav className="space-y-1 mb-8">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/'
              ? 'bg-forest-surface text-forest-text'
              : 'text-forest-muted hover:bg-forest-surface hover:text-forest-text'
          }`}
        >
          <Home className="w-5 h-5" />
          Home
        </Link>
      </nav>

      <div className="mb-6">
        <h3 className="px-3 text-xs font-semibold text-forest-muted uppercase tracking-wider mb-3">
          Your Communities
        </h3>
        <div className="space-y-1">
          {joinedCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/c/${community.name}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === `/c/${community.name}`
                  ? 'bg-forest-surface text-forest-text'
                  : 'text-forest-muted hover:bg-forest-surface hover:text-forest-text'
              }`}
            >
              <RemoteImage
                src={community.avatarUrl}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate">{community.displayName}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        {firstJoined ? (
          <Link
            href={`/c/${firstJoined.name}/submit`}
            className="flex items-center justify-center gap-2 w-full bg-forest-accent hover:bg-forest-accent-hover text-white py-3 px-4 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Post
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-forest-surface border border-forest-border text-forest-muted py-3 px-4 rounded-xl font-semibold transition-colors"
          >
            Join a community to post
          </Link>
        )}
      </div>
    </aside>
  );
}
