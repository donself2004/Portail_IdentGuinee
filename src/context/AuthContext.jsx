import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Charger l'utilisateur depuis le localStorage de manière synchrone au démarrage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('identiguinee_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {

      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('identiguinee_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('identiguinee_user');
  };

  const updateUser = (nextUserData) => {
    setUser((previousUser) => {
      const mergedUser = { ...(previousUser || {}), ...nextUserData };
      localStorage.setItem('identiguinee_user', JSON.stringify(mergedUser));
      return mergedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
