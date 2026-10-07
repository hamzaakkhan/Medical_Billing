import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, Wifi, WifiOff, X, CheckCheck, Info, AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { ROLE_LABELS } from '../utils/permissions';
import { useSocket } from '../context/SocketContext';

function NotificationIcon({ type }) {
  switch (type) {
    case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    case 'error':   return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    case 'message': return <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    default:        return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  }
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Navbar({ onMenuClick, user }) {
  const roleInfo = ROLE_LABELS[user?.role] || { label: user?.role || '', color: 'bg-gray-100 text-gray-700' };
  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user?.email || 'User';

  const { connected, unreadCount, notifications, dismissNotification, clearNotifications } = useSocket() || {};
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel when clicking outside
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

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients, invoices..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Real-time connection indicator */}
        <div
          title={connected ? 'Real-time connected' : 'Connecting to real-time server…'}
          className={`hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${
            connected
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-gray-400 bg-gray-50 border-gray-200'
          }`}
        >
          {connected
            ? <><Wifi className="w-3 h-3" /> Live</>
            : <><WifiOff className="w-3 h-3" /> Offline</>
          }
        </div>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelOpen(o => !o)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 ring-1 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {panelOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {notifications?.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {!notifications?.length ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                    >
                      <NotificationIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                      </div>
                      <button
                        onClick={() => dismissNotification?.(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {connected ? <><Wifi className="w-3 h-3"/> Real-time connected</> : <><WifiOff className="w-3 h-3"/> Reconnecting…</>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 ml-1">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">{displayName}</p>
            <p className={`text-[10px] font-medium mt-0.5 leading-none ${roleInfo.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-500'}`}>
              {roleInfo.label}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer">
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
