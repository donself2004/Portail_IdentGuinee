/**
 * Tracking.jsx — Suivi des demandes citoyen
 * FIX COMPLET : multi-stratégie fetch + INT cast citoyen_id
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, FileText, Clock, CheckCircle, XCircle, Trash2, AlertTriangle, RefreshCw, Plus, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const DOC_NAMES = {
  P: 'Passeport Biométrique', C: "Carte Nationale d'Identité", A: "Extrait d'Acte de Naissance",
  E: "Extrait d'Acte de Naissance", D: 'Permis de Conduire',
};
const TYPE_DOC = {
  P:'Passeport', C:"Carte d'Identité", A:'Extrait de Naissance', E:'Extrait de Naissance', D:'Permis de Conduire',
};

const fmtDate = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }); } catch { return '—'; }
};
const getDocName = (doc) => {
  const raw = doc.statut_demande || doc.type_document || '';
  const code = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim();
  return DOC_NAMES[code] || DOC_NAMES[raw] || doc.type_document || 'Document Officiel GN';
};
const getTypeDoc = (doc) => {
  const raw = doc.statut_demande || doc.type_document || '';
  const code = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim();
  return TYPE_DOC[code] || doc.type_document || "Carte d'Identité";
};
const getStatut = (doc) => {
  const s  = (doc.statut || '').toUpperCase().trim();
  const sd = (doc.statut_demande?.includes(':') ? doc.statut_demande.split(':')[1] : '').toUpperCase().trim();
  const DONE = ['GENERE','GÉNÉRÉ','VALIDE','VALIDATED','TERMINEE','TERMINÉE','COMPLETE'];
  if (DONE.some(v => s === v || sd === v)) return 'done';
  if (['REJETE','REJECTED','REJETÉ'].some(v => s === v || sd === v)) return 'rejete';
  return 'en_cours';
};

const DeleteModal = ({ demande, onConfirm, onCancel, loading }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
    <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:420, width:'100%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
      <div style={{ width:56, height:56, background:'#FEE2E2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
        <AlertTriangle size={28} color="#CE1126" />
      </div>
      <h3 style={{ fontSize:18, fontWeight:800, color:'#0a2e1a', margin:'0 0 10px' }}>Supprimer cette demande ?</h3>
      <p style={{ fontSize:14, color:'#666', margin:'0 0 24px', lineHeight:1.5 }}>
        La demande <strong>{getDocName(demande)}</strong> sera définitivement supprimée.
      </p>
      <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
        <button onClick={onCancel} disabled={loading} style={{ padding:'10px 24px', background:'#f5f5f5', border:'1px solid #e0e0e0', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
        <button onClick={onConfirm} disabled={loading} style={{ padding:'10px 24px', background:'#CE1126', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, opacity:loading?0.6:1 }}>
          <Trash2 size={15}/> {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

const STATUT_STYLE = {
  done:     { label:'Terminée', color:'#006D44', bg:'#F0FDF4', icon:<CheckCircle size={13}/>, dot:'#006D44' },
  en_cours: { label:'En cours', color:'#B45309', bg:'#FEF3C7', icon:<Clock size={13}/>,       dot:'#F59E0B' },
  rejete:   { label:'Rejetée',  color:'#CE1126', bg:'#FEE2E2', icon:<XCircle size={13}/>,     dot:'#CE1126' },
};

const Tracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState('');
  const [toDelete,  setToDelete]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const fetchDemandes = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setDbError('');

    const results = [];

    // ── Stratégie 1 : citoyen_id INT ──
    try {
      const cid = parseInt(user.id, 10);
      if (!isNaN(cid)) {
        const { data, error } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('citoyen_id', cid)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) results.push(...data);
      }
    } catch {}

    // ── Stratégie 2 : id_acte ──
    const idActe = user.id_acte_lie || user.matricule;
    if (results.length === 0 && idActe && idActe !== '—') {
      try {
        const { data } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id_acte', idActe)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) results.push(...data);
      } catch {}
    }

    // ── Stratégie 3 : fetch global + filtre côté JS ──
    if (results.length === 0) {
      try {
        const { data, error } = await supabase
          .from('documents_certifies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          setDbError(`Erreur Supabase: ${error.message}`);
        } else if (data) {
          const cid = parseInt(user.id, 10);
          const filtered = data.filter(d =>
            (!isNaN(cid) && d.citoyen_id === cid) ||
            (idActe && idActe !== '—' && d.id_acte === idActe)
          );
          if (filtered.length > 0) results.push(...filtered);
          else setDbError(`Aucune demande liée à votre compte (id: ${user.id}, acte: ${idActe || 'N/A'}). Vérifiez que les données ont bien été soumises.`);
        }
      } catch (err) {
        setDbError(`Erreur: ${err.message}`);
      }
    }

    setDocuments(results);
    setLoading(false);
  }, [user?.id, user?.id_acte_lie, user?.matricule]);

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await supabase.from('documents_certifies').delete().eq('id', toDelete.id);
      setDocuments(prev => prev.filter(d => d.id !== toDelete.id));
    } catch {}
    setDeleting(false);
    setToDelete(null);
  };

  return (
    <Layout>
      {toDelete && <DeleteModal demande={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} loading={deleting}/>}

      <div className="animate-fade-in" style={{ maxWidth:900, margin:'0 auto' }}>
        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom:20 }}>
          <span>Tableau de bord</span><ChevronRight size={13}/><span className="active">Suivi des demandes</span>
        </nav>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 className="page-title">Suivi de vos demandes</h1>
            <p className="page-subtitle" style={{ marginTop:4 }}>Consultez et gérez l'avancement de vos démarches administratives.</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={fetchDemandes} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', color:'var(--text-muted)', fontWeight:600, fontFamily:'var(--font)' }}>
              <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/> Actualiser
            </button>
            <button onClick={() => navigate('/nouvelle-demande')} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontWeight:700, fontFamily:'var(--font)' }}>
              <Plus size={14}/> Nouvelle demande
            </button>
          </div>
        </div>

        {dbError && (
          <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:12, padding:'12px 18px', marginBottom:16, fontSize:12, color:'#856404' }}>
            ⚠️ {dbError}
          </div>
        )}

        <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding:56, textAlign:'center' }}>
              <div className="step-loader" style={{ margin:'0 auto 16px' }}/>
              <p style={{ color:'var(--text-faint)', fontSize:14 }}>Chargement de vos demandes...</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding:56, textAlign:'center' }}>
              <FileText size={44} style={{ color:'#d0d0d0', margin:'0 auto 16px', display:'block' }}/>
              <p style={{ fontWeight:700, fontSize:15, color:'var(--text-heading)', margin:'0 0 6px' }}>Aucune demande pour le moment</p>
              <p style={{ fontSize:13, color:'var(--text-faint)', margin:'0 0 24px' }}>Cliquez sur "Nouvelle demande" pour commencer une démarche.</p>
              <button onClick={() => navigate('/nouvelle-demande')}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>
                <Plus size={16}/> Faire une demande
              </button>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:580 }}>
                <thead>
                  <tr style={{ background:'#FAFAFA', borderBottom:'1px solid var(--border)' }}>
                    {['Type de document','Référence','Date','Statut','Action'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => {
                    const statut = getStatut(doc);
                    const st = STATUT_STYLE[statut];
                    const isDone = statut === 'done';
                    return (
                      <tr key={doc.id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:8, background:st.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <FileText size={16} color={st.color}/>
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-heading)' }}>{getDocName(doc)}</div>
                              <div style={{ fontSize:11, color:'var(--text-faint)' }}>{doc.id_acte ? `Acte: ${doc.id_acte}` : 'Registre NaissanceChain'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-muted)', background:'var(--bg-main)', padding:'3px 8px', borderRadius:6 }}>
                            {`REQ-${String(doc.id).slice(0,8).toUpperCase()}`}
                          </span>
                        </td>
                        <td style={{ padding:'14px 16px', fontSize:13, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                          {fmtDate(doc.date_generation || doc.created_at)}
                        </td>
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:st.bg, color:st.color, fontSize:12, fontWeight:700 }}>
                            {st.icon} {st.label}
                          </span>
                        </td>
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {isDone && (
                              <button
                                onClick={() => navigate('/document-genere', { state: { documentId: doc.id, type_document: getTypeDoc(doc) } })}
                                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>
                                <Eye size={13}/> Voir
                              </button>
                            )}
                            <button onClick={() => setToDelete(doc)}
                              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#FEE2E2', color:'#CE1126', border:'1px solid #FECACA', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div style={{ marginTop:12, fontSize:12, color:'var(--text-faint)', textAlign:'center' }}>
            {documents.length} demande{documents.length>1?'s':''} · Données en temps réel depuis NaissanceChain
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
};

export default Tracking;
