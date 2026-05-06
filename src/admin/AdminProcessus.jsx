import React, { useState, useEffect } from 'react';
import { CheckCircle, Shield, Activity } from 'lucide-react';
import AdminLayout from './AdminLayout';

const ETAPES = [
  {
    num: 1,
    label: 'Réception & Chiffrement',
    desc: 'Paquets TLS 1.3 — Validation cryptographique instantanée.',
    done: true,
  },
  {
    num: 2,
    label: 'Vérification registre de naissance',
    desc: 'Recherche croisée dans la base GN-RNN-01...',
    active: true,
  },
  {
    num: 3,
    label: 'Analyse biométrique croisée',
    desc: 'Comparaison des minuties et points de repère faciaux.',
    done: false,
  },
  {
    num: 4,
    label: 'Validation automatique',
    desc: "Moteur de règles IA — Score de confiance requis : > 98%.",
    done: false,
  },
  {
    num: 5,
    label: 'Génération du certificat sécurisé',
    desc: 'Signé avec clé d\'État HSM et code QR dynamique.',
    done: false,
  },
];

const EVENTS_INITIAL = [
  { id: 8291, label: 'Demande #GN-8291 complétée', sub: 'Vérification Conakry — District de Kaloum', time: 'il y a 2 sec', statut: 'done' },
  { id: 8290, label: 'Demande #GN-8290 complétée', sub: 'Vérification Nzérékoré — Secteur Rural', time: 'il y a 14 sec', statut: 'done' },
  { id: 8292, label: 'Demande #GN-8292 en cours', sub: 'Étape: Vérification registre de naissance', time: 'ACTIF', statut: 'active' },
];

