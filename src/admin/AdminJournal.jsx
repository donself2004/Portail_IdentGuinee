import React, { useState, useEffect } from 'react';
import { Shield, Clock, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';

const INITIAL_LOGS = [
  { time: '12:03:01', req: '#7829', label: 'Vérification registre OK', hash: 'SHA-256: 8A7F...021E', type: 'success', icon: '✓' },
  { time: '12:03:05', req: '#7829', label: 'Validation biométrique réussie', hash: 'SHA-256: 4F1C...88A2', type: 'success', icon: '◈' },
  { time: '12:03:10', req: '#7829', label: 'Document généré automatiquement', hash: 'SHA-256: 99E2...FB4C', type: 'success', icon: '↑' },
  { time: '12:04:15', req: '#7830', label: 'Rejet automatique : Incohérence de données', hash: 'POLICE_VIOLATION_04', type: 'error', icon: '⊘' },
  { time: '12:05:00', req: '#7831', label: 'Analyse des pièces jointes en cours...', hash: 'PENDING_QUEUE', type: 'pending', icon: '↺' },
  { time: '12:06:22', req: 'SYSTEM', label: 'Snapshot de la base de données vers le registre immuable complété.', hash: 'BACKUP_OK', type: 'system', icon: '☰' },
];

const AdminJournal = () => {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Nouveaux logs simulés en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      const reqNum = Math.floor(Math.random() * 200) + 7832;
      const types = [
        { label: 'Vérification registre OK', hash: `SHA-256: ${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`, type: 'success', icon: '✓' },
        { label: 'Document généré automatiquement', hash: `SHA-256: ${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`, type: 'success', icon: '↑' },
        { label: 'Validation biométrique réussie', hash: `SHA-256: ${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`, type: 'success', icon: '◈' },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setLogs(prev => [
        { time: timeStr, req: `#${reqNum}`, ...t },
        ...prev.slice(0, 19)
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const typeStyle = {
    success: { color: '#006D44', reqColor: '#006D44' },
    error: { color: '#CE1126', reqColor: '#CE1126' },
    pending: { color: '#888', reqColor: '#555' },
    system: { color: '#888', reqColor: '#555' },
  };

  const handleExport = () => {
    const content = logs.map(l => `${l.time} | ${l.req} | ${l.label} | ${l.hash}`).join('\n');
    const blob = new Blob([`IDENTIGUINEE — SYSTEM LEDGER EXPORT\nExporté le ${new Date().toLocaleString('fr-FR')}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SYSTEM_LEDGER_V2.log'; a.click();
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5, display: 'inline-block', marginBottom: 10 }}>
            IMMUABILITÉ GARANTIE
          </span>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#0a2e1a', margin: '0 0 6px' }}>Journal de transparence</h1>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>Journal d'audit en temps réel — Preuve d'intégrité</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#006D44', margin: '0 0 2px', letterSpacing: -1 }}>ZÉRO CORRUPTION</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 2, margin: 0 }}>ZÉRO AGENT HUMAIN</p>
        </div>
      </div>

      {/* Métriques haut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Preuve de Travail Algorithmique */}
        <div style={{ background: '#006D44', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, bottom: -30, width: 100, height: 100, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, display: 'inline-block', marginBottom: 12 }}>
              <Shield size={22} color="#fff" />
            </div>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>Preuve de Travail Algorithmique</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Chaque décision est signée numériquement et ancrée dans le registre d'État sans intervention manuelle.
            </p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 44, fontWeight: 900, color: '#0a2e1a', margin: '0 0 4px' }}>99.9%</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>Automatisation</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 44, fontWeight: 900, color: '#0a2e1a', margin: '0 0 4px' }}>0ms</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>Latence d'audit</p>
        </div>
      </div>

      {/* Terminal de logs */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {/* Barre de titre terminal */}
        <div style={{ background: '#f5f5f5', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666', fontWeight: 700 }}>SYSTEM_LEDGER_V2.LOG</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#006D44' }}>FLUX EN DIRECT</span>
          </div>
        </div>

        {/* Logs */}
        <div style={{ background: '#0d1f17', padding: '16px 0', maxHeight: 340, overflowY: 'auto' }}>
          {logs.map((log, i) => {
            const ts = typeStyle[log.type] || typeStyle.system;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '6px 20px', fontFamily: 'monospace', fontSize: 12,
                borderLeft: log.type === 'error' ? '3px solid #CE1126' : '3px solid transparent',
                transition: 'background 0.2s'
              }}>
                <span style={{ color: '#4fc3f7', flexShrink: 0, minWidth: 60 }}>{log.time}</span>
                <span style={{ color: ts.reqColor, fontWeight: 700, flexShrink: 0, minWidth: 70 }}>{log.req}</span>
                <span style={{ color: log.type === 'error' ? '#CE1126' : '#888', marginRight: 6, flexShrink: 0 }}>{log.icon}</span>
                <span style={{ color: log.type === 'error' ? '#ff6b6b' : log.type === 'pending' ? '#fbbf24' : '#e0e0e0', flex: 1 }}>
                  {log.label}
                </span>
                <span style={{
                  color: log.type === 'success' ? '#4fc3f7' : log.type === 'error' ? '#CE1126' : '#888',
                  fontSize: 10, flexShrink: 0, fontWeight: 600
                }}>{log.hash}</span>
              </div>
            );
          })}
        </div>

        {/* Footer terminal */}
        <div style={{ background: '#f9f9f9', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#666' }}>
            <span><strong>NŒUDS ACTIFS:</strong> 12 / 12</span>
            <span><strong>HACHAGE COURANT:</strong> 0x78a2bc45...</span>
          </div>
          <button onClick={handleExport} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #ddd', borderRadius: 8,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#333'
          }}>
            <Download size={14} /> EXPORTER L'AUDIT COMPLET
          </button>
        </div>
      </div>

      {/* Cartes de bas de page */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '20px 24px', border: '1px solid #c3e6cb', display: 'flex', gap: 14 }}>
          <div style={{ background: '#006D44', borderRadius: 10, padding: 10, height: 'fit-content', flexShrink: 0 }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0a2e1a', margin: '0 0 6px' }}>Architecture Zero-Trust</h4>
            <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.6 }}>
              Le système n'accorde aucune confiance par défaut, même à l'intérieur du réseau administratif. Chaque accès est authentifié et logué.
            </p>
          </div>
        </div>
        <div style={{ background: '#fff5f0', borderRadius: 14, padding: '20px 24px', border: '1px solid #fecba1', display: 'flex', gap: 14 }}>
          <div style={{ background: '#e0650a', borderRadius: 10, padding: 10, height: 'fit-content', flexShrink: 0 }}>
            <Clock size={20} color="#fff" />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0a2e1a', margin: '0 0 6px' }}>Traçabilité à vie</h4>
            <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.6 }}>
              Les journaux ne peuvent pas être supprimés ou modifiés. Ils constituent une archive historique et légale permanente de l'activité du système.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminJournal;
