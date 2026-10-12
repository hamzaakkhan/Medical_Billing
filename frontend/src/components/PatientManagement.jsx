import React, { useMemo } from 'react';
import { UserPlus, Users, RefreshCw } from 'lucide-react';
import PatientTable from './PatientTable';
import { TableSkeleton } from './LoadingSkeleton';
import ErrorAlert from './ErrorAlert';

export default function PatientManagement({
  patients,
  isLoading,
  error,
  onRefresh,
  canCreate,
  canEdit,
  canDelete,
  onOpenAddModal,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  searchQuery,
  onSearchChange,
}) {
  const isViewOnly = !canCreate && !canEdit && !canDelete;

  const stats = useMemo(() => {
    const withEmergency = patients.filter(
      (p) => p.emergency_phone && p.emergency_phone.trim()
    ).length;
    const cities = new Set(
      patients.map((p) => (p.city || '').trim().toLowerCase()).filter(Boolean)
    ).size;
    return {
      total: patients.length,
      withEmergency,
      cities,
    };
  }, [patients]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Patient Directory</span>
            {isViewOnly && (
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md uppercase tracking-wide border border-amber-200 dark:border-amber-800">
                Read Only
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isViewOnly
              ? 'View registered patient charts, contact information, and demographics.'
              : 'Register new patients, update demographics, and manage clinic patient records.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
            title="Refresh patient records"
            aria-label="Refresh patient records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Registered Patients
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Emergency Contact On File
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.withEmergency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Cities Represented
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.cities}</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={onRefresh} />}

      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-xl w-72 animate-pulse" />
          </div>
          <TableSkeleton rows={6} />
        </div>
      ) : (
        <PatientTable
          patients={patients}
          onView={onViewPatient}
          onEdit={canEdit ? onEditPatient : null}
          onDelete={canDelete ? onDeletePatient : null}
          onOpenAddModal={canCreate ? onOpenAddModal : null}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          viewOnly={isViewOnly}
        />
      )}
    </div>
  );
}
