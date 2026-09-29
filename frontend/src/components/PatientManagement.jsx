import React from 'react';
import { UserPlus, Users, Search, RefreshCw } from 'lucide-react';
import PatientTable from './PatientTable';
import { TableSkeleton } from './LoadingSkeleton';
import ErrorAlert from './ErrorAlert';

export default function PatientManagement({
  patients,
  isLoading,
  error,
  onRefresh,
  onOpenAddModal,
  onViewPatient,
  onEditPatient,
  onDeletePatient,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Patient Management & Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, inspect, update, and manage all active patient electronic health records (EHR).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-sky-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Patient</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={onRefresh} />}

      {/* Table Container */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            <div className="h-9 bg-slate-200 rounded-xl w-72 animate-pulse" />
          </div>
          <TableSkeleton rows={6} />
        </div>
      ) : (
        <PatientTable
          patients={patients}
          onView={onViewPatient}
          onEdit={onEditPatient}
          onDelete={onDeletePatient}
          onOpenAddModal={onOpenAddModal}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      )}
    </div>
  );
}
