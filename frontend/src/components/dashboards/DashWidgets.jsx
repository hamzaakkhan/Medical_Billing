import React from 'react';

// Reusable stat card
export function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${iconBg || 'bg-blue-50'} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor || 'text-blue-600'}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Section header
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {action}
    </div>
  );
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    'Checked In':  'bg-emerald-100 text-emerald-700',
    'In Session':  'bg-blue-100 text-blue-700',
    'Scheduled':   'bg-gray-100 text-gray-600',
    'Pending':     'bg-amber-100 text-amber-700',
    'Denied':      'bg-red-100 text-red-700',
    'Paid':        'bg-emerald-100 text-emerald-700',
    'Active':      'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// Loading skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

// Table wrapper
export function DashTable({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }) {
  return <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-2.5 text-sm text-gray-700 border-b border-gray-100 ${className}`}>{children}</td>;
}
