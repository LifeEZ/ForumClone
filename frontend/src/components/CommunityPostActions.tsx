'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Community, User } from '@/types';
import { JoinCommunityButton } from '@/components/JoinCommunityButton';
import { springBouncy } from '@/lib/motion';

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
  const joinClass = `${actionClass} bg-forest-accent text-white hover:bg-forest-accent-hover shadow-lg shadow-forest-accent/15`;

  if (!user) {
    return (
      <div className={layout}>
        <Link
          href="/login"
          className={`${actionClass} border border-forest-border/70 text-forest-text hover:bg-forest-surface`}
        >
          Log in to post
        </Link>
        <JoinCommunityButton onClick={onJoin} className={joinClass}>
          Join community
        </JoinCommunityButton>
      </div>
    );
  }

  if (!community.isJoined) {
    return (
      <div className={layout}>
        <JoinCommunityButton onClick={onJoin} className={joinClass}>
          Join to post
        </JoinCommunityButton>
      </div>
    );
  }

  return (
    <div className={layout}>
      <motion.div whileTap={{ scale: 0.98 }} transition={springBouncy}>
        <Link
          href={`/c/${community.name}/submit`}
          className={`${actionClass} bg-forest-accent text-white hover:bg-forest-accent-hover shadow-lg shadow-forest-accent/15`}
        >
          <Plus className="w-4 h-4" />
          Create post
        </Link>
      </motion.div>
      <JoinCommunityButton
        onClick={onJoin}
        joined
        className={`${actionClass} bg-forest-bg border border-forest-border/70 text-forest-text hover:bg-forest-surface-hover`}
      >
        Joined
      </JoinCommunityButton>
    </div>
  );
}
