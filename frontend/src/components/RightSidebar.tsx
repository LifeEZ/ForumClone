import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
interface RightSidebarProps {
  communityId?: string;
}
export const RightSidebar: React.FC<RightSidebarProps> = ({ communityId }) => {
  const { communities, toggleJoinCommunity } = useAppContext();
  const community = communityId ?
  communities.find((c) => c.id === communityId) :
  null;
  const trendingCommunities = communities.filter((c) => !c.isJoined).slice(0, 3);
  return (
    <aside className="w-80 flex-shrink-0 hidden xl:block h-screen sticky top-0 py-6 px-4 overflow-y-auto">
      {community ?
      <div className="bg-forest-surface border border-forest-border rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-forest-muted uppercase tracking-wider mb-4">
            About Community
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <img
            src={community.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover" />
          
            <div>
              <h4 className="font-bold text-forest-text">{community.name}</h4>
              <p className="text-sm text-forest-muted">r/{community.handle}</p>
            </div>
          </div>
          <p className="text-sm text-forest-text/90 mb-4">
            {community.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-forest-text mb-6">
            <div>
              <span className="font-bold block">
                {community.memberCount.toLocaleString()}
              </span>
              <span className="text-forest-muted">Members</span>
            </div>
            <div>
              <span className="font-bold block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-forest-accent block"></span>
                124
              </span>
              <span className="text-forest-muted">Online</span>
            </div>
          </div>
          <button
          onClick={() => toggleJoinCommunity(community.id)}
          className={`w-full py-2 rounded-xl font-semibold transition-colors ${community.isJoined ? 'bg-forest-bg border border-forest-border text-forest-text hover:bg-forest-surface-hover' : 'bg-forest-accent text-white hover:bg-forest-accent-hover'}`}>
          
            {community.isJoined ? 'Joined' : 'Join Community'}
          </button>
        </div> :

      <div className="bg-forest-surface border border-forest-border rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-forest-muted uppercase tracking-wider mb-4">
            Trending Communities
          </h3>
          <div className="space-y-4">
            {trendingCommunities.map((c) =>
          <div
            key={c.id}
            className="flex items-center justify-between gap-3">
            
                <Link
              to={`/r/${c.handle}`}
              className="flex items-center gap-3 flex-1 min-w-0 group">
              
                  <img
                src={c.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              
                  <div className="truncate">
                    <h4 className="font-semibold text-sm text-forest-text group-hover:underline truncate">
                      {c.name}
                    </h4>
                    <p className="text-xs text-forest-muted truncate">
                      {c.memberCount.toLocaleString()} members
                    </p>
                  </div>
                </Link>
                <button
              onClick={() => toggleJoinCommunity(c.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-forest-bg border border-forest-border text-forest-text hover:bg-forest-surface-hover transition-colors flex-shrink-0">
              
                  Join
                </button>
              </div>
          )}
          </div>
        </div>
      }

      <div className="text-xs text-forest-muted space-y-2 px-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a href="#" className="hover:underline">
            User Agreement
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Content Policy
          </a>
          <a href="#" className="hover:underline">
            Moderator Code
          </a>
        </div>
        <p className="pt-2 border-t border-forest-border/50">
          Canopy © 2026. All rights reserved.
        </p>
      </div>
    </aside>);

};