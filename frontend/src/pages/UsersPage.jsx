import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../api/userApi';
import UserModal from '../components/UserModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { useAuth, ROLE_ID_MAP } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/permissions';
import { formatFullName, getInitials } from '../utils/nameFormat';

export default function UsersPage() {
  const { user: currentUser, cacheUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      const mapped = (data || []).map((u) => {
        const roleName = ROLE_ID_MAP[u.role_id] || (u.role_id === 1 ? 'admin' : 'receptionist');
        if (u.email) {
          cacheUserRole?.(u.email, roleName);
        }
        return {
          ...u,
          role: roleName,
        };
      });
      setUsers(mapped);
    } catch (err) {
      setError(err.message || 'Failed to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (formData, id) => {
    if (id) {
      await updateUser(id, formData, userToEdit);
      if (formData.email && formData.role) {
        cacheUserRole?.(formData.email, formData.role);
      }
      showToast('Staff account updated successfully.');
    } else {
      await createUser(formData);
      if (formData.email && formData.role) {
        cacheUserRole?.(formData.email, formData.role);
      }
      showToast(
        `${formatFullName(formData.first_name, formData.middle_name, formData.last_name)} added as ${
          ROLE_LABELS[formData.role]?.label || formData.role
        }.`
      );
    }
    setIsModalOpen(false);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      showToast('Staff account deleted.');
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((u) => {
        const full = `${u.first_name || ''} ${u.middle_name || ''} ${u.last_name || ''}`.toLowerCase();
        return (
          full.includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q) ||
          String(u.id).includes(q)
        );
      });
    }
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result.sort((a, b) => a.id - b.id);
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.is_active).length;
    const receptionists = users.filter((u) => u.role === 'receptionist').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total: users.length, active, receptionists, admins };
  }, [users]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Staff & User Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage clinic staff accounts, role assignments, and active access status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
            title="Refresh staff list"
            aria-label="Refresh staff list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setUserToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Staff</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Accounts</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Receptionists</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.receptionists}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Administrators</p>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">{stats.admins}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="text-xs font-semibold px-3 py-1.5 bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850 dark:bg-slate-800/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 dark:focus:border-blue-400 transition"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="receptionist">Receptionists</option>
              <option value="admin">System Admins</option>
              <option value="doctor">Doctors</option>
              <option value="biller">Medical Billers</option>
              <option value="coder">Medical Coders</option>
            </select>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap pl-2 border-l border-slate-200 dark:border-slate-700">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="p-14 text-center text-slate-400 dark:text-slate-500">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2.5" />
            <p className="text-xs font-medium">Loading staff directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No matching staff members</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {searchQuery || roleFilter !== 'ALL'
                ? 'Try clearing your search query or role filter.'
                : 'Add your first receptionist or staff account to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-3 px-5 w-20">ID</th>
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((u) => {
                  const roleBadge = ROLE_LABELS[u.role] || {
                    label: u.role,
                    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
                  };
                  const isSelf = Number(u.id) === Number(currentUser?.id);
                  const isOtherAdmin = u.role === 'admin' && !isSelf;
                  const canEditTarget = !isOtherAdmin || Boolean(currentUser?.is_root_admin);
                  const canDeleteTarget =
                    !isSelf &&
                    !u.is_root_admin &&
                    (u.role !== 'admin' || Boolean(currentUser?.is_root_admin));

                  const fullName = formatFullName(u.first_name, u.middle_name, u.last_name);
                  const initials = getInitials(u.first_name, u.last_name);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        #{u.id}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/80 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                              <span>{fullName}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold px-1.5 py-0.5 rounded-md leading-none">
                                  You
                                </span>
                              )}
                              {u.is_root_admin && (
                                <span className="text-[10px] bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-semibold px-1.5 py-0.5 rounded-md leading-none">
                                  Root Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${roleBadge.color}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {canEditTarget && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserToEdit(u);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                              title="Edit staff account"
                              aria-label="Edit staff account"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteTarget ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUserToDelete(u);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition"
                              title="Delete staff account"
                              aria-label="Delete staff account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-7 inline-block" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
        isRootAdmin={Boolean(currentUser?.is_root_admin)}
        currentUserId={currentUser?.id}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen && Boolean(userToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
            setUserToDelete(null);
          }
        }}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
        title="Delete Staff Account"
        description="Are you sure you want to permanently remove this staff member's access?"
        patientName={
          userToDelete
            ? `${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email})`
            : ''
        }
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
