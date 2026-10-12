import axios from 'axios';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/users`;

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
    throw new Error('Unable to connect to the server. Please verify the backend is running.');
  }
  throw err;
};

/**
 * Fetch all users (Admin only)
 * GET /users/
 */
export async function getAllUsers() {
  try {
    const res = await axios.get(`${API_BASE}/`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Fetch single user by ID (Admin only)
 * GET /users/{id}
 */
export async function getUserById(id) {
  try {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Create a new user (Admin only)
 * POST /users/
 */
export async function createUser(userData) {
  const payload = {
    first_name: userData.first_name?.trim(),
    middle_name: userData.middle_name?.trim() ? userData.middle_name.trim() : null,
    last_name: userData.last_name?.trim(),
    email: userData.email?.trim().toLowerCase(),
    password: userData.password,
    role: userData.role,
    is_active: userData.is_active !== undefined ? Boolean(userData.is_active) : true,
  };
  try {
    const res = await axios.post(`${API_BASE}/`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Update user by ID (Admin only)
 * PUT /users/{id}
 */
export async function updateUser(id, userData, originalUser = null) {
  const isTargetRootAdmin = Boolean(originalUser?.is_root_admin);
  const payload = {};

  if (userData.first_name !== undefined && userData.first_name.trim()) {
    payload.first_name = userData.first_name.trim();
  }
  if (userData.middle_name !== undefined) {
    payload.middle_name = userData.middle_name?.trim() ? userData.middle_name.trim() : null;
  }
  if (userData.last_name !== undefined && userData.last_name.trim()) {
    payload.last_name = userData.last_name.trim();
  }
  if (userData.email !== undefined && userData.email.trim()) {
    payload.email = userData.email.trim().toLowerCase();
  }
  if (userData.password && userData.password.trim()) {
    payload.password = userData.password;
  }

  // Backend forbids sending 'role' or deactivating 'is_active' for root admin
  if (!isTargetRootAdmin) {
    if (userData.role && (!originalUser?.role || userData.role !== originalUser.role)) {
      payload.role = userData.role;
    }
    if (userData.is_active !== undefined) {
      payload.is_active = Boolean(userData.is_active);
    }
  }

  try {
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Delete user by ID (Admin only)
 * DELETE /users/{id}
 */
export async function deleteUser(id) {
  try {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Fetch currently authenticated user's profile
 * GET /users/me
 */
export async function getMyProfile() {
  try {
    const res = await axios.get(`${API_BASE}/me`);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Update currently authenticated user's profile
 * PUT /users/me
 */
export async function updateMyProfile(profileData) {
  const payload = {
    first_name: profileData.first_name?.trim(),
    middle_name: profileData.middle_name?.trim() ? profileData.middle_name.trim() : null,
    last_name: profileData.last_name?.trim(),
    email: profileData.email?.trim().toLowerCase(),
  };
  try {
    const res = await axios.put(`${API_BASE}/me`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

/**
 * Change currently authenticated user's password
 * PUT /users/me/password
 */
export async function changeMyPassword(passwordData) {
  const payload = {
    current_password: passwordData.current_password,
    new_password: passwordData.new_password,
  };
  try {
    const res = await axios.put(`${API_BASE}/me/password`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}
