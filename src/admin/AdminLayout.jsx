import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings2, ScrollText,
  Shield, LogOut, CheckCircle
} from 'lucide-react';

// ── Auth admin (sessionStorage) ──
export const isAdminLoggedIn = () => {
  try { return !!sessionStorage.getItem('identiguinee_admin'); } catch { return false; }
};
export const logoutAdmin = (navigate) => {
  sessionStorage.removeItem('identiguinee_admin');
  navigate('/');
};
export const getAdminUser = () => {
  try { return JSON.parse(sessionStorage.getItem('identiguinee_admin') || '{}'); } catch { return {}; }
};

const NAV_ITEMS = [
  { path: '/admin',                label: 'Tableau de bord',        icon: <LayoutDashboard size={19} /> },
  { path: '/admin/demandes',       label: 'Demandes citoyens',      icon: <Users size={19} /> },
  { path: '/admin/utilisateurs',   label: 'Utilisateurs',           icon: <Users size={19} /> },
  { path: '/admin/processus',      label: 'Processus automatique',  icon: <Settings2 size={19} /> },
  { path: '/admin/journal',        label: 'Journal de transparence',icon: <ScrollText size={19} /> },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = getAdminUser();

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate('/', { replace: true });
  }, [navigate]);

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (window.confirm('Déconnecter l\'administrateur ?')) logoutAdmin(navigate);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: 'var(--font)' }}>

      {/* ── SIDEBAR ADMIN ── */}
      <aside style={{
        width: 'var(--sidebar-width)', height: '100vh',
        position: 'fixed', left: 0, top: 0,
        background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto', overflowX: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', display: 'block', letterSpacing: '-0.3px' }}>
            Identi<span style={{ color: 'var(--primary)' }}>Guinée</span>
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#fff', background: 'var(--primary)', borderRadius: 4, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>
            Administration
          </span>
        </div>

        {/* Profil admin — SANS photo, juste icône bouclier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--bg-main)', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={20} color="#fff" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {admin.nom || 'Administrateur'}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>Accès complet</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', marginBottom: 6 }}>
            Navigation
          </p>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-base)', fontWeight: isActive(item.path) ? 700 : 500,
              background: isActive(item.path) ? 'var(--primary-light)' : 'transparent',
              color: isActive(item.path) ? 'var(--primary)' : 'var(--text-muted)',
              textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
            }}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer — UNIQUEMENT Déconnexion, pas de lien Portail Citoyen */}
        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', marginBottom: 6 }}>
            Compte
          </p>
          {/* ── DÉCONNEXION ADMIN — ROUGE ── */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-base)', fontWeight: 700,
            color: 'var(--danger)', background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)', cursor: 'pointer',
            fontFamily: 'var(--font)', width: '100%', textAlign: 'left',
          }}>
            <LogOut size={19} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ── */}
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          padding: '0 32px', height: 'var(--header-height)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>IdentiGuinée</span>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Administration</span>
            {location.pathname !== '/admin' && (() => {
              const current = NAV_ITEMS.find(n => location.pathname.startsWith(n.path) && n.path !== '/admin');
              return current ? (
                <><span>/</span><span style={{ color: 'var(--text-heading)', fontWeight: 700 }}>{current.label}</span></>
              ) : null;
            })()}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--primary)',
          }}>
            <CheckCircle size={14} fill="var(--primary)" color="#fff" />
            Système actif
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
