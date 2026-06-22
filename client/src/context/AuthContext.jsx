import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Only the JWT is persisted (localStorage). The user record — including the
// role used for view/permission gating — is never stored client-side; it is
// fetched fresh from the server (`GET /me`) on every boot, so a stale cached
// role can never grant the wrong view.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Resolving = we have a token but haven't fetched the user yet. Gate routing
  // on this so a refresh doesn't flash the login page before /me returns.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return undefined;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/me');
        if (alive) setUser(data.user);
      } catch {
        // 401 is handled by the axios interceptor (clears token → /login).
        localStorage.removeItem('token');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const login = (token, u) => {
    localStorage.setItem('token', token);
    setUser(u);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // In-memory only — never persisted.
  const updateUser = (partial) => setUser((prev) => ({ ...prev, ...partial }));

  return <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const isAdmin = (role) => role === 'admin';
export const isDriver = (role) => role === 'driver';
