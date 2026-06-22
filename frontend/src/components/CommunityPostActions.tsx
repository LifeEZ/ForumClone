import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Community, User } from '@/types';

interface CommunityPostActionsProps {
  community: Community;
  user: User | null;
  onJoin: () => void;
  /** Full-width stacked layout for the mobile sticky bar. */
  compact?: boolean;
}

export function CommunityPostActions({
  community,
  user,
  onJoin,
  compact = false,
}: CommunityPostActionsProps) {
  const layout = compact
    ? 'flex flex-col gap-2 w-full'
    : 'flex flex-col sm:flex-row gap-2 w-full sm:w-auto';
  const actionClass = compact
    ? 'flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold transition-colors'
    : 'flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-semibold transition-colors';

  if (!user) {
    return (
      <div className={layout}>
        <Link
          href="/login"
          className={`${actionClass} border border-forest-border text-forest-text hover:bg-forest-surface`}
        >
          Log in to post
        </Link>
        <button
          type="button"
          onClick={onJoin}
          className={`${actionClass} bg-forest-accent text-white hover:bg-forest-accent-hover`}
        >
          Join
        </button>
      </div>
    );
  }

  if (!community.isJoined) {
    return (
      <div className={layout}>
        <button
          type="button"
          onClick={onJoin}
          className={`${actionClass} bg-forest-accent text-white hover:bg-forest-accent-hover`}
        >
          Join to post
        </button>
      </div>
    );
  }

  return (
    <div className={layout}>
      <Link
        href={`/c/${community.name}/submit`}
        className={`${actionClass} bg-forest-accent text-white hover:bg-forest-accent-hover`}
      >
        <Plus className="w-4 h-4" />
        Create post
      </Link>
      <button
        type="button"
        onClick={onJoin}
        className={`${actionClass} bg-forest-bg border border-forest-border text-forest-text hover:bg-forest-surface-hover`}
      >
        Joined
      </button>
    </div>
  );
}
