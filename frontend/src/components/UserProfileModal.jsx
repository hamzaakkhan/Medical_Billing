import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Lock,
  Mail,
  Shield,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Calendar,
  KeyRound,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { updateMyProfile, changeMyPassword, getMyProfile } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/permissions';
import { formatFullName, getInitials, normalizeName } from '../utils/nameFormat';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user: authUser, updateCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile Form State
  const [profileData, setProfileData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Sync state when opening
  useEffect(() => {
    if (!isOpen) return;

    if (authUser) {
      setProfileData({
        first_name: authUser.first_name || '',
        middle_name: authUser.middle_name || '',
        last_name: authUser.last_name || '',
        email: authUser.email || '',
      });
    }

    // Refresh profile from server to guarantee fresh details
    getMyProfile()
      .then((fresh) => {
        if (fresh) {
          setProfileData({
            first_name: fresh.first_name || '',
            middle_name: fresh.middle_name || '',
            last_name: fresh.last_name || '',
            email: fresh.email || '',
          });
          updateCurrentUser?.(fresh);
        }
      })
      .catch(() => {});

    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setProfileErrors({});
    setPasswordErrors({});
    setServerError('');
    setSuccessMessage('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [isOpen]);

  // Lock scroll & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmittingProfile && !isSubmittingPassword) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmittingProfile, isSubmittingPassword, onClose]);

  if (!isOpen) return null;

  const roleInfo = ROLE_LABELS[authUser?.role] || {
    label: authUser?.role || 'Staff Member',
    color: 'bg-slate-100 text-slate-700',
  };

  const formattedName = formatFullName(authUser?.first_name, authUser?.middle_name, authUser?.last_name);
  const displayName = formattedName || authUser?.email || 'User';

  const memberSinceFormatted = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Validation
  const validateProfile = () => {
    const errs = {};
    if (!profileData.first_name.trim()) {
      errs.first_name = 'First name is required';
    } else if (profileData.first_name.trim().length > 50) {
      errs.first_name = 'Must be 50 characters or fewer';
    }

    if (profileData.middle_name && profileData.middle_name.trim().length > 50) {
      errs.middle_name = 'Must be 50 characters or fewer';
    }

    if (!profileData.last_name.trim()) {
      errs.last_name = 'Last name is required';
    } else if (profileData.last_name.trim().length > 50) {
      errs.last_name = 'Must be 50 characters or fewer';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(profileData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordData.current_password) {
      errs.current_password = 'Enter your current password';
    }

    if (!passwordData.new_password) {
      errs.new_password = 'Enter a new password';
    } else if (passwordData.new_password.length < 8) {
      errs.new_password = 'Password must be at least 8 characters long';
    } else if (passwordData.new_password.length > 100) {
      errs.new_password = 'Password must be 100 characters or fewer';
    }

    if (passwordData.new_password && passwordData.current_password) {
      if (passwordData.new_password === passwordData.current_password) {
        errs.new_password = 'New password must be different from current password';
      }
    }

    if (!passwordData.confirm_password) {
      errs.confirm_password = 'Confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errs.confirm_password = 'Passwords do not match';
    }

    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError('');
    setSuccessMessage('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError('');
    setSuccessMessage('');
  };

  // Submit Profile Form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setIsSubmittingProfile(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const payload = {
        first_name: normalizeName(profileData.first_name),
        middle_name: profileData.middle_name ? normalizeName(profileData.middle_name) : null,
        last_name: normalizeName(profileData.last_name),
        email: profileData.email.trim().toLowerCase(),
      };
      const updated = await updateMyProfile(payload);
      setProfileData({
        first_name: updated.first_name || '',
        middle_name: updated.middle_name || '',
        last_name: updated.last_name || '',
        email: updated.email || '',
      });
      updateCurrentUser?.(updated);
      setSuccessMessage('Profile information updated successfully.');
    } catch (err) {
      setServerError(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Submit Password Form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsSubmittingPassword(true);
    setServerError('');
    setSuccessMessage('');

    try {
      await changeMyPassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccessMessage('Password changed successfully.');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setServerError(err.message || 'Unable to update password. Please check your inputs.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };
  const pwdScore = getPasswordStrength(passwordData.new_password);

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/35 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmittingProfile && !isSubmittingPassword) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fade-in">
        {/* Header with Account Identity */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0">
                {getInitials(authUser?.first_name, authUser?.last_name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="user-profile-title" className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {displayName}
                  </h3>
                  {authUser?.is_root_admin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Shield className="w-2.5 h-2.5" /> Root Admin
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      authUser?.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        authUser?.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {authUser?.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{authUser?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingProfile || isSubmittingPassword}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setServerError('');
                setSuccessMessage('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setServerError('');
                setSuccessMessage('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* Alerts / Feedback Banners */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5 shrink-0 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-700 dark:text-slate-200">
          {activeTab === 'profile' ? (
            <div className="space-y-5">
              {/* System Metadata Card (Read-Only) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  System Account Credentials
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">
                      Account ID
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      #{authUser?.id || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">
                      Assigned Role
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                      {roleInfo.label}
                      <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" title="Role is managed by administration" />
                    </span>
                  </div>
                  {memberSinceFormatted && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">
                        Member Since
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {memberSinceFormatted}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  Role assignments and administrative access levels are managed by clinic administrators.
                </p>
              </div>

              {/* Editable Profile Information */}
              <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      onBlur={(e) => {
                        setProfileData((prev) => ({
                          ...prev,
                          first_name: normalizeName(e.target.value) || '',
                        }));
                      }}
                      placeholder="First name"
                      className={`w-full px-3 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                        profileErrors.first_name
                          ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                      }`}
                    />
                    {profileErrors.first_name && (
                      <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                        {profileErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Middle Name <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="middle_name"
                      value={profileData.middle_name}
                      onChange={handleProfileChange}
                      onBlur={(e) => {
                        setProfileData((prev) => ({
                          ...prev,
                          middle_name: normalizeName(e.target.value) || '',
                        }));
                      }}
                      placeholder="Middle name"
                      className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    onBlur={(e) => {
                      setProfileData((prev) => ({
                        ...prev,
                        last_name: normalizeName(e.target.value) || '',
                      }));
                    }}
                    placeholder="Last name"
                    className={`w-full px-3 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                      profileErrors.last_name
                        ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                    }`}
                  />
                  {profileErrors.last_name && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {profileErrors.last_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="staff@clinic.com"
                      className={`w-full pl-9.5 pr-3 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                        profileErrors.email
                          ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                      }`}
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {profileErrors.email}
                    </p>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* Tab 2: Security & Password */
            <form id="password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Healthcare Security Requirement</p>
                  <p className="text-[11px] text-blue-800/90 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                    To safeguard clinical billing records and patient data, your password must be at least 8 characters long and differ from your current password.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className={`w-full pl-9.5 pr-10 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                      passwordErrors.current_password
                        ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {passwordErrors.current_password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Minimum 8 characters"
                    className={`w-full pl-9.5 pr-10 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                      passwordErrors.new_password
                        ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.new_password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            pwdScore >= step
                              ? step <= 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Strength:{' '}
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {pwdScore <= 1 ? 'Weak' : pwdScore === 2 ? 'Fair' : pwdScore === 3 ? 'Good' : 'Strong'}
                      </span>
                    </p>
                  </div>
                )}
                {passwordErrors.new_password && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {passwordErrors.new_password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    className={`w-full pl-9.5 pr-10 py-2 rounded-xl text-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:outline-none focus:ring-2 ${
                      passwordErrors.confirm_password
                        ? 'border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/30 focus:ring-red-100 dark:focus:ring-red-900/40 focus:border-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                    {passwordErrors.confirm_password}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingProfile || isSubmittingPassword}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'profile' ? (
            <button
              type="submit"
              form="profile-form"
              disabled={isSubmittingProfile}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              form="password-form"
              disabled={isSubmittingPassword}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

