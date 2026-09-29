/**
 * API client for Medical Billing & EHR Receptionist Portal
 * Directly communicates with existing FastAPI backend endpoints:
 * - GET    /patients/
 * - GET    /patients/{id}
 * - POST   /patients/
 * - PUT    /patients/{id}
 * - DELETE /patients/{id}
 */

// Base endpoint. In dev, Vite proxies /patients to http://127.0.0.1:8000/patients
const API_BASE = (import.meta.env.VITE_API_URL || '/patients').replace(/\/+$/, '');

/**
 * Helper to process API responses cleanly and extract useful error messages
 */
async function handleResponse(response) {
  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let errorMessage = 'Request failed with status ' + response.status;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.detail)) {
        // FastAPI 422 validation errors
        errorMessage = data.detail
          .map((err) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            return `${field ? field + ': ' : ''}${err.msg}`;
          })
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
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Fetch all patients from backend
 * GET /patients/
 */
export async function getAllPatients() {
  try {
    const response = await fetch(`${API_BASE}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to backend server. Please verify FastAPI is running at http://127.0.0.1:8000.'
      );
    }
    throw err;
  }
}

/**
 * Fetch single patient by ID
 * GET /patients/{id}
 */
export async function getPatientById(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server.');
    }
    throw err;
  }
}

/**
 * Add a new patient record
 * POST /patients/
 *
 * Backend expects:
 * {
 *   first_name: str (max 30),
 *   middle_name: str (max 30),
 *   last_name: str (max 30),
 *   dob: str (YYYY-MM-DD, max 10),
 *   address: str (max 100),
 *   city: str (max 50),
 *   state: str (max 50),
 *   postal_code: str (max 10),
 *   email: EmailStr,
 *   phone: str (9-11 chars),
 *   emergency_phone: str | null
 * }
 */
export async function createPatient(patientData) {
  // Ensure middle_name is at least empty string so DB nullable=False is satisfied
  const payload = {
    ...patientData,
    middle_name: patientData.middle_name ? patientData.middle_name.trim() : '',
    emergency_phone: patientData.emergency_phone ? patientData.emergency_phone.trim() : null,
  };

  try {
    const response = await fetch(`${API_BASE}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server.');
    }
    throw err;
  }
}

/**
 * Update an existing patient
 * PUT /patients/{id}
 *
 * Backend expects partial/full update fields
 */
export async function updatePatient(id, patientData) {
  const payload = { ...patientData };

  // If middle_name is provided, trim it; if explicitly cleared or undefined, handle gracefully
  if ('middle_name' in payload) {
    payload.middle_name = payload.middle_name ? payload.middle_name.trim() : '';
  }
  if ('emergency_phone' in payload) {
    payload.emergency_phone = payload.emergency_phone ? payload.emergency_phone.trim() : null;
  }

  // Remove read-only / immutable id from payload if present
  delete payload.id;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server.');
    }
    throw err;
  }
}

/**
 * Delete a patient by ID
 * DELETE /patients/{id}
 */
export async function deletePatient(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server.');
    }
    throw err;
  }
}
