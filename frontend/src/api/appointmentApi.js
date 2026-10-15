import axios from 'axios';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/appointments`;

const handleAxiosError = (err) => {
  if (err.response) {
    const data = err.response.data;
    let errorMessage = `Request failed with status ${err.response.status}`;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((e) => `${e.loc ? e.loc[e.loc.length - 1] + ': ' : ''}${e.msg}`)
          .join(', ');
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (typeof data === 'string' && data.trim()) {
      errorMessage = data;
    }
    const error = new Error(errorMessage);
    error.status = err.response.status;
    error.data = data;
    throw error;
  }
  if (err.request) {
    throw new Error('Unable to connect to the backend server. Please verify FastAPI is running.');
  }
  throw err;
};

/**
 * Fetch all appointments with optional query filters (patient_id, doctor_id, status)
 * GET /appointments/
 */
export async function getAllAppointments(filters = {}) {
  try {
    const params = {};
    if (filters.patient_id) params.patient_id = filters.patient_id;
    if (filters.doctor_id) params.doctor_id = filters.doctor_id;
    if (filters.status) params.status = filters.status;

    const res = await axios.get(`${API_BASE}/`, { params });
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Fetch appointment by ID
 * GET /appointments/{id}
 */
export async function getAppointmentById(id) {
  try {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Create a new appointment
 * POST /appointments/
 */
export async function createAppointment(appointmentData) {
  const payload = {
    patient_id: Number(appointmentData.patient_id),
    doctor_id: Number(appointmentData.doctor_id),
    start_at: appointmentData.start_at,
    ends_at: appointmentData.ends_at,
    reason: appointmentData.reason?.trim(),
    status: appointmentData.status || 'scheduled',
    notes: appointmentData.notes?.trim() ? appointmentData.notes.trim() : null,
  };

  try {
    const res = await axios.post(`${API_BASE}/`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Update an existing appointment (status, notes, rescheduled times, doctor/patient)
 * PUT /appointments/{id}
 */
export async function updateAppointment(id, appointmentData) {
  const payload = {};

  if (appointmentData.patient_id !== undefined) payload.patient_id = Number(appointmentData.patient_id);
  if (appointmentData.doctor_id !== undefined) payload.doctor_id = Number(appointmentData.doctor_id);
  if (appointmentData.start_at !== undefined) payload.start_at = appointmentData.start_at;
  if (appointmentData.ends_at !== undefined) payload.ends_at = appointmentData.ends_at;
  if (appointmentData.reason !== undefined) payload.reason = appointmentData.reason?.trim();
  if (appointmentData.status !== undefined) payload.status = appointmentData.status;
  if (appointmentData.notes !== undefined) {
    payload.notes = appointmentData.notes?.trim() ? appointmentData.notes.trim() : null;
  }

  try {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Delete an appointment record
 * DELETE /appointments/{id}
 */
export async function deleteAppointment(id) {
  try {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Fetch eligible doctors list for scheduling dropdowns & filters
 * GET /appointments/doctors
 */
export async function getEligibleDoctors() {
  try {
    const res = await axios.get(`${API_BASE}/doctors`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

