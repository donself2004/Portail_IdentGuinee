import React, { createContext, useState, useContext, useEffect } from 'react';
import { isSessionValid } from '../lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('identiguinee_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Vérifier l'expiration de session
      if (!isSessionValid(parsed)) {
        localStorage.removeItem('identiguinee_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Vérifier l'expiration toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isSessionValid(user)) {
        setUser(null);
        localStorage.removeItem('identiguinee_user');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('identiguinee_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('identiguinee_user');
  };

  const updateUser = (nextUserData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...nextUserData };
      localStorage.setItem('identiguinee_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
