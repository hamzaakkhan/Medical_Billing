import React, { useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Edit3,
  Printer,
  Shield,
  Clock,
  IdCard,
} from 'lucide-react';

export default function PatientViewModal({ isOpen, onClose, patient, onEdit }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const fullName = [patient.first_name, patient.middle_name, patient.last_name]
    .filter(Boolean)
    .join(' ');

  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-xl font-bold tracking-wider shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  CHART #{patient.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Active Patient
                </span>
              </div>
              <h3 id="patient-view-title" className="text-xl font-bold mt-1 text-white tracking-tight">
                {fullName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>DOB: {patient.dob}</span>
                <span>•</span>
                <span className="text-sky-300 font-medium">{calculateAge(patient.dob)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Section: Demographics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-sky-600" />
              Patient Identification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">First Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">{patient.first_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Middle Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {patient.middle_name || <span className="text-slate-400 italic">None</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Last Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">{patient.last_name}</p>
              </div>
            </div>
          </div>

          {/* Section: Contact & Emergency */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-600" />
              Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-600" /> Primary Phone
                </p>
                <a
                  href={`tel:${patient.phone}`}
                  className="block mt-1 font-mono font-semibold text-sky-700 hover:underline text-sm"
                >
                  {patient.phone}
                </a>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600" /> Email Address
                </p>
                <a
                  href={`mailto:${patient.email}`}
                  className="block mt-1 font-medium text-sky-700 hover:underline text-sm truncate"
                >
                  {patient.email}
                </a>
              </div>

              <div className="md:col-span-2 bg-amber-50/70 p-4 rounded-xl border border-amber-200/70">
                <p className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Emergency Contact Number
                </p>
                <p className="mt-1 font-mono text-sm text-slate-800">
                  {patient.emergency_phone ? (
                    <a
                      href={`tel:${patient.emergency_phone}`}
                      className="font-semibold text-amber-900 hover:underline"
                    >
                      {patient.emergency_phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not registered on file</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Residential Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              Residential Address
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">Street Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">{patient.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                <div>
                  <p className="text-xs text-slate-400 font-medium">City</p>
                  <p className="font-medium text-slate-800 mt-0.5">{patient.city}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">State / Province</p>
                  <p className="font-medium text-slate-800 mt-0.5">{patient.state}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Postal Code</p>
                  <p className="font-mono font-medium text-slate-800 mt-0.5">{patient.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Chart</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(patient);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-sky-600/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Patient</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
