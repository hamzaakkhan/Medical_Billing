import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import PatientModal from './components/PatientModal';
import PatientViewModal from './components/PatientViewModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Toast from './components/Toast';
import {
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from './api/patientApi';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'patients'
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback notification
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Fetch all patients from FastAPI backend
  const fetchPatients = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await getAllPatients();
      const patientList = Array.isArray(data) ? data : [];
      setPatients(patientList);
      setIsBackendHealthy(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to connect to FastAPI backend');
      setIsBackendHealthy(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Open Add Patient Modal
  const handleOpenAddModal = () => {
    setPatientToEdit(null);
    setIsAddEditOpen(true);
  };

  // Open Edit Patient Modal
  const handleOpenEditModal = (patient) => {
    setPatientToEdit(patient);
    setIsAddEditOpen(true);
  };

  // Open View Patient Modal
  const handleOpenViewModal = (patient) => {
    setViewPatient(patient);
    setIsViewOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (patient) => {
    setDeleteTargetPatient(patient);
    setIsDeleteOpen(true);
  };

  // Submit Add or Edit Patient
  const handleSavePatient = async (formData, editId) => {
    setIsSubmitting(true);
    try {
      if (editId) {
        // Update existing patient (PUT /patients/{id})
        const res = await updatePatient(editId, formData);
        const successMsg = typeof res === 'string' ? res : 'Patient updated successfully';
        showToast('success', 'Patient Updated', successMsg);
      } else {
        // Create new patient (POST /patients/)
        const res = await createPatient(formData);
        const successMsg = typeof res === 'string' ? res : 'Patient added successfully';
        showToast('success', 'Patient Registered', successMsg);
      }

      setIsAddEditOpen(false);
      setPatientToEdit(null);
      await fetchPatients(true);
    } catch (err) {
      showToast('error', 'Operation Failed', err.message || 'Could not save patient record');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async (patientId) => {
    setIsDeleting(true);
    try {
      await deletePatient(patientId);
      showToast('success', 'Patient Deleted', `Patient record #${patientId} was permanently removed`);
      setIsDeleteOpen(false);
      setDeleteTargetPatient(null);
      // If the deleted patient was being viewed, close the view modal
      if (viewPatient && viewPatient.id === patientId) {
        setIsViewOpen(false);
        setViewPatient(null);
      }
      await fetchPatients(true);
    } catch (err) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete patient record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isBackendHealthy={isBackendHealthy}
        patientCount={patients.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          onOpenAddModal={handleOpenAddModal}
          onRefresh={() => fetchPatients(false)}
          isRefreshing={isRefreshing}
          patientCount={patients.length}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              patients={patients}
              isLoading={isLoading}
              onOpenAddModal={handleOpenAddModal}
              onNavigateToPatients={() => setActiveTab('patients')}
              onViewPatient={handleOpenViewModal}
              onSearchFocus={() => {
                setActiveTab('patients');
              }}
            />
          )}

          {activeTab === 'patients' && (
            <PatientManagement
              patients={patients}
              isLoading={isLoading}
              error={error}
              onRefresh={() => fetchPatients(false)}
              onOpenAddModal={handleOpenAddModal}
              onViewPatient={handleOpenViewModal}
              onEditPatient={handleOpenEditModal}
              onDeletePatient={handleOpenDeleteModal}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
        </main>
      </div>

      {/* Patient Add / Edit Modal */}
      <PatientModal
        isOpen={isAddEditOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsAddEditOpen(false);
            setPatientToEdit(null);
          }
        }}
        onSave={handleSavePatient}
        patientToEdit={patientToEdit}
        isSubmitting={isSubmitting}
      />

      {/* Patient Full Dossier / Chart Modal */}
      <PatientViewModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewPatient(null);
        }}
        patient={viewPatient}
        onEdit={(patient) => {
          setIsViewOpen(false);
          handleOpenEditModal(patient);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteOpen(false);
            setDeleteTargetPatient(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        patient={deleteTargetPatient}
        isDeleting={isDeleting}
      />

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
