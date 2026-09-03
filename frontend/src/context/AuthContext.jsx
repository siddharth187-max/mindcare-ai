import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mindcare_token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify token and load user
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user || data);
      } catch {
        // Token invalid, clear it
        localStorage.removeItem('mindcare_token');
        localStorage.removeItem('mindcare_user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('mindcare_token', data.token);
    localStorage.setItem('mindcare_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password, role) {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('mindcare_token', data.token);
    localStorage.setItem('mindcare_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('mindcare_token');
    localStorage.removeItem('mindcare_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
