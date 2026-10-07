import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to infer role from email since non-admins cannot hit /users/{id}
  const inferRoleFromEmail = (email = '') => {
    const lower = email.toLowerCase();
    if (lower.includes('admin')) return 'admin';
    if (lower.includes('doc')) return 'doctor';
    if (lower.includes('recep')) return 'receptionist';
    if (lower.includes('cod')) return 'coder';
    if (lower.includes('bill')) return 'biller';
    return 'receptionist'; // Safe default for actual clinic
  };

  const fetchUserProfile = async (authToken, decoded, emailFallback = '') => {
    try {
      const res = await axios.get(`http://localhost:8000/users/${decoded.sub || decoded.user_id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      // Admin successful
      return { ...res.data, role: res.data.role_id === 1 ? 'admin' : 'unknown' };
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        // Not an admin, infer role from email (which we either pass during login or have stored)
        const emailToUse = emailFallback || localStorage.getItem('userEmail') || '';
        return { 
          id: decoded.sub || decoded.user_id, 
          email: emailToUse,
          role: inferRoleFromEmail(emailToUse),
          isFallback: true 
        };
      }
      throw err;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
            return;
          }
          const userProfile = await fetchUserProfile(token, decoded);
          setUser(userProfile);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
    formData.append('username', username);
    formData.append('password', password);

    const res = await axios.post('http://localhost:8000/login/', formData);
    const newToken = res.data.access_token;
    
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', username); // Store for inference
    
    const decoded = jwtDecode(newToken);
    const userProfile = await fetchUserProfile(newToken, decoded, username);
    
    setUser(userProfile);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
