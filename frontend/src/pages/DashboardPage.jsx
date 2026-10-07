import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllPatients } from '../api/patientApi';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import ReceptionistDashboard from '../components/dashboards/ReceptionistDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import BillerDashboard from '../components/dashboards/BillerDashboard';
import CoderDashboard from '../components/dashboards/CoderDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      getAllPatients()
        .then((data) => setPatients(data || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    };

    load();

    const handleRealtimeUpdate = () => {
      load();
    };

    window.addEventListener('medflow:patients-updated', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('medflow:patients-updated', handleRealtimeUpdate);
    };
  }, []);

  const props = { patients, isLoading, user, navigate };

  switch (user?.role) {
    case 'admin':       return <AdminDashboard {...props} />;
    case 'receptionist':return <ReceptionistDashboard {...props} />;
    case 'doctor':      return <DoctorDashboard {...props} />;
    case 'biller':      return <BillerDashboard {...props} />;
    case 'coder':       return <CoderDashboard {...props} />;
    default:            return <AdminDashboard {...props} />;
  }
}
