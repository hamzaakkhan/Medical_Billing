import React from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Building2,
  Activity,
  ArrowRight,
  Eye,
  ShieldCheck,
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { StatCardSkeleton } from './LoadingSkeleton';

export default function Dashboard({
  user,
  patients,
  isLoading,
  onOpenAddModal,
  onNavigateToPatients,
  onViewPatient,
  onSearchFocus,
}) {
  const totalPatients = patients.length;
  const recentPatients = [...patients].slice(-5).reverse();

  // Metrics
  const distinctCities = new Set(patients.map((p) => p.city?.trim()).filter(Boolean)).size;
  const emergencyCount = patients.filter((p) => p.emergency_phone?.trim()).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-200 border border-white/15 mb-4">
            <Activity className="w-3.5 h-3.5 text-sky-300" />
            <span>Outpatient Reception & Patient Intake Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome to MedFlow Receptionist Portal
          </h2>
          <p className="mt-2 text-sm sm:text-base text-sky-100 leading-relaxed">
            Manage patient registrations, access medical charts, and update contact profiles in real-time
            synchronized with PostgreSQL & FastAPI.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sky-900 text-sm font-bold shadow-md hover:bg-sky-50 active:scale-95 transition"
            >
              <UserPlus className="w-4 h-4 text-sky-700" />
              <span>Register New Patient</span>
            </button>
            <button
              onClick={onNavigateToPatients}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800/80 hover:bg-sky-700/80 border border-white/20 text-white text-sm font-semibold transition"
            >
              <Users className="w-4 h-4" />
              <span>Browse All Records</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue Card (Admin/Biller only) */}
          {(user?.role === 'admin' || user?.role === 'biller') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <span className="font-bold text-lg">$</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  $12,450
                </span>
                <span className="text-xs text-slate-400 ml-2 font-medium">MTD estimate</span>
              </div>
              <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Module in development
              </p>
            </div>
          )}

          {/* Card 1: Total Patients */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Patients
              </span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{totalPatients}</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">registered charts</span>
            </div>
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized with DB
            </p>
          </div>

          {/* Card 2: Emergency Contact Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Emergency On File
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{emergencyCount}</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">with contacts</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">
              {totalPatients > 0 ? `${Math.round((emergencyCount / totalPatients) * 100)}% compliance` : '0%'}
            </p>
          </div>

          {/* Card 3: Geographic Coverage */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Locations Served
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">{distinctCities}</span>
              <span className="text-xs text-slate-400 ml-2 font-medium">cities / regions</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">Active patient catchment</p>
          </div>

          {/* Card 4: Front Desk Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Desk Operational
              </span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">Online</span>
            </div>
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Station Ready
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Registrations & Receptionist Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Recent Registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Patient Registrations</h3>
              <p className="text-xs text-slate-500">Most recently added patient records in the clinic</p>
            </div>
            <button
              onClick={onNavigateToPatients}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            {recentPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No patient records found in the database.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPatients.map((patient) => {
                  const fullName = [patient.first_name, patient.middle_name, patient.last_name]
                    .filter(Boolean)
                    .join(' ');
                  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();

                  return (
                    <div
                      key={patient.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/60">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition truncate">
                            {fullName}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                            <span>Chart #{patient.id}</span>
                            <span>•</span>
                            <span>{patient.city || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-mono">{patient.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onViewPatient(patient)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="View Chart"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Receptionist Checklist & Quick Desk Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Front Desk Fast Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={onOpenAddModal}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-800 text-xs font-semibold transition border border-sky-100"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div>Register New Patient</div>
                  <div className="text-[11px] font-normal text-sky-600">Enter demographic details</div>
                </div>
              </button>

              <button
                onClick={onNavigateToPatients}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition border border-slate-200/60"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div>Search & Filter Directory</div>
                  <div className="text-[11px] font-normal text-slate-500">Find by name, phone or chart ID</div>
                </div>
              </button>
            </div>
          </div>

          {/* Daily Reception Protocol Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Intake Protocol Guidelines</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Verify full legal name and date of birth with government-issued photo ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Confirm current 9–11 digit telephone number and valid email for billing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Record an emergency contact number for urgent medical notifications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Validate street address and postal code for insurance claims billing.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
