import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pvtrack_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('pvtrack_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('pvtrack_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('pvtrack_token');
        localStorage.removeItem('pvtrack_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('pvtrack_token', token);
    localStorage.setItem('pvtrack_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('pvtrack_token');
    localStorage.removeItem('pvtrack_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isViewer = user?.role === 'VIEWER';
  const canWrite = user && user.role !== 'VIEWER';
  const isAdminOrManager = isAdmin || isManager;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isManager, isViewer, canWrite, isAdminOrManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
