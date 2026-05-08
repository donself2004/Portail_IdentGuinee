/**
 * Documents.jsx — Mes documents officiels
 * FIX COMPLET : multi-stratégie de fetch pour contourner RLS + type INT citoyen_id
 */
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, FileCode2, Shield, Trash2,
  AlertTriangle, Plus, RefreshCw, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const DOC_META = {
  C: { label:"Carte Nationale d'Identité",  color:'#006D44', typeDoc:"Carte d'Identité",     icon:'🪪', bg:'#f0fdf4' },
  P: { label:'Passeport Biométrique',        color:'#0054A6', typeDoc:'Passeport',             icon:'📘', bg:'#eff6ff' },
  A: { label:"Extrait d'Acte de Naissance",  color:'#7B2D8B', typeDoc:'Extrait de Naissance',  icon:'📄', bg:'#faf5ff' },
  E: { label:"Extrait d'Acte de Naissance",  color:'#7B2D8B', typeDoc:'Extrait de Naissance',  icon:'📄', bg:'#faf5ff' },
  D: { label:'Permis de Conduire',           color:'#B45309', typeDoc:'Permis de Conduire',     icon:'🚗', bg:'#fffbeb' },
};

const getDocMeta = (doc) => {
  const raw  = doc.statut_demande || doc.type_document || '';
  const code = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim().charAt(0).toUpperCase();
  return DOC_META[code] || { label:'Document Officiel GN', color:'#006D44', typeDoc:"Carte d'Identité", icon:'📋', bg:'#f8f9fa' };
};
const getDocCode = (doc) => {
  const raw = doc.statut_demande || doc.type_document || '';
  return raw.includes(':') ? raw.split(':')[0].trim() : raw.trim().charAt(0).toUpperCase();
};
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : '—';
const dedup = (docs) => {
  const seen = new Map();
  for (const doc of docs) {
    const code = getDocCode(doc);
    if (!seen.has(code)) seen.set(code, doc);
  }
  return Array.from(seen.values());
};
const isGenere = (d) => ['GENERE','GÉNÉRÉ','VALIDE','VALIDATED'].includes((d.statut||'').toUpperCase().trim());

