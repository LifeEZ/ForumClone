import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Trees, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
export const TopBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { communities } = useAppContext();
  const joinedCommunities = communities.filter((c) => c.isJoined);
  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-forest-bg/80 backdrop-blur-md border-b border-forest-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 -ml-1.5 text-forest-text hover:bg-forest-surface rounded-lg transition-colors">
            
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-forest-accent">
            <Trees className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-forest-text">
              Canopy
            </span>
          </Link>
        </div>

        <Link
          to="/compose"
          className="p-1.5 -mr-1.5 text-forest-text hover:bg-forest-surface rounded-lg transition-colors">
          
          <Plus className="w-6 h-6" />
        </Link>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen &&
      <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)} />
        
          <div className="relative w-72 max-w-[80vw] bg-forest-bg h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-forest-border flex items-center justify-between">
              <span className="font-bold text-forest-text">Menu</span>
              <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 -mr-1.5 text-forest-muted hover:text-forest-text hover:bg-forest-surface rounded-lg transition-colors">
              
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3">
              <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-forest-muted uppercase tracking-wider mb-3">
                  Your Communities
                </h3>
                <div className="space-y-1">
                  {joinedCommunities.map((community) =>
                <Link
                  key={community.id}
                  to={`/r/${community.handle}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-forest-text hover:bg-forest-surface transition-colors">
                  
                      <img
                    src={community.avatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover" />
                  
                      <span className="truncate">{community.name}</span>
                    </Link>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </>);

};