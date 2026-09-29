import React, { useState, useEffect } from 'react';
import { UserPlus, RefreshCw, Calendar, Clock, Bell, Shield } from 'lucide-react';

export default function Navbar({ activeTab, onOpenAddModal, onRefresh, isRefreshing, patientCount }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Context */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {activeTab === 'dashboard' ? 'Receptionist Dashboard' : 'Patient Records & Directory'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Primary Care & Outpatient Intake</span>
            <span>•</span>
            <span className="text-sky-600 font-semibold">{patientCount} Active Records</span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Date & Time display */}
        <div className="hidden xl:flex items-center gap-4 px-3.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200/80 disabled:opacity-50"
          title="Refresh patient records from database"
          aria-label="Refresh records"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
        </button>

        {/* Primary Action: Add Patient */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-sky-600/20 hover:shadow"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </div>
    </header>
  );
}
