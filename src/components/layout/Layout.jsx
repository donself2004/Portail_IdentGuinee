import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Layout commun pour toutes les pages citoyens.
 * Gère l'état ouvert/fermé de la sidebar sur mobile.
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout-wrapper">
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Burger button (mobile) */}
      <button
        className="sidebar-burger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </main>
    </div>
  );
};

export default Layout;
