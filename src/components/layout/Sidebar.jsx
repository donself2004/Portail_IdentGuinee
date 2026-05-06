import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, Search, FolderOpen,
  LifeBuoy, Settings, LogOut, Bell, Layers, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Sidebar.css';

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const avatar = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || 'C') + ' ' + (user?.nom || ''))}&background=006D44&color=fff`;

  const isActive = path => location.pathname === path;

  const handleLogout = () => { logout(); navigate('/'); };
  const handleNav = () => { if (onClose) onClose(); };

  // Fermer sur changement de route (mobile)
  useEffect(() => { if (onClose) onClose(); }, [location.pathname]);

  const NAV = [
    { to: '/dashboard',        icon: <LayoutDashboard size={18} />, label: 'Tableau de bord' },
    { to: '/nouvelle-demande', icon: <FilePlus size={18} />,        label: 'Nouvelle demande' },
    { to: '/suivi',            icon: <Search size={18} />,          label: 'Suivi des demandes' },
    { to: '/documents',        icon: <FolderOpen size={18} />,      label: 'Mes documents' },
    { to: '/services',         icon: <Layers size={18} />,          label: 'Services' },
  ];

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Close btn mobile */}
      <button className="sidebar-close" onClick={onClose} aria-label="Fermer le menu">
        <X size={18} />
      </button>

      {/* Logo */}
      <div className="sidebar-brand">
        <span className="sidebar-logo">Identi<em>Guinée</em></span>
        <span className="sidebar-badge">Portail Citoyen</span>
      </div>

      {/* Profil */}
      <div className="sidebar-profile">
        <img src={avatar} alt="avatar" className="sidebar-avatar" />
        <div className="sidebar-profile-info">
          <p className="sidebar-profile-name">{user?.prenom} {user?.nom}</p>
          <p className="sidebar-profile-role">Citoyen Vérifié ✓</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-title">Navigation</p>
        {NAV.map(item => (
          <Link key={item.to} to={item.to} onClick={handleNav} className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}>
            {item.icon}<span>{item.label}</span>
          </Link>
        ))}
        <Link to="/notifications" onClick={handleNav} className={`sidebar-link ${isActive('/notifications') ? 'active' : ''}`}>
          <Bell size={18} /><span>Notifications</span>
          {unreadCount > 0 && <span className="sidebar-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-section-title">Compte</p>
        <Link to="/aide" onClick={handleNav} className={`sidebar-link ${isActive('/aide') ? 'active' : ''}`}>
          <LifeBuoy size={18} /><span>Aide & Support</span>
        </Link>
        <Link to="/parametres" onClick={handleNav} className={`sidebar-link ${isActive('/parametres') ? 'active' : ''}`}>
          <Settings size={18} /><span>Paramètres</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-link sidebar-link-logout">
          <LogOut size={18} /><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
