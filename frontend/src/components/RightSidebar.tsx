'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { JoinCommunityButton } from '@/components/JoinCommunityButton';
import { RemoteImage } from '@/components/RemoteImage';
import { formatCount } from '@/lib/format';

interface RightSidebarProps {
  communityId?: string;
}

export function RightSidebar({ communityId }: RightSidebarProps) {
  const { communities, toggleJoinCommunity } = useAppContext();
  const community = communityId
    ? communities.find((c) => c.id === communityId)
    : null;
  const trendingCommunities = communities
    .filter((c) => !c.isJoined)
    .slice(0, 3);

  return (
    <aside className="w-80 flex-shrink-0 hidden xl:block sticky top-14 h-[calc(100vh-3.5rem)] py-6 px-4 overflow-y-auto">
      {community ? (
        <div className="bg-forest-surface/90 border border-forest-border/50 rounded-2xl p-5 mb-6 shadow-lg shadow-black/15">
          <h3 className="font-display text-sm font-semibold text-forest-muted uppercase tracking-wider mb-4">
            About community
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <RemoteImage
              src={community.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-display font-semibold text-forest-text">
                {community.displayName}
              </h4>
              <p className="text-sm text-forest-muted">c/{community.name}</p>
            </div>
          </div>
          <p className="text-sm text-forest-text/90 mb-4">
            {community.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-forest-text mb-6">
            <div>
              <span className="font-bold block">
                {formatCount(community.memberCount)}
              </span>
              <span className="text-forest-muted">Members</span>
            </div>
          </div>
          <JoinCommunityButton
            onClick={() => toggleJoinCommunity(community.id)}
            joined={community.isJoined}
            className={`w-full py-2 rounded-xl font-semibold transition-colors ${
              community.isJoined
                ? 'bg-forest-bg border border-forest-border/70 text-forest-text hover:bg-forest-surface-hover'
                : 'bg-forest-accent text-white hover:bg-forest-accent-hover shadow-lg shadow-forest-accent/15'
            }`}
          >
            {community.isJoined ? 'Joined' : 'Join community'}
          </JoinCommunityButton>
        </div>
      ) : (
        <div className="bg-forest-surface/90 border border-forest-border/50 rounded-2xl p-5 mb-6 shadow-lg shadow-black/15">
          <h3 className="font-display text-sm font-semibold text-forest-muted uppercase tracking-wider mb-4">
            Communities
          </h3>
          <div className="space-y-4">
            {trendingCommunities.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={`/c/${c.name}`}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <RemoteImage
                    src={c.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="font-display font-semibold text-sm text-forest-text group-hover:underline truncate">
                      {c.displayName}
                    </h4>
                    <p className="text-xs text-forest-muted truncate">
                      {formatCount(c.memberCount)} members
                    </p>
                  </div>
                </Link>
                <JoinCommunityButton
                  onClick={() => toggleJoinCommunity(c.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-forest-accent text-white hover:bg-forest-accent-hover shadow-md shadow-forest-accent/15 flex-shrink-0"
                >
                  Join
                </JoinCommunityButton>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-forest-muted space-y-2 px-2">
        <p className="pt-2 border-t border-forest-border/50">
          Hiver © 2026. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
