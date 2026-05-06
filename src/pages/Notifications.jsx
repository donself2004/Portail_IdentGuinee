import React from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Bell, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Layout>
      <div className="notifications-page animate-fade-in">
          <nav className="breadcrumbs animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span>TABLEAU DE BORD</span> <ChevronRight size={14} />
            <span className="active">NOTIFICATIONS</span>
          </nav>

          <div className="notifications-header animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div>
              <h2 className="page-title">Notifications</h2>
              <p className="page-subtitle">
                Retrouvez toutes les alertes, mises à jour et messages importants concernant vos demandes.
              </p>
            </div>
            <button className="mark-read-button" onClick={markAllAsRead}>
              Marquer toutes comme lues
            </button>
          </div>

          <div className="notifications-grid animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {notifications.length === 0 ? (
              <div className="empty-notification-card">
                <Bell size={32} />
                <h3>Aucune notification</h3>
                <p>Vous n'avez pas de nouvelles notifications pour le moment.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-card-top">
                    <h4>{notification.title}</h4>
                    {!notification.read && <span className="notification-dot" />}
                  </div>
                  <p>{notification.subtitle}</p>
                  <span className="notification-time">{notification.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
    </Layout>
  );
};

export default Notifications;
