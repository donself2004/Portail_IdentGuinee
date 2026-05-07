/**
 * Documents.jsx — Mes documents
 * - 1 seul document par catégorie (le plus récent)
 * - Lien Consulter avec le bon type_document
 * - Suppression possible par le citoyen
 * - Badge VÉRIFIÉ
 */
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, FileCode2, Download, Shield, Trash2,
  AlertTriangle, Plus, RefreshCw, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Map code → label complet + couleur ──
const DOC_META = {
  C: { label: "Carte d'Identité GN", color: '#006D44', typeDoc: "Carte d'Identité" },
  P: { label: 'Passeport GN',         color: '#0054A6', typeDoc: 'Passeport' },
  A: { label: 'Acte de Naissance GN', color: '#7B2D8B', typeDoc: 'Extrait de Naissance' },
  E: { label: 'Acte de Naissance GN', color: '#7B2D8B', typeDoc: 'Extrait de Naissance' },
  D: { label: 'Permis de Conduire GN',color: '#B45309', typeDoc: 'Permis de Conduire' },
  G: { label: 'Carte Grise GN',       color: '#475569', typeDoc: "Carte d'Identité" },
  J: { label: 'Casier Judiciaire GN', color: '#CE1126', typeDoc: "Carte d'Identité" },
  N: { label: 'Certificat de Nationalité GN', color: '#006D44', typeDoc: "Carte d'Identité" },
};

const getDocMeta = (doc) => {
  const raw  = doc.statut_demande || doc.type_document || '';
  const code = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim().charAt(0).toUpperCase();
  return DOC_META[code] || { label: 'Document Officiel GN', color: '#006D44', typeDoc: "Carte d'Identité" };
};

const getDocCode = (doc) => {
  const raw = doc.statut_demande || doc.type_document || '';
  return raw.includes(':') ? raw.split(':')[0].trim() : raw.trim().charAt(0).toUpperCase();
};

const fmtDate = (v) => v
  ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—';

// Garder uniquement 1 doc par catégorie (le plus récent)
const deduplicateByCategory = (docs) => {
  const seen = new Map();
  for (const doc of docs) {
    const code = getDocCode(doc);
    if (!seen.has(code)) seen.set(code, doc);
  }
  return Array.from(seen.values());
};

// ── Modal suppression ──
const DeleteModal = ({ doc, onConfirm, onCancel, loading }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  }}>
    <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
      <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
        <AlertTriangle size={28} color="#CE1126" />
      </div>
      <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0a2e1a' }}>Supprimer ce document ?</h3>
      <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.5 }}>
        <strong>{getDocMeta(doc).label}</strong> sera définitivement supprimé de votre espace.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onCancel} disabled={loading}
          style={{ padding: '10px 24px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          style={{ padding: '10px 24px', background: '#CE1126', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading?'wait':'pointer', fontFamily: 'inherit', opacity: loading?0.7:1, display:'flex',alignItems:'center',gap:6 }}>
          <Trash2 size={14} /> {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

const Documents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toDelete,  setToDelete]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut, statut_demande, type_document, created_at, date_generation, hash_document')
        .eq('citoyen_id', user.id)
        .eq('statut', 'GENERE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // 1 document par catégorie
      setDocuments(deduplicateByCategory(data || []));
    } catch (err) {
      console.error('Documents fetch error:', err);
      setDocuments([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('documents_certifies')
        .delete()
        .eq('id', toDelete.id);
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== toDelete.id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Erreur lors de la suppression.');
    }
    setDeleting(false);
    setToDelete(null);
  };

  return (
    <Layout>
      {toDelete && (
        <DeleteModal
          doc={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}

      <div style={{ maxWidth: 900, margin: '0 auto' }} className="animate-fade-in">
        {/* En-tête */}
        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom: 20 }}>
          <span>Tableau de bord</span>
          <ChevronRight size={13} />
          <span className="active">Mes documents</span>
        </nav>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Mes documents officiels</h1>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Un seul document par catégorie — certifié par NaissanceChain.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchDocuments}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font)' }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
            <button onClick={() => navigate('/nouvelle-demande')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
              <Plus size={14} /> Nouveau document
            </button>
          </div>
        </div>

        {/* Grille documents */}
        {loading ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div className="step-loader" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Chargement...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--border)' }}>
            <FileCode2 size={48} style={{ color: '#d0d0d0', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-heading)', margin: '0 0 8px' }}>
              Aucun document généré
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: '0 0 24px' }}>
              Faites votre première demande pour obtenir vos documents officiels.
            </p>
            <button onClick={() => navigate('/nouvelle-demande')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              <Plus size={16} /> Faire une demande
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20
          }}>
            {documents.map(doc => {
              const meta = getDocMeta(doc);
              const typeDoc = doc.type_document || meta.typeDoc;

              return (
                <div key={doc.id} style={{
                  background: '#fff', borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}
                >
                  {/* Top row : icône + badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 48, height: 48,
                      background: `${meta.color}15`,
                      borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileCode2 size={22} color={meta.color} />
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 800, color: '#006D44',
                      background: '#F0FDF4', padding: '4px 10px', borderRadius: 20,
                      border: '1px solid #BBF7D0',
                    }}>
                      <Shield size={10} /> VÉRIFIÉ
                    </div>
                  </div>

                  {/* Nom + date */}
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0a2e1a', margin: '0 0 4px', lineHeight: 1.3 }}>
                      {meta.label}
                    </h4>
                    <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                      Généré le {fmtDate(doc.date_generation || doc.created_at)}
                    </p>
                    {doc.hash_document && (
                      <p style={{ fontSize: 9, color: '#aaa', margin: '4px 0 0', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.4 }}>
                        {doc.hash_document.substring(0, 20)}...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                      onClick={() => navigate('/document-genere', {
                        state: { documentId: doc.id, type_document: typeDoc }
                      })}
                      style={{
                        flex: 1, padding: '10px 0', textAlign: 'center',
                        background: '#F0FDF4', color: '#006D44',
                        border: '1px solid #BBF7D0', borderRadius: 10,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}
                    >
                      <Eye size={13} /> Consulter
                    </button>
                    <button
                      onClick={() => setToDelete(doc)}
                      title="Supprimer ce document"
                      style={{
                        padding: '10px 12px',
                        background: '#FFF5F5', color: '#CE1126',
                        border: '1px solid #FECACA', borderRadius: 10,
                        fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
