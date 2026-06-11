'use client';

import { Sparkles } from 'lucide-react';

/** v1 feeds are newest-first only; sorting UI deferred to v2. */
export function SortBar() {
  return (
    <div className="flex items-center gap-2 mb-6 bg-forest-surface p-2 rounded-xl border border-forest-border">
      <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-forest-bg text-forest-text shadow-sm">
        <Sparkles className="w-4 h-4" />
        New
      </span>
    </div>
  );
}
