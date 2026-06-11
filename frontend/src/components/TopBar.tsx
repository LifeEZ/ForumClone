'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Trees, Plus, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { RemoteImage } from '@/components/RemoteImage';

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { communities } = useAppContext();
  const joinedCommunities = communities.filter((c) => c.isJoined);
  const firstJoined = joinedCommunities[0];

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-forest-bg/80 backdrop-blur-md border-b border-forest-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 -ml-1.5 text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 text-forest-accent">
            <Trees className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-forest-text">
              Hiver
            </span>
          </Link>
        </div>

        {firstJoined && (
          <Link
            href={`/c/${firstJoined.name}/submit`}
            className="p-1.5 -mr-1.5 text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
            aria-label="Create post"
          >
            <Plus className="w-6 h-6" />
          </Link>
        )}
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-forest-bg h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-forest-border flex items-center justify-between">
              <span className="font-bold text-forest-text">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 -mr-1.5 text-forest-muted hover:text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3">
              <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-forest-muted uppercase tracking-wider mb-3">
                  Your Communities
                </h3>
                <div className="space-y-1">
                  {joinedCommunities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/c/${community.name}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-forest-text hover:bg-forest-surface transition-colors"
                    >
                      <RemoteImage
                        src={community.avatarUrl}
                        alt=""
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="truncate">{community.displayName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