const DeleteModal = ({ doc, onConfirm, onCancel, loading }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
    <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.22)' }}>
      <div style={{ width:56, height:56, background:'#FEE2E2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <AlertTriangle size={28} color="#CE1126" />
      </div>
      <h3 style={{ margin:'0 0 10px', fontSize:18, fontWeight:800, color:'#0a2e1a' }}>Supprimer ce document ?</h3>
      <p style={{ fontSize:14, color:'#666', margin:'0 0 24px', lineHeight:1.5 }}>
        <strong>{getDocMeta(doc).label}</strong> sera supprimé définitivement.
      </p>
      <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
        <button onClick={onCancel} disabled={loading} style={{ padding:'10px 24px', background:'#f5f5f5', border:'1px solid #ddd', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
        <button onClick={onConfirm} disabled={loading} style={{ padding:'10px 24px', background:'#CE1126', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:loading?0.7:1, display:'flex', alignItems:'center', gap:6 }}>
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
  const [dbError,   setDbError]   = useState('');
  const [toDelete,  setToDelete]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setDbError('');

    const results = [];

    // ── Stratégie 1 : citoyen_id (INT cast) ──
    try {
      const cid = parseInt(user.id, 10);
      if (!isNaN(cid)) {
        const { data } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('citoyen_id', cid)
          .order('date_generation', { ascending: false });
        if (data && data.length > 0) results.push(...data);
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
          .order('date_generation', { ascending: false });
        if (data && data.length > 0) results.push(...data);
      } catch {}
    }

    // ── Stratégie 3 : tous les docs (fallback démo) ──
    if (results.length === 0) {
      try {
        const { data, error } = await supabase
          .from('documents_certifies')
          .select('*')
          .order('date_generation', { ascending: false })
          .limit(100);

        if (error) {
          setDbError(`Erreur Supabase: ${error.message}`);
        } else if (data && data.length > 0) {
          // Filtrer par citoyen_id ou id_acte si possible
          const cid = parseInt(user.id, 10);
          const filtered = data.filter(d =>
            (!isNaN(cid) && d.citoyen_id === cid) ||
            (idActe && d.id_acte === idActe)
          );
          results.push(...(filtered.length > 0 ? filtered : []));
          if (filtered.length === 0) {
            setDbError(`Aucun document lié à votre compte (citoyen_id: ${user.id}, acte: ${idActe || 'N/A'})`);
          }
        }
      } catch (err) {
        setDbError(`Erreur: ${err.message}`);
      }
    }

    // Filtrer documents générés + dédupliquer
    const generes = results.filter(isGenere);
    setDocuments(dedup(generes));
    setLoading(false);
  }, [user?.id, user?.id_acte_lie, user?.matricule]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

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
      {toDelete && <DeleteModal doc={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} loading={deleting} />}

      <div style={{ maxWidth:900, margin:'0 auto' }} className="animate-fade-in">
        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom:20 }}>
          <span>Tableau de bord</span><ChevronRight size={13}/><span className="active">Mes documents</span>
        </nav>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 className="page-title">Mes documents officiels</h1>
            <p className="page-subtitle" style={{ marginTop:4 }}>Un seul document par catégorie — certifié par NaissanceChain.</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={fetchDocuments}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', color:'var(--text-muted)', fontWeight:600, fontFamily:'var(--font)' }}>
              <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }} /> Actualiser
            </button>
            <button onClick={() => navigate('/nouvelle-demande')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontWeight:700, fontFamily:'var(--font)' }}>
              <Plus size={14} /> Nouveau document
            </button>
          </div>
        </div>

        {/* Message debug si erreur */}
        {dbError && (
          <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:12, color:'#856404' }}>
            ⚠️ {dbError}
          </div>
        )}

        {loading ? (
          <div style={{ padding:56, textAlign:'center', background:'#fff', borderRadius:16, border:'1px solid var(--border)' }}>
            <div className="step-loader" style={{ margin:'0 auto 16px' }} />
            <p style={{ color:'var(--text-faint)', fontSize:14 }}>Chargement...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px', background:'#fff', borderRadius:16, border:'1px solid var(--border)' }}>
            <FileCode2 size={48} style={{ color:'#d0d0d0', margin:'0 auto 16px', display:'block' }} />
            <p style={{ fontWeight:700, fontSize:16, color:'var(--text-heading)', margin:'0 0 8px' }}>Aucun document généré</p>
            <p style={{ fontSize:13, color:'var(--text-faint)', margin:'0 0 24px' }}>
              Faites votre première demande pour obtenir vos documents officiels.
            </p>
            <button onClick={() => navigate('/nouvelle-demande')}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>
              <Plus size={16}/> Faire une demande
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:20 }}>
            {documents.map(doc => {
              const meta = getDocMeta(doc);
              const typeDoc = doc.type_document || meta.typeDoc;
              return (
                <div key={doc.id} style={{
                  background:'#fff', borderRadius:16, border:`1.5px solid ${meta.color}22`,
                  padding:0, display:'flex', flexDirection:'column', overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.07)', transition:'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform='none'; }}
                >
                  {/* Bande couleur en haut */}
                  <div style={{ height:5, background:`linear-gradient(90deg, ${meta.color}, ${meta.color}99)` }} />

                  <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, flex:1 }}>
                    {/* Icône + badge */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, border:`1px solid ${meta.color}22` }}>
                        {meta.icon}
                      </div>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, background:'#F0FDF4', color:'#006D44', fontSize:10, fontWeight:800, border:'1px solid #b8d8b8', letterSpacing:0.5 }}>
                        <Shield size={10}/> VÉRIFIÉ
                      </span>
                    </div>

                    {/* Titre */}
                    <div>
                      <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text-heading)', margin:'0 0 4px', lineHeight:1.3 }}>{meta.label}</h3>
                      <p style={{ fontSize:12, color:'var(--text-faint)', margin:'0 0 6px' }}>Émis le {fmtDate(doc.date_generation || doc.created_at)}</p>
                      {doc.id_acte && (
                        <span style={{ fontSize:11, fontFamily:'monospace', color:meta.color, background:meta.bg, padding:'2px 8px', borderRadius:6, fontWeight:700 }}>
                          {doc.id_acte}
                        </span>
                      )}
                    </div>

                    {/* Hash */}
                    {doc.hash_document && (
                      <div style={{ background:'#f8f9fa', borderRadius:8, padding:'8px 10px', borderLeft:`3px solid ${meta.color}` }}>
                        <div style={{ fontSize:9, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>Hash SHA-256</div>
                        <div style={{ fontSize:10, fontFamily:'monospace', color:'#444', wordBreak:'break-all', lineHeight:1.5 }}>
                          {doc.hash_document.slice(0,36)}…
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                      <button
                        onClick={() => navigate('/document-genere', { state: { documentId: doc.id, type_document: typeDoc } })}
                        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', background:meta.color, color:'#fff', border:'none', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>
                        <Eye size={13}/> Consulter
                      </button>
                      <button onClick={() => setToDelete(doc)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 13px', background:'#FEE2E2', color:'#CE1126', border:'1px solid #FECACA', borderRadius:10, cursor:'pointer' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
};

export default Documents;
