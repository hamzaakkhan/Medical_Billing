import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Edit3,
  Printer,
  IdCard,
} from 'lucide-react';
import { normalizeName, formatFullName, getInitials } from '../utils/nameFormat';

export default function PatientViewModal({ isOpen, onClose, patient, onEdit }) {
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

  if (!isOpen || !patient) return null;

  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} years old` : 'N/A';
  };

  const fullName = formatFullName(patient.first_name, patient.middle_name, patient.last_name);

  const initials = getInitials(patient.first_name, patient.last_name);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-view-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/25 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white relative shrink-0 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-15 h-15 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200 text-lg font-bold tracking-wider shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  CHART #{patient.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Registered Patient
                </span>
              </div>
              <h3
                id="patient-view-title"
                className="text-xl font-bold mt-1.5 text-white tracking-tight truncate"
              >
                {fullName}
              </h3>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>DOB: {patient.dob}</span>
                <span>•</span>
                <span className="text-blue-200 font-medium">{calculateAge(patient.dob)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-200">
          {/* Section: Demographics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Patient Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">First Name</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{normalizeName(patient.first_name)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Middle Name</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.middle_name ? normalizeName(patient.middle_name) : <span className="text-slate-400 dark:text-slate-500 font-normal">None</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Last Name</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{normalizeName(patient.last_name)}</p>
              </div>
            </div>
          </div>

          {/* Section: Contact & Emergency */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Primary Phone
                </p>
                <a
                  href={`tel:${patient.phone}`}
                  className="block mt-1 font-mono font-semibold text-blue-700 dark:text-blue-400 hover:underline text-sm"
                >
                  {patient.phone}
                </a>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Email Address
                </p>
                <a
                  href={`mailto:${patient.email}`}
                  className="block mt-1 font-medium text-blue-700 dark:text-blue-400 hover:underline text-sm truncate"
                >
                  {patient.email}
                </a>
              </div>

              <div className="md:col-span-2 bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200/70 dark:border-amber-800/60">
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Emergency Contact Number
                </p>
                <p className="mt-1 font-mono text-sm text-slate-800 dark:text-slate-200">
                  {patient.emergency_phone ? (
                    <a
                      href={`tel:${patient.emergency_phone}`}
                      className="font-semibold text-amber-900 dark:text-amber-300 hover:underline"
                    >
                      {patient.emergency_phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Not provided</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Residential Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Residential Address
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Street Address</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{patient.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">City</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{patient.city}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">State / Province</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{patient.state}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Postal Code</p>
                  <p className="font-mono font-medium text-slate-900 dark:text-slate-100 mt-0.5">{patient.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Chart</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(patient);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
