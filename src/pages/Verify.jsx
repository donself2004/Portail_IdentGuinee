import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, FileText, ChevronLeft, Calendar, MapPin, User, Hash, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * PAGE DE VÉRIFICATION PUBLIQUE
 * Accessible via : /verify/:docId  ou  /verify?id=xxx&acte=GN-xxx
 * Scannée par les organisations tiers via QR code imprimé sur le document.
 * Retourne : AUTHENTIQUE ✓ ou NON AUTHENTIQUE ✗ en < 3 secondes.
 */
const Verify = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const qpId   = searchParams.get('id');
  const qpActe = searchParams.get('acte');

  const targetId   = docId || qpId;
  const targetActe = qpActe;

  const [status, setStatus]     = useState('loading'); // 'loading' | 'authentic' | 'invalid'
  const [doc, setDoc]           = useState(null);
  const [citoyen, setCitoyen]   = useState(null);
  const [acte, setActe]         = useState(null);
  const [elapsed, setElapsed]   = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 100) / 10), 100);

    const verify = async () => {
      try {
        // ── Étape 1 : chercher le document certifié ──
        if (targetId) {
          // On cherche d'abord par hash (plus sûr)
          let { data: d, error: errHash } = await supabase
            .from('documents_certifies')
            .select('*')
            .eq('hash_document', targetId)
            .maybeSingle();

          // Fallback par ID numérique si non trouvé par hash (et si targetId ressemble à un nombre)
          if (!d && !isNaN(targetId)) {
            const { data: dById } = await supabase
              .from('documents_certifies')
              .select('*')
              .eq('id', parseInt(targetId))
              .maybeSingle();
            d = dById;
          }

          if (d) {
            setDoc(d);

            // ── Étape 2 : citoyen ──
            if (d.citoyen_id) {
              const { data: c } = await supabase.from('citoyens').select('*').eq('id', d.citoyen_id).maybeSingle();
              if (c) setCitoyen(c);
            }

            // ── Étape 3 : acte NaissanceChain ──
            const acteId = d.id_acte || d.id_acte_lie;
            if (acteId) {
              const { data: a } = await supabase.from('naissancechain').select('*').eq('id_acte', acteId).maybeSingle();
              if (a) setActe(a);
            }

            const statutOk = ['GENERE', 'GÉNÉRÉ', 'VALIDE', 'VALIDATED'].includes((d.statut || '').toUpperCase());
            setStatus(statutOk ? 'authentic' : 'invalid');
            clearInterval(timer);
            return;
          }
        }

        // ── Fallback : chercher par numéro d'acte ──
        if (targetActe) {
          const { data: a } = await supabase.from('naissancechain').select('*').eq('id_acte', targetActe).maybeSingle();
          if (a) {
            setActe(a);
            setStatus('authentic');
            clearInterval(timer);
            return;
          }
        }

        setStatus('invalid');
        clearInterval(timer);
      } catch {
        setStatus('invalid');
        clearInterval(timer);
      }
    };

    verify();
    return () => clearInterval(timer);
  }, [targetId, targetActe]);

  const fmtDate = (v) => v
    ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  // ── État chargement ──
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Shield size={32} color="var(--primary)" className="pulse" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px' }}>Vérification en cours...</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>Consultation du Registre National NaissanceChain</p>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', border: '1px solid var(--border)', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <Clock size={14} color="var(--text-faint)" />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{elapsed.toFixed(1)}s</span>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>/ objectif &lt; 3s</span>
          </div>
          <div style={{ marginTop: 20, height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 2, animation: 'scan-progress 2.5s ease-in-out forwards' }} />
          </div>
        </div>
        <style>{`@keyframes scan-progress { from { width: 0%; } to { width: 95%; } }`}</style>
      </div>
    );
  }

  // ── DOCUMENT INVALIDE / NON TROUVÉ ──
  if (status === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#fff', padding: '40px 36px', borderRadius: 24, boxShadow: '0 20px 48px rgba(206,17,38,0.12)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'var(--danger-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <XCircle size={40} color="var(--danger)" />
          </div>
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, display: 'inline-block', marginBottom: 16 }}>
            ✗ NON AUTHENTIQUE
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 12px' }}>Document Non Reconnu</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 14, margin: '0 0 8px' }}>
            Ce document <strong>ne figure pas</strong> dans le registre national sécurisé NaissanceChain de la République de Guinée.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 28px' }}>
            Il pourrait s'agir d'un document <strong style={{ color: 'var(--danger)' }}>falsifié</strong>, d'une erreur de lecture QR ou d'un document non encore enregistré.
          </p>
          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>ID scanné</p>
            <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-heading)', margin: 0, wordBreak: 'break-all' }}>{targetId || targetActe || 'Identifiant non lisible'}</p>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 20px' }}>En cas de doute, contactez le Ministère de la Justice : <strong>+224 655 00 00 00</strong></p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
            <ChevronLeft size={16} /> Retour au portail
          </Link>
        </div>
      </div>
    );
  }

  // ── DOCUMENT AUTHENTIQUE ──
  const nom    = acte?.prenom && acte?.nom ? `${acte.prenom} ${acte.nom}` : citoyen?.prenom && citoyen?.nom ? `${citoyen.prenom} ${citoyen.nom}` : 'Non communiqué';
  const fields = [
    { icon: <User size={15} />,     label: 'Nom complet',         val: nom },
    { icon: <Calendar size={15} />, label: 'Date de naissance',   val: fmtDate(acte?.date_naissance || citoyen?.date_naissance) },
    { icon: <MapPin size={15} />,   label: 'Lieu de naissance',   val: acte?.lieu_naissance || '—' },
    { icon: <FileText size={15} />, label: 'Numéro d\'acte',      val: doc?.id_acte || acte?.id_acte || targetActe || '—' },
    { icon: <Hash size={15} />,     label: 'Référence document',  val: doc?.id ? `DOC-${String(doc.id).padStart(5, '0')}` : '—' },
    { icon: <Clock size={15} />,    label: 'Date d\'émission',    val: fmtDate(doc?.date_generation || doc?.created_at) },
  ];

  const hashBC = acte?.hash_blockchain || doc?.hash_document || null;

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font)' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Badge AUTHENTIQUE */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', boxShadow: '0 20px 48px rgba(0,109,68,0.12)', marginBottom: 20 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px solid var(--primary-border)' }}>
              <CheckCircle size={40} color="var(--primary)" fill="var(--primary)" style={{ color: '#fff' }} />
            </div>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '6px 20px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, display: 'inline-block', marginBottom: 12 }}>
              ✓ DOCUMENT AUTHENTIQUE
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px' }}>Vérification réussie</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Ce document est <strong style={{ color: 'var(--primary)' }}>officiellement enregistré</strong> dans le Registre National NaissanceChain de la République de Guinée.
            </p>
          </div>

          {/* Temps de réponse */}
          <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <Clock size={16} color="var(--primary)" />
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>Vérification effectuée en {elapsed.toFixed(1)} seconde{elapsed >= 2 ? 's' : ''}</span>
          </div>

          {/* Infos du document */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-faint)' }}>
                  {f.icon}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{f.val}</span>
              </div>
            ))}
          </div>

          {/* Hash blockchain */}
          {hashBC && (
            <div style={{ background: '#0a2e1a', borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px' }}>Empreinte Blockchain (SHA-256)</p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#69f0ae', margin: 0, wordBreak: 'break-all', lineHeight: 1.6 }}>{hashBC}</p>
            </div>
          )}

          {/* Signature officielle */}
          <div style={{ border: '2px solid var(--primary-border)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', margin: '0 0 2px' }}>🇬🇳 RÉPUBLIQUE DE GUINÉE</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Ministère de la Justice — DGAE</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', margin: '0 0 2px' }}>Système</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>NaissanceChain v2</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#999', margin: '0 0 12px' }}>
            Vérification effectuée le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
            <ChevronLeft size={15} /> Retour au portail IdentiGuinée
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Verify;
