import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserRound,
  Calendar,
  X,
  Settings,
} from 'lucide-react';
import { NAV_CONFIG } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import BrandLogo from './BrandLogo';

const ICON_MAP = {
  LayoutDashboard,
  Users,
  UserRound,
  Calendar,
};

export default function Sidebar({ isOpen, setIsOpen, userRole }) {
  const { user } = useAuth();
  const effectiveRole = userRole || user?.role;
  const navItems = NAV_CONFIG[effectiveRole] || [];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          flex flex-col transform transition-transform duration-200 ease-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <BrandLogo size="md" to="/" />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.id}
                to={item.id}
                end={item.id === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm
                  transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                          strokeWidth={isActive ? 2.4 : 2}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wide leading-none shrink-0 ${
                          isActive
                            ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Shelf: Settings Only */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          {/* Settings Entry */}
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(true);
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60 shadow-2xs hover:shadow-xs transition cursor-pointer group"
            aria-label="Open system settings and preferences"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              <span className="truncate">Settings</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              Preferences
            </span>
          </button>
        </div>
      </aside>

      {/* System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
