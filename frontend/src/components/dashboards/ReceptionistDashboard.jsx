import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  UserRound,
  Phone,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  ArrowRight,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { StatCard, SkeletonCard } from './DashWidgets';
import { createPatient, updatePatient, deletePatient } from '../../api/patientApi';
import { useSocket } from '../../context/SocketContext';
import PatientModal from '../PatientModal';
import PatientViewModal from '../PatientViewModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import Toast from '../Toast';
import { formatFullName, getInitials } from '../../utils/nameFormat';

export default function ReceptionistDashboard({
  patients,
  isLoading,
  navigate,
  onRefreshPatients,
}) {
  const {
    emitPatientRegistered,
    emitPatientUpdated,
    emitPatientDeleted,
  } = useSocket() || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [patientToView, setPatientToView] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const stats = useMemo(() => {
    const withEmergency = patients.filter(
      (p) => p.emergency_phone && p.emergency_phone.trim()
    ).length;
    const distinctCities = new Set(
      patients.map((p) => (p.city || '').trim().toLowerCase()).filter(Boolean)
    ).size;
    return {
      total: patients.length,
      withEmergency,
      distinctCities,
    };
  }, [patients]);

  const recentPatients = useMemo(() => {
    return [...patients].sort((a, b) => b.id - a.id).slice(0, 8);
  }, [patients]);

  const handleSavePatient = async (patientData, id) => {
    const fullName = formatFullName(patientData.first_name, patientData.middle_name, patientData.last_name);
    if (id) {
      await updatePatient(id, patientData);
      setToast({ message: 'Patient record updated successfully.', type: 'success' });
      emitPatientUpdated?.(id, fullName);
    } else {
      await createPatient(patientData);
      setToast({ message: 'New patient registered successfully.', type: 'success' });
      emitPatientRegistered?.(fullName);
    }
    setIsModalOpen(false);
    onRefreshPatients?.();
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const fullName = formatFullName(patientToDelete.first_name, patientToDelete.middle_name, patientToDelete.last_name);
      await deletePatient(patientToDelete.id);
      setToast({ message: 'Patient record deleted.', type: 'success' });
      emitPatientDeleted?.(patientToDelete.id, fullName);
      setPatientToDelete(null);
      onRefreshPatients?.();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete patient.', type: 'error' });
      setPatientToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Front Desk & Patient Intake</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Register new patients and manage clinic demographic records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPatientToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Live Metrics from Backend */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Registered Patients"
            value={stats.total}
            sub="Active patient charts in database"
            icon={UserRound}
            iconBg="bg-blue-50 dark:bg-blue-950/50"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Emergency Contacts on File"
            value={stats.withEmergency}
            sub="Patients with emergency phone listed"
            icon={Phone}
            iconBg="bg-emerald-50 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Cities Represented"
            value={stats.distinctCities}
            sub="Distinct patient locations"
            icon={MapPin}
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
        </div>
      )}

      {/* Recent Patient Registrations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Patient Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any patient row to view their full chart, or use quick actions to edit or remove
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
          >
            <span>Open Full Directory ({patients.length})</span>
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
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">Location</th>
                <th className="py-3 px-5">Emergency Contact</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {recentPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No patients registered yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Click "Register New Patient" above to add the first patient record.
                    </p>
                  </td>
                </tr>
              ) : (
                recentPatients.map((p) => {
                  const fullName = formatFullName(p.first_name, p.middle_name, p.last_name);
                  const initials = getInitials(p.first_name, p.last_name);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setPatientToView(p)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        #{p.id}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.dob}
                      </td>
                      <td className="py-3.5 px-5 text-xs">
                        <div className="font-mono text-slate-800 dark:text-slate-200">{p.phone}</div>
                        <div className="text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{p.email}</div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400">
                        {p.city}, {p.state}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-mono">
                        {p.emergency_phone ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{p.emergency_phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-sans">None</span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPatientToView(p)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                            title="View chart"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPatientToEdit(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                            title="Edit patient"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientToDelete(p)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                            title="Delete patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create / Edit Patient Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={patientToEdit}
        onSave={handleSavePatient}
      />

      {/* View Patient Modal */}
      <PatientViewModal
        isOpen={Boolean(patientToView)}
        onClose={() => setPatientToView(null)}
        patient={patientToView}
        onEdit={(p) => {
          setPatientToView(null);
          setPatientToEdit(p);
          setIsModalOpen(true);
        }}
      />

      {/* Delete Patient Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(patientToDelete)}
        onClose={() => {
          if (!isDeleting) setPatientToDelete(null);
        }}
        onConfirm={handleDeletePatient}
        isDeleting={isDeleting}
        title="Delete Patient Record"
        description="Are you sure you want to permanently remove this patient record?"
        patient={patientToDelete}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
