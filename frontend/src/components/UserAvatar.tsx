'use client';

import { RemoteImage } from '@/components/RemoteImage';
import { getAvatarColor, getAvatarLetter } from '@/lib/avatar';

interface UserAvatarProps {
  userId: string;
  username: string;
  /** Custom upload URL from API; null shows letter fallback. */
  avatarUrl?: string | null;
  className?: string;
  size?: number;
}

export function UserAvatar({
  userId,
  username,
  avatarUrl,
  className = 'w-8 h-8',
  size = 32,
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <RemoteImage
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const letter = getAvatarLetter(username);
  const color = getAvatarColor(userId);

  return (
    <span
      className={`${className} rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm leading-none ring-1 ring-inset ring-white/10`}
      style={{ backgroundColor: color }}
      aria-label={username}
    >
      {letter}
    </span>
  );
}
