import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import UsersPage from './pages/UsersPage';

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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Role-specific Dashboard (Admin & Receptionist) */}
                <Route index element={<DashboardPage />} />

                {/* Patients — Receptionist has full CRUD; Admin has View-Only */}
                <Route
                  path="patients"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                      <PatientsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Users — Admin only */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirects to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </SocketProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
