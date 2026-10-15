import React, { useState, useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  CalendarCheck,
  Shield,
  Layers,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getEligibleDoctors,
} from '../api/appointmentApi';
import { getAllPatients } from '../api/patientApi';
import { formatFullName } from '../utils/nameFormat';

import AppointmentModal from '../components/appointments/AppointmentModal';
import AppointmentDetailsModal from '../components/appointments/AppointmentDetailsModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Toast from '../components/Toast';
import { TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import ErrorBoundary from '../components/ErrorBoundary';

// Status color palette for calendar events
const STATUS_COLORS = {
  scheduled: { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' },      // Blue
  confirmed: { bg: '#059669', border: '#047857', text: '#ffffff' },      // Emerald
  in_progress: { bg: '#d97706', border: '#b45309', text: '#ffffff' },    // Amber
  completed: { bg: '#475569', border: '#334155', text: '#ffffff' },      // Slate
  cancelled: { bg: '#e11d48', border: '#be123c', text: '#ffffff' },      // Rose
  no_show: { bg: '#dc2626', border: '#b91c1c', text: '#ffffff' },        // Red
  rescheduled: { bg: '#4f46e5', border: '#4338ca', text: '#ffffff' },    // Indigo
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const socketContext = useSocket();
  const calendarRef = useRef(null);

  const role = user?.role || 'receptionist';
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isReceptionist = role === 'receptionist';

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Fetch all required data
  const fetchData = async (isSilentRefresh = false) => {
    if (!isSilentRefresh) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      // Backend automatically restricts doctor appointments when logged in as doctor
      const [apptsData, docsData, patientsData] = await Promise.all([
        getAllAppointments().catch((e) => {
          console.error('getAllAppointments failed:', e);
          return [];
        }),
        getEligibleDoctors().catch((e) => {
          console.error('getEligibleDoctors failed:', e);
          return [];
        }),
        getAllPatients().catch((e) => {
          console.error('getAllPatients failed:', e);
          return [];
        }),
      ]);

      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setDoctors(Array.isArray(docsData) ? docsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for custom appointment update events
    const handleAppointmentsUpdated = () => fetchData(true);
    window.addEventListener('medflow:appointments-updated', handleAppointmentsUpdated);

    return () => {
      window.removeEventListener('medflow:appointments-updated', handleAppointmentsUpdated);
    };
  }, []);

  // Filter appointments for display in FullCalendar
  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments.filter((appt) => {
      if (!appt) return false;
      // Doctor filter
      if (selectedDoctorId && String(appt.doctor_id) !== String(selectedDoctorId)) {
        return false;
      }
      // Status filter
      if (selectedStatus && (appt.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      // Search query (patient, doctor, reason, notes)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const pName = (appt.patient_name || '').toLowerCase();
        const dName = (appt.doctor_name || '').toLowerCase();
        const reason = (appt.reason || '').toLowerCase();
        const notes = (appt.notes || '').toLowerCase();
        return (
          pName.includes(query) ||
          dName.includes(query) ||
          reason.includes(query) ||
          notes.includes(query)
        );
      }
      return true;
    });
  }, [appointments, selectedDoctorId, selectedStatus, searchQuery]);

  // Operational metrics
  const stats = useMemo(() => {
    if (!Array.isArray(appointments)) {
      return { total: 0, scheduled: 0, confirmed: 0, inProgress: 0, completed: 0, cancelledOrNoShow: 0 };
    }
    const total = appointments.length;
    let scheduled = 0;
    let confirmed = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelledOrNoShow = 0;

    appointments.forEach((appt) => {
      if (!appt) return;
      const st = (appt.status || '').toLowerCase();
      if (st === 'scheduled') scheduled++;
      else if (st === 'confirmed') confirmed++;
      else if (st === 'in_progress') inProgress++;
      else if (st === 'completed') completed++;
      else if (st === 'cancelled' || st === 'no_show') cancelledOrNoShow++;
    });

    return { total, scheduled, confirmed, inProgress, completed, cancelledOrNoShow };
  }, [appointments]);

  // Transform filtered appointments into FullCalendar events format
  const calendarEvents = useMemo(() => {
    if (!Array.isArray(filteredAppointments)) return [];
    return filteredAppointments
      .filter((appt) => appt && appt.start_at)
      .map((appt) => {
        const st = (appt.status || 'scheduled').toLowerCase();
        const colorScheme = STATUS_COLORS[st] || STATUS_COLORS.scheduled;

        return {
          id: String(appt.id || Math.random()),
          title: `${appt.patient_name || 'Patient'} • Dr. ${appt.doctor_name || 'Doctor'} (${appt.reason || 'Visit'})`,
          start: appt.start_at,
          end: appt.ends_at,
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
          textColor: colorScheme.text,
          extendedProps: {
            ...appt,
          },
        };
      });
  }, [filteredAppointments]);

  // Handlers
  const handleEventClick = (clickInfo) => {
    const apptId = Number(clickInfo.event.id);
    const found = appointments.find((a) => a.id === apptId) || clickInfo.event.extendedProps;
    setSelectedAppointment(found);
    setIsDetailsOpen(true);
  };

  const handleDateSelect = (selectInfo) => {
    if (isAdmin) return; // Admin has read-only access
    setSelectedSlot({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setAppointmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenNewAppointment = () => {
    if (isAdmin) return;
    setAppointmentToEdit(null);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appt) => {
    if (isAdmin) return;
    setAppointmentToEdit(appt);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (payload, appointmentId) => {
    if (isAdmin) {
      throw new Error('Admins have read-only access and cannot schedule or modify appointments.');
    }

    if (appointmentId) {
      await updateAppointment(appointmentId, payload);
      showToast('Appointment successfully updated.');
    } else {
      await createAppointment(payload);
      showToast('Appointment booked and confirmed.');
    }

    setIsModalOpen(false);
    setAppointmentToEdit(null);
    setSelectedSlot(null);
    fetchData(true);
  };

  const handleQuickStatusChange = async (appointmentId, newStatus) => {
    if (isAdmin) {
      showToast('Admin role is restricted to read-only oversight.', 'error');
      return;
    }

    try {
      await updateAppointment(appointmentId, { status: newStatus });
      showToast(`Appointment status updated to ${newStatus.replace('_', ' ')}.`);
      
      // Update local state smoothly
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment((prev) => ({ ...prev, status: newStatus }));
      }
      fetchData(true);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteRequest = (appt) => {
    if (!isReceptionist) {
      showToast('Only receptionists have permission to delete appointment records.', 'error');
      return;
    }
    setAppointmentToDelete(appt);
    setIsDetailsOpen(false);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAppointment(appointmentToDelete.id);
      showToast('Appointment record removed.');
      setIsDeleteOpen(false);
      setAppointmentToDelete(null);
      fetchData(true);
    } catch (err) {
      showToast(err.message || 'Failed to delete appointment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Custom Event Content Renderer for FullCalendar
  const renderEventContent = (eventInfo) => {
    const appt = eventInfo?.event?.extendedProps || {};
    const st = (appt?.status || 'scheduled').toLowerCase();
    const timeText = eventInfo?.timeText || '';

    return (
      <div className="p-1 px-1.5 flex flex-col justify-center leading-tight overflow-hidden text-white w-full">
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-[11px] truncate tracking-tight">
            {appt?.patient_name || 'Patient'}
          </span>
          <span className="text-[9px] uppercase font-semibold px-1 py-0.5 rounded-xs bg-black/20 shrink-0">
            {st.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] opacity-90 truncate mt-0.5">
          {timeText && <span>{timeText}</span>}
          {timeText && <span>•</span>}
          <span className="truncate">Dr. {appt?.doctor_name || 'Assigned'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Appointment Calendar</span>
            </h1>
            
            {/* Role indicator badge */}
            {isAdmin && (
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md uppercase tracking-wide border border-amber-200 dark:border-amber-800">
                Read-Only Oversight
              </span>
            )}
            {isDoctor && (
              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                Doctor Schedule
              </span>
            )}
            {isReceptionist && (
              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                Scheduling Ops
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin
              ? 'Clinic-wide schedule monitoring, provider workload oversight, and visit statistics.'
              : isDoctor
              ? 'Review consultations, update visit progression, and maintain clinical logs.'
              : 'Book patient visits, coordinate doctor availability, and manage schedule shifts.'}
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Schedule button: visible only to Receptionist and Doctor */}
          {!isAdmin && (
            <button
              type="button"
              onClick={handleOpenNewAppointment}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-400">Total appointments</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Scheduled</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.scheduled + stats.confirmed}
          </div>
          <span className="text-[11px] text-slate-400">Scheduled / Confirmed</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <Play className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.inProgress}
          </div>
          <span className="text-[11px] text-slate-400">Active consultations</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completed}
          </div>
          <span className="text-[11px] text-slate-400">Finished visits</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stats.cancelledOrNoShow}
          </div>
          <span className="text-[11px] text-slate-400">Cancelled or No Show</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name, doctor, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Doctor Filter (Admin and Receptionist) */}
            {!isDoctor && (
              <div className="w-full sm:w-52">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {formatFullName(d.first_name, null, d.last_name)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedDoctorId || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDoctorId('');
                  setSelectedStatus('');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter notification when empty */}
      {filteredAppointments.length === 0 && !isLoading && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>No appointments match your selected search query or filters.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDoctorId('');
              setSelectedStatus('');
            }}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Main FullCalendar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <TableSkeleton rows={8} />
          </div>
        ) : (
          <ErrorBoundary title="Calendar Display Notice" onReset={() => fetchData(true)}>
            <div className="calendar-container">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                }}
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  list: 'Agenda',
                }}
                events={calendarEvents}
                editable={false}
                selectable={!isAdmin}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                nowIndicator={true}
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                slotDuration="00:30:00"
                eventClick={handleEventClick}
                select={handleDateSelect}
                eventContent={renderEventContent}
                height="auto"
              />
            </div>
          </ErrorBoundary>
        )}
      </div>

      {/* Appointment Modal (Booking & Rescheduling) */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAppointmentToEdit(null);
          setSelectedSlot(null);
        }}
        onSave={handleSaveAppointment}
        appointmentToEdit={appointmentToEdit}
        initialSlot={selectedSlot}
        currentUser={user}
        doctors={doctors}
        patients={patients}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        currentUser={user}
        onEdit={handleEditAppointment}
        onStatusChange={handleQuickStatusChange}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* Delete Confirmation Modal (Receptionist only) */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setAppointmentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment Record"
        patientName={
          appointmentToDelete
            ? `${appointmentToDelete.patient_name || 'Patient'} on ${new Date(
                appointmentToDelete.start_at
              ).toLocaleDateString()}`
            : 'this appointment'
        }
        description="Are you sure you want to permanently delete this appointment record? This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

