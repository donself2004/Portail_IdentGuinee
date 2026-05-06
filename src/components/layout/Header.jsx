import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Header.css';

const NOTIFS_DEFAULT = [
  { id: 1, title: "Carte d'identité disponible", desc: "Votre CNI est prête à être retirée au centre de Kaloum.", time: "Il y a 2h", read: false },
  { id: 2, title: "Vérification NaissanceChain réussie", desc: "Votre acte de naissance a été confirmé avec succès.", time: "Hier", read: false },
  { id: 3, title: "Rappel rendez-vous", desc: "Votre rendez-vous au centre de Conakry est demain à 10h00.", time: "Il y a 2 jours", read: true },
  { id: 4, title: "Bienvenue sur IdentiGuinée", desc: "Découvrez tous nos services de documents officiels.", time: "Il y a 3 jours", read: true },
];

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || 'C') + '+' + (user?.nom || ''))}&background=006D44&color=fff`;

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState(NOTIFS_DEFAULT);

  const unread = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <header className="header-root">
      {/* Burger mobile */}
      <button className="header-burger" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} color="var(--text-heading)" />
      </button>

      {/* Logo mobile */}
      <span className="header-logo-mobile">Identi<em>Guinée</em></span>

      {/* Actions droite */}
      <div className="header-actions">
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="header-icon-btn" onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }} aria-label="Notifications">
            <Bell size={19} />
            {unread > 0 && <span className="header-badge">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="header-dropdown notif-dropdown">
              <div className="header-dropdown-header">
                <span>Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
                    <CheckCheck size={13} /> Tout lire
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.map(n => (
                  <div key={n.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: n.read ? '#fff' : 'var(--primary-light)', cursor: 'pointer' }}
                    onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                    <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-heading)', margin: '0 0 3px' }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', lineHeight: 1.4 }}>{n.desc}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: 0 }}>{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar profil */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} aria-label="Profil">
            <img src={avatarSrc} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-border)' }} />
            <span className="header-username">{user?.prenom}</span>
          </button>
          {profileOpen && (
            <div className="header-dropdown profile-dropdown">
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={avatarSrc} alt="" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-heading)', margin: 0 }}>{user?.prenom} {user?.nom}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{user?.email || user?.matricule}</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/'); setProfileOpen(false); }}
                style={{ width: '100%', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left' }}>
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fermer dropdowns sur clic extérieur */}
      {(notifOpen || profileOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}
    </header>
  );
};

export default Header;
