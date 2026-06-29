'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springBouncy } from '@/lib/motion';

interface JoinCommunityButtonProps {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  joined?: boolean;
  disabled?: boolean;
  className?: string;
}

export function JoinCommunityButton({
  children,
  onClick,
  joined = false,
  disabled = false,
  className = '',
}: JoinCommunityButtonProps) {
  const [glowKey, setGlowKey] = useState(0);

  const handleClick = () => {
    if (disabled) return;
    if (!joined) {
      setGlowKey((key) => key + 1);
    }
    void onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      whileHover={joined ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={springBouncy}
      className={`relative overflow-hidden ${className}`}
    >
      {!joined && glowKey > 0 && (
        <motion.span
          key={glowKey}
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-forest-glow/30"
          initial={{ opacity: 0.7, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          aria-hidden
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
