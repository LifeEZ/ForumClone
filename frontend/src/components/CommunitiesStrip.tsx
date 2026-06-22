'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { RemoteImage } from '@/components/RemoteImage';

export function CommunitiesStrip() {
  const { communities } = useAppContext();
  const pathname = usePathname() ?? '';
  const joinedCommunities = communities.filter((c) => c.isJoined);

  if (joinedCommunities.length === 0) {
    return null;
  }

  return (
    <section className="mb-6" aria-label="Your communities">
      <h2 className="font-display text-sm font-semibold text-forest-muted uppercase tracking-wider mb-3 px-1">
        Your communities
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {joinedCommunities.map((community) => {
          const href = `/c/${community.name}`;
          const isActive = pathname === href;

          return (
            <Link
              key={community.id}
              href={href}
              className="flex flex-col items-center gap-2 min-w-[4.75rem] group shrink-0"
            >
              <div
                className={`p-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'ring-2 ring-forest-accent ring-offset-2 ring-offset-forest-bg'
                    : 'ring-2 ring-transparent group-hover:ring-forest-border'
                }`}
              >
                <RemoteImage
                  src={community.avatarUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
              <span
                className={`font-display text-xs font-semibold text-center truncate max-w-[4.75rem] transition-colors ${
                  isActive
                    ? 'text-forest-text'
                    : 'text-forest-muted group-hover:text-forest-text'
                }`}
              >
                {community.displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
