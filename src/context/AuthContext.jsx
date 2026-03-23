import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('trekops_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login: store token + user data
  const login = useCallback((token, userData) => {
    localStorage.setItem('trekops_token', token);
    localStorage.setItem('trekops_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Update user data without changing token
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('trekops_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Logout: clear everything
  const logout = useCallback(() => {
    localStorage.removeItem('trekops_token');
    localStorage.removeItem('trekops_user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const token = localStorage.getItem('trekops_token');

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
