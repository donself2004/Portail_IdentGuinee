/**
 * Verifier.jsx — Vérification par numéro d'acte (route /verifier/:id)
 * SÉCURISÉ : cherche un document certifié associé à l'acte, pas juste l'acte
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, ChevronLeft, Clock, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Verifier = () => {
  const { id } = useParams();
  const [status, setStatus]   = useState('loading');
  const [acte, setActe]       = useState(null);
  const [doc, setDoc]         = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 100) / 10), 100);

    const verify = async () => {
      try {
        // 1. Chercher l'acte dans NaissanceChain
        const { data: a } = await supabase
          .from('naissancechain')
          .select('*')
          .eq('id_acte', id)
          .maybeSingle();
        if (a) setActe(a);

        // 2. Chercher un document certifié GENERE lié à cet acte
        const { data: docs } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id_acte', id)
          .eq('statut', 'GENERE')
          .order('date_generation', { ascending: false })
          .limit(1);

        clearInterval(timer);

        if (docs && docs.length > 0) {
          setDoc(docs[0]);
          setStatus('authentic');
        } else if (a) {
          // Acte existe mais pas de document certifié émis
          setStatus('acte_only');
        } else {
          setStatus('invalid');
        }
      } catch {
        clearInterval(timer);
        setStatus('invalid');
      }
    };

    verify();
    return () => clearInterval(timer);
  }, [id]);

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : '—';

  if (status === 'loading') {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0fdf4,#e8f5e8)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Arial,sans-serif' }}>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          {/* En-tête officiel */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:6 }}>
              <div style={{ display:'flex', height:14, width:24, borderRadius:2, overflow:'hidden' }}>
                <div style={{ flex:1, background:'#CE1126' }}/><div style={{ flex:1, background:'#FCD116' }}/><div style={{ flex:1, background:'#009A44' }}/>
              </div>
              <div style={{ fontSize:10, fontWeight:800, color:'#444', letterSpacing:1, textTransform:'uppercase' }}>République de Guinée</div>
              <div style={{ display:'flex', height:14, width:24, borderRadius:2, overflow:'hidden' }}>
                <div style={{ flex:1, background:'#CE1126' }}/><div style={{ flex:1, background:'#FCD116' }}/><div style={{ flex:1, background:'#009A44' }}/>
              </div>
            </div>
            <div style={{ fontSize:18, fontWeight:900, color:'#0a2e1a' }}>Identi<span style={{ color:'#006D44' }}>Guinée</span></div>
            <div style={{ fontSize:9, color:'#888', letterSpacing:1, textTransform:'uppercase' }}>Travail · Justice · Solidarité</div>
          </div>
          <Shield size={48} color="#006D44" style={{ marginBottom:16 }} />
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0a2e1a', margin:'0 0 8px' }}>Vérification en cours...</h2>
          <p style={{ fontSize:12, color:'#555', margin:'0 0 16px' }}>Consultation NaissanceChain — Acte N° {id}</p>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', borderRadius:20, padding:'8px 16px', border:'1px solid #e0ece0' }}>
            <Clock size={13} color="#888" />
            <span style={{ fontSize:12, fontFamily:'monospace', color:'#006D44', fontWeight:700 }}>{elapsed.toFixed(1)}s</span>
          </div>
          <div style={{ marginTop:16, height:4, background:'#e0ece0', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#006D44', borderRadius:2, animation:'prog 2.5s ease-in-out forwards' }} />
          </div>
        </div>
        <style>{`@keyframes prog{from{width:0}to{width:90%}}`}</style>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div style={{ minHeight:'100vh', background:'#fff5f5', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Arial,sans-serif' }}>
        <div style={{ maxWidth:440, width:'100%', background:'#fff', padding:'36px 28px', borderRadius:20, boxShadow:'0 20px 48px rgba(206,17,38,0.1)', textAlign:'center', border:'1px solid #fee2e2' }}>
          <XCircle size={48} color="#CE1126" style={{ marginBottom:16 }} />
          <div style={{ background:'#CE1126', color:'#fff', padding:'5px 16px', borderRadius:20, fontSize:11, fontWeight:800, letterSpacing:1.5, display:'inline-block', marginBottom:14 }}>✗ NON AUTHENTIQUE</div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#1a0a0a', margin:'0 0 10px' }}>Acte Non Reconnu</h1>
          <p style={{ fontSize:13, color:'#555', margin:'0 0 20px', lineHeight:1.6 }}>Le numéro <strong style={{ fontFamily:'monospace' }}>{id}</strong> ne correspond à aucun acte enregistré dans NaissanceChain.</p>
          <Link to="/" style={{ color:'#CE1126', fontWeight:700, textDecoration:'none', fontSize:13, display:'inline-flex', alignItems:'center', gap:6 }}>
            <ChevronLeft size={15} /> Retour au portail
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'acte_only') {
    return (
      <div style={{ minHeight:'100vh', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Arial,sans-serif' }}>
        <div style={{ maxWidth:480, width:'100%', background:'#fff', padding:'36px 28px', borderRadius:20, boxShadow:'0 20px 48px rgba(180,83,9,0.1)', textAlign:'center', border:'1px solid #fcd34d' }}>
          <Shield size={48} color="#B45309" style={{ marginBottom:16 }} />
          <div style={{ background:'#B45309', color:'#fff', padding:'5px 16px', borderRadius:20, fontSize:11, fontWeight:800, letterSpacing:1.5, display:'inline-block', marginBottom:14 }}>⚠ ACTE ENREGISTRÉ — SANS DOCUMENT ÉMIS</div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'#1a0a0a', margin:'0 0 10px' }}>Acte trouvé — Pas de document certifié</h1>
          <p style={{ fontSize:13, color:'#555', margin:'0 0 16px', lineHeight:1.6 }}>
            L'acte N° <strong>{id}</strong> existe dans NaissanceChain pour <strong>{acte?.prenom} {acte?.nom}</strong>, mais aucun document officiel certifié n'a encore été émis pour cet acte.
          </p>
          <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, padding:'12px', marginBottom:20, textAlign:'left' }}>
            <div style={{ fontSize:11, color:'#92400e', lineHeight:1.8 }}>
              <div>• Nom : <strong>{acte?.nom}</strong></div>
              <div>• Prénom : <strong>{acte?.prenom}</strong></div>
              <div>• Lieu de naissance : <strong>{acte?.lieu_naissance || '—'}</strong></div>
              <div>• Hash blockchain : <strong style={{ fontFamily:'monospace', fontSize:9 }}>{acte?.hash_blockchain?.slice(0,32) || '—'}...</strong></div>
            </div>
          </div>
          <Link to="/" style={{ color:'#B45309', fontWeight:700, textDecoration:'none', fontSize:13, display:'inline-flex', alignItems:'center', gap:6 }}>
            <ChevronLeft size={15} /> Retour au portail
          </Link>
        </div>
      </div>
    );
  }

  // AUTHENTIQUE
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0fdf4,#e8f5e8)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Arial,sans-serif' }}>
      <div style={{ maxWidth:520, width:'100%' }}>
        <div style={{ textAlign:'center', fontSize:18, fontWeight:900, color:'#0a2e1a', marginBottom:20 }}>
          Identi<span style={{ color:'#006D44' }}>Guinée</span>
          <span style={{ background:'#006D44', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:10, marginLeft:8 }}>VÉRIFICATION OFFICIELLE</span>
        </div>

        <div style={{ background:'#fff', borderRadius:20, padding:'32px 28px', boxShadow:'0 20px 48px rgba(0,109,68,0.12)', border:'2px solid #b8d8b8' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:72, height:72, background:'#e8f5e8', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'3px solid #006D44' }}>
              <CheckCircle size={40} color="#006D44" />
            </div>
            <div style={{ background:'#006D44', color:'#fff', padding:'6px 20px', borderRadius:20, fontSize:12, fontWeight:800, letterSpacing:1.5, display:'inline-block', marginBottom:12 }}>
              ✓ DOCUMENT AUTHENTIQUE
            </div>
            {/* Badge officiel */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20, padding:'4px 12px' }}>
                <div style={{ display:'flex', height:10, width:18, borderRadius:1, overflow:'hidden' }}>
                  <div style={{ flex:1, background:'#CE1126' }}/><div style={{ flex:1, background:'#FCD116' }}/><div style={{ flex:1, background:'#009A44' }}/>
                </div>
                <span style={{ fontSize:9, fontWeight:800, color:'#166534', letterSpacing:1 }}>REGISTRE NATIONAL — NAISSANCECHAIN</span>
              </div>
            </div>
            <h1 style={{ fontSize:20, fontWeight:800, color:'#0a2e1a', margin:'0 0 6px' }}>Vérification réussie</h1>
            <p style={{ fontSize:13, color:'#555', margin:0, lineHeight:1.6 }}>
              Acte officiellement enregistré dans le Registre National NaissanceChain.
            </p>
          </div>

          <div style={{ background:'#e8f5e8', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <Clock size={15} color="#006D44" />
            <span style={{ fontSize:12, color:'#006D44', fontWeight:700 }}>Vérifié en {elapsed.toFixed(1)}s ⚡</span>
          </div>

          {[
            ['Titulaire', `${acte?.prenom || ''} ${acte?.nom || ''}`],
            ['N° Acte NaissanceChain', id],
            ['Lieu de naissance', acte?.lieu_naissance || '—'],
            ['Document certifié', doc?.id ? `DOC-${String(doc.id).padStart(6, '0')}` : '—'],
            ['Date d\'émission', fmtDate(doc?.date_generation)],
          ].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fdf8', borderRadius:10, border:'1px solid #e0f0e0', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.4 }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#0a2e1a', textAlign:'right', maxWidth:'55%', wordBreak:'break-all' }}>{v}</span>
            </div>
          ))}

          {(doc?.hash_document || acte?.hash_blockchain) && (
            <div style={{ background:'#0a1f0a', borderRadius:12, padding:'14px 16px', marginTop:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <Hash size={11} color="#69f0ae" />
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.8 }}>Empreinte SHA-256</span>
              </div>
              <div style={{ fontSize:10, fontFamily:'monospace', color:'#69f0ae', wordBreak:'break-all', lineHeight:1.6 }}>
                {doc?.hash_document || acte?.hash_blockchain}
              </div>
            </div>
          )}

          <div style={{ marginTop:20, textAlign:'center' }}>
            <Link to="/" style={{ color:'#006D44', fontWeight:700, textDecoration:'none', fontSize:13, display:'inline-flex', alignItems:'center', gap:6 }}>
              <ChevronLeft size={15} /> Retour au portail
            </Link>
          </div>
        </div>

        <div style={{ textAlign:'center', fontSize:11, color:'#999', marginTop:12 }}>
          Vérification le {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })} à {new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default Verifier;
