import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserPlus,
  Edit3,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Check,
} from 'lucide-react';
import { normalizeName, formatFullName } from '../utils/nameFormat';
import { getAllPatients } from '../api/patientApi';

const INITIAL_FORM = {
  first_name: '',
  middle_name: '',
  last_name: '',
  dob: '',
  health_card: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  email: '',
  phone: '',
  emergency_phone: '',
};

export default function PatientModal({ isOpen, onClose, onSave, patientToEdit, existingPatients = [] }) {
  const isEdit = Boolean(patientToEdit);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [patientList, setPatientList] = useState(existingPatients || []);

  useEffect(() => {
    if (Array.isArray(existingPatients) && existingPatients.length > 0) {
      setPatientList(existingPatients);
    } else if (isOpen) {
      getAllPatients()
        .then((data) => {
          if (Array.isArray(data)) setPatientList(data);
        })
        .catch(() => {});
    }
  }, [existingPatients, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (patientToEdit) {
      setFormData({
        first_name: patientToEdit.first_name || '',
        middle_name: patientToEdit.middle_name || '',
        last_name: patientToEdit.last_name || '',
        dob: patientToEdit.dob || '',
        health_card: patientToEdit.health_card || '',
        address: patientToEdit.address || '',
        city: patientToEdit.city || '',
        state: patientToEdit.state || '',
        postal_code: patientToEdit.postal_code || '',
        email: patientToEdit.email || '',
        phone: patientToEdit.phone || '',
        emergency_phone: patientToEdit.emergency_phone || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
    setServerError('');
    setDuplicateWarning(null);
  }, [patientToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (duplicateWarning) {
          setDuplicateWarning(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose, duplicateWarning]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length > 30) {
      newErrors.first_name = 'Must be 30 characters or fewer';
    }

    if (formData.middle_name && formData.middle_name.trim().length > 30) {
      newErrors.middle_name = 'Must be 30 characters or fewer';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length > 30) {
      newErrors.last_name = 'Must be 30 characters or fewer';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else if (new Date(formData.dob) > new Date()) {
      newErrors.dob = 'Date of birth cannot be in the future';
    }

    const cleanHealthCard = (formData.health_card || '').replace(/[-\s]/g, '').toUpperCase();
    if (!cleanHealthCard) {
      newErrors.health_card = 'Health Card / Insurance ID is required';
    } else if (cleanHealthCard.length < 7 || cleanHealthCard.length > 12) {
      newErrors.health_card = 'Must be between 7 and 12 characters';
    } else if (!/^[A-Z0-9]+$/.test(cleanHealthCard)) {
      newErrors.health_card = 'Only alphanumeric characters (A-Z, 0-9) allowed';
    } else {
      const duplicatePatient = patientList.find((p) => {
        if (isEdit && p.id === patientToEdit?.id) return false;
        const pCard = (p.health_card || '').replace(/[-\s]/g, '').toUpperCase();
        return pCard === cleanHealthCard;
      });
      if (duplicatePatient) {
        newErrors.health_card = `Already registered to patient ${formatFullName(duplicatePatient.first_name, duplicatePatient.middle_name, duplicatePatient.last_name)} (Chart #${duplicatePatient.id})`;
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    } else if (formData.address.trim().length > 100) {
      newErrors.address = 'Must be 100 characters or fewer';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length > 50) {
      newErrors.city = 'Must be 50 characters or fewer';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State / Province is required';
    } else if (formData.state.trim().length > 50) {
      newErrors.state = 'Must be 50 characters or fewer';
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    } else if (formData.postal_code.trim().length > 10) {
      newErrors.postal_code = 'Must be 10 characters or fewer';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    const phoneClean = formData.phone.trim();
    if (!phoneClean) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneClean.length < 9 || phoneClean.length > 15) {
      newErrors.phone = 'Phone number must be between 9 and 15 characters';
    }

    if (formData.emergency_phone && formData.emergency_phone.trim()) {
      const ep = formData.emergency_phone.trim();
      if (ep.length > 20) {
        newErrors.emergency_phone = 'Must be 20 characters or fewer';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const checkDuplicateContacts = (email, phone, currentId) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
    const rawPhone = phone ? phone.trim().toLowerCase() : '';

    const matches = [];

    for (const p of patientList) {
      if (currentId && p.id === currentId) continue;

      const pEmail = p.email ? p.email.trim().toLowerCase() : '';
      const pDigits = p.phone ? p.phone.replace(/\D/g, '') : '';
      const pRawPhone = p.phone ? p.phone.trim().toLowerCase() : '';

      const emailMatches = Boolean(cleanEmail && pEmail && cleanEmail === pEmail);
      const phoneMatches = Boolean(
        cleanDigits && pDigits
          ? cleanDigits.length >= 7 && pDigits.length >= 7
            ? cleanDigits === pDigits
            : rawPhone === pRawPhone
          : rawPhone && pRawPhone && rawPhone === pRawPhone
      );

      if (emailMatches || phoneMatches) {
        matches.push({
          patient: p,
          emailMatches,
          phoneMatches,
        });
      }
    }

    return matches;
  };

  const executeSave = async (submissionData) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await onSave(submissionData, isEdit ? patientToEdit.id : null);
      setDuplicateWarning(null);
    } catch (err) {
      setServerError(err.message || 'Failed to save patient record. Please verify all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submissionData = {
      ...formData,
      first_name: normalizeName(formData.first_name),
      middle_name: formData.middle_name ? normalizeName(formData.middle_name) : null,
      last_name: normalizeName(formData.last_name),
      health_card: (formData.health_card || '').replace(/[-\s]/g, '').toUpperCase(),
      email: formData.email.trim().toLowerCase(),
      city: normalizeName(formData.city),
      state: formData.state.trim().toUpperCase(),
      address: formData.address.trim(),
      postal_code: formData.postal_code.trim(),
      phone: formData.phone.trim(),
      emergency_phone: formData.emergency_phone ? formData.emergency_phone.trim() : null,
    };

    const matches = checkDuplicateContacts(
      submissionData.email,
      submissionData.phone,
      isEdit ? patientToEdit.id : null
    );

    if (matches.length > 0) {
      setDuplicateWarning({ matches, submissionData });
      return;
    }

    await executeSave(submissionData);
  };

  const inputClass = (hasError) =>
    `w-full px-3.5 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
        : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/40'
    }`;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/25 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isEdit
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/80'
                  : 'bg-blue-600 text-white shadow-xs'
              }`}
            >
              {isEdit ? <Edit3 className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h3 id="patient-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {isEdit ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdit
                  ? `Updating chart #${patientToEdit.id} for ${formatFullName(patientToEdit.first_name, patientToEdit.middle_name, patientToEdit.last_name)}`
                  : 'Enter patient demographics, contact details, and residential address'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* Form Body */}
        <form
          id="patient-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-200"
          noValidate
        >
          {/* Section 1: Personal Identification */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mb-3.5">
              <IdCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Personal Identification
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onBlur={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      first_name: normalizeName(e.target.value) || '',
                    }));
                  }}
                  maxLength={30}
                  placeholder="e.g. John"
                  className={inputClass(errors.first_name)}
                />
                {errors.first_name && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Middle Name <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  onBlur={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      middle_name: normalizeName(e.target.value) || '',
                    }));
                  }}
                  maxLength={30}
                  placeholder="e.g. Robert"
                  className={inputClass(errors.middle_name)}
                />
                {errors.middle_name && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.middle_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  onBlur={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      last_name: normalizeName(e.target.value) || '',
                    }));
                  }}
                  maxLength={30}
                  placeholder="e.g. Doe"
                  className={inputClass(errors.last_name)}
                />
                {errors.last_name && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputClass(errors.dob)}
                />
                {errors.dob && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.dob}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Health Card / Insurance ID <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">7-12 chars</span>
                </label>
                <input
                  type="text"
                  name="health_card"
                  value={formData.health_card}
                  onChange={handleChange}
                  onBlur={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      health_card: e.target.value.replace(/[-\s]/g, '').toUpperCase(),
                    }));
                  }}
                  maxLength={12}
                  placeholder="e.g. 1234567890AB"
                  className={inputClass(errors.health_card)}
                />
                {errors.health_card ? (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.health_card}</p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    Provincial Health ID or Insurer Member ID. Identification only; does not verify coverage.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mb-3.5">
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Contact & Emergency Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="e.g. 03001234567"
                  className={inputClass(errors.phone)}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Emergency Contact Phone <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="e.g. 03219876543"
                  className={inputClass(errors.emergency_phone)}
                />
                {errors.emergency_phone && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {errors.emergency_phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Residential Address */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mb-3.5">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Residential Address
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. 10880 Wilshire Blvd"
                  className={inputClass(errors.address)}
                />
                {errors.address && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. Los Angeles"
                    className={inputClass(errors.city)}
                  />
                  {errors.city && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. California"
                    className={inputClass(errors.state)}
                  />
                  {errors.state && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g. 90024"
                    className={inputClass(errors.postal_code)}
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {errors.postal_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="patient-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEdit ? 'Saving...' : 'Registering...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Register Patient'}</span>
              </>
            )}
          </button>
        </div>

        {/* Duplicate Contact Warning Confirmation Popup */}
        {duplicateWarning && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="duplicate-warning-title"
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) setDuplicateWarning(null);
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-amber-200/90 dark:border-amber-800/80 overflow-hidden flex flex-col p-6 animate-scale-up space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 id="duplicate-warning-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Existing Contact Information Found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Another patient record already shares this contact detail.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                In medical clinics, family members, spouses, or dependents may legitimately share an email address or phone number. Would you like to proceed and save this patient anyway?
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {duplicateWarning.matches.map(({ patient, emailMatches, phoneMatches }) => {
                  const fullName = formatFullName(patient.first_name, patient.middle_name, patient.last_name);
                  return (
                    <div
                      key={patient.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                        <span>{fullName}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          Patient #{patient.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {emailMatches && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-medium border border-amber-200/80 dark:border-amber-800/80">
                            <Mail className="w-3 h-3" />
                            Email: {patient.email}
                          </span>
                        )}
                        {phoneMatches && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-medium border border-amber-200/80 dark:border-amber-800/80">
                            <Phone className="w-3 h-3" />
                            Phone: {patient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
                >
                  Go Back & Review
                </button>
                <button
                  type="button"
                  onClick={() => executeSave(duplicateWarning.submissionData)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Yes, Proceed & Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
