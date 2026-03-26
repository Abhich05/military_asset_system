import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mil_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mil_token') || null);

  const login = useCallback(async (username, password) => {
    const { data } = await apiClient.post('/api/auth/login', { username, password });
    if (!data.ok) throw new Error(data.error);
    localStorage.setItem('mil_token', data.token);
    localStorage.setItem('mil_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mil_token');
    localStorage.removeItem('mil_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';
  const isCommander = user?.role === 'BaseCommander';
  const isLogistics = user?.role === 'LogisticsOfficer';
  const canWrite = isAdmin || isCommander || isLogistics;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isCommander, isLogistics, canWrite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
