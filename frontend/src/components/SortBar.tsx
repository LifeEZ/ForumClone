import React from 'react';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import { SortOption } from '../types';
interface SortBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}
export const SortBar: React.FC<SortBarProps> = ({
  currentSort,
  onSortChange
}) => {
  const options: {
    id: SortOption;
    icon: React.ElementType;
    label: string;
  }[] = [
  {
    id: 'Hot',
    icon: Flame,
    label: 'Hot'
  },
  {
    id: 'New',
    icon: Sparkles,
    label: 'New'
  },
  {
    id: 'Top',
    icon: TrendingUp,
    label: 'Top'
  }];

  return (
    <div className="flex items-center gap-2 mb-6 bg-forest-surface p-2 rounded-xl border border-forest-border">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentSort === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSortChange(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-forest-bg text-forest-text shadow-sm' : 'text-forest-muted hover:bg-forest-surface-hover hover:text-forest-text'}`}>
            
            <Icon className="w-4 h-4" />
            {opt.label}
          </button>);

      })}
    </div>);

};