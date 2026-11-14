import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PatientManagement from '../components/PatientManagement';
import {
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../api/patientApi';
import PatientModal from '../components/PatientModal';
import PatientViewModal from '../components/PatientViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { canDo } from '../utils/permissions';
import { formatFullName } from '../utils/nameFormat';

export default function PatientsPage() {
  const { user } = useAuth();
  const {
    emitPatientRegistered,
    emitPatientUpdated,
    emitPatientDeleted,
  } = useSocket() || {};
  const role = user?.role || 'receptionist';

  // Permissions
  const canCreate = canDo(role, 'patients', 'create');
  const canEdit = canDo(role, 'patients', 'edit');
  const canDelete = canDo(role, 'patients', 'delete');

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [patientToView, setPatientToView] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllPatients();
      setPatients(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    const handleRealtimeUpdate = () => {
      fetchPatients();
    };

    window.addEventListener('medflow:patients-updated', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('medflow:patients-updated', handleRealtimeUpdate);
    };
  }, []);

  const handleSavePatient = async (patientData, id) => {
    const patientFullName = formatFullName(patientData.first_name, patientData.middle_name, patientData.last_name);
    if (id) {
      await updatePatient(id, patientData);
      showToast('Patient record updated successfully.');
      emitPatientUpdated?.(id, patientFullName);
    } else {
      await createPatient(patientData);
      showToast('New patient registered successfully.');
      emitPatientRegistered?.(patientFullName);
    }
    setIsAddEditOpen(false);
    fetchPatients();
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const patientFullName = formatFullName(patientToDelete.first_name, patientToDelete.middle_name, patientToDelete.last_name);
      await deletePatient(patientToDelete.id);
      showToast('Patient record deleted.');
      emitPatientDeleted?.(patientToDelete.id, patientFullName);
      setIsDeleteOpen(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      showToast(err.message || 'Failed to delete patient.', 'error');
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PatientManagement
        patients={patients}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchPatients}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onOpenAddModal={
          canCreate
            ? () => {
                setPatientToEdit(null);
                setIsAddEditOpen(true);
              }
            : null
        }
        onViewPatient={(p) => {
          setPatientToView(p);
          setIsViewOpen(true);
        }}
        onEditPatient={
          canEdit
            ? (p) => {
                setPatientToEdit(p);
                setIsAddEditOpen(true);
              }
            : null
        }
        onDeletePatient={
          canDelete
            ? (p) => {
                setPatientToDelete(p);
                setIsDeleteOpen(true);
              }
            : null
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        role={role}
      />

      <PatientModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        patientToEdit={patientToEdit}
        onSave={handleSavePatient}
        existingPatients={patients}
      />

      <PatientViewModal
        isOpen={isViewOpen && Boolean(patientToView)}
        onClose={() => setIsViewOpen(false)}
        patient={patientToView}
        onEdit={
          canEdit
            ? () => {
                setIsViewOpen(false);
                setPatientToEdit(patientToView);
                setIsAddEditOpen(true);
              }
            : null
        }
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen && Boolean(patientToDelete)}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
            setPatientToDelete(null);
          }
        }}
        onConfirm={handleDeletePatient}
        isDeleting={isDeleting}
        title="Delete Patient Record"
        description="Are you sure you want to permanently remove this patient record from the database?"
        patient={patientToDelete}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
