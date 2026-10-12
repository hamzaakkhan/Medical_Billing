import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserRound,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Mail,
  Phone,
} from 'lucide-react';
import { StatCard, SkeletonCard } from './DashWidgets';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../api/userApi';
import { useAuth, ROLE_ID_MAP } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/permissions';
import UserModal from '../UserModal';
import PatientViewModal from '../PatientViewModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import Toast from '../Toast';
import { formatFullName } from '../../utils/nameFormat';

export default function AdminDashboard({
  patients,
  isLoading,
  user: currentUser,
  navigate,
}) {
  const { cacheUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modals for direct User CRUD & Patient View from Admin Dashboard
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [patientToView, setPatientToView] = useState(null);
  const [toast, setToast] = useState(null);

  const loadUsers = async () => {
    setUsersLoading(true);
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
      setUsers(mapped.sort((a, b) => a.id - b.id));
    } catch {
      // handled silently on dashboard overview
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveUser = async (formData, id) => {
    if (id) {
      await updateUser(id, formData, userToEdit);
      if (formData.email && formData.role) {
        cacheUserRole?.(formData.email, formData.role);
      }
      setToast({ message: 'Staff account updated successfully.', type: 'success' });
    } else {
      await createUser(formData);
      if (formData.email && formData.role) {
        cacheUserRole?.(formData.email, formData.role);
      }
      setToast({
        message: `${formatFullName(formData.first_name, formData.middle_name, formData.last_name)} created as ${
          ROLE_LABELS[formData.role]?.label || formData.role
        }.`,
        type: 'success',
      });
    }
    setIsUserModalOpen(false);
    loadUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setToast({ message: 'Staff account removed.', type: 'success' });
      setIsDeleteOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete user.', type: 'error' });
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const metrics = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active).length;
    const receptionists = users.filter((u) => u.role === 'receptionist' && u.is_active).length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return {
      totalUsers: users.length,
      activeUsers,
      receptionists,
      admins,
      totalPatients: patients.length,
    };
  }, [users, patients]);

  const recentPatients = useMemo(() => {
    return [...patients].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [patients]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">System Administration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage clinic staff accounts and review registered patient records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setUserToEdit(null);
              setIsUserModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Live Metrics */}
      {isLoading && usersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Staff Accounts"
            value={metrics.totalUsers}
            sub={`${metrics.activeUsers} active in system`}
            icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-950/50"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Active Receptionists"
            value={metrics.receptionists}
            sub="Front-desk patient intake"
            icon={CheckCircle2}
            iconBg="bg-emerald-50 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Registered Patients"
            value={metrics.totalPatients}
            sub="Read-only chart directory"
            icon={UserRound}
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            label="System Admins"
            value={metrics.admins}
            sub="Full user management access"
            icon={Shield}
            iconBg="bg-violet-50 dark:bg-violet-950/50"
            iconColor="text-violet-600 dark:text-violet-400"
          />
        </div>
      )}

      {/* Staff & User Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Staff & User Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active clinic staff and assigned role permissions
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
          >
            <span>Manage All ({users.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    Loading staff accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No staff accounts found.
                  </td>
                </tr>
              ) : (
                users.slice(0, 6).map((u) => {
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

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{formatFullName(u.first_name, u.middle_name, u.last_name)}</span>
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
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            <XCircle className="w-3.5 h-3.5" />
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
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                              title="Edit staff account"
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
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                              title="Delete staff account"
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Directory Preview (View-Only for Admin) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Patient Records</h2>
                <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md uppercase tracking-wide border border-amber-200 dark:border-amber-800">
                  View Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Patient intake and modifications are managed by Receptionist staff
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
          >
            <span>View All Patients ({patients.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3 px-5 w-20">Chart #</th>
                <th className="py-3 px-5">Patient Name</th>
                <th className="py-3 px-5">DOB</th>
                <th className="py-3 px-5">Phone</th>
                <th className="py-3 px-5">Location</th>
                <th className="py-3 px-5 text-right">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {recentPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No patients registered in the database yet.
                  </td>
                </tr>
              ) : (
                recentPatients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setPatientToView(p)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                      #{p.id}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100">
                      {formatFullName(p.first_name, p.middle_name, p.last_name)}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400">{p.dob}</td>
                    <td className="py-3.5 px-5 text-xs font-mono text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{p.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400">
                      {p.city}, {p.state}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToView(p);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
        isRootAdmin={Boolean(currentUser?.is_root_admin)}
        currentUserId={currentUser?.id}
      />

      {/* Delete User Modal */}
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
            ? `${formatFullName(userToDelete.first_name, userToDelete.middle_name, userToDelete.last_name)} (${userToDelete.email})`
            : ''
        }
      />

      {/* Read-Only Patient View Modal */}
      <PatientViewModal
        isOpen={Boolean(patientToView)}
        onClose={() => setPatientToView(null)}
        patient={patientToView}
        onEdit={null}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
