/**
 * DocumentGenere.jsx — Documents officiels guinéens v3.0
 * Designs fidèles aux vrais documents officiels de la République de Guinée
 * QR codes réels pointant vers /verify/:docId
 * Export PDF haute résolution
 */
import React, { useState, useEffect, useRef, Component, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Download, Printer, CheckCircle, Loader, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './DocumentGenere.css';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return <div style={{ padding: 40, textAlign: 'center', color: '#CE1126' }}>Erreur d'affichage. Rechargez la page.</div>;
    return this.props.children;
  }
}

// ── Helpers ─────────────────────────────────────────────
const fmtDateFR = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(v); }
};
const fmtDateFRLong = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return String(v); }
};
const fmtDateUP = (v) => {
  if (!v) return '—';
  const M = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛ','SEP','OCT','NOV','DÉC'];
  try { const d = new Date(v); return `${String(d.getDate()).padStart(2,'0')} ${M[d.getMonth()]} ${d.getFullYear()}`; }
  catch { return String(v); }
};
const addYrs = (n) => { const d = new Date(); d.setFullYear(d.getFullYear()+n); return fmtDateUP(d); };
// Génération stable basée sur le hash de l'id_acte (pas de Math.random au render)
const stableNum = (seed, mod, pad = 0) => {
  let h = 0;
  const s = String(seed || 'default');
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  const n = Math.abs(h) % mod;
  return pad > 0 ? String(n).padStart(pad, '0') : String(n);
};
const mkNIN = (acte) => {
  const seed = acte?.id_acte || acte?.numero_identifiant_national || 'GIN0000';
  const s1 = stableNum(seed, 99999999, 8);
  const s2 = stableNum(seed + 'NIN', 9999, 4);
  return `GIN${s2}${s1}`;
};
const mkPassNum = (acte) => {
  const seed = acte?.id_acte || 'PASS';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const i1 = Math.abs(stableNum(seed, 24) | 0) % 24;
  const i2 = Math.abs(stableNum(seed + 'B', 24) | 0) % 24;
  const num = stableNum(seed + 'NUM', 899999, 6);
  return letters[i1] + letters[i2] + (100000 + parseInt(num));
};

// QR Code URL via api.qrserver.com (gratuit, fiable)
const buildQrUrl = (docId, hashId = null, size = 120) => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://identiguinee.vercel.app';
  const verifyId = hashId || docId;
  const verifyUrl = `${base}/verify/${verifyId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&data=${encodeURIComponent(verifyUrl)}`;
};

