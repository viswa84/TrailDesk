import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('traildesk_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (phone) => {
    const userData = {
      name: 'Admin User',
      phone,
      role: 'Admin',
      avatar: 'AU',
    };
    setUser(userData);
    localStorage.setItem('traildesk_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('traildesk_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
