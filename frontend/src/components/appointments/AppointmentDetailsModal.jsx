import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  UserCheck,
  FileText,
  AlertCircle,
  Edit3,
  Trash2,
  CheckCircle,
  Play,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ShieldAlert,
} from 'lucide-react';
import { formatFullName } from '../../utils/nameFormat';

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
    icon: Calendar,
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
    icon: XCircle,
  },
  no_show: {
    label: 'No Show',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900',
    icon: AlertCircle,
  },
  rescheduled: {
    label: 'Rescheduled',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900',
    icon: CalendarClock,
  },
};

// Pure helper function - zero hooks, no conditional hook calls
function getPermittedActions(statusKey, isAdmin) {
  if (isAdmin) return [];

  switch (statusKey) {
    case 'scheduled':
      return [
        {
          key: 'confirmed',
          label: 'Confirm Visit',
          icon: CheckCircle,
          btnClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
        },
        {
          key: 'in_progress',
          label: 'Start Consultation',
          icon: Play,
          btnClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60',
        },
        {
          key: 'no_show',
          label: 'Mark No Show',
          icon: AlertCircle,
          btnClass: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60',
        },
        {
          key: 'cancelled',
          label: 'Cancel Appointment',
          icon: XCircle,
          btnClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60',
        },
      ];
    case 'confirmed':
      return [
        {
          key: 'in_progress',
          label: 'Start Consultation',
          icon: Play,
          btnClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60',
        },
        {
          key: 'no_show',
          label: 'Mark No Show',
          icon: AlertCircle,
          btnClass: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60',
        },
        {
          key: 'cancelled',
          label: 'Cancel Appointment',
          icon: XCircle,
          btnClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60',
        },
      ];
    case 'in_progress':
      return [
        {
          key: 'completed',
          label: 'Complete Consultation',
          icon: CheckCircle2,
          btnClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
        },
        {
          key: 'cancelled',
          label: 'Abort / Cancel',
          icon: XCircle,
          btnClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60',
        },
      ];
    case 'rescheduled':
      return [
        {
          key: 'confirmed',
          label: 'Confirm Visit',
          icon: CheckCircle,
          btnClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
        },
        {
          key: 'in_progress',
          label: 'Start Consultation',
          icon: Play,
          btnClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60',
        },
        {
          key: 'cancelled',
          label: 'Cancel Appointment',
          icon: XCircle,
          btnClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60',
        },
      ];
    default:
      return [];
  }
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  currentUser,
  onEdit,
  onStatusChange,
  onDeleteRequest,
}) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // If not open or no appointment selected, return null safely after all hooks have executed
  if (!isOpen || !appointment) return null;

  const role = currentUser?.role || 'receptionist';
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isReceptionist = role === 'receptionist';

  const statusKey = (appointment.status || 'scheduled').toLowerCase();
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.scheduled;
  const StatusIcon = statusCfg.icon;

  // Format date and time
  const startDate = appointment.start_at ? new Date(appointment.start_at) : null;
  const endDate = appointment.ends_at ? new Date(appointment.ends_at) : null;

  const dateString = startDate
    ? startDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not specified';

  const timeString = startDate && endDate
    ? `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not specified';

  const durationMins = startDate && endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    : null;

  const handleQuickStatus = async (newStatus) => {
    if (isAdmin || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(appointment.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const permittedActions = getPermittedActions(statusKey, isAdmin);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-details-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="appointment-details-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Appointment Details
                </h2>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${statusCfg.badgeClass}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Appointment ID #{appointment.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Oversight Notice */}
        {isAdmin && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Admin Oversight Mode:</strong> You have read-only access. Scheduling modifications are reserved for receptionists and doctors.
            </span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Patient & Doctor Two-Column Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Patient Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Patient
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {appointment.patient_name || `Patient #${appointment.patient_id}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Record ID: #{appointment.patient_id}
              </div>
            </div>

            {/* Doctor Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                Assigned Doctor
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Dr. {appointment.doctor_name || `Doctor #${appointment.doctor_id}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Provider ID: #{appointment.doctor_id}
              </div>
            </div>
          </div>

          {/* Schedule Timing Card */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Schedule Timing
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {dateString}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {timeString}
                </div>
              </div>
              {durationMins && (
                <span className="self-start sm:self-auto text-xs font-medium px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300">
                  {durationMins} minutes
                </span>
              )}
            </div>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Reason for Visit
            </span>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200">
              {appointment.reason || 'No specific visit reason specified.'}
            </div>
          </div>

          {/* Clinical / Administrative Notes */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clinical & Scheduling Notes
            </span>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {appointment.notes ? (
                appointment.notes
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500 text-xs">
                  No additional clinical or scheduling notes recorded for this visit.
                </span>
              )}
            </div>
          </div>

          {/* Permitted Status Actions Bar */}
          {!isAdmin && permittedActions.length > 0 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Permitted Status Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {permittedActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.key}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleQuickStatus(action.key)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${action.btnClass}`}
                    >
                      <ActionIcon className="w-3.5 h-3.5" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terminal Status Notices */}
          {statusKey === 'completed' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Visit Completed:</strong> Consultation has ended and clinical documentation is finalized.
              </span>
            </div>
          )}

          {statusKey === 'cancelled' && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>
                <strong>Appointment Cancelled:</strong> This appointment was cancelled and is inactive.
              </span>
            </div>
          )}

          {statusKey === 'no_show' && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>
                <strong>Patient No Show:</strong> The patient did not attend this scheduled visit.
              </span>
            </div>
          )}

          {/* Audit Metadata */}
          <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between gap-2">
            <span>Scheduled by User #{appointment.scheduled_by}</span>
            {appointment.created_at && (
              <span>Created {new Date(appointment.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          
          {/* Delete Action (Receptionist Only) */}
          <div>
            {isReceptionist ? (
              <button
                type="button"
                onClick={() => onDeleteRequest(appointment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Edit / Reschedule (Receptionist and Doctor) */}
            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(appointment);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>
                  {statusKey === 'completed'
                    ? 'Update Clinical Notes'
                    : isDoctor
                    ? 'Edit Notes & Timing'
                    : 'Edit / Reschedule'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
