import axios from 'axios';

const API_BASE = 'http://localhost:8000/patients';

const handleAxiosError = (err) => {
  if (err.response) {
    const data = err.response.data;
    let errorMessage = `Request failed with status ${err.response.status}`;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((e) => `${e.loc ? e.loc[e.loc.length - 1] + ': ' : ''}${e.msg}`).join(', ');
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
    throw new Error('Unable to connect to backend server. Please verify FastAPI is running.');
  }
  throw err;
};

export async function getAllPatients() {
  try {
    const res = await axios.get(`${API_BASE}/`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function getPatientById(id) {
  try {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function createPatient(patientData) {
  const payload = {
    ...patientData,
    middle_name: patientData.middle_name ? patientData.middle_name.trim() : null,
    emergency_phone: patientData.emergency_phone ? patientData.emergency_phone.trim() : null,
  };
  try {
    const res = await axios.post(`${API_BASE}/`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function updatePatient(id, patientData) {
  const payload = { ...patientData };
  if ('middle_name' in payload) {
    payload.middle_name = payload.middle_name ? payload.middle_name.trim() : null;
  }
  if ('emergency_phone' in payload) {
    payload.emergency_phone = payload.emergency_phone ? payload.emergency_phone.trim() : null;
  }
  delete payload.id;

  try {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function deletePatient(id) {
  try {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}
