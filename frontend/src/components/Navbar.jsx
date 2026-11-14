import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  X,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ROLE_LABELS } from '../utils/permissions';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from './UserProfileModal';
import { formatFullName, getInitials } from '../utils/nameFormat';
import { getStoredAvatar } from '../utils/avatarStorage';
import BrandLogo from './BrandLogo';

function NotificationIcon({ type }) {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
    case 'message':
      return <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
  }
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const PAGE_TITLES = {
  '/': 'Dashboard Overview',
  '/users': 'Staff & User Management',
  '/patients': 'Patient Directory',
  '/appointments': 'Appointments',
};

export default function Navbar({ onMenuClick, user }) {
  const location = useLocation();
  const roleInfo = ROLE_LABELS[user?.role] || {
    label: user?.role || 'Staff',
    color: 'bg-slate-100 text-slate-700',
  };
  const formattedName = formatFullName(user?.first_name, user?.middle_name, user?.last_name);
  const displayName = formattedName || user?.email || 'User';

  const currentPageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    document.title = currentPageTitle ? `${currentPageTitle} | BillMD` : 'BillMD';
  }, [currentPageTitle]);

  const {
    connected,
    unreadCount,
    notifications,
    dismissNotification,
    clearNotifications,
  } = useSocket() || {};

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  const { logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(() => getStoredAvatar(user?.id));

  useEffect(() => {
    setAvatarUrl(getStoredAvatar(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e.detail?.userId === user?.id) {
        setAvatarUrl(e.detail.dataUrl || null);
      }
    };
    window.addEventListener('medflow-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('medflow-avatar-updated', handleAvatarUpdate);
  }, [user?.id]);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileDropdownOpen]);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative z-10">
      {/* Left: Mobile Menu Button + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand badge */}
        <BrandLogo size="sm" showName={true} to="/" className="lg:hidden" />

        <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 dark:text-slate-500 font-medium">
            BillMD
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {currentPageTitle}
          </span>
        </div>
      </div>

      {/* Right: Live Status, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time connection indicator */}
        <div
          title={connected ? 'Real-time updates active' : 'Real-time server offline'}
          className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            connected
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80'
              : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}
        >
          {connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3 h-3" />
              <span>Live Sync</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {panelOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Activity Feed
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {notifications?.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {!notifications?.length ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                    <Bell className="w-7 h-7 mb-2 opacity-30" />
                    <p className="text-xs font-medium">No recent notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="mt-0.5">
                        <NotificationIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {timeAgo(n.timestamp)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissNotification?.(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown trigger & menu */}
        <div className="relative pl-3 border-l border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-transparent text-left cursor-pointer transition-colors duration-150 select-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            aria-label="User account menu"
            aria-expanded={profileDropdownOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none mt-0.5 capitalize">
                {roleInfo.label}
              </p>
            </div>
            <div className="relative shrink-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-xs ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{getInitials(user?.first_name, user?.last_name)}</span>
                )}
              </div>
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs"
              />
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 hidden sm:block ${
                profileDropdownOpen
                  ? 'rotate-180 text-blue-600 dark:text-blue-400'
                  : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* User Identity Header */}
              <div className="px-3.5 py-3">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email}
                </p>
                {roleInfo.label && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 capitalize font-medium">
                    {roleInfo.label}
                  </p>
                )}
              </div>

              {/* Account Profile Action */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(true);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer outline-none focus:outline-none"
                >
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Account Profile</span>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer outline-none focus:outline-none"
                >
                  <LogOut className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}
