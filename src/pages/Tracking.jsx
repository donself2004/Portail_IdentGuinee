/**
 * Tracking.jsx — Suivi des demandes citoyen
 * Fix: page vide (erreur silencieuse), affichage cohérent, suppression
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronRight, FileText, Clock, CheckCircle, XCircle,
  Trash2, AlertTriangle, RefreshCw, Plus
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// ── Map codes → noms lisibles ──
const DOC_NAMES = {
  P: 'Passeport Biométrique',
  C: "Carte Nationale d'Identité",
  A: 'Acte de Naissance',
  E: "Extrait d'Acte de Naissance",
  D: 'Permis de Conduire',
  G: 'Carte Grise',
  J: 'Casier Judiciaire',
  N: 'Certificat de Nationalité',
  'Passeport': 'Passeport Biométrique',
  "Carte d'Identité": "Carte Nationale d'Identité",
  'Extrait de Naissance': "Extrait d'Acte de Naissance",
  'Permis de Conduire': 'Permis de Conduire',
};

const fmtDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const getDocName = (doc) => {
  if (!doc) return 'Document Officiel GN';
  const raw = doc.statut_demande || '';
  // Essayer d'abord le code préfixe (ex: "P:TERMINEE")
  const code = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim();
  return DOC_NAMES[code] || DOC_NAMES[raw] || doc.type_document || 'Document Officiel GN';
};

const getStatut = (doc) => {
  if (!doc) return 'en_cours';
  const s  = (doc.statut || '').toUpperCase().trim();
  const sd = (doc.statut_demande?.includes(':') ? doc.statut_demande.split(':')[1] : '').toUpperCase().trim();
  const DONE = ['GENERE','GÉNÉRÉ','VALIDE','VALIDATED','TERMINEE','TERMINÉE','COMPLETE','COMPLÉTÉ'];
  if (DONE.some(v => s === v || sd === v)) return 'done';
  if (['REJETE','REJECTED','REJETÉ'].some(v => s === v || sd === v)) return 'rejete';
  return 'en_cours';
};

// ── Modale confirmation ──
const DeleteModal = ({ demande, onConfirm, onCancel, loading }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  }}>
    <div style={{
      background: '#fff', borderRadius: 20, padding: 32, maxWidth: 420,
      width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        width: 56, height: 56, background: '#FEE2E2', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
      }}>
        <AlertTriangle size={28} color="#CE1126" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e1a', margin: '0 0 10px' }}>Supprimer cette demande ?</h3>
      <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.5 }}>
        La demande <strong>{demande?.ref}</strong> sera définitivement supprimée. Action irréversible.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onCancel} disabled={loading}
          style={{ padding: '10px 24px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{ padding: '10px 24px', background: '#CE1126', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}>
          <Trash2 size={15} /> {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

// ── Couleurs par statut ──
const STATUT_STYLE = {
  done:     { label: 'Terminée',   color: '#006D44', bg: '#F0FDF4', icon: <CheckCircle size={13} />, dot: '#006D44' },
  en_cours: { label: 'En cours',   color: '#B45309', bg: '#FEF3C7', icon: <Clock size={13} />,       dot: '#F59E0B' },
  rejete:   { label: 'Rejetée',    color: '#CE1126', bg: '#FEE2E2', icon: <XCircle size={13} />,     dot: '#CE1126' },
};

const Tracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [toDelete,  setToDelete]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const fetchDemandes = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut_demande, statut, created_at, date_generation, type_document')
        .eq('citoyen_id', user.id)
        .order('created_at', { ascending: false });

      if (dbErr) throw dbErr;
      setDocuments(data || []);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError('Impossible de charger vos demandes. Vérifiez votre connexion.');
      setDocuments([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('documents_certifies')
        .delete()
        .eq('id', toDelete.id);
      if (delErr) throw delErr;
      setDocuments(prev => prev.filter(d => d.id !== toDelete.id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erreur lors de la suppression. Réessayez.');
    }
    setDeleting(false);
    setToDelete(null);
  };

  return (
    <Layout>
      {toDelete && (
        <DeleteModal
          demande={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}

      <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* En-tête */}
        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom: 20 }}>
          <span>Tableau de bord</span>
          <ChevronRight size={13} />
          <span className="active">Suivi des demandes</span>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Suivi de vos demandes</h1>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Consultez et gérez l'avancement de vos démarches administratives.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchDemandes}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font)' }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
            <button onClick={() => navigate('/nouvelle-demande')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
              <Plus size={14} /> Nouvelle demande
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#CE1126', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tableau */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <div className="step-loader" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Chargement de vos demandes...</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <FileText size={44} style={{ color: '#d0d0d0', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-heading)', margin: '0 0 6px' }}>Aucune demande pour le moment</p>
              <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: '0 0 24px' }}>
                Cliquez sur "Nouvelle demande" pour commencer une démarche.
              </p>
              <button onClick={() => navigate('/nouvelle-demande')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                <Plus size={16} /> Faire une demande
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid var(--border)' }}>
                    {['Type de document', 'Référence', 'Date', 'Statut', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => {
                    const statut  = getStatut(doc);
                    const sc      = STATUT_STYLE[statut];
                    const canDel  = statut !== 'done';

                    return (
                      <tr key={doc.id}
                        style={{ borderBottom: i < documents.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 9, background: statut === 'done' ? '#F0FDF4' : '#F0F0F0', borderRadius: 10, flexShrink: 0 }}>
                              <FileText size={18} color={statut === 'done' ? '#006D44' : '#888'} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', margin: 0 }}>{getDocName(doc)}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>Acte : {doc.id_acte || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          REQ-{(doc.id || '').substring(0, 8).toUpperCase()}-GN
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDate(doc.date_generation || doc.created_at)}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20,
                            background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11,
                            whiteSpace: 'nowrap'
                          }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {canDel ? (
                            <button
                              onClick={() => setToDelete({ id: doc.id, ref: `REQ-${(doc.id||'').substring(0,8).toUpperCase()}-GN` })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FEE2E2', color: '#CE1126', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              <Trash2 size={12} /> Annuler
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>Finalisée</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Légende */}
        {documents.length > 0 && (
          <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(STATUT_STYLE).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.dot, flexShrink: 0 }}/>
                {val.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tracking;
