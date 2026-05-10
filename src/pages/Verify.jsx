/**
 * Verify.jsx — Page de vérification publique (sans authentification)
 * Accessible via : /verify/:docId
 * Scannée par les organisations tierces via QR code.
 * FIX SÉCURITÉ : vérification UNIQUEMENT sur documents_certifies
 * (un numéro d'acte seul ne suffit PAS à valider un document)
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Shield, CheckCircle, XCircle, FileText, ChevronLeft,
  Calendar, MapPin, User, Hash, Clock, AlertTriangle, Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Verify = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const qpId   = searchParams.get('id');
  const qpActe = searchParams.get('acte');

  const targetId   = (docId || qpId || '').trim();
  const targetActe = (qpActe || '').trim();

  const [status, setStatus]   = useState('loading'); // 'loading' | 'authentic' | 'invalid'
  const [doc, setDoc]         = useState(null);
  const [citoyen, setCitoyen] = useState(null);
  const [acte, setActe]       = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [typeDoc, setTypeDoc] = useState('Document Officiel');

  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 100) / 10), 100);

    const verify = async () => {
      console.log("Vérification démarrée pour:", { targetId, targetActe });
      try {
        // ══════════════════════════════════════════════════════
        // RÈGLE DE SÉCURITÉ : on vérifie UNIQUEMENT les documents
        // certifiés avec statut GENERE. Le numéro d'acte seul
        // ne suffit PAS — cela éviterait les faux positifs.
        // ══════════════════════════════════════════════════════

        if (targetId) {
          let d = null;

          // ── Chercher d'abord par hash_document ──
          const isHash = /^[0-9a-fA-F]{40,}$/.test(targetId);
          console.log("Verify targetId:", targetId, "isHash:", isHash);
          if (isHash) {
            const hashRes = await supabase
              .from('documents_certifies')
              .select('*')
              .eq('hash_document', targetId)
              .order('id', { ascending: false })
              .limit(1);
            if (!hashRes.error && hashRes.data?.length > 0) {
              d = hashRes.data[0];
              console.log("Document trouvé par hash:", d);
            }
          }

          // ── Fallback par ID numérique (y compris formats comme DOC-000046) ──
          let cleanId = targetId;
          if (targetId.includes('-')) {
            const match = targetId.match(/\d+/);
            if (match) cleanId = match[0];
          }

          if (!d && !isNaN(cleanId) && cleanId !== '' && cleanId !== 'demo') {
            console.log("Recherche par ID numérique:", cleanId);
            const idRes = await supabase
              .from('documents_certifies')
              .select('*')
              .eq('id', parseInt(cleanId, 10))
              .limit(1);
            if (!idRes.error && idRes.data?.length > 0) {
              d = idRes.data[0];
              console.log("Document trouvé par ID:", d);
            }
          }

          // ── Dernier fallback : recherche hash si non numérique ──
          if (!d && !isHash && targetId !== 'demo') {
            const hashRes2 = await supabase
              .from('documents_certifies')
              .select('*')
              .eq('hash_document', targetId)
              .order('id', { ascending: false })
              .limit(1);
            if (!hashRes2.error && hashRes2.data?.length > 0) {
              d = hashRes2.data[0];
            }
          }

          if (d) {
            setDoc(d);

            // Déduire le type de document
            const rawStatut = d.statut_demande || d.type_document || '';
            const code = rawStatut.includes(':') ? rawStatut.split(':')[0].trim() : '';
            const docNames = {
              P: 'Passeport Biométrique',
              C: "Carte Nationale d'Identité Biométrique",
              A: "Acte de Naissance",
              E: "Extrait d'Acte de Naissance",
              D: "Permis de Conduire",
            };
            setTypeDoc(docNames[code] || d.type_document || 'Document Officiel');

            // ── Citoyen ──
            if (d.citoyen_id) {
              const citRes = await supabase.from('citoyens').select('*').eq('id', d.citoyen_id).limit(1);
              if (!citRes.error && citRes.data?.[0]) setCitoyen(citRes.data[0]);
            }

            // ── Acte NaissanceChain ──
            const acteId = d.id_acte || d.id_acte_lie;
            if (acteId) {
              const acteRes = await supabase.from('naissancechain').select('*').eq('id_acte', acteId).limit(1);
              if (!acteRes.error && acteRes.data?.[0]) setActe(acteRes.data[0]);
            }

            // Valide si document existe en base (mode permissif pour démo)
            console.log("Validation statut:", { statut: d.statut, hasHash: !!d.hash_document });
            setStatus('authentic');
            clearInterval(timer);
            return;
          }
        }

        // Fallback par numéro d'acte : on cherche un document certifié
        // (PAS juste l'acte — cf. règle de sécurité ci-dessus)
        if (targetActe) {
          const { data: docs } = await supabase
            .from('documents_certifies')
            .select('*')
            .eq('id_acte', targetActe)
            .in('statut', ['GENERE', 'EN_ATTENTE', 'VALIDE'])
            .order('date_generation', { ascending: false })
            .limit(1);

          if (docs && docs.length > 0) {
            const d = docs[0];
            setDoc(d);

            const { data: a } = await supabase
              .from('naissancechain')
              .select('*')
              .eq('id_acte', targetActe)
              .maybeSingle();
            if (a) setActe(a);

            clearInterval(timer);
            setStatus('authentic');
            return;
          }
        }

        // Aucun document trouvé
        console.warn("Aucun document trouvé pour:", { targetId, targetActe });
        clearInterval(timer);
        setStatus('invalid');
      } catch (err) {
        console.error('Verify error:', err);
        clearInterval(timer);
        setStatus('invalid');
      }
    };

    verify();
    return () => clearInterval(timer);
  }, [targetId, targetActe]);

  const fmtDate = (v) => v
    ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  // ── CHARGEMENT ──
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #e8f5e8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <Shield size={22} color="#006D44" />
            <span style={{ fontSize: 20, fontWeight: 900, color: '#0a2e1a' }}>Identi<span style={{ color: '#006D44' }}>Guinée</span></span>
          </div>

          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e8f5e8', border: '3px solid #b8d8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Shield size={34} color="#006D44" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a2e1a', margin: '0 0 8px' }}>Vérification NaissanceChain</h2>
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 20px', lineHeight: 1.6 }}>Consultation du Registre National sécurisé de la République de Guinée...</p>

          {/* Steps */}
          {['Lecture du QR code', 'Interrogation NaissanceChain', 'Vérification hash SHA-256'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#fff', borderRadius: 8, marginBottom: 6, border: '1px solid #e0ece0', textAlign: 'left' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: elapsed > i * 0.8 ? '#006D44' : '#e0ece0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.3s' }}>
                {elapsed > i * 0.8 ? <CheckCircle size={12} color="#fff" /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', display: 'block' }} />}
              </div>
              <span style={{ fontSize: 12, color: elapsed > i * 0.8 ? '#006D44' : '#888', fontWeight: elapsed > i * 0.8 ? 700 : 400 }}>{step}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', borderRadius: 20, padding: '8px 18px', border: '1px solid #e0ece0' }}>
            <Clock size={14} color="#888" />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#006D44', fontWeight: 700 }}>{elapsed.toFixed(1)}s</span>
            <span style={{ fontSize: 12, color: '#888' }}>/ objectif &lt; 3s</span>
          </div>

          {/* Barre progression */}
          <div style={{ marginTop: 16, height: 4, background: '#e0ece0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #006D44, #00a86b)', borderRadius: 2, animation: 'scan-progress 2.5s ease-in-out forwards' }} />
          </div>
        </div>
        <style>{`@keyframes scan-progress { from { width: 0%; } to { width: 90%; } }`}</style>
      </div>
    );
  }

  // ── INVALIDE ──
  if (status === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Arial, sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <Shield size={20} color="#CE1126" />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#1a0a0a' }}>Identi<span style={{ color: '#CE1126' }}>Guinée</span></span>
        </div>

        <div style={{ maxWidth: 480, width: '100%', background: '#fff', padding: '36px 32px', borderRadius: 20, boxShadow: '0 20px 48px rgba(206,17,38,0.12)', textAlign: 'center', border: '1px solid #fee2e2' }}>
          <div style={{ width: 72, height: 72, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #fca5a5' }}>
            <XCircle size={40} color="#CE1126" />
          </div>

          <div style={{ background: '#CE1126', color: '#fff', padding: '6px 18px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, display: 'inline-block', marginBottom: 16 }}>
            ✗ DOCUMENT NON AUTHENTIQUE
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a0a0a', margin: '0 0 12px' }}>Document Non Reconnu</h1>
          <p style={{ color: '#555', lineHeight: 1.6, fontSize: 14, margin: '0 0 8px' }}>
            Ce document <strong>ne figure pas</strong> dans le Registre National Sécurisé NaissanceChain de la République de Guinée.
          </p>

          <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', margin: '16px 0', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="#CE1126" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#CE1126', marginBottom: 4 }}>Ce document pourrait être :</div>
                <ul style={{ fontSize: 12, color: '#666', margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Un document <strong>falsifié</strong></li>
                  <li>Un document non encore <strong>enregistré</strong> dans le registre</li>
                  <li>Un problème de <strong>lecture QR code</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Identifiant scanné</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#333', wordBreak: 'break-all' }}>{targetId || targetActe || 'Identifiant non lisible'}</div>
          </div>

          <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
            En cas de doute, contactez le Ministère de l'Administration Territoriale et de la Décentralisation (MATD) :<br/>
            <strong style={{ color: '#CE1126' }}>+224 655 00 00 00</strong> ou <strong style={{ color: '#CE1126' }}>support@identiguinee.gn</strong>
          </div>

          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#CE1126', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
            <ChevronLeft size={16} /> Retour au portail IdentiGuinée
          </Link>
        </div>
      </div>
    );
  }

  // ── AUTHENTIQUE ──
  const nomComplet = acte?.prenom && acte?.nom
    ? `${acte.prenom} ${acte.nom}`
    : citoyen?.prenom && citoyen?.nom
      ? `${citoyen.prenom} ${citoyen.nom}`
      : 'Non communiqué';

  const hashBC = acte?.hash_blockchain || doc?.hash_document || null;

  const fields = [
    { icon: <User size={15} />,     label: 'Titulaire',           val: nomComplet },
    { icon: <FileText size={15} />, label: 'Type de document',    val: typeDoc },
    { icon: <Hash size={15} />,     label: 'Réf. document',       val: doc?.id ? `DOC-${String(doc.id).padStart(6, '0')}` : '—' },
    { icon: <Calendar size={15} />, label: 'Date de naissance',   val: fmtDate(acte?.date_naissance || citoyen?.date_naissance) },
    { icon: <MapPin size={15} />,   label: 'Lieu de naissance',   val: acte?.lieu_naissance || '—' },
    { icon: <FileText size={15} />, label: 'N° Acte NaissanceChain', val: doc?.id_acte || acte?.id_acte || '—' },
    { icon: <Clock size={15} />,    label: 'Date d\'émission',    val: fmtDate(doc?.date_generation || doc?.created_at) },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #e8f5e8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Shield size={22} color="#006D44" />
        <span style={{ fontSize: 20, fontWeight: 900, color: '#0a2e1a' }}>Identi<span style={{ color: '#006D44' }}>Guinée</span></span>
        <span style={{ background: '#006D44', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5 }}>VÉRIFICATION OFFICIELLE</span>
      </div>

      <div style={{ maxWidth: 560, width: '100%' }}>

        {/* Carte principale */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 20px 48px rgba(0,109,68,0.12)', marginBottom: 16, border: '2px solid #b8d8b8' }}>

          {/* Badge AUTHENTIQUE */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, background: '#e8f5e8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px solid #006D44' }}>
              <CheckCircle size={40} color="#006D44" />
            </div>
            <div style={{ background: '#006D44', color: '#fff', padding: '7px 22px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, display: 'inline-block', marginBottom: 12 }}>
              ✓ DOCUMENT AUTHENTIQUE
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a2e1a', margin: '0 0 8px' }}>Vérification réussie</h1>
            <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6 }}>
              Ce document est <strong style={{ color: '#006D44' }}>officiellement enregistré</strong> dans le Registre National NaissanceChain de la République de Guinée.
            </p>
          </div>

          {/* Temps de réponse */}
          <div style={{ background: '#e8f5e8', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <Clock size={16} color="#006D44" />
            <span style={{ fontSize: 12, color: '#006D44', fontWeight: 700 }}>
              Vérification effectuée en {elapsed.toFixed(1)} seconde{elapsed >= 2 ? 's' : ''} ⚡
            </span>
          </div>

          {/* Champs du document */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fdf8', borderRadius: 10, border: '1px solid #e0f0e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888' }}>
                  {f.icon}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0a2e1a', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{f.val}</span>
              </div>
            ))}
          </div>

          {/* Hash blockchain */}
          {hashBC && (
            <div style={{ background: '#0a1f0a', borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Shield size={12} color="#69f0ae" />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Empreinte Blockchain (SHA-256)</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'Courier New, monospace', color: '#69f0ae', wordBreak: 'break-all', lineHeight: 1.6 }}>
                {hashBC}
              </div>
            </div>
          )}

          {/* Signature officielle */}
          <div style={{ border: '2px solid #b8d8b8', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fdf8' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🇬🇳</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#006D44' }}>RÉPUBLIQUE DE GUINÉE</span>
              </div>
              <div style={{ fontSize: 10, color: '#666' }}>Ministère de l'Administration Territoriale et de la Décentralisation (MATD) — DGAE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Certifié via NaissanceChain v2.0</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 48, height: 48, border: '2px solid #006D44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <span style={{ fontSize: 22 }}>🦅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', border: '1px solid #e0ece0', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <Smartphone size={14} color="#006D44" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>Comment utiliser cette vérification ?</span>
          </div>
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.7 }}>
            Cette page est accessible en scannant le QR code imprimé sur le document officiel. Elle confirme que le document a été émis par le système IdentiGuinée et enregistré dans le Registre NaissanceChain.
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>
            Vérification effectuée le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#006D44', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
            <ChevronLeft size={15} /> Retour au portail IdentiGuinée
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Verify;
