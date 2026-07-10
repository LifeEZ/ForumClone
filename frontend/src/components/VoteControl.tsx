'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PollenBurst } from '@/components/PollenBurst';
import { springBouncy } from '@/lib/motion';
import { useAuth } from '@/context/AuthContext';

interface VoteControlProps {
  upvotes: number;
  downvotes: number;
  userVote: 1 | -1 | 0;
  onVote: (vote: 1 | -1 | 0) => void;
  horizontal?: boolean;
}

export function VoteControl({
  upvotes,
  downvotes,
  userVote,
  onVote,
  horizontal = false,
}: VoteControlProps) {
  const score = upvotes - downvotes;
  const [pollenTrigger, setPollenTrigger] = useState(0);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const handleUpvote = (e: React.MouseEvent) => {
    if (!isLoggedIn) return;
    e.preventDefault();
    e.stopPropagation();
    const nextVote = userVote === 1 ? 0 : 1;
    if (nextVote === 1) {
      setPollenTrigger((count) => count + 1);
    }
    onVote(nextVote);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    if (!isLoggedIn) return;
    e.preventDefault();
    e.stopPropagation();
    onVote(userVote === -1 ? 0 : -1);
  };

  return (
    <div
      className={`flex items-center gap-1 overflow-visible bg-forest-bg/50 rounded-full p-1 border border-forest-border/70 ${
        horizontal ? 'flex-row' : 'flex-col sm:flex-row'
      }`}
    >
      <motion.button
        type="button"
        onClick={handleUpvote}
        disabled={!isLoggedIn}
        title={isLoggedIn ? undefined : 'Log in to vote'}
        whileTap={isLoggedIn ? { scale: 0.9 } : undefined}
        transition={springBouncy}
        className={`relative overflow-visible p-1.5 rounded-full transition-colors ${
          !isLoggedIn
            ? 'text-forest-muted/50 cursor-not-allowed'
            : userVote === 1
              ? 'text-vote-up bg-vote-up/10'
              : 'text-forest-muted hover:bg-forest-surface-hover hover:text-vote-up'
        }`}
        aria-label="Upvote"
      >
        <PollenBurst trigger={pollenTrigger} />
        <ArrowBigUp
          className="w-5 h-5 relative z-10"
          fill={userVote === 1 ? 'currentColor' : 'none'}
        />
      </motion.button>

      <div className="relative w-8 h-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{
              y: userVote === 1 ? 20 : -20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: userVote === 1 ? -20 : 20,
              opacity: 0,
            }}
            transition={springBouncy}
            className={`text-sm font-semibold ${
              userVote === 1
                ? 'text-vote-up'
                : userVote === -1
                  ? 'text-vote-down'
                  : 'text-forest-text'
            }`}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        onClick={handleDownvote}
        disabled={!isLoggedIn}
        title={isLoggedIn ? undefined : 'Log in to vote'}
        whileTap={isLoggedIn ? { scale: 0.9 } : undefined}
        transition={springBouncy}
        className={`p-1.5 rounded-full transition-colors ${
          !isLoggedIn
            ? 'text-forest-muted/50 cursor-not-allowed'
            : userVote === -1
              ? 'text-vote-down bg-vote-down/10'
              : 'text-forest-muted hover:bg-forest-surface-hover hover:text-vote-down'
        }`}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className="w-5 h-5"
          fill={userVote === -1 ? 'currentColor' : 'none'}
        />
      </motion.button>
    </div>
  );
}
