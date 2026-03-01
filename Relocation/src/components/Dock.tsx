import { Home, Rocket, Users, Newspaper, StickyNote, Star, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import React from 'react';

type DockItem = {
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
};

type DockProps = {
  items?: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  activeLabel?: string;
};

const defaultDockItems: DockItem[] = [
  { to: '/', icon: <Home className="h-6 w-6" />, label: 'Home' },
  { to: '/dashboard', icon: <Rocket className="h-6 w-6" />, label: 'Dashboard' },
  { to: '/amenities', icon: <MapPin className="h-6 w-6" />, label: 'Amenities' },
  { to: '/vibe-match', icon: <Users className="h-6 w-6" />, label: 'Vibe Match' },
  { to: '/articles', icon: <Newspaper className="h-6 w-6" />, label: 'Articles' },
  { to: '/notes', icon: <StickyNote className="h-6 w-6" />, label: 'Notes' },
  { to: '/reviews', icon: <Star className="h-6 w-6" />, label: 'Reviews' },
];

const Dock = ({ items, activeLabel }: DockProps) => {
  const list = items && items.length ? items : defaultDockItems;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full shadow-lg">
        {list.map((item, idx) =>
          item.to ? (
            <NavLink
              key={item.to + idx}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center h-12 w-12 rounded-full transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
              title={item.label}
            >
              {item.icon}
            </NavLink>
          ) : (
            <button
              key={item.label + idx}
              onClick={item.onClick}
              title={item.label}
              className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors ${
                activeLabel && activeLabel === item.label
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Dock;
