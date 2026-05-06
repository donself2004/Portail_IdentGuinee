import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, FileText, Clock, CheckCircle, XCircle, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';

const DOC_NAMES = {
  P: 'Passeport Biométrique GN',
  C: "Carte Nationale d'Identité",
  A: 'Acte de Naissance',
  E: "Extrait d'Acte de Naissance",
  D: 'Permis de Conduire',
  G: 'Carte Grise',
  J: 'Casier Judiciaire',
  N: 'Certificat de Nationalité',
};

const fmtDate = (v) => v
  ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Modale confirmation suppression ──
const DeleteModal = ({ demande, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
      <div style={{ width: 56, height: 56, background: 'var(--danger-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <AlertTriangle size={28} color="var(--danger)" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 10px' }}>Supprimer cette demande ?</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Cette action est irréversible. La demande <strong>{demande?.ref}</strong> sera définitivement supprimée.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={onCancel} style={{ padding: '10px 24px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
        <button onClick={onConfirm} style={{ padding: '10px 24px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={15} /> Supprimer
        </button>
      </div>
    </div>
  </div>
);

const Tracking = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDemandes = async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut_demande, statut, created_at, date_generation')
        .eq('citoyen_id', user.id)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
    } catch { setDocuments([]); }
    setLoading(false);
  };

  useEffect(() => { fetchDemandes(); }, [user?.id]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await supabase.from('documents_certifies').delete().eq('id', toDelete.id);
      setDocuments(prev => prev.filter(d => d.id !== toDelete.id));
    } catch { /* silencieux */ }
    setDeleting(false);
    setToDelete(null);
  };

  const getStatut = (doc) => {
    if (!doc) return 'en_cours';
    const s = (doc.statut || '').toUpperCase();
    const sd = (doc.statut_demande?.split(':')?.[1] || '').toUpperCase();
    if (['GENERE', 'GÉNÉRÉ', 'VALIDE', 'VALIDATED', 'TERMINEE', 'TERMINÉE'].some(v => s === v || sd === v)) return 'done';
    if (s === 'REJETE' || s === 'REJECTED') return 'rejete';
    return 'en_cours';
  };

  const statutDisplay = {
    done:     { label: 'Terminée',   color: 'var(--primary)', bg: 'var(--primary-light)', icon: <CheckCircle size={13} /> },
    en_cours: { label: 'En cours',   color: 'var(--warning)', bg: 'var(--warning-light)', icon: <Clock size={13} /> },
    rejete:   { label: 'Rejetée',    color: 'var(--danger)',  bg: 'var(--danger-light)',  icon: <XCircle size={13} /> },
  };

  const getDocName = (doc) => {
    if (!doc) return 'Document Officiel GN';
    const raw = doc.statut_demande || '';
    const code = raw.includes(':') ? raw.split(':')[0] : 'A';
    return DOC_NAMES[code] || 'Document Officiel GN';
  };

  return (
    <Layout>
      {toDelete && (
        <DeleteModal
          demande={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
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
            <p className="page-subtitle" style={{ marginTop: 4 }}>Consultez et gérez l'état d'avancement de vos démarches administratives.</p>
          </div>
          <button onClick={fetchDemandes} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font)' }}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Actualiser
          </button>
        </div>

        {/* Tableau */}
        <div className="form-card table-scroll" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="step-loader" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Chargement de vos demandes...</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <FileText size={40} style={{ color: 'var(--text-faint)', margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-faint)', fontSize: 14, fontWeight: 600 }}>Aucune demande en cours pour le moment.</p>
              <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 6 }}>Cliquez sur "Nouvelle demande" pour commencer une démarche.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                  {['Type de demande', 'Référence', 'Date', 'Statut', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => {
                  if (!doc) return null;
                  const stat = getStatut(doc);
                  const sc = statutDisplay[stat] || statutDisplay.en_cours;
                  const canDelete = stat !== 'done'; // ne peut supprimer que si pas encore terminée

                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg-main)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ padding: 9, background: stat === 'done' ? '#f5f5f5' : 'var(--primary-light)', color: stat === 'done' ? 'var(--text-faint)' : 'var(--primary)', borderRadius: 10, flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', margin: 0 }}>{getDocName(doc)}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>N° acte : {doc.id_acte || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                        REQ-{String(doc.id).substring(0, 8).toUpperCase() || 'UNKNOWN'}-GN
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
                        {fmtDate(doc.date_generation || doc.created_at)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11 }}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {canDelete ? (
                          <button
                            onClick={() => setToDelete({ id: doc.id, ref: `REQ-${String(doc.id).substring(0, 8).toUpperCase() || 'UNKNOWN'}-GN` })}
                            className="btn-danger"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <Trash2 size={13} /> Supprimer
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
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tracking;