const AdminProcessus = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(45);
  const [capacity, setCapacity] = useState(4200);
  const [events, setEvents] = useState(EVENTS_INITIAL);
  const [chartBars] = useState([55, 70, 60, 80, 65, 90, 85, 95, 88, 100]);

  // Simule la progression de l'étape active
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setActiveStep(s => (s < 5 ? s + 1 : 1));
          return 0;
        }
        return p + 2;
      });
      setCapacity(c => {
        const delta = Math.floor(Math.random() * 100) - 50;
        return Math.max(3800, Math.min(4800, c + delta));
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Simule des nouveaux événements
  useEffect(() => {
    const interval = setInterval(() => {
      const nextId = Math.floor(Math.random() * 900) + 8300;
      const villes = ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Nzérékoré'];
      const ville = villes[Math.floor(Math.random() * villes.length)];
      setEvents(prev => [
        { id: nextId, label: `Demande #GN-${nextId} complétée`, sub: `Vérification ${ville}`, time: 'il y a 1 sec', statut: 'done' },
        ...prev.slice(0, 4)
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#006D44', letterSpacing: 1, margin: '0 0 6px', textTransform: 'uppercase' }}>
            FLUX D'IDENTIFICATION NATIONAL
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0a2e1a', margin: '0 0 6px' }}>
            Moteur de vérification automatique en temps réel
          </h1>
          <p style={{ fontSize: 13, color: '#006D44', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#006D44', display: 'inline-block' }} />
            Aucune intervention humaine requise
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#aaa', fontWeight: 700, margin: '0 0 2px', letterSpacing: 0.8 }}>UPTIME SYSTÈME</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#006D44', margin: 0 }}>99.99%</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#aaa', fontWeight: 700, margin: '0 0 2px', letterSpacing: 0.8 }}>TEMPS MOYEN</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0a2e1a', margin: 0 }}>1.4s</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* ── Pipeline étapes ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ETAPES.map((etape, i) => {
            const isActive = activeStep === i + 1;
            const isDone = activeStep > i + 1;

            return (
              <div key={etape.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Timeline dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? '#006D44' : isActive ? '#006D44' : '#e8e8e8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s', boxShadow: isActive ? '0 0 0 4px rgba(0,109,68,0.2)' : 'none'
                  }}>
                    {isDone
                      ? <CheckCircle size={18} color="#fff" />
                      : <span style={{ color: isDone || isActive ? '#fff' : '#aaa', fontWeight: 700, fontSize: 13 }}>{etape.num}</span>
                    }
                  </div>
                  {i < ETAPES.length - 1 && (
                    <div style={{ width: 2, height: 24, background: isDone ? '#006D44' : '#e0e0e0', transition: 'all 0.3s', marginTop: 4 }} />
                  )}
                </div>

                {/* Contenu */}
                <div style={{
                  flex: 1, background: '#fff', borderRadius: 14, padding: '16px 20px',
                  border: `2px solid ${isActive ? '#006D44' : '#eee'}`,
                  boxShadow: isActive ? '0 4px 20px rgba(0,109,68,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s', marginBottom: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isActive ? 10 : 0 }}>
                    <div>
                      {isActive && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#006D44', letterSpacing: 1, margin: '0 0 4px' }}>
                          ÉTAPE {etape.num} — EN COURS
                        </p>
                      )}
                      {!isActive && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: '0 0 4px' }}>
                          ÉTAPE {etape.num}
                        </p>
                      )}
                      <p style={{ fontWeight: 700, fontSize: 15, color: isDone || isActive ? '#0a2e1a' : '#aaa', margin: '0 0 4px' }}>
                        {etape.label}
                      </p>
                      <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{etape.desc}</p>
                    </div>
                    {isActive && (
                      <span style={{
                        background: '#006D44', color: '#fff', fontSize: 10,
                        fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: 0.5
                      }}>ACTIF</span>
                    )}
                  </div>

                  {/* Barre de progression pour l'étape active */}
                  {isActive && (
                    <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${progress}%`, height: '100%',
                        background: 'linear-gradient(90deg, #006D44, #00a86b)',
                        borderRadius: 3, transition: 'width 0.15s linear'
                      }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Journal des événements récents */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a2e1a', margin: 0 }}>Journal des événements récents</h3>
              <a href="/admin/journal" style={{ fontSize: 12, color: '#006D44', fontWeight: 600, textDecoration: 'none' }}>VOIR TOUT LE JOURNAL</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map((ev, i) => (
                <div key={`${ev.id}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: ev.statut === 'active' ? '#fffbeb' : '#f9fdf9',
                  borderRadius: 10, border: `1px solid ${ev.statut === 'active' ? '#fde68a' : '#e8efe8'}`
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: ev.statut === 'done' ? '#006D44' : '#fbbf24',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {ev.statut === 'done'
                      ? <CheckCircle size={14} color="#fff" />
                      : <Activity size={14} color="#fff" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#0a2e1a', margin: '0 0 2px' }}>{ev.label}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{ev.sub}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: ev.statut === 'active' ? '#d97706' : '#aaa',
                    background: ev.statut === 'active' ? '#fef3c7' : 'transparent',
                    padding: ev.statut === 'active' ? '2px 8px' : 0, borderRadius: 4
                  }}>{ev.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Colonne droite : métriques ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Charge système */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0a2e1a', margin: 0 }}>Charge système</h3>
              <span style={{ background: '#f0fdf4', color: '#006D44', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>Optimale</span>
            </div>
            {/* Mini chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 8 }}>
              {chartBars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, background: i === chartBars.length - 1 ? '#006D44' : '#c8e6c9',
                  borderRadius: '3px 3px 0 0', height: `${h}%`, transition: 'height 0.5s'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
              <span>08:00</span><span>12:00</span><span>EN DIRECT</span>
            </div>
          </div>

          {/* Capacité actuelle */}
          <div style={{ background: '#006D44', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, margin: '0 0 6px', textTransform: 'uppercase' }}>CAPACITÉ ACTUELLE</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>
              {capacity.toLocaleString('fr-FR')} <span style={{ fontSize: 16, fontWeight: 600 }}>req/min</span>
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              ↑ +12% par rapport à l'heure précédente
            </p>
          </div>

          {/* Sécurité niveau État */}
          <div style={{ background: '#fff5f5', borderRadius: 16, padding: 20, border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ background: '#CE1126', borderRadius: 8, padding: 8, flexShrink: 0 }}>
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0a2e1a', margin: '0 0 4px' }}>Sécurité de niveau État</p>
                <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.5 }}>
                  Le moteur utilise un environnement d'exécution de confiance (TEE) pour garantir que les données ne sont jamais exposées en clair.
                </p>
              </div>
            </div>
          </div>

          {/* Analyse temps réel visual */}
          <div style={{
            borderRadius: 16, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg, #0a2e1a, #006D44)',
            padding: 20, minHeight: 120
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 70% 50%, rgba(0,200,100,0.2), transparent 70%)'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(0,255,120,0.4)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,200,100,0.1)' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,255,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="#fff" />
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, textAlign: 'center', margin: 0 }}>
                Analyse en temps réel via CoreEngine v2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProcessus;