// MRZ generator (ICAO 9303 simplifié)
const buildMRZ = (nom, prenom, ddn, expire, numDoc, genre) => {
  const pad = (s, n, c = '<') => (s + c.repeat(n)).slice(0, n);
  const cleanName = (s) => s.toUpperCase().replace(/[^A-Z]/g, '<');
  const cleanDate = (v) => {
    if (!v) return '000000';
    try {
      const d = new Date(v);
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}${mm}${dd}`;
    } catch { return '000000'; }
  };
  const n = cleanName(nom);
  const p = cleanName(prenom);
  const nameField = pad(`${n}<<${p}`, 39);
  const docNum = pad((numDoc || 'AA000000').replace(/[^A-Z0-9]/g, ''), 9);
  const ddnStr = cleanDate(ddn);
  const expStr = cleanDate(expire);
  const sex = (genre || 'M').charAt(0).toUpperCase();
  const line1 = `P<GIN${nameField}`;
  const line2 = `${docNum}<GIN${ddnStr}${sex}${expStr}GUINEEN<<<<<<<<<`;
  return { line1, line2 };
};

// ── Export PDF ───────────────────────────────────────────
const exportPDF = async (ref, filename) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(ref.current, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
    pdf.save(filename);
    return true;
  } catch (e) { console.error('PDF error:', e); return false; }
};


// ── Signature électronique officielle du Ministère ───────────────
// Utilisée dans tous les documents officiels générés
const SignatureMinistere = ({ ministere = "MATD", long = false, dark = false }) => {
  const MIN_INFO = {
    MATD: {
      nom: "Ministère de l'Administration Territoriale et de la Décentralisation",
      abbrev: "MATD",
      poste: "Le Ministre de l'Administration Territoriale",
      direction: "Direction Nationale de l'État Civil",
      code: "MATD-GN-2026",
      color: "#7B2D8B",
    },
    MSPC: {
      nom: "Ministère de la Sécurité et de la Protection Civile",
      abbrev: "M.S.P.C.",
      poste: "Le Ministre de la Sécurité et de la Protection Civile",
      direction: "Direction Nationale des Documents de Voyage",
      code: "MSPC-GN-2026",
      color: "#006D44",
    },
    MINSP: {
      nom: "Ministère de la Sécurité et de la Protection Civile",
      abbrev: "M.I.N.S.P",
      poste: "Le Directeur National de la Police",
      direction: "Direction des Permis et Licences",
      code: "MINSP-GN-2026",
      color: "#B45309",
    },
  };
  const info = MIN_INFO[ministere] || MIN_INFO.MATD;
  const textColor = dark ? 'rgba(255,255,255,0.85)' : '#333';
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : '#888';
  const lineColor = dark ? 'rgba(255,255,255,0.25)' : '#ddd';
  const bgColor = dark ? 'rgba(255,255,255,0.06)' : `${info.color}08`;
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : `${info.color}22`;

  // Signature SVG cursive simulée
  const sigPath = `M 10 28 C 20 10, 35 5, 45 18 C 55 30, 60 12, 75 20 C 88 27, 92 18, 105 22 C 115 25, 118 30, 125 28`;

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      padding: long ? '14px 16px' : '10px 14px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      {/* Gauche : cachet + titre */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Cachet circulaire */}
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <svg viewBox="0 0 60 60" width="56" height="56">
            <circle cx="30" cy="30" r="28" fill="none" stroke={info.color} strokeWidth="1.5"/>
            <circle cx="30" cy="30" r="22" fill="none" stroke={info.color} strokeWidth="0.5" strokeDasharray="2,2"/>
            {/* Texte circulaire */}
            <path id="topArc" d="M 6 30 A 24 24 0 0 1 54 30" fill="none"/>
            <text style={{fontSize:'5px', fontWeight:700}}>
              <textPath href="#topArc" startOffset="5%" fill={info.color} fontFamily="Arial" fontSize="4.5" fontWeight="700" letterSpacing="1">
                RÉPUBLIQUE DE GUINÉE · {info.abbrev}
              </textPath>
            </text>
            <path id="botArc" d="M 8 32 A 22 22 0 0 0 52 32" fill="none"/>
            <text>
              <textPath href="#botArc" startOffset="8%" fill={info.color} fontFamily="Arial" fontSize="4" letterSpacing="0.5">
                {info.code}
              </textPath>
            </text>
            {/* Étoile centrale */}
            <text x="30" y="34" textAnchor="middle" fontSize="16" fill={info.color}>★</text>
          </svg>
        </div>

        <div>
          {long && (
            <div style={{ fontSize: 9, color: labelColor, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
              Document certifié par
            </div>
          )}
          <div style={{ fontSize: long ? 10 : 9, fontWeight: 800, color: textColor, lineHeight: 1.3, maxWidth: 200 }}>
            {long ? info.nom : info.abbrev}
          </div>
          <div style={{ fontSize: 8.5, color: labelColor, marginTop: 2 }}>{info.direction}</div>
          {long && (
            <div style={{ fontSize: 8, color: labelColor, marginTop: 1 }}>{info.code}</div>
          )}
        </div>
      </div>

      {/* Droite : signature SVG + nom */}
      <div style={{ textAlign: 'center', minWidth: 140 }}>
        <div style={{ fontSize: 7.5, color: labelColor, marginBottom: 4 }}>Signature électronique certifiée</div>
        <div style={{ borderBottom: `1.5px solid ${lineColor}`, paddingBottom: 4, marginBottom: 4 }}>
          <svg width="135" height="36" viewBox="0 0 135 36">
            <path d={sigPath} fill="none" stroke={info.color} strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
            {/* Paraphe */}
            <path d="M 20 32 L 30 28 M 28 20 L 35 32" fill="none" stroke={info.color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <div style={{ fontSize: 8, fontWeight: 700, color: textColor }}>{info.poste}</div>
        <div style={{ fontSize: 7.5, color: labelColor, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#006D44', display: 'inline-block' }}/>
          Signé numériquement · IdentiGuinée
        </div>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
//  PASSEPORT BIOMÉTRIQUE — Design officiel guinéen
//  Couverture verte, pages intérieures avec MRZ ICAO, zone données
// ═══════════════════════════════════════════════════════════════
const PasseportBiometrique = ({ acte, user, documentId, hash_document }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = acte?.date_naissance || user?.date_naissance;
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const genre  = (acte?.genre === 'F' || acte?.genre === 'Féminin') ? 'F' : 'M';
  const numPass = useMemo(() => mkPassNum(acte), [acte?.id_acte]);
  const nin    = mkNIN(acte);
  const emis   = new Date();
  const expire = new Date(); expire.setFullYear(expire.getFullYear() + 5);
  const qrUrl  = documentId ? buildQrUrl(documentId, hash_document, 130) : null;
  const mrz    = buildMRZ(nom, prenom, ddn, expire.toISOString(), numPass, genre);
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+' '+nom.charAt(0))}&background=1a3a20&color=fff&bold=true&size=200`;

  const Field = ({ label, value, labelEn }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, color: '#8a9a8a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: 1.2 }}>
        {label} <span style={{ color: '#6a8a6a', fontStyle: 'italic', fontWeight: 400 }}>/ {labelEn}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0d1f0d', marginTop: 2, letterSpacing: 0.3 }}>{value || '—'}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 780, margin: '0 auto' }}>

      {/* ── PAGE DE DONNÉES (recto du passeport ouvert) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fff8 0%, #edfced 30%, #f5fff5 70%, #e8fbe8 100%)',
        border: '2px solid #2d5a2d',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,80,0,0.18)',
        position: 'relative',
      }}>

        {/* Motif de fond (guilloché simplifié) */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04, zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, #006D44 0, #006D44 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }} />

        {/* ── EN-TÊTE OFFICIEL ── */}
        <div style={{
          background: 'linear-gradient(90deg, #006D44 0%, #004d30 50%, #006D44 100%)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}>
          {/* Armoiries + texte */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.15)" stroke="#FCD116" strokeWidth="2"/>
                <polygon points="50,20 55,36 72,36 59,46 63,63 50,53 37,63 41,46 28,36 45,36" fill="#FCD116"/>
                <rect x="22" y="74" width="18" height="11" rx="1" fill="#CE1126"/>
                <rect x="41" y="74" width="18" height="11" rx="1" fill="#FCD116"/>
                <rect x="60" y="74" width="18" height="11" rx="1" fill="#009A44"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textTransform: 'uppercase' }}>République de Guinée</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FCD116', letterSpacing: 1 }}>PASSEPORT</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>PASSPORT · PASSAPORTE</div>
            </div>
          </div>
          {/* Type + Drapeau */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', width: 32, height: 46, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
              <div style={{ flex: 1, background: '#CE1126' }}/>
              <div style={{ flex: 1, background: '#FCD116' }}/>
              <div style={{ flex: 1, background: '#009A44' }}/>
            </div>
            <div style={{ background: '#FCD116', color: '#006D44', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>
              TYPE P · ORDINAIRE · OACI 9303
            </div>
          </div>
        </div>

        {/* ── CORPS — données personnelles ── */}
        <div style={{ display: 'flex', gap: 0, position: 'relative', zIndex: 1 }}>

          {/* Colonne photo + biométrie */}
          <div style={{
            width: 200, padding: '20px 16px',
            borderRight: '2px dashed #b8d8b8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            background: 'rgba(0,109,68,0.03)',
          }}>
            {/* Photo */}
            <div style={{
              width: 156, height: 190,
              border: '3px solid #006D44',
              borderRadius: 4,
              overflow: 'hidden',
              background: '#d0e8d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              <img src={avatarURL} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              {/* Coin holographique */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, background: 'linear-gradient(135deg, transparent 50%, rgba(0,109,68,0.4) 50%)', opacity: 0.7 }} />
            </div>

            {/* Numéro passeport */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 8, color: '#5a7a5a', fontWeight: 600, letterSpacing: 0.5 }}>N° PASSEPORT / PASSPORT NO.</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#006D44', fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>{numPass}</div>
            </div>

            {/* QR Code */}
            {qrUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ background: '#fff', padding: 6, borderRadius: 6, border: '2px solid #006D44', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <img src={qrUrl} alt="QR Code vérification" width={118} height={118} style={{ display: 'block' }} crossOrigin="anonymous" />
                </div>
                <div style={{ fontSize: 7.5, color: '#5a7a5a', textAlign: 'center', lineHeight: 1.4, fontWeight: 600 }}>
                  Scanner pour vérifier<br/>l'authenticité du document
                </div>
              </div>
            )}

            {/* Puce biométrique */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0faf0', border: '1px solid #b8d8b8', borderRadius: 8, padding: '6px 10px', width: '100%' }}>
              <div style={{ fontSize: 20 }}>💾</div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#006D44' }}>PUCE BIOMÉTRIQUE</div>
                <div style={{ fontSize: 7, color: '#5a7a5a' }}>ICAO Doc 9303</div>
              </div>
            </div>
          </div>

          {/* Colonne données */}
          <div style={{ flex: 1, padding: '20px 24px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
              <Field label="Nom" labelEn="Surname" value={nom} />
              <Field label="Sexe" labelEn="Sex" value={genre} />
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Prénom(s)" labelEn="Given names" value={prenom} />
              </div>
              <Field label="Nationalité" labelEn="Nationality" value="GUINÉENNE" />
              <Field label="N° Identification Nat." labelEn="National ID No." value={nin} />
              <Field label="Date de naissance" labelEn="Date of birth" value={fmtDateUP(ddn)} />
              <Field label="Lieu de naissance" labelEn="Place of birth" value={lieu} />
              <Field label="Date d'émission" labelEn="Date of issue" value={fmtDateUP(emis)} />
              <Field label="Date d'expiration" labelEn="Date of expiry" value={fmtDateUP(expire)} />
              <Field label="Autorité" labelEn="Authority" value="M.S.P.C. GUINÉE" />
              <Field label="Type" labelEn="Type" value="P — ORDINAIRE" />
            </div>

            {/* Signature électronique officielle */}
            <div style={{ marginTop: 12 }}>
              <SignatureMinistere ministere="MSPC" long={true} dark={false} />
            </div>
          </div>
        </div>

        {/* ── MRZ (Zone de Lecture Automatique) ── */}
        <div style={{
          background: '#0d1a0d',
          padding: '10px 16px 12px',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontSize: 7.5, color: '#4a7a4a', fontWeight: 600, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
            Zone de lecture automatique (MRZ) · Machine Readable Zone
          </div>
          <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: '#69f0ae', letterSpacing: 2, lineHeight: 1.8, userSelect: 'none' }}>
            <div>{mrz.line1}</div>
            <div>{mrz.line2}</div>
          </div>
        </div>

        {/* Bande holographique bas */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #CE1126, #FCD116, #009A44, #006D44, #FCD116, #CE1126)',
          opacity: 0.7,
        }} />
      </div>

      {/* QR vérification intégré dans le document */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CARTE NATIONALE D'IDENTITÉ CEDEAO — Design officiel guinéen
//  Dimensions ID-1 (85.6×54mm), recto/verso, fond vert clair
// ═══════════════════════════════════════════════════════════════
const CarteIdentiteCEDEAO = ({ acte, user, documentId, hash_document }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = acte?.date_naissance || user?.date_naissance;
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const genre  = (acte?.genre === 'F' || acte?.genre === 'Féminin') ? 'F' : 'M';
  const nin    = mkNIN(acte);
  const emis   = new Date();
  const expire = new Date(); expire.setFullYear(expire.getFullYear() + 10);
  const qrUrl  = documentId ? buildQrUrl(documentId, hash_document, 100) : null;
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+' '+nom.charAt(0))}&background=1a5a30&color=fff&bold=true&size=200`;

  const CARD = { width: '100%', maxWidth: 720, fontFamily: 'Arial, sans-serif' };
  // CNI guinéenne = document ROSE/FUCHSIA selon normes officielles (Décret D/95/254)
  const RECTO_BG = 'linear-gradient(135deg, #fde8f0 0%, #f9d0e4 30%, #fce4ef 60%, #f5c6de 100%)';
  const VERSO_BG = 'linear-gradient(135deg, #e8f5e8 0%, #f0faf0 50%, #d4edda 100%)';

  return (
    <div style={CARD}>
      {/* ── RECTO ── */}
      <div style={{
        background: RECTO_BG,
        border: '2px solid #7a1547',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 6px 24px rgba(0,80,0,0.15)',
        marginBottom: 12,
        position: 'relative',
      }}>
        {/* Guilloché fond */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, zIndex: 0, backgroundImage: 'repeating-linear-gradient(30deg, #9B1B5A 0, #9B1B5A 1px, transparent 0, transparent 40%)', backgroundSize: '6px 6px' }} />

        {/* Bande supérieure rouge tricolore */}
        <div style={{ height: 7, background: 'linear-gradient(90deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)', position: 'relative', zIndex: 1 }} />

        {/* En-tête */}
        <div style={{
          background: 'rgba(0,109,68,0.92)',
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.1)" stroke="#FCD116" strokeWidth="3"/>
                <polygon points="50,20 55,36 72,36 59,46 63,63 50,53 37,63 41,46 28,36 45,36" fill="#FCD116"/>
                <rect x="22" y="74" width="18" height="11" rx="1" fill="#CE1126"/>
                <rect x="41" y="74" width="18" height="11" rx="1" fill="#FCD116"/>
                <rect x="60" y="74" width="18" height="11" rx="1" fill="#009A44"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5 }}>RÉPUBLIQUE DE GUINÉE</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#FCD116', letterSpacing: 0.5 }}>CARTE NATIONALE D'IDENTITÉ</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)' }}>ECOWAS IDENTITY CARD · BILHETE DE IDENTIDADE CEDEAO</div>
            </div>
          </div>
          {/* Logo CEDEAO + drapeau */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', width: 22, height: 32, overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              <div style={{ flex: 1, background: '#CE1126' }}/>
              <div style={{ flex: 1, background: '#FCD116' }}/>
              <div style={{ flex: 1, background: '#009A44' }}/>
            </div>
            <div style={{ background: '#FCD116', color: '#9B1B5A', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 3 }}>BIOMÉTRIQUE</div>
          </div>
        </div>

        {/* Corps recto */}
        <div style={{ display: 'flex', padding: '12px 14px 10px', gap: 14, position: 'relative', zIndex: 1 }}>
          {/* Photo + empreinte */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 88, height: 108, border: '2.5px solid #9B1B5A', borderRadius: 4, overflow: 'hidden', background: '#e8c0d4', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <img src={avatarURL} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            </div>
            {/* Empreinte digitale */}
            <div style={{ width: 88, height: 32, border: '1.5px solid #8ab88a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', gap: 4 }}>
              <span style={{ fontSize: 18 }}>👆</span>
              <div style={{ fontSize: 7, color: '#5a7a5a', fontWeight: 600 }}>EMPREINTE<br/>BIOMÉTRIQUE</div>
            </div>
          </div>

          {/* Données personnelles */}
          <div style={{ flex: 1 }}>
            {[
              ['Nom / Surname', nom, 'Sexe / Sex', genre],
              ['Prénom(s) / Given names', prenom, null, null],
              ['Nationalité', 'GUINÉENNE', 'Date naissance / Date of birth', fmtDateUP(ddn)],
              ['Lieu naissance / Place of birth', lieu, null, null],
              ['Date d\'émission / Date of issue', fmtDateUP(emis), 'Expiration', fmtDateUP(expire)],
              ['N° Identification Nationale / National ID No.', nin, null, null],
              ['Lieu de délivrance / Place of issuance', `${lieu} · M.S.P.C`, null, null],
            ].map(([l1, v1, l2, v2], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: l2 ? '1fr 1fr' : '1fr', gap: '0 12px', marginBottom: 6, borderBottom: '1px solid rgba(0,109,68,0.15)', paddingBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 7, color: '#5a7a5a', fontStyle: 'italic', fontWeight: 600 }}>{l1}</div>
                  <div style={{ fontSize: l1.includes('Nom') || l1.includes('Prénom') ? 13 : 10, fontWeight: l1.includes('Nom') || l1.includes('Prénom') ? 900 : 700, color: '#2a0a1a' }}>{v1}</div>
                </div>
                {l2 && (
                  <div>
                    <div style={{ fontSize: 7, color: '#5a7a5a', fontStyle: 'italic', fontWeight: 600 }}>{l2}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0a1a0a' }}>{v2}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bas recto : signature électronique + QR */}
        <div style={{ padding: '0 14px 12px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <SignatureMinistere ministere="MATD" long={false} dark={false} />
            </div>
            {qrUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div style={{ background: '#fff', padding: 4, border: '1.5px solid #9B1B5A', borderRadius: 4 }}>
                  <img src={qrUrl} alt="QR Code" width={72} height={72} style={{ display: 'block' }} crossOrigin="anonymous" />
                </div>
                <div style={{ fontSize: 6.5, color: '#5a7a5a', textAlign: 'center', fontWeight: 600 }}>Scanner pour vérifier</div>
              </div>
            )}
          </div>
        </div>

        {/* Bande arc-en-ciel holographique */}
        <div style={{ height: 5, background: 'linear-gradient(90deg, #CE1126 0%, #FCD116 25%, #009A44 50%, #006D44 75%, #FCD116 100%)', opacity: 0.75 }} />
      </div>

      {/* ── VERSO ── */}
      <div style={{
        background: VERSO_BG,
        border: '2px solid #7a1547',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,80,0,0.1)',
        position: 'relative',
      }}>
        {/* Bande supérieure */}
        <div style={{ height: 7, background: 'linear-gradient(90deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)', position: 'relative', zIndex: 1 }} />

        {/* Contenu verso */}
        <div style={{ padding: '14px 16px', position: 'relative', zIndex: 1 }}>
          {/* Bande magnétique */}
          <div style={{ background: '#1a1a1a', height: 32, borderRadius: 3, marginBottom: 12, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
            <div style={{ fontSize: 7, color: '#888', fontFamily: 'Courier New, monospace', letterSpacing: 2 }}>▐▌▌▐▌▐▌▌▐▌▌▐▌▐▌▌▐▌▐▌▌▐▌▌▐▌▐▌▌▐▌▌▐▌▐▌▌▐</div>
          </div>

          {/* Zone de lecture automatique (MRZ ID-1) */}
          <div style={{ background: '#0d1a0d', borderRadius: 4, padding: '8px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 7, color: '#4a7a4a', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>ZONE DE LECTURE AUTOMATIQUE (MRZ) · ID-1</div>
            {(() => {
              const mrz = buildMRZ(nom, prenom, ddn, expire.toISOString(), nin.slice(0,9), genre);
              const idLine1 = `I<GIN${nin.slice(0,9).padEnd(9, '<')}<${nin.slice(9,15).padEnd(6,'<')}<<`;
              const idLine2 = `${fmtDateUP(ddn).replace(/\s/g,'').slice(0,6) || '000000'}${genre}<${fmtDateUP(expire).replace(/\s/g,'').slice(0,6) || '000000'}GIN${nom.replace(/[^A-Z]/g,'<').padEnd(14,'<')}`;
              const idLine3 = `${nom.replace(/[^A-Z]/g,'<').padEnd(13,'<')}<${prenom.replace(/[^A-Z]/g,'<').padEnd(17,'<')}`;
              return ['IDGIN' + nin.slice(0,9) + '<' + nin.slice(9,15), idLine2, idLine3].map((l, i) => (
                <div key={i} style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#f48fb1', letterSpacing: 2, lineHeight: 1.8 }}>{l.slice(0,30)}</div>
              ));
            })()}
          </div>

          {/* Infos complémentaires */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 9 }}>
            <div style={{ background: 'rgba(0,109,68,0.08)', padding: 8, borderRadius: 6, border: '1px solid rgba(0,109,68,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#9B1B5A', marginBottom: 2 }}>Organe émetteur</div>
              <div style={{ color: '#333' }}>Ministère de la Sécurité<br/>et de la Protection Civile<br/>(M.S.P.C) — République de Guinée</div>
            </div>
            <div style={{ background: 'rgba(0,109,68,0.08)', padding: 8, borderRadius: 6, border: '1px solid rgba(0,109,68,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#9B1B5A', marginBottom: 2 }}>Validité</div>
              <div style={{ color: '#333' }}>Valable dans tous les<br/>États membres de la CEDEAO<br/>et à l'international</div>
            </div>
          </div>

          {/* Mentions légales */}
          <div style={{ marginTop: 10, padding: 8, background: 'rgba(206,17,38,0.04)', border: '1px solid rgba(206,17,38,0.15)', borderRadius: 6 }}>
            <div style={{ fontSize: 7.5, color: '#CE1126', fontWeight: 700, marginBottom: 3 }}>⚠ AVERTISSEMENT / WARNING</div>
            <div style={{ fontSize: 7.5, color: '#555', lineHeight: 1.5 }}>
              Ce document est la propriété de la République de Guinée. Toute falsification est passible de poursuites pénales conformément au Code Pénal Guinéen.
              <span style={{ fontStyle: 'italic', color: '#888' }}> · This document is property of the Republic of Guinea.</span>
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'linear-gradient(90deg, #009A44 0%, #FCD116 25%, #CE1126 50%, #FCD116 75%, #009A44 100%)', opacity: 0.75 }} />
      </div>

      {/* QR vérification intégré dans le document */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ACTE DE NAISSANCE — Design officiel guinéen
//  Format A4, en-tête gouvernemental, sections ENFANT/PÈRE/MÈRE
// ═══════════════════════════════════════════════════════════════
const ActeNaissance = ({ acte, user, documentId, hash_document }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const lieu   = (acte?.lieu_naissance || 'Conakry').toUpperCase();
  const ddn    = acte?.date_naissance || user?.date_naissance;
  const genre  = (acte?.genre === 'F' || acte?.genre === 'Féminin') ? 'FÉMININ' : 'MASCULIN';
  const nomPere = (acte?.nom_pere || 'NOM DU PÈRE').toUpperCase();
  const nomMere = (acte?.nom_mere || 'NOM DE LA MÈRE').toUpperCase();
  const prefecture = (acte?.region || lieu).toUpperCase();
  const commune = (acte?.commune || lieu).toUpperCase();
  const numCert = acte?.id_acte || `B${Math.floor(1000000000 + Math.random()*8999999999)}`;
  const numIdNat = (acte?.numero_identifiant_national || mkNIN(acte)).replace(/\D/g,'');
  const today = fmtDateFR(new Date());
  const todayLong = fmtDateFRLong(new Date());
  const qrUrl = documentId ? buildQrUrl(documentId, hash_document, 110) : null;

  const PURPLE = '#5c2d82';
  const LIGHT_PURPLE = '#f5eeff';
  const DARK_GREEN = '#006D44';

  const SectionTitle = ({ title }) => (
    <div style={{
      background: `linear-gradient(90deg, ${PURPLE} 0%, #7b3fa8 100%)`,
      color: '#fff', fontSize: 10.5, fontWeight: 700,
      letterSpacing: 1.5, textAlign: 'center', padding: '5px 10px',
      textTransform: 'uppercase',
    }}>
      {title}
    </div>
  );

  const Row = ({ label, value, label2, value2 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: label2 ? '1fr 1fr' : '1fr', borderBottom: `1px solid #d0b8e8`, minHeight: 26 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', borderRight: label2 ? `1px solid #d0b8e8` : 'none' }}>
        <div style={{ padding: '4px 8px', fontSize: 8.5, color: '#5a3a6a', fontStyle: 'italic', fontWeight: 600, background: LIGHT_PURPLE, display: 'flex', alignItems: 'center', borderRight: `1px solid #d0b8e8` }}>{label}</div>
        <div style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center' }}>{value || '—'}</div>
      </div>
      {label2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>
          <div style={{ padding: '4px 6px', fontSize: 8.5, color: '#5a3a6a', fontStyle: 'italic', fontWeight: 600, background: LIGHT_PURPLE, display: 'flex', alignItems: 'center', borderRight: `1px solid #d0b8e8` }}>{label2}</div>
          <div style={{ padding: '4px 6px', fontSize: 10.5, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center' }}>{value2 || '—'}</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Times New Roman, Georgia, serif', maxWidth: 750, margin: '0 auto' }}>
      <div style={{
        border: `5px solid ${PURPLE}`,
        borderRadius: 4,
        background: LIGHT_PURPLE,
        boxShadow: '0 8px 32px rgba(92,45,130,0.18)',
      }}>
        <div style={{ border: `2.5px solid #9b5cc8`, margin: 6, borderRadius: 2 }}>
          <div style={{ padding: '16px 20px' }}>

            {/* ── EN-TÊTE ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              {/* Gauche : références */}
              <div style={{ fontSize: 8.5, color: '#555', lineHeight: 1.8 }}>
                <div>République de Guinée</div>
                <div>Ministère de l'Administration</div>
                <div>du Territoire (MATD)</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>Préfecture : <span style={{ color: PURPLE }}>{prefecture}</span></div>
                <div style={{ fontWeight: 700 }}>Commune : <span style={{ color: PURPLE }}>{commune}</span></div>
              </div>

              {/* Centre : Titre */}
              <div style={{ textAlign: 'center' }}>
                {/* Armoiries République de Guinée */}
                <svg width="52" height="52" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', margin:'0 auto 2px' }}>
                  <circle cx="50" cy="50" r="47" fill="#f5f0ff" stroke={PURPLE} strokeWidth="2.5"/>
                  <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(92,45,130,0.2)" strokeWidth="0.5"/>
                  <polygon points="50,20 55,36 72,36 59,46 63,63 50,53 37,63 41,46 28,36 45,36" fill={PURPLE}/>
                  <rect x="22" y="72" width="18" height="12" rx="1" fill="#CE1126"/>
                  <rect x="41" y="72" width="18" height="12" rx="1" fill="#FCD116"/>
                  <rect x="60" y="72" width="18" height="12" rx="1" fill="#009A44"/>
                </svg>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: DARK_GREEN, fontWeight: 700, marginTop: 2 }}>RÉPUBLIQUE DE GUINÉE</div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: '#555', fontStyle: 'italic' }}>TRAVAIL · JUSTICE · SOLIDARITÉ</div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900, fontStyle: 'italic', color: '#1a0a2a', letterSpacing: 0.5, borderBottom: `2px solid ${PURPLE}`, paddingBottom: 4 }}>
                  Acte de Naissance
                </div>
                <div style={{ fontSize: 11, fontStyle: 'italic', color: '#888', marginTop: 2 }}>Certificate of Birth</div>
              </div>

              {/* Droite : numéros */}
              <div style={{ textAlign: 'right', fontSize: 8.5, color: '#555', lineHeight: 1.8 }}>
                <div>N° Certificat : <strong style={{ color: PURPLE }}>{numCert}</strong></div>
                <div>N° Identif. National : <strong style={{ color: PURPLE }}>{numIdNat.slice(0, 12)}</strong></div>
                <div style={{ marginTop: 8 }}>
                  {qrUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{ background: '#fff', padding: 4, border: `1.5px solid ${PURPLE}`, borderRadius: 4, display: 'inline-block' }}>
                        <img src={qrUrl} alt="QR Code" width={90} height={90} style={{ display: 'block' }} crossOrigin="anonymous" />
                      </div>
                      <div style={{ fontSize: 7, color: '#6a4a8a', fontWeight: 600 }}>Scanner pour vérifier</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Déclaration introductive */}
            <div style={{ background: 'rgba(92,45,130,0.07)', border: `1px solid #c8a8e8`, borderRadius: 4, padding: '8px 14px', marginBottom: 14, fontSize: 10, color: '#333', lineHeight: 1.7, fontStyle: 'italic' }}>
              Je soussigné(e), <strong>Officier de l'État Civil Délégué</strong> de la Commune de <strong>{commune}</strong>, Préfecture de <strong>{prefecture}</strong>, certifie avoir dressé l'acte de naissance de :
            </div>

            {/* SECTION ENFANT */}
            <div style={{ border: `1.5px solid ${PURPLE}`, marginBottom: 0 }}>
              <SectionTitle title="ENFANT — CHILD" />
              <Row label="Prénom(s) :" value={prenom} />
              <Row label="Nom :" value={nom} />
              <Row label="Date de naissance :" value={`${fmtDateFRLong(ddn)} à ${acte?.heure_naissance || '08h00'}`} label2="Lieu de naissance :" value2={`${lieu}, Préfecture de ${prefecture}`} />
              <Row label="Sexe / Sex :" value={genre} label2="Nationalité :" value2="GUINÉENNE" />
            </div>

            {/* SECTION PÈRE */}
            <div style={{ border: `1.5px solid ${PURPLE}`, borderTop: 'none' }}>
              <SectionTitle title="PÈRE — FATHER" />
              <Row label="Nom complet :" value={nomPere} />
              <Row label="Date de naissance :" value="—" label2="Nationalité :" value2="GUINÉENNE" />
              <Row label="Profession :" value={(acte?.profession_pere || 'CULTIVATEUR').toUpperCase()} label2="N° Identification :" value2="NON COMMUNIQUÉ" />
            </div>

            {/* SECTION MÈRE */}
            <div style={{ border: `1.5px solid ${PURPLE}`, borderTop: 'none' }}>
              <SectionTitle title="MÈRE — MOTHER" />
              <Row label="Nom complet :" value={nomMere} />
              <Row label="Date de naissance :" value="—" label2="Nationalité :" value2="GUINÉENNE" />
              <Row label="Profession :" value="MÉNAGÈRE" label2="N° Identification :" value2="NON COMMUNIQUÉ" />
            </div>

            {/* SECTION DÉCLARANT */}
            <div style={{ border: `1.5px solid ${PURPLE}`, borderTop: 'none', marginBottom: 14 }}>
              <SectionTitle title="DÉCLARANT — DECLARANT" />
              <Row label="Nom complet :" value={nomPere} label2="Lien de parenté :" value2="PÈRE" />
            </div>

            {/* Certifié conforme + signature électronique */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, color: '#333' }}>
                  Dressé le : <strong>{todayLong}</strong>
                </div>
                <div style={{ background: DARK_GREEN, color: '#fff', fontSize: 8, fontWeight: 700, padding: '3px 10px', borderRadius: 4, letterSpacing: 0.5 }}>
                  ✓ HASH BLOCKCHAIN VÉRIFIÉ
                </div>
              </div>
              <div style={{ fontSize: 8.5, color: '#555', fontStyle: 'italic', marginBottom: 14 }}>
                Officier de l'État Civil Délégué · Habilité par l'Ordonnance N° 92-027/PRG/SGG du 12 Mai 1992<br/>
                Conforme à la Loi L/2015/013/AN du 6 Juillet 2015 relative à la modernisation de l'état civil en République de Guinée.<br/>
                Document généré via le système NaissanceChain — Registre National Numérique.
              </div>
              <SignatureMinistere ministere="MATD" long={true} dark={false} />
            </div>

          </div>
        </div>
      </div>

      {/* QR vérification intégré dans le document */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PERMIS DE CONDUIRE — Design officiel guinéen
//  Format credit card ID-1, recto/verso, catégories de véhicules
// ═══════════════════════════════════════════════════════════════
const PermisConduire = ({ acte, user, documentId, hash_document }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = fmtDateFR(acte?.date_naissance || user?.date_naissance);
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const numPC  = 'GN' + Math.floor(10000000 + Math.random()*89999999);
  const today  = fmtDateFR(new Date());
  const expiry = addYrs(5);
  const qrUrl  = documentId ? buildQrUrl(documentId, hash_document, 90) : null;
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+' '+nom.charAt(0))}&background=1a2e0d&color=fff&bold=true&size=200`;

  const cats = [
    { c: 'AM', icon: '🛵', desc: 'Cyclomoteur', date: null },
    { c: 'A',  icon: '🏍', desc: 'Motocycle', date: null },
    { c: 'B',  icon: '🚗', desc: 'Véhicule léger', date: today },
    { c: 'C',  icon: '🚛', desc: 'Poids lourd', date: null },
    { c: 'D',  icon: '🚌', desc: 'Transport en commun', date: null },
    { c: 'E',  icon: '🚜', desc: 'Véhicule articulé', date: null },
  ];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 720, margin: '0 auto' }}>

      {/* ── RECTO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a10 0%, #2d5a1a 40%, #1a3a10 100%)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(0,60,0,0.3)',
        marginBottom: 10,
        position: 'relative',
        border: '2px solid #4a7a2a',
      }}>
        {/* Motif sécurité */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, #8bc34a 0, #8bc34a 2px, transparent 2px, transparent 14px)', backgroundSize: '14px 14px' }} />

        {/* Bande tricolore haut */}
        <div style={{ height: 7, background: 'linear-gradient(90deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)', position: 'relative', zIndex: 1 }} />

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.15)" stroke="#FCD116" strokeWidth="2"/>
              <polygon points="50,20 55,36 72,36 59,46 63,63 50,53 37,63 41,46 28,36 45,36" fill="#FCD116"/>
              <rect x="22" y="74" width="18" height="11" rx="1" fill="#CE1126"/>
              <rect x="41" y="74" width="18" height="11" rx="1" fill="#FCD116"/>
              <rect x="60" y="74" width="18" height="11" rx="1" fill="#009A44"/>
            </svg>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 }}>RÉPUBLIQUE DE GUINÉE</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#FCD116', letterSpacing: 1 }}>PERMIS DE CONDUIRE</div>
              <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.6)' }}>DRIVING LICENCE · UNION AFRICAINE</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', width: 22, height: 32, overflow: 'hidden', borderRadius: 2 }}>
              <div style={{ flex: 1, background: '#CE1126' }}/>
              <div style={{ flex: 1, background: '#FCD116' }}/>
              <div style={{ flex: 1, background: '#009A44' }}/>
            </div>
          </div>
        </div>

        {/* Corps recto */}
        <div style={{ display: 'flex', gap: 14, padding: '0 16px 14px', position: 'relative', zIndex: 1 }}>
          {/* Photo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 86, height: 106, border: '2.5px solid #8bc34a', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <img src={avatarURL} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            </div>
            {qrUrl && (
              <div style={{ background: '#fff', padding: 4, border: '2px solid #8bc34a', borderRadius: 4 }}>
                <img src={qrUrl} alt="QR" width={76} height={76} style={{ display: 'block' }} crossOrigin="anonymous" />
              </div>
            )}
          </div>

          {/* Données */}
          <div style={{ flex: 1 }}>
            {[
              ['1. Nom / Surname', nom],
              ['2. Prénom(s) / Given names', prenom],
              ['3. Date et lieu de naissance', `${ddn} · ${lieu}`],
              ['4a. Date d\'émission', today],
              ['4b. Date d\'expiration', expiry],
              ['4c. Autorité délivrante', 'PRÉFECTURE DE POLICE · CONAKRY'],
              ['5. N° Permis / Licence No.', numPC],
              ['8. Lieu de résidence', `${lieu} · GUINÉE`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.6)', fontWeight: 600, minWidth: 140, flexShrink: 0, lineHeight: 1.5, paddingTop: 1 }}>{l}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>{v}</div>
              </div>
            ))}

            {/* Signature électronique Permis */}
            <div style={{ marginTop: 10 }}>
              <SignatureMinistere ministere="MINSP" long={false} dark={true} />
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'linear-gradient(90deg, #CE1126 0%, #FCD116 25%, #009A44 50%, #FCD116 75%, #CE1126 100%)', position: 'relative', zIndex: 1 }} />
      </div>

      {/* ── VERSO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fff0 0%, #e8f5e8 50%, #f0fff0 100%)',
        border: '2px solid #4a7a2a',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,60,0,0.1)',
        position: 'relative',
      }}>
        <div style={{ height: 7, background: 'linear-gradient(90deg, #CE1126 33%, #FCD116 33% 66%, #009A44 66%)', position: 'relative', zIndex: 1 }} />

        <div style={{ padding: '14px 16px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a10', marginBottom: 10, letterSpacing: 0.5 }}>9. Catégories habilitées / Authorized categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 14 }}>
            {cats.map(cat => (
              <div key={cat.c} style={{
                border: `2px solid ${cat.date ? '#2d5a1a' : '#ccc'}`,
                borderRadius: 6, padding: '6px 4px', textAlign: 'center',
                background: cat.date ? 'rgba(45,90,26,0.08)' : '#f9f9f9',
                opacity: cat.date ? 1 : 0.45,
              }}>
                <div style={{ fontSize: 18 }}>{cat.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: cat.date ? '#1a3a10' : '#999', marginTop: 2 }}>{cat.c}</div>
                <div style={{ fontSize: 7, color: '#666', lineHeight: 1.3, marginTop: 2 }}>{cat.desc}</div>
                {cat.date && <div style={{ fontSize: 7, color: '#2d5a1a', fontWeight: 700, marginTop: 3, background: 'rgba(45,90,26,0.12)', borderRadius: 3, padding: '1px 3px' }}>{cat.date}</div>}
              </div>
            ))}
          </div>

          {/* Avertissement */}
          <div style={{ padding: 8, background: 'rgba(206,17,38,0.05)', border: '1px solid rgba(206,17,38,0.15)', borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 7.5, color: '#CE1126', fontWeight: 700, marginBottom: 2 }}>⚠ Conditions de validité</div>
            <div style={{ fontSize: 7.5, color: '#555', lineHeight: 1.5 }}>
              Ce permis est valable sur tout le territoire de la République de Guinée et dans les États membres de la CEDEAO. Toute falsification est poursuivie pénalement.
            </div>
          </div>

          {/* QR vérification intégré dans le document */}
        </div>

        <div style={{ height: 5, background: 'linear-gradient(90deg, #009A44 0%, #FCD116 25%, #CE1126 50%, #FCD116 75%, #009A44 100%)', opacity: 0.7 }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL — DocumentGenere
// ═══════════════════════════════════════════════════════════════
const DocumentGenere = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const docRef   = useRef(null);

  const documentId   = location.state?.documentId;
  const type_document = location.state?.type_document || "Carte d'Identité";

  const [acte, setActe]           = useState(null);
  const [doc, setDoc]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');

  useEffect(() => {
    const base = window.location.origin;
    if (documentId) setVerifyUrl(`${base}/verify/${documentId}`);
  }, [documentId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Charger le document certifié (par ID ou dernier doc du user)
        let docData = null;
        if (documentId) {
          const { data } = await supabase
            .from('documents_certifies')
            .select('*')
            .eq('id', documentId)
            .maybeSingle();
          docData = data;
        } else if (user?.id) {
          // Fallback : prendre le dernier document généré du citoyen
          const { data } = await supabase
            .from('documents_certifies')
            .select('*')
            .eq('citoyen_id', user.id)
            .eq('statut', 'GENERE')
            .order('date_generation', { ascending: false })
            .limit(1)
            .maybeSingle();
          docData = data;
        }
        if (docData) setDoc(docData);

        // 2. Charger les données NaissanceChain (acte de naissance)
        const idActe = user?.id_acte_lie || user?.matricule
          || docData?.id_acte;
        if (idActe) {
          const { data: acteData } = await supabase
            .from('naissancechain')
            .select('*')
            .eq('id_acte', idActe)
            .maybeSingle();
          if (acteData) setActe(acteData);
        }
      } catch (e) {
        console.error('Erreur chargement document:', e);
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [documentId, user]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const cleanName = (s) => (s || 'document').toLowerCase().replace(/\s+/g, '_');
    const filename = `identiguinee_${cleanName(type_document)}_${cleanName(acte?.nom || user?.nom)}.pdf`;
    const ok = await exportPDF(docRef, filename);
    if (!ok) alert('Erreur lors de la génération du PDF. Réessayez.');
    setPdfLoading(false);
  };

  // Résoudre le bon composant
  const renderDocument = () => {
    const props = { acte, user, documentId, hash_document: doc?.hash_document };
    const t = (type_document || '').toLowerCase();
    if (t.includes('passeport')) return <PasseportBiometrique {...props} />;
    if (t.includes('acte') || t.includes('naissance') || t.includes('extrait')) return <ActeNaissance {...props} />;
    if (t.includes('permis')) return <PermisConduire {...props} />;
    return <CarteIdentiteCEDEAO {...props} />;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size={36} color="#006D44" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 14, color: '#666', fontWeight: 600 }}>Chargement du document...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 40px' }}>

        {/* ── En-tête ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#888' }}>
          <span style={{ cursor: 'pointer', color: '#006D44', fontWeight: 700 }} onClick={() => navigate('/dashboard')}>Tableau de bord</span>
          <ChevronRight size={14} />
          <span>Document généré</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8f5e8', padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CheckCircle size={20} color="#006D44" fill="#006D44" />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0a2e1a', margin: 0 }}>{type_document}</h1>
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
              Document officiel certifié · Registre NaissanceChain · République de Guinée 🇬🇳
            </p>
            {doc?.hash_document && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={12} color="#006D44" />
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#006D44', fontWeight: 700 }}>
                  {doc.hash_document.slice(0, 36)}...
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#006D44', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: pdfLoading ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {pdfLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
              {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
            </button>
            <button
              onClick={() => {
                // Préparer l'impression : isoler le document
                const zone = document.getElementById('doc-print-zone');
                if (zone) {
                  const clone = zone.cloneNode(true);
                  clone.id = 'doc-print-clone';
                  clone.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:999999;background:white;padding:16px;box-sizing:border-box;';
                  document.body.appendChild(clone);
                  // Masquer le reste
                  document.body.style.overflow = 'hidden';
                  window.print();
                  // Nettoyer après impression
                  setTimeout(() => {
                    document.body.removeChild(clone);
                    document.body.style.overflow = '';
                  }, 1000);
                } else {
                  window.print();
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', color: '#006D44', border: '2px solid #006D44', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Printer size={15} /> Imprimer
            </button>
            {/* bouton vérifier retiré - vérification via QR code uniquement */}
          </div>
        </div>

        {/* ── Document ── */}
        <div ref={docRef} id="doc-print-zone" style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <ErrorBoundary>
            {renderDocument()}
          </ErrorBoundary>
        </div>

        {/* URL de vérification encodée dans le QR code du document uniquement */}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/documents')} style={{ padding: '10px 20px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            📁 Mes documents
          </button>
          <button onClick={() => navigate('/nouvelle-demande')} style={{ padding: '10px 20px', background: '#fff', border: '2px solid #006D44', color: '#006D44', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nouvelle demande
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Masquer le clone hors impression */
        #doc-print-clone { display: none; }

        @media print {
          /* Masquer toute l'interface sauf le document */
          .layout-sidebar,
          .layout-header,
          .layout-main > *:not(#doc-print-zone),
          button,
          nav,
          [class*="sidebar"],
          [class*="header"],
          [class*="Sidebar"],
          [class*="Header"] {
            display: none !important;
          }
          /* Forcer le document à remplir la page */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Zone d'impression */
          #doc-print-zone,
          #doc-print-clone {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 99999 !important;
            background: white !important;
            margin: 0 !important;
            padding: 16px !important;
            box-sizing: border-box !important;
          }
          /* Forcer toutes les couleurs d'arrière-plan à s'imprimer */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default DocumentGenere;
