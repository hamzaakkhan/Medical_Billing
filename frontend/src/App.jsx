import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Users management page (admin only)
function UsersPage() {
  return <PlaceholderPage
    title="User Management"
    description="Add, edit, deactivate, or delete system users. Assign roles: Admin, Receptionist, Doctor, Medical Coder, Biller."
    icon="Users"
  />;
}

// Protected Route — requires login, optionally requires a specific set of roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Universal */}
            <Route index element={<DashboardPage />} />
            <Route path="settings" element={
              <PlaceholderPage title="Settings" description="Manage clinic profile, notifications, integrations, and system preferences." icon="Settings" />
            } />

            {/* Patients — receptionist has full CRUD; admin/doctor/coder are view-only (enforced in PatientsPage) */}
            <Route path="patients" element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor', 'coder']}>
                <PatientsPage />
              </ProtectedRoute>
            } />

            {/* Admin-only */}
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="invoices" element={
              <ProtectedRoute allowedRoles={['admin', 'biller']}>
                <PlaceholderPage title="Invoices" description="View and manage all patient invoices, outstanding balances, and payment history." icon="FileText" />
              </ProtectedRoute>
            } />
            <Route path="payers" element={
              <ProtectedRoute allowedRoles={['admin', 'biller']}>
                <PlaceholderPage title="Payers" description="Manage insurance payers, contract rates, and ERA/EOB reconciliation." icon="Building2" />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PlaceholderPage title="Reports & Analytics" description="Revenue cycle reports, denial analysis, aging AR reports, and financial summaries." icon="BarChart3" />
              </ProtectedRoute>
            } />

            {/* Receptionist */}
            <Route path="schedule" element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor']}>
                <PlaceholderPage title="Schedule & Appointments" description="Manage daily appointment slots, patient check-ins, and scheduling workflows." icon="CalendarCheck" />
              </ProtectedRoute>
            } />
            <Route path="insurers" element={
              <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                <PlaceholderPage title="Insurance Verification" description="Verify patient insurance eligibility, coverage details, and insurer contracts." icon="ShieldCheck" />
              </ProtectedRoute>
            } />

            {/* Doctor */}
            <Route path="clinical" element={
              <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                <PlaceholderPage title="Clinical Notes & Encounters" description="Document patient visits, SOAP notes, diagnoses, and treatment plans." icon="ClipboardList" />
              </ProtectedRoute>
            } />

            {/* Coder */}
            <Route path="coding" element={
              <ProtectedRoute allowedRoles={['admin', 'coder']}>
                <PlaceholderPage title="Medical Coding Workbench" description="Assign ICD-10 and CPT codes to encounters. Review coding accuracy and compliance." icon="Code2" />
              </ProtectedRoute>
            } />

            {/* Biller */}
            <Route path="claims" element={
              <ProtectedRoute allowedRoles={['admin', 'biller']}>
                <PlaceholderPage title="Claims Management" description="Submit, track, and manage insurance claims through their full lifecycle." icon="ClipboardCheck" />
              </ProtectedRoute>
            } />
            <Route path="denials" element={
              <ProtectedRoute allowedRoles={['admin', 'biller']}>
                <PlaceholderPage title="Denial Management" description="Review denied claims, appeal submissions, and track resolution status." icon="XCircle" />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
