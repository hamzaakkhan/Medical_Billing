import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  UserCheck,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  Info,
  CalendarClock,
  CheckCircle,
  Play,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatFullName } from '../../utils/nameFormat';
import SearchableSelect from './SearchableSelect';

const ALL_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900' },
  { value: 'in_progress', label: 'In Progress', icon: Play, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900' },
  { value: 'no_show', label: 'No Show', icon: AlertCircle, color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900' },
  { value: 'rescheduled', label: 'Rescheduled', icon: CalendarClock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900' },
];

// Valid lifecycle transitions for editing an existing appointment
const PERMITTED_STATUS_TRANSITIONS = {
  scheduled: ['scheduled', 'confirmed', 'in_progress', 'cancelled', 'no_show', 'rescheduled'],
  confirmed: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
  in_progress: ['in_progress', 'completed', 'cancelled'],
  rescheduled: ['rescheduled', 'confirmed', 'in_progress', 'cancelled', 'no_show'],
  completed: ['completed'], // Terminal
  cancelled: ['cancelled'], // Terminal
  no_show: ['no_show'],     // Terminal
};

const DURATION_PRESETS = [15, 30, 45, 60, 90];

function formatToInputDateTime(dateObj) {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointmentToEdit = null,
  initialSlot = null,
  currentUser = null,
  doctors = [],
  patients = [],
}) {
  const isEdit = Boolean(appointmentToEdit);
  const role = currentUser?.role || 'receptionist';
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin';

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    start_at: '',
    ends_at: '',
    reason: '',
    status: 'scheduled',
    notes: '',
  });

  const [selectedDuration, setSelectedDuration] = useState(30);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized options for searchable selects
  const patientOptions = useMemo(() => {
    return patients.map((p) => {
      const fullName = formatFullName(p.first_name, p.middle_name, p.last_name) || `Patient #${p.id}`;
      const dobInfo = p.dob ? `DOB: ${p.dob}` : null;
      const phoneInfo = p.phone ? `Phone: ${p.phone}` : null;
      const subtitle = [dobInfo, phoneInfo].filter(Boolean).join(' • ') || 'No contact details';
      return {
        id: p.id,
        title: fullName,
        subtitle,
        badge: `#${p.id}`,
      };
    });
  }, [patients]);

  const doctorOptions = useMemo(() => {
    return doctors.map((d) => {
      const fullName = formatFullName(d.first_name, null, d.last_name) || d.email;
      return {
        id: d.id,
        title: `Dr. ${fullName}`,
        subtitle: d.email || `Doctor #${d.id}`,
        badge: d.role ? d.role.toUpperCase() : 'DOCTOR',
      };
    });
  }, [doctors]);

  // Check if current appointment is in a terminal state
  const isTerminalStatus = useMemo(() => {
    if (!isEdit || !appointmentToEdit) return false;
    const st = (appointmentToEdit.status || '').toLowerCase();
    return st === 'completed' || st === 'cancelled' || st === 'no_show';
  }, [isEdit, appointmentToEdit]);

  // Permitted statuses for the edit dropdown
  const allowedStatusOptions = useMemo(() => {
    if (!isEdit || !appointmentToEdit) return [];
    const currentSt = (appointmentToEdit.status || 'scheduled').toLowerCase();
    const allowedKeys = PERMITTED_STATUS_TRANSITIONS[currentSt] || [currentSt];
    return ALL_STATUS_OPTIONS.filter((opt) => allowedKeys.includes(opt.value));
  }, [isEdit, appointmentToEdit]);

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    setServerError('');
    setErrors({});

    if (appointmentToEdit) {
      const start = appointmentToEdit.start_at ? formatToInputDateTime(appointmentToEdit.start_at) : '';
      const end = appointmentToEdit.ends_at ? formatToInputDateTime(appointmentToEdit.ends_at) : '';
      
      let duration = 30;
      if (appointmentToEdit.start_at && appointmentToEdit.ends_at) {
        const diffMs = new Date(appointmentToEdit.ends_at) - new Date(appointmentToEdit.start_at);
        const mins = Math.round(diffMs / 60000);
        if (mins > 0) duration = mins;
      }
      setSelectedDuration(duration);

      setFormData({
        patient_id: appointmentToEdit.patient_id ? String(appointmentToEdit.patient_id) : '',
        doctor_id: appointmentToEdit.doctor_id ? String(appointmentToEdit.doctor_id) : (isDoctor ? String(currentUser?.id) : ''),
        start_at: start,
        ends_at: end,
        reason: appointmentToEdit.reason || '',
        status: appointmentToEdit.status || 'scheduled',
        notes: appointmentToEdit.notes || '',
      });
    } else {
      // New appointment: status is always 'scheduled'
      let defaultStart = '';
      let defaultEnd = '';

      if (initialSlot?.start) {
        defaultStart = formatToInputDateTime(initialSlot.start);
        if (initialSlot.end) {
          defaultEnd = formatToInputDateTime(initialSlot.end);
          const diffMs = new Date(initialSlot.end) - new Date(initialSlot.start);
          const mins = Math.round(diffMs / 60000);
          if (mins > 0) setSelectedDuration(mins);
        } else {
          const endDate = new Date(new Date(initialSlot.start).getTime() + 30 * 60000);
          defaultEnd = formatToInputDateTime(endDate);
          setSelectedDuration(30);
        }
      } else {
        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
        defaultStart = formatToInputDateTime(now);
        const nextEnd = new Date(now.getTime() + 30 * 60000);
        defaultEnd = formatToInputDateTime(nextEnd);
        setSelectedDuration(30);
      }

      setFormData({
        patient_id: '',
        doctor_id: isDoctor ? String(currentUser?.id) : (doctors[0] ? String(doctors[0].id) : ''),
        start_at: defaultStart,
        ends_at: defaultEnd,
        reason: '',
        status: 'scheduled',
        notes: '',
      });
    }
  }, [isOpen, appointmentToEdit, initialSlot, currentUser, isDoctor, doctors]);

  // Escape key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Adjust ends_at when duration or start_at changes
  const handleDurationSelect = (mins) => {
    setSelectedDuration(mins);
    if (formData.start_at) {
      const startDate = new Date(formData.start_at);
      if (!isNaN(startDate.getTime())) {
        const newEndDate = new Date(startDate.getTime() + mins * 60000);
        setFormData((prev) => ({
          ...prev,
          ends_at: formatToInputDateTime(newEndDate),
        }));
      }
    }
  };

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, start_at: newStart };
      if (newStart && selectedDuration) {
        const startDate = new Date(newStart);
        if (!isNaN(startDate.getTime())) {
          const newEndDate = new Date(startDate.getTime() + selectedDuration * 60000);
          updated.ends_at = formatToInputDateTime(newEndDate);
        }
      }
      return updated;
    });
    if (errors.start_at) setErrors((prev) => ({ ...prev, start_at: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.patient_id) {
      errs.patient_id = 'Please select a patient';
    }
    if (!formData.doctor_id) {
      errs.doctor_id = 'Please select an assigned doctor';
    }
    if (!formData.start_at) {
      errs.start_at = 'Start time is required';
    }
    if (!formData.ends_at) {
      errs.ends_at = 'End time is required';
    } else if (formData.start_at && new Date(formData.ends_at) <= new Date(formData.start_at)) {
      errs.ends_at = 'End time must be after start time';
    } else if (formData.start_at && formData.ends_at) {
      const durationMins = (new Date(formData.ends_at) - new Date(formData.start_at)) / 60000;
      if (durationMins < 5) {
        errs.ends_at = 'Duration must be at least 5 minutes';
      } else if (durationMins > 1440) {
        errs.ends_at = 'Duration cannot exceed 24 hours';
      }
    }
    if (!formData.reason.trim()) {
      errs.reason = 'Please enter a reason for the appointment';
    } else if (formData.reason.length > 255) {
      errs.reason = 'Reason cannot exceed 255 characters';
    }
    if (formData.notes && formData.notes.length > 1000) {
      errs.notes = 'Notes cannot exceed 1000 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (isAdmin) {
      setServerError('Admins have read-only permissions and cannot modify appointments.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        start_at: new Date(formData.start_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        reason: formData.reason.trim(),
        // New appointments always start in 'scheduled' state
        status: isEdit ? formData.status : 'scheduled',
        notes: formData.notes.trim() || null,
      };

      await onSave(payload, appointmentToEdit?.id);
    } catch (err) {
      setServerError(err.message || 'An error occurred while saving the appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => String(p.id) === String(formData.patient_id));

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="appointment-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isEdit ? 'Edit & Reschedule Appointment' : 'Schedule New Appointment'}
                </h2>
                {!isEdit && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-md">
                    Initial: Scheduled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdit
                  ? 'Update appointment timing, provider notes, or visit progression.'
                  : 'Specify patient, provider, date, duration, and reason for consultation.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Scheduling Conflict: </span>
              {serverError}
            </div>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Patient Selection */}
          {isEdit && isDoctor ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Patient <span className="text-rose-500">*</span>
                </span>
                <span className="text-xs text-slate-400 italic">Patient locked by doctor role</span>
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>{appointmentToEdit.patient_name || `Patient #${appointmentToEdit.patient_id}`}</span>
                <span className="text-xs text-slate-400 italic">Assigned Patient</span>
              </div>
            </div>
          ) : (
            <SearchableSelect
              label="Patient"
              required
              placeholder="Search patient by name, DOB, or phone..."
              options={patientOptions}
              value={formData.patient_id}
              onChange={(id) => {
                setFormData((prev) => ({ ...prev, patient_id: id }));
                if (errors.patient_id) setErrors((prev) => ({ ...prev, patient_id: '' }));
              }}
              error={errors.patient_id}
              icon={User}
            />
          )}

          {/* Doctor Selection */}
          {isDoctor ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  Assigned Doctor <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal normal-case text-amber-600 dark:text-amber-400">
                  Fixed to logged-in doctor
                </span>
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Dr. {formatFullName(currentUser?.first_name, null, currentUser?.last_name) || currentUser?.email}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Self</span>
              </div>
            </div>
          ) : (
            <SearchableSelect
              label="Assigned Doctor"
              required
              placeholder="Search doctor by name or email..."
              options={doctorOptions}
              value={formData.doctor_id}
              onChange={(id) => {
                setFormData((prev) => ({ ...prev, doctor_id: id }));
                if (errors.doctor_id) setErrors((prev) => ({ ...prev, doctor_id: '' }));
              }}
              error={errors.doctor_id}
              icon={UserCheck}
            />
          )}

          {/* Time & Duration Slot Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Scheduling Slot & Duration
              </span>
              
              {/* Duration Presets */}
              <div className="flex items-center gap-1.5">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationSelect(mins)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      selectedDuration === mins
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={handleStartChange}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.start_at
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.start_at && (
                  <p className="mt-1 text-xs text-rose-500">{errors.start_at}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setFormData((prev) => ({ ...prev, ends_at: newEnd }));
                    if (formData.start_at && newEnd) {
                      const diffMins = Math.round((new Date(newEnd) - new Date(formData.start_at)) / 60000);
                      if (diffMins > 0) setSelectedDuration(diffMins);
                    }
                    if (errors.ends_at) setErrors((prev) => ({ ...prev, ends_at: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ends_at
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.ends_at && (
                  <p className="mt-1 text-xs text-rose-500">{errors.ends_at}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reason for Visit & Optional Status (Status is shown ONLY in Edit mode) */}
          <div className={`grid grid-cols-1 ${isEdit ? 'sm:grid-cols-3' : ''} gap-4`}>
            <div className={isEdit ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Reason for Visit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Annual Checkup, Follow-up Consultation, Routine Examination"
                maxLength={255}
                value={formData.reason}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, reason: e.target.value }));
                  if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason
                    ? 'border-rose-400 bg-rose-50/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-rose-500">{errors.reason}</p>
              )}
            </div>

            {/* In Edit mode: show status selector with only permitted transitions */}
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                {isTerminalStatus ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {formData.status.replace('_', ' ')} (Locked)
                  </div>
                ) : (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium capitalize"
                  >
                    {allowedStatusOptions.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Clinical / Administrative Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Clinical / Administrative Notes (Optional)</span>
              <span className="text-[11px] font-normal normal-case text-slate-400">
                {formData.notes.length}/1000
              </span>
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Add patient special requests, symptoms, pre-appointment prep, or doctor notes..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-rose-500">{errors.notes}</p>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isAdmin}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Confirm & Schedule'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
