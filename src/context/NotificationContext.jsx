import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const NotificationContext = createContext();
const STORAGE_KEY = 'identiguinee_notifications';

const defaultNotifications = [
  {
    id: 'notif-1',
    title: 'Nouveau message du support',
    subtitle: 'Votre demande a été prise en charge.',
    time: 'Il y a 15 min',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Statut de dossier mis à jour',
    subtitle: 'Votre demande de Passeport est maintenant en cours.',
    time: 'Hier',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Rappel de documents',
    subtitle: 'N’oubliez pas de fournir une copie de votre acte de naissance.',
    time: '3 jours',
    read: true,
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.read).length,
    [notifications]
  );

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notif) => ({ ...notif, read: true }))
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
