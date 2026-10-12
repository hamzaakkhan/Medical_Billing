import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllPatients } from '../api/patientApi';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import ReceptionistDashboard from '../components/dashboards/ReceptionistDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = useCallback(() => {
    setIsLoading(true);
    getAllPatients()
      .then((data) => setPatients(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadPatients();

    const handleRealtimeUpdate = () => {
      loadPatients();
    };

    window.addEventListener('medflow:patients-updated', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('medflow:patients-updated', handleRealtimeUpdate);
    };
  }, [loadPatients]);

  const props = {
    patients,
    isLoading,
    user,
    navigate,
    onRefreshPatients: loadPatients,
  };

  if (user?.role === 'admin') {
    return <AdminDashboard {...props} />;
  }

  if (user?.role === 'receptionist') {
    return <ReceptionistDashboard {...props} />;
  }

  // Fallback for roles whose dedicated portals are not enabled yet
  return (
    <div className="max-w-lg mx-auto mt-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Portal Access Restricted</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
        Your account is assigned the <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{user?.role}</span> role.
        Currently, only the <span className="font-semibold text-slate-700 dark:text-slate-300">Admin</span> and{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">Receptionist</span> workspaces are active.
      </p>
    </div>
  );
}
