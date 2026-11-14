import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Maps DB role_id (1: admin, 2: receptionist, 3: doctor, 4: coder, 5: biller) to role string
export const ROLE_ID_MAP = {
  1: 'admin',
  2: 'receptionist',
  3: 'doctor',
  4: 'coder',
  5: 'biller',
};

export const ROLE_TO_ID = {
  admin: 1,
  receptionist: 2,
  doctor: 3,
  coder: 4,
  biller: 5,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to infer role from email or saved metadata when /users/{id} is restricted (for non-admins)
  const inferRole = (email = '') => {
    // Check if we saved a verified role for this email during user creation/login
    const savedRoleMap = JSON.parse(localStorage.getItem('userRolesCache') || '{}');
    if (savedRoleMap[email.toLowerCase()]) {
      return savedRoleMap[email.toLowerCase()];
    }

    const lower = email.toLowerCase();
    if (lower.includes('admin')) return 'admin';
    if (lower.includes('doc')) return 'doctor';
    if (lower.includes('recep')) return 'receptionist';
    if (lower.includes('cod')) return 'coder';
    if (lower.includes('bill')) return 'biller';
    return 'receptionist'; // Default fallback for front-desk staff
  };

  const fetchUserProfile = async (authToken, decoded, emailFallback = '') => {
    try {
      // Query current user's profile from /users/me (works for all roles)
      const res = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = res.data;
      const roleStr = data.role || ROLE_ID_MAP[data.role_id] || (data.role_id === 1 ? 'admin' : 'receptionist');
      return {
        ...data,
        role: roleStr,
      };
    } catch (err) {
      // Fallback if /users/me is unreachable
      const userId = decoded?.sub || decoded?.user_id;
      const emailToUse = emailFallback || localStorage.getItem('userEmail') || '';
      const role = inferRole(emailToUse);
      return { 
        id: userId, 
        email: emailToUse,
        role: role,
        isFallback: true 
      };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      if (activeToken) {
        try {
          const decoded = jwtDecode(activeToken);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            logout();
            setLoading(false);
            return;
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
          if (!user) {
            const userProfile = await fetchUserProfile(activeToken, decoded);
            setUser(userProfile);
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username.trim());
    formData.append('password', password);

    const res = await axios.post(`${API_BASE_URL}/login/`, formData);
    const newToken = res.data.access_token;

    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', username.trim());
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    const decoded = jwtDecode(newToken);
    const userProfile = await fetchUserProfile(newToken, decoded, username.trim());

    setUser(userProfile);
    setLoading(false);
    return userProfile;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateCurrentUser = (updatedData) => {
    if (!updatedData) return;
    setUser((prev) => {
      if (!prev) return updatedData;
      const isUnchanged = Object.keys(updatedData).every(
        (key) => prev[key] === updatedData[key]
      );
      if (isUnchanged) return prev;
      return { ...prev, ...updatedData };
    });
    if (updatedData.email) {
      localStorage.setItem('userEmail', updatedData.email);
    }
  };

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const profile = await fetchUserProfile(token, decoded);
      setUser(profile);
      return profile;
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  // Helper so admin actions can cache roles for created users
  const cacheUserRole = (email, role) => {
    try {
      const saved = JSON.parse(localStorage.getItem('userRolesCache') || '{}');
      saved[email.toLowerCase()] = role;
      localStorage.setItem('userRolesCache', JSON.stringify(saved));
    } catch {
      // ignore storage error
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        cacheUserRole,
        updateCurrentUser,
        refreshUserProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
