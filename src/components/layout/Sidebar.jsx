import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  Search, 
  FolderOpen, 
  LifeBuoy, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${user?.prenom || 'Citoyen'}+${user?.nom || ''}&background=006D44&color=fff`;

  const isActive = (path) => {
    return location.pathname === path ? "nav-item active" : "nav-item";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1 className="logo-text">Identi<span>Guinée</span></h1>
      </div>

      <div className="user-short-profile">
        <img src={avatarSrc} alt="Profile" className="avatar-small" />
        <div className="user-info">
          <p className="user-name">{user?.prenom} {user?.nom}</p>
          <p className="user-status">Citoyen Vérifié</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <Link to="/" className={isActive('/')}>
            <LayoutDashboard size={20} />
            <span>Tableau de bord</span>
          </Link>
          <Link to="/nouvelle-demande" className={isActive('/nouvelle-demande')}>
            <FilePlus size={20} />
            <span>Nouvelle demande</span>
          </Link>
          <Link to="/suivi" className={isActive('/suivi')}>
            <Search size={20} />
            <span>Suivi des demandes</span>
          </Link>
          <Link to="/documents" className={isActive('/documents')}>
            <FolderOpen size={20} />
            <span>Mes documents</span>
          </Link>
        </div>

        <div className="nav-group bottom">
          <Link to="/aide" className={`${isActive('/aide')} secondary`}>
            <LifeBuoy size={20} />
            <span>Aide & Support</span>
          </Link>
          <Link to="/parametres" className={`${isActive('/parametres')} secondary`}>
            <Settings size={20} />
            <span>Paramètres</span>
          </Link>
          <button onClick={logout} className="nav-item logout" style={{ width: '100%', textAlign: 'left' }}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
