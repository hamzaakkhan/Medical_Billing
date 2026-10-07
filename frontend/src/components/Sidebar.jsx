import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserRound, FileText, Building2, BarChart3,
  CalendarCheck, ShieldCheck, ClipboardList, Code2, ClipboardCheck,
  XCircle, Settings, LogOut, Activity, ChevronRight, X
} from 'lucide-react';
import { NAV_CONFIG, ROLE_LABELS } from '../utils/permissions';

const ICON_MAP = {
  LayoutDashboard, Users, UserRound, FileText, Building2, BarChart3,
  CalendarCheck, ShieldCheck, ClipboardList, Code2, ClipboardCheck,
  XCircle, Settings,
};

const GROUP_LABELS = {
  main:    null,
  finance: 'Finance & Billing',
};

export default function Sidebar({ isOpen, setIsOpen, userRole, user, onLogout }) {
  const navItems = NAV_CONFIG[userRole] || [];
  const roleInfo = ROLE_LABELS[userRole] || { label: userRole, badge: userRole?.toUpperCase(), color: 'bg-gray-100 text-gray-700' };

  // Group nav items
  const groups = {};
  navItems.filter(i => i.group !== 'bottom').forEach(item => {
    const g = item.group || 'main';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });
  const bottomItems = navItems.filter(i => i.group === 'bottom');

  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user?.email || 'User';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200
        flex flex-col transform transition-transform duration-250 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 leading-none">MedFlow</span>
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide ${roleInfo.color}`}>
                {roleInfo.badge}
              </span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {Object.entries(groups).map(([groupKey, items]) => (
            <div key={groupKey} className="mb-1">
              {GROUP_LABELS[groupKey] && (
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {GROUP_LABELS[groupKey]}
                </p>
              )}
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                return (
                  <NavLink
                    key={item.id}
                    to={item.id}
                    end={item.id === '/'}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-150 cursor-pointer mb-0.5
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && (
                        <NavLink to={item.id} end={item.id === '/'}>
                          {({ isActive }) => (
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                          )}
                        </NavLink>
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide leading-none">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-gray-100">
          {/* Settings */}
          {bottomItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.id}
                to={item.id}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-5 py-3 text-sm font-medium transition-colors
                  ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </NavLink>
            );
          })}

          {/* User avatar + logout */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{roleInfo.label}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
