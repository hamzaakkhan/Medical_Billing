import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Stethoscope,
  Settings,
  Activity,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, isBackendHealthy, patientCount = 0 }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Reception Dashboard',
      icon: LayoutDashboard,
      badge: null,
      enabled: true,
    },
    {
      id: 'patients',
      label: 'Patient Directory',
      icon: Users,
      badge: patientCount > 0 ? patientCount : null,
      enabled: true,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarCheck,
      badge: 'Soon',
      enabled: false,
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: CreditCard,
      badge: 'Soon',
      enabled: false,
    },
    {
      id: 'claims',
      label: 'Insurance & Claims',
      icon: FileSpreadsheet,
      badge: 'Soon',
      enabled: false,
    },
    {
      id: 'doctors',
      label: 'Care Providers',
      icon: Stethoscope,
      badge: 'Soon',
      enabled: false,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Clinic Branding */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base tracking-tight leading-tight">
              MedFlow EHR
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Receptionist Desk</p>
          </div>
        </div>

        {/* Backend Status Indicator */}
        <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="text-slate-400">FastAPI Backend</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span
              className={`text-[11px] font-semibold ${
                isBackendHealthy ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isBackendHealthy ? 'Connected' : 'Checking'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.enabled && onTabChange(item.id)}
              disabled={!item.enabled}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : item.enabled
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-400 cursor-not-allowed hover:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : item.enabled ? 'text-slate-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.enabled
                      ? 'bg-slate-800 text-sky-400'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          System & Support
        </div>
        <button
          disabled
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>System Settings</span>
          <span className="ml-auto text-[10px] bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </button>
      </nav>

      {/* Receptionist Profile Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Station 01 • Front Desk</p>
            <p className="text-[11px] text-slate-400 truncate">Staff ID: REC-9042</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="HIPAA Compliant Session" />
        </div>
      </div>
    </aside>
  );
}
