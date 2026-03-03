import { createContext, useContext, useState, useCallback } from 'react';
import { apolloClient } from '../graphql/client';
import { LOGIN_MUTATION } from '../graphql/mutations';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('traildesk_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (phone, password) => {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: { phone, password },
    });

    const { token, user: authUser } = data.login;

    // Store JWT for Apollo authLink
    localStorage.setItem('traildesk_token', token);

    // Store user profile
    const userData = {
      _id: authUser._id,
      name: authUser.name,
      email: authUser.email,
      phone: authUser.phone,
      role: authUser.role,
      avatar: authUser.avatar || authUser.name?.split(' ').map(n => n[0]).join('') || 'U',
      tenantId: authUser.tenantId,
      tenantName: authUser.tenantName,
    };
    setUser(userData);
    localStorage.setItem('traildesk_user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('traildesk_user');
    localStorage.removeItem('traildesk_token');
    apolloClient.clearStore();
  }, []);

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
