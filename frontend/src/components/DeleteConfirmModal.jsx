import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, patient, isDeleting }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !patient) return null;

  const fullName = [patient.first_name, patient.middle_name, patient.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header with warning icon */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
              Delete Patient Record
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the medical chart for:
            </p>
            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-sm">
              <div className="font-semibold text-slate-800">{fullName}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Chart ID: <span className="font-mono text-slate-700">#{patient.id}</span> • DOB: {patient.dob}
              </div>
            </div>
            <p className="mt-3 text-xs text-rose-600 font-medium">
              ⚠️ Warning: This action directly executes FastAPI DELETE /patients/{patient.id} and cannot be undone.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(patient.id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
