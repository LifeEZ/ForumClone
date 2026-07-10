'use client';

import { useSyncExternalStore } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { parseApiDate } from '@/lib/dates';

function subscribeToClientMount() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** Renders relative time after mount to avoid SSR/client locale or clock mismatches. */
export function RelativeTime({ date }: { date: string | Date }) {
  const isClient = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot,
  );
  const label = isClient ? formatDistanceToNow(parseApiDate(date)) : '';

  return <span suppressHydrationWarning>{label || '…'}</span>;
}
