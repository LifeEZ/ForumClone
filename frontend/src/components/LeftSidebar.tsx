import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, TrendingUp, Plus, Trees } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
export const LeftSidebar: React.FC = () => {
  const { communities } = useAppContext();
  const location = useLocation();
  const joinedCommunities = communities.filter((c) => c.isJoined);
  const navItems = [
  {
    icon: Home,
    label: 'Home',
    path: '/'
  },
  {
    icon: TrendingUp,
    label: 'Popular',
    path: '/popular'
  },
  {
    icon: Compass,
    label: 'Explore',
    path: '/explore'
  }];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0 border-r border-forest-border bg-forest-bg overflow-y-auto py-6 px-4">
      <Link
        to="/"
        className="flex items-center gap-3 px-2 mb-8 text-forest-accent hover:text-forest-accent-hover transition-colors">
        
        <Trees className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight text-forest-text">
          Canopy
        </span>
      </Link>

      <nav className="space-y-1 mb-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-forest-surface text-forest-text' : 'text-forest-muted hover:bg-forest-surface hover:text-forest-text'}`}>
              
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>);

        })}
      </nav>

      <div className="mb-6">
        <h3 className="px-3 text-xs font-semibold text-forest-muted uppercase tracking-wider mb-3">
          Your Communities
        </h3>
        <div className="space-y-1">
          {joinedCommunities.map((community) =>
          <Link
            key={community.id}
            to={`/r/${community.handle}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${location.pathname === `/r/${community.handle}` ? 'bg-forest-surface text-forest-text' : 'text-forest-muted hover:bg-forest-surface hover:text-forest-text'}`}>
            
              <img
              src={community.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover" />
            
              <span className="truncate">{community.name}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Link
          to="/compose"
          className="flex items-center justify-center gap-2 w-full bg-forest-accent hover:bg-forest-accent-hover text-white py-3 px-4 rounded-xl font-semibold transition-colors">
          
          <Plus className="w-5 h-5" />
          Create Post
        </Link>
      </div>
    </aside>);

};