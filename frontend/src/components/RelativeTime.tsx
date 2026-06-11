'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

/** Renders relative time after mount to avoid SSR/client locale or clock mismatches. */
export function RelativeTime({ date }: { date: string | Date }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(date)));
  }, [date]);

  return <span suppressHydrationWarning>{label || '…'}</span>;
}
