import React from 'react';
import { UserPlus, Users, RefreshCw, Eye } from 'lucide-react';
import PatientTable from './PatientTable';
import { TableSkeleton } from './LoadingSkeleton';
import ErrorAlert from './ErrorAlert';

export default function PatientManagement({
  patients, isLoading, error, onRefresh,
  canCreate, canEdit, canDelete,
  onOpenAddModal, onViewPatient, onEditPatient, onDeletePatient,
  searchQuery, onSearchChange, role,
}) {
  const isViewOnly = !canCreate && !canEdit && !canDelete;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Patient Directory
            {isViewOnly && (
              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-wide border border-amber-200">
                View Only
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isViewOnly
              ? `You have read-only access to patient records (${role} role).`
              : 'Register, search, edit, and manage patient records.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreate && onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={onRefresh} />}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="h-9 bg-gray-200 rounded-lg w-72 animate-pulse" />
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
