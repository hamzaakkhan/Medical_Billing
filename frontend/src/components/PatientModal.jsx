import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Edit3,
  Loader2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  IdCard,
} from 'lucide-react';

const INITIAL_FORM = {
  first_name: '',
  middle_name: '',
  last_name: '',
  dob: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  email: '',
  phone: '',
  emergency_phone: '',
};

export default function PatientModal({ isOpen, onClose, onSave, patientToEdit, isSubmitting }) {
  const isEdit = Boolean(patientToEdit);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Populate form on edit or reset on create
  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        first_name: patientToEdit.first_name || '',
        middle_name: patientToEdit.middle_name || '',
        last_name: patientToEdit.last_name || '',
        dob: patientToEdit.dob || '',
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
  }, [patientToEdit, isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    // First Name
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length > 30) {
      newErrors.first_name = 'Must be 30 characters or fewer';
    }

    // Middle Name (optional, max 30)
    if (formData.middle_name && formData.middle_name.length > 30) {
      newErrors.middle_name = 'Must be 30 characters or fewer';
    }

    // Last Name
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length > 30) {
      newErrors.last_name = 'Must be 30 characters or fewer';
    }

    // DOB
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else if (formData.dob.length > 10) {
      newErrors.dob = 'Invalid date format (YYYY-MM-DD)';
    }

    // Address
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    } else if (formData.address.trim().length > 100) {
      newErrors.address = 'Must be 100 characters or fewer';
    }

    // City
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length > 50) {
      newErrors.city = 'Must be 50 characters or fewer';
    }

    // State
    if (!formData.state.trim()) {
      newErrors.state = 'State / Province is required';
    } else if (formData.state.trim().length > 50) {
      newErrors.state = 'Must be 50 characters or fewer';
    }

    // Postal Code
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    } else if (formData.postal_code.trim().length > 10) {
      newErrors.postal_code = 'Must be 10 characters or fewer';
    }

    // Email (EmailStr validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    // Phone (min 9, max 11)
    const phoneClean = formData.phone.trim();
    if (!phoneClean) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneClean.length < 9 || phoneClean.length > 11) {
      newErrors.phone = 'Phone number must be between 9 and 11 digits';
    }

    // Emergency Phone (optional, if given, validate reasonable length)
    if (formData.emergency_phone && formData.emergency_phone.trim()) {
      const ep = formData.emergency_phone.trim();
      if (ep.length < 7 || ep.length > 15) {
        newErrors.emergency_phone = 'Emergency phone should be 7 to 15 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData, isEdit ? patientToEdit.id : null);
    } catch (err) {
      setServerError(err.message || 'Failed to save patient. Please check input values.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isEdit ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {isEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="patient-modal-title" className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Updating record for Chart #${patientToEdit.id}`
                  : 'FastAPI Backend • POST /patients/'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        {/* Form Body */}
        <form id="patient-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Section 1: Demographics */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <IdCard className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Personal Identification
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. John"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.first_name
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. Robert"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.middle_name
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.middle_name && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.middle_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="e.g. Doe"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.last_name
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="mt-4 sm:w-1/2 pr-0 sm:pr-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.dob
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
              </div>
              {errors.dob && <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.dob}</p>}
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <Phone className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Contact & Communication
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Phone <span className="text-rose-500">*</span> (9–11 digits)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={11}
                  placeholder="e.g. 0304283222"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emergency Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="e.g. 14165551234"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.emergency_phone
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.emergency_phone && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {errors.emergency_phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Residential Address */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-4">
              <MapPin className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Residential Address
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. 10880 Wilshire Blvd"
                  className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                    errors.address
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. Los Angeles"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                      errors.city
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State / Province <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. California"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                      errors.state
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                    }`}
                  />
                  {errors.state && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Postal Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="e.g. 90024"
                    className={`w-full px-3.5 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                      errors.postal_code
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30'
                        : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                    }`}
                  />
                  {errors.postal_code && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">
                      {errors.postal_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="patient-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-sky-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEdit ? 'Updating Patient...' : 'Saving Patient...'}</span>
              </>
            ) : (
              <>
                {isEdit ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isEdit ? 'Save Changes' : 'Register Patient'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
