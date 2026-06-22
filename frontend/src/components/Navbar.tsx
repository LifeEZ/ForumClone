'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  Search,
  Trees,
  X,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { RemoteImage } from '@/components/RemoteImage';
import { UserAvatar } from '@/components/UserAvatar';

export function Navbar() {
  const router = useRouter();
  const { communities, user } = useAppContext();
  const { logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const joinedCommunities = communities.filter((c) => c.isJoined);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-forest-bg/80 backdrop-blur-md border-b border-forest-border"
      >
        <div className="max-w-[1600px] mx-auto px-4 h-14 grid grid-cols-[1fr_min(100%,28rem)_1fr] items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 justify-self-start">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 text-forest-accent hover:text-forest-accent-hover transition-colors"
            >
              <Trees className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="font-display text-lg font-semibold tracking-tight text-forest-text">
                Hiver
              </span>
            </Link>
          </div>

          <form
            role="search"
            className="hidden sm:flex w-full min-w-0 items-center gap-2 px-3 py-2 rounded-xl border border-forest-border bg-forest-surface/50 text-forest-muted justify-self-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search className="w-4 h-4 flex-shrink-0" aria-hidden />
            <input
              type="search"
              readOnly
              tabIndex={-1}
              aria-disabled="true"
              placeholder="Search communities and posts"
              className="w-full min-w-0 bg-transparent text-sm text-forest-muted placeholder:text-forest-muted focus:outline-none cursor-default"
            />
          </form>

          <div className="flex items-center gap-2 sm:gap-3 justify-self-end min-h-9 min-w-[9.5rem] sm:min-w-[11.5rem] md:min-w-[13rem] justify-end">
            {isLoading ? (
              <div
                className="flex items-center gap-2 sm:gap-3"
                aria-busy="true"
                aria-label="Loading account"
              >
                <div className="w-8 h-8 rounded-full bg-forest-surface animate-pulse" />
                <div className="hidden md:block space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-forest-surface animate-pulse" />
                  <div className="h-3 w-14 rounded bg-forest-surface animate-pulse" />
                </div>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <UserAvatar
                    userId={user.id}
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    className="w-8 h-8"
                  />
                  <div className="hidden md:block min-w-0">
                    <p className="text-sm font-semibold text-forest-text truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-forest-muted">
                      {user.karma} karma
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-forest-muted hover:text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-forest-text hover:text-forest-accent transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-forest-surface"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white bg-forest-accent hover:bg-forest-accent-hover transition-colors px-3 sm:px-4 py-2 rounded-xl"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-forest-bg h-full shadow-2xl flex flex-col border-r border-forest-border">
            <div className="p-4 border-b border-forest-border flex items-center justify-between">
              <span className="font-bold text-forest-text">Menu</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 -mr-1.5 text-forest-muted hover:text-forest-text hover:bg-forest-surface rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3">
              <div className="mb-6">
                <h3 className="font-display px-3 text-xs font-semibold text-forest-muted uppercase tracking-wider mb-3">
                  Your communities
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
                      <span className="font-display truncate">{community.displayName}</span>
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
