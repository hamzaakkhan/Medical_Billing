import React from 'react';

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
          <div className="w-28 h-4 bg-slate-200 rounded hidden md:block" />
          <div className="w-32 h-4 bg-slate-200 rounded hidden lg:block" />
          <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block" />
          <div className="w-16 h-8 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-slate-200 rounded" />
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
      </div>
      <div className="w-16 h-8 bg-slate-200 rounded" />
      <div className="w-32 h-3 bg-slate-100 rounded" />
    </div>
  );
}
