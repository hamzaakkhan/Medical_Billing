import React from 'react';
import {
  LayoutDashboard, Users, FileText, Building2, BarChart3,
  CalendarCheck, ShieldCheck, ClipboardList, Code2, ClipboardCheck,
  XCircle, Settings,
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard, Users, FileText, Building2, BarChart3,
  CalendarCheck, ShieldCheck, ClipboardList, Code2, ClipboardCheck,
  XCircle, Settings,
};

export default function PlaceholderPage({ title, description, icon = 'LayoutDashboard' }) {
  const Icon = ICON_MAP[icon] || LayoutDashboard;

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
        <Icon className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-6">{description}</p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
        Module scaffolded — backend integration in progress
      </div>
    </div>
  );
}
