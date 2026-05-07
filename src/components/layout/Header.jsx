/**
 * Header.jsx — Synchronisé avec NotificationContext (badge + dropdown unifiés)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || 'C') + '+' + (user?.nom || ''))}&background=006D44&color=fff`;

  const typeIcon = { success: '✅', warning: '⚠️', info: 'ℹ️' };

  return (
    <header className="header-root">
      {/* Burger mobile */}
      <button className="header-burger" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} color="var(--text-heading)" />
      </button>

      {/* Logo mobile */}
      <span className="header-logo-mobile" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        Identi<em>Guinée</em>
      </span>

      {/* Actions droite */}
      <div className="header-actions">

        {/* ── Notifications — connecté au contexte global ── */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-icon-btn"
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="header-dropdown notif-dropdown">
              <div className="header-dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                  >
                    <CheckCheck size={13} /> Tout lire
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    Aucune notification
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--border)',
                        background: n.read ? '#fff' : 'var(--primary-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                      onClick={() => { markAsRead(n.id); setNotifOpen(false); navigate('/notifications'); }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                        {typeIcon[n.type] || 'ℹ️'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: 'var(--text-heading)', margin: '0 0 2px' }}>
                          {n.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px', lineHeight: 1.4 }}>
                          {n.subtitle}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: 0 }}>{n.time}</p>
                      </div>
                      {!n.read && (
                        <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                    style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}
                  >
                    Voir toutes les notifications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Avatar profil ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            aria-label="Profil"
          >
            <img src={avatarSrc} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-border)' }} />
            <span className="header-username">{user?.prenom}</span>
          </button>
          {profileOpen && (
            <div className="header-dropdown profile-dropdown">
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={avatarSrc} alt="" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-heading)', margin: 0 }}>
                    {user?.prenom} {user?.nom}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {user?.email || user?.matricule}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); setProfileOpen(false); }}
                style={{ width: '100%', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay fermeture */}
      {(notifOpen || profileOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          onClick={() => { setNotifOpen(false); setProfileOpen(false); }}
        />
      )}
    </header>
  );
};

export default Header;
