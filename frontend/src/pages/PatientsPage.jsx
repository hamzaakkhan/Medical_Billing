import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PatientManagement from '../components/PatientManagement';
import { getAllPatients, createPatient, updatePatient, deletePatient } from '../api/patientApi';
import PatientModal from '../components/PatientModal';
import PatientViewModal from '../components/PatientViewModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { canDo } from '../utils/permissions';

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
  const canEdit   = canDo(role, 'patients', 'edit');
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllPatients();
      setPatients(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients.');
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
    try {
      const patientFullName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
      if (id) {
        await updatePatient(id, patientData);
        showToast('Patient updated successfully');
        emitPatientUpdated?.(id, patientFullName);
      } else {
        await createPatient(patientData);
        showToast('Patient registered successfully');
        emitPatientRegistered?.(patientFullName);
      }
      setIsAddEditOpen(false);
      fetchPatients();
    } catch (err) {
      throw err;
    }
  };

  const handleDeletePatient = async () => {
    try {
      const patientFullName = `${patientToDelete.first_name} ${patientToDelete.last_name}`;
      await deletePatient(patientToDelete.id);
      showToast('Patient record deleted');
      emitPatientDeleted?.(patientToDelete.id, patientFullName);
      setIsDeleteOpen(false);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
      setIsDeleteOpen(false);
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
        onOpenAddModal={canCreate ? () => { setPatientToEdit(null); setIsAddEditOpen(true); } : null}
        onViewPatient={(p) => { setPatientToView(p); setIsViewOpen(true); }}
        onEditPatient={canEdit ? (p) => { setPatientToEdit(p); setIsAddEditOpen(true); } : null}
        onDeletePatient={canDelete ? (p) => { setPatientToDelete(p); setIsDeleteOpen(true); } : null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        role={role}
      />

      {isAddEditOpen && (
        <PatientModal
          isOpen={isAddEditOpen}
          onClose={() => setIsAddEditOpen(false)}
          patientToEdit={patientToEdit}
          onSave={handleSavePatient}
        />
      )}

      {isViewOpen && patientToView && (
        <PatientViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          patient={patientToView}
          onEdit={canEdit ? () => {
            setIsViewOpen(false);
            setPatientToEdit(patientToView);
            setIsAddEditOpen(true);
          } : null}
        />
      )}

      {isDeleteOpen && patientToDelete && (
        <DeleteConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeletePatient}
          patientName={`${patientToDelete.first_name} ${patientToDelete.last_name}`}
        />
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, show: false }))}
        />
      )}
    </>
  );
}
