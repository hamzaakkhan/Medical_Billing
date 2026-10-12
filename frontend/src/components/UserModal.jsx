import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserPlus,
  Edit3,
  Mail,
  Lock,
  Shield,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { normalizeName, formatFullName } from '../utils/nameFormat';

const INITIAL_FORM = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'receptionist',
  is_active: true,
};

export default function UserModal({
  isOpen,
  onClose,
  userToEdit,
  onSave,
  isRootAdmin = false,
  currentUserId,
}) {
  const isEdit = Boolean(userToEdit);
  const isSelf = isEdit && Number(userToEdit?.id) === Number(currentUserId);
  const isTargetRootAdmin = Boolean(userToEdit?.is_root_admin);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form on open
  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setFormData({
        first_name: userToEdit.first_name || '',
        middle_name: userToEdit.middle_name || '',
        last_name: userToEdit.last_name || '',
        email: userToEdit.email || '',
        password: '',
        role: userToEdit.role || 'receptionist',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setShowPassword(false);
    setErrors({});
    setServerError('');
  }, [userToEdit, isOpen]);

  // Lock background scroll and bind Escape key while open
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length > 50) {
      newErrors.first_name = 'Must be 50 characters or fewer';
    }

    if (formData.middle_name && formData.middle_name.trim().length > 50) {
      newErrors.middle_name = 'Must be 50 characters or fewer';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length > 50) {
      newErrors.last_name = 'Must be 50 characters or fewer';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (formData.password.length > 100) {
        newErrors.password = 'Password must be 100 characters or fewer';
      }
    } else if (isSelf && formData.password && formData.password.trim()) {
      if (formData.password.length < 8) {
        newErrors.password = 'New password must be at least 8 characters';
      } else if (formData.password.length > 100) {
        newErrors.password = 'Password must be 100 characters or fewer';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    const submissionData = {
      ...formData,
      first_name: normalizeName(formData.first_name),
      middle_name: formData.middle_name ? normalizeName(formData.middle_name) : null,
      last_name: normalizeName(formData.last_name),
      email: formData.email.trim().toLowerCase(),
    };
    if (isEdit && !isSelf) {
      delete submissionData.password;
    }

    try {
      await onSave(submissionData, isEdit ? userToEdit.id : null);
    } catch (err) {
      setServerError(err.message || 'Unable to save staff account. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/25 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60 shrink-0">
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
              <h3 id="user-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {isEdit ? 'Edit Staff Account' : 'Add Staff Member'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdit
                  ? `Update credentials for ${formatFullName(userToEdit.first_name, userToEdit.middle_name, userToEdit.last_name)}`
                  : 'Create clinic staff credentials and assign system role'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Banner */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          id="user-modal-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-200 flex-1"
          noValidate
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                maxLength={50}
                placeholder="e.g. Sarah"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                  errors.first_name
                    ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                }`}
              />
              {errors.first_name && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.first_name}</p>
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
                maxLength={50}
                placeholder="e.g. Jenkins"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                  errors.last_name
                    ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                }`}
              />
              {errors.last_name && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.last_name}</p>
              )}
            </div>
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
              maxLength={50}
              placeholder="e.g. Marie"
              className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                errors.middle_name
                  ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
              }`}
            />
            {errors.middle_name && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.middle_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="staff@clinic.com"
                className={`w-full pl-10 pr-3.5 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password{' '}
              {isEdit ? (
                isSelf ? (
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Leave blank to keep existing password)
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (Protected)
                  </span>
                )
              ) : (
                <span className="text-red-500">*</span>
              )}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={isEdit && !isSelf ? 'password' : (showPassword ? 'text' : 'password')}
                name="password"
                value={isEdit && !isSelf ? '••••••••••••' : formData.password}
                onChange={handleChange}
                disabled={isEdit && !isSelf}
                placeholder={isEdit ? '••••••••' : 'Minimum 8 characters'}
                className={`w-full pl-10 ${
                  isEdit && !isSelf
                    ? 'pr-3.5 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700 select-none'
                    : 'pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                } py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                    : ''
                }`}
              />
              {(!isEdit || isSelf) && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            {isEdit && !isSelf && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Staff members must change their own password.
              </p>
            )}
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                System Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isTargetRootAdmin}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <option value="receptionist">Receptionist (Front Desk)</option>
                  {(isRootAdmin || isTargetRootAdmin || formData.role === 'admin') && (
                    <option value="admin">System Admin</option>
                  )}
                  <option value="doctor">Doctor</option>
                  <option value="biller">Medical Biller</option>
                  <option value="coder">Medical Coder</option>
                </select>
              </div>
              {isTargetRootAdmin && (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Root admin role cannot be changed.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Status
              </label>
              <label
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 select-none ${
                  isTargetRootAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isTargetRootAdmin}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                />
                <span
                  className={`text-xs font-semibold ${
                    formData.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {formData.is_active ? 'Active Account' : 'Inactive Account'}
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
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
            form="user-modal-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Account'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
