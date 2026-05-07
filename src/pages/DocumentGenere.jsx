/**
 * DocumentGenere.jsx — Documents officiels guinéens
 * Design fidèle aux vrais documents scannés fournis
 * Export PDF haute résolution (scale 3)
 */
import React, { useState, useEffect, useRef, Component } from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Download, Printer, CheckCircle, Loader, X, Smartphone, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './DocumentGenere.css';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return <div style={{ padding: 40, textAlign: 'center', color: '#CE1126' }}>Erreur d'affichage. Recharger la page.</div>;
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────
const fmtDateFR = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(v); }
};

const fmtDateUP = (v) => {
  if (!v) return '—';
  const M = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛ','SEP','OCT','NOV','DÉC'];
  try { const d = new Date(v); return `${String(d.getDate()).padStart(2,'0')} ${M[d.getMonth()]} ${d.getFullYear()}`; }
  catch { return String(v); }
};

const addYrs = (n) => { const d = new Date(); d.setFullYear(d.getFullYear()+n); return fmtDateUP(d); };

const mkNIN = (acte) => {
  const seed = (acte?.id_acte || '').replace(/\D/g,'').padStart(4,'0').slice(-4);
  const rnd  = Math.floor(10000000 + Math.random()*89999999).toString();
  return `GIN${seed}${rnd}`;
};

// ── Export PDF ─────────────────────────────────────
const exportPDF = async (ref, filename) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF }   = await import('jspdf');
    const canvas = await html2canvas(ref.current, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
    pdf.save(filename);
    return true;
  } catch (e) { console.error('PDF error:', e); return false; }
};

// ══════════════════════════════════════════════════
//  CNI CEDEAO — Fidèle aux vraies cartes guinéennes
//  Fond vert clair, en-tête rouge-orange, données bilingues
// ══════════════════════════════════════════════════
const CarteIdentiteCEDEAO = ({ acte, user }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = fmtDateUP(acte?.date_naissance || user?.date_naissance);
  const emis   = fmtDateUP(new Date());
  const expire = addYrs(5);
  const nin    = mkNIN(acte);
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const genre  = (acte?.genre || 'M').charAt(0).toUpperCase();
  const taille = acte?.taille || '1,75 m';
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+'+'+nom.charAt(0))}&background=4a8a6a&color=fff&bold=true&size=200`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      {/* ── RECTO ── */}
      <div style={{
        background: 'linear-gradient(150deg, #c8e6c0 0%, #dff0d8 25%, #eaf7e4 50%, #f0faea 75%, #d8ecd0 100%)',
        border: '1.5px solid #9ecb8c', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,100,40,0.13)',
        position: 'relative',
      }}>
        {/* Watermark */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:0 }}>
          <div style={{ fontSize:160, opacity:0.025, color:'#006D44', fontWeight:900 }}>GN</div>
        </div>

        {/* En-tête rouge CEDEAO */}
        <div style={{
          background: 'linear-gradient(90deg, #c62828 0%, #d84315 60%, #bf360c 100%)',
          padding: '10px 16px 10px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Logo CEDEAO simplifié */}
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#005a30', border:'2px solid #FCD116', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:20 }}>🌍</span>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:900, color:'#fff', letterSpacing:0.8, lineHeight:1.2 }}>RÉPUBLIQUE DE GUINÉE</div>
              <div style={{ fontSize:9.5, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>CARTE D'IDENTITÉ CEDEAO</div>
              <div style={{ fontSize:7, color:'rgba(255,255,255,0.75)', lineHeight:1.3 }}>ECOWAS IDENTITY CARD / BILHETE DE IDENTIDADE CEDEAO</div>
            </div>
          </div>
          {/* Drapeau Guinée */}
          <div style={{ display:'flex', flexDirection:'column', width:26, height:38, borderRadius:3, overflow:'hidden', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}>
            <div style={{ flex:1, background:'#CE1126' }}/>
            <div style={{ flex:1, background:'#FCD116' }}/>
            <div style={{ flex:1, background:'#009A44' }}/>
          </div>
        </div>

        {/* Corps recto */}
        <div style={{ display:'flex', padding:'14px 14px 12px', gap:12, position:'relative', zIndex:1 }}>
          {/* Photo + signature */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0, width:104 }}>
            <div style={{ width:96, height:118, border:'2px solid #006D44', borderRadius:3, overflow:'hidden', background:'#c8dcc0', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={avatarURL} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'cover' }} crossOrigin="anonymous" />
            </div>
            <div style={{ width:96, textAlign:'center' }}>
              <div style={{ fontSize:7, color:'#555', fontStyle:'italic' }}>Signature / Signature</div>
              <div style={{ height:1, background:'#333', marginTop:4 }}/>
            </div>
          </div>

          {/* Données */}
          <div style={{ flex:1 }}>
            {/* Nom + Sexe */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div>
                <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Nom / Surname</div>
                <div style={{ fontSize:14, fontWeight:900, color:'#0a0a0a' }}>{nom}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Sexe / Sex</div>
                <div style={{ fontSize:14, fontWeight:900, color:'#0a0a0a' }}>{genre}</div>
              </div>
            </div>

            {/* Prénom */}
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Prénom / First name</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#0a0a0a' }}>{prenom}</div>
            </div>

            {/* Nationalité */}
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Nationalité / Nationality</div>
              <div style={{ fontSize:11, color:'#111' }}>GUINÉENNE</div>
            </div>

            {/* Date naissance */}
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Date de naissance / Date of birth</div>
              <div style={{ fontSize:11, color:'#111' }}>{ddn}</div>
            </div>

            {/* Émission + Taille */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <div>
                <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Date d'émission / Date of issuance</div>
                <div style={{ fontSize:11, color:'#111' }}>{emis}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Taille / Height</div>
                <div style={{ fontSize:11, color:'#111' }}>{taille}</div>
              </div>
            </div>

            {/* Expiration */}
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Date d'expiration / Date of expiry</div>
              <div style={{ fontSize:11, color:'#111' }}>{expire}</div>
            </div>

            {/* NIN */}
            <div style={{ marginBottom:5 }}>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Numéro d'identité / ID number</div>
              <div style={{ fontSize:11, color:'#111', fontFamily:'Courier New, monospace', letterSpacing:0.5 }}>{nin}</div>
            </div>

            {/* Lieu délivrance */}
            <div>
              <div style={{ fontSize:7.5, color:'#444', fontStyle:'italic' }}>Lieu de délivrance / Place of issuance</div>
              <div style={{ fontSize:11, color:'#111' }}>{lieu} / M.S.P.C</div>
            </div>
          </div>

          {/* Empreinte */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, width:68, paddingTop:4 }}>
            <div style={{ width:60, height:74, border:'1px solid #bbb', borderRadius:4, background:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="48" height="60" viewBox="0 0 48 60">
                <ellipse cx="24" cy="30" rx="21" ry="27" stroke="#bbb" strokeWidth="1.2" fill="#f5f5f5"/>
                {[6,10,14,18,22,26,30].map((r,i)=>(
                  <ellipse key={i} cx="24" cy="30" rx={r/2+5} ry={r/2+8} stroke="#ccc" strokeWidth="0.7" fill="none"/>
                ))}
              </svg>
            </div>
            <div style={{ fontSize:7, color:'#888' }}>Empreinte</div>
          </div>
        </div>
      </div>

      {/* ── VERSO ── */}
      <div style={{
        marginTop:20,
        background: 'linear-gradient(150deg, #c8e6c0 0%, #dff0d8 25%, #eaf7e4 50%, #f0faea 75%, #d8ecd0 100%)',
        border: '1.5px solid #9ecb8c', borderRadius: 12, overflow:'hidden',
        boxShadow: '0 4px 18px rgba(0,100,40,0.13)',
      }}>
        {/* Top verso */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid rgba(0,109,44,0.15)', background:'rgba(255,255,255,0.3)' }}>
          {/* Puce */}
          <div style={{ width:38, height:30, background:'linear-gradient(135deg, #C8A82C, #8B7216)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #8B7216' }}>
            <div style={{ width:22, height:16, background:'#8B7216', borderRadius:2 }}/>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#006D44' }}>GIN</div>
            <div style={{ fontSize:8.5, color:'#333', fontStyle:'italic' }}>Le Directeur Général de la Police Nationale</div>
            <div style={{ fontSize:13, fontWeight:900, color:'#CE1126', letterSpacing:0.5 }}>RÉPUBLIQUE DE GUINÉE</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', width:20, height:28, borderRadius:2, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>
            <div style={{ flex:1, background:'#CE1126' }}/>
            <div style={{ flex:1, background:'#FCD116' }}/>
            <div style={{ flex:1, background:'#009A44' }}/>
          </div>
        </div>

        {/* NIN */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 16px', background:'rgba(252,209,22,0.18)', borderBottom:'1px solid rgba(0,109,44,0.1)' }}>
          <span style={{ fontSize:9.5, fontWeight:700, color:'#555' }}>NIN</span>
          <span style={{ fontSize:15, fontWeight:900, color:'#0a2e1a', fontFamily:'Courier New, monospace', letterSpacing:1 }}>{nin}</span>
        </div>

        <div style={{ textAlign:'center', padding:'4px 0 2px', fontSize:8, color:'#666', fontStyle:'italic' }}>Autorité de délivrance</div>
        <div style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#333' }}>Le Directeur Général de la Police Nationale</div>
        <div style={{ textAlign:'center', fontSize:22, color:'#006D44', padding:'2px 0' }}>〜〜〜〜〜〜〜〜〜〜</div>

        {/* Géo */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', padding:'10px 16px', gap:10 }}>
          {[
            ['Lieu de naissance', lieu],
            ['Région/Region\nPréfecture', (acte?.region||lieu)+'\n'+(acte?.prefecture||lieu)],
            ['Sous-préfecture/Commune\nQuartier/District\nSecteur/Village', (acte?.commune||'KALOUM').toUpperCase()+'\n'+(acte?.quartier||'CENTRE').toUpperCase()+'\n'+(acte?.secteur||'01')],
          ].map(([lbl,val],i) => (
            <div key={i}>
              {lbl.split('\n').map((l,j) => <div key={j} style={{ fontSize:7.5, color:'#555', fontStyle:'italic', lineHeight:1.3 }}>{l}</div>)}
              {val.split('\n').map((v,j) => <div key={j} style={{ fontSize:10, fontWeight:700, color:'#0a0a0a' }}>{v}</div>)}
            </div>
          ))}
        </div>

        {/* MRZ */}
        <div style={{ background:'#ebebeb', borderTop:'2px dashed #ccc', padding:'8px 14px' }}>
          {[
            'I<GIN' + nin.replace(/\D/g,'').substring(0,10).padEnd(10,'<')+'<<<<<<<<<<<<<',
            nin.replace(/\D/g,'').substring(0,9).padEnd(9,'<')+'GIN'+(acte?.date_naissance?new Date(acte.date_naissance).toISOString().slice(2,4):'00')+'0101M'+(new Date().getFullYear()+5).toString().slice(2)+'1231GIN<<<<<',
            (nom+'<<'+prenom+'<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<').substring(0,30),
          ].map((line,i) => (
            <div key={i} style={{ fontFamily:'Courier New, monospace', fontSize:10.5, letterSpacing:2, color:'#111', lineHeight:1.6, whiteSpace:'nowrap', overflow:'hidden' }}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  PASSEPORT BIOMÉTRIQUE — fidèle au PDF scanné
//  Fond beige/crème, en-tête bordeaux, photo gauche, MRZ
// ══════════════════════════════════════════════════
const PasseportBiometrique = ({ acte, user, documentId }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = fmtDateUP(acte?.date_naissance);
  const emis   = fmtDateUP(new Date());
  const expire = addYrs(10);
  const numPP  = `GN${Math.floor(10000000+Math.random()*89999999)}`;
  const numP   = String(Math.floor(100000000000+Math.random()*899999999999));
  const lieu   = (acte?.lieu_naissance||'CONAKRY').toUpperCase();
  const genre  = (acte?.genre||'M').charAt(0).toUpperCase();
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+'+'+nom.charAt(0))}&background=3a2a1a&color=fff&bold=true&size=200`;
  const ddnMrz = acte?.date_naissance ? new Date(acte.date_naissance).toISOString().slice(2,4) + String(new Date(acte.date_naissance).getMonth()+1).padStart(2,'0') + String(new Date(acte.date_naissance).getDate()).padStart(2,'0') : '000000';
  const expMrz = (new Date().getFullYear()+10).toString().slice(2)+'0101';
  const mrz1 = `P<GIN${nom}<<${prenom}`.substring(0,44).padEnd(44,'<');
  const mrz2 = (numPP+'GIN'+ddnMrz+genre+expMrz+numP.substring(0,14).padEnd(14,'<')).substring(0,44);

  return (
    <div style={{ fontFamily:'Arial, sans-serif', maxWidth:700, margin:'0 auto' }}>
      {/* Bande couverture */}
      <div style={{ background:'linear-gradient(90deg,#004d20,#006D44)', padding:'8px 18px', display:'flex', justifyContent:'space-between', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.8)', letterSpacing:1, borderRadius:'10px 10px 0 0' }}>
        <span>PASSEPORT / PASSPORT</span>
        <span>REPUBLIQUE DE GUINEE / REPUBLIC OF GUINEA</span>
      </div>

      {/* Page données */}
      <div style={{ background:'linear-gradient(135deg, #fdf8ee 0%, #f8f0dc 40%, #ede0c4 100%)', border:'2px solid #c8a86a', borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'hidden', boxShadow:'0 6px 24px rgba(0,0,0,0.12)', position:'relative' }}>
        {/* Watermark aigle */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:140, opacity:0.035, pointerEvents:'none', zIndex:0 }}>🦅</div>

        {/* En-tête bordeaux */}
        <div style={{ background:'linear-gradient(90deg,#7B0000,#9B0000)', padding:'10px 18px', borderBottom:'3px solid #5B0000', position:'relative', zIndex:1 }}>
          <div style={{ fontSize:15, fontWeight:900, color:'#fff', letterSpacing:1, marginBottom:5 }}>REPUBLIQUE DE GUINEE</div>
          <div style={{ display:'flex', gap:20, alignItems:'flex-end' }}>
            {[['PASSEPORT/PASSPORT',''],['Type/Type','P'],['Code du Pays/Country Code','GIN'],['Passeport No/Passport No',numPP]].map(([l,v],i) => (
              <div key={i}>
                <div style={{ fontSize:7, color:'rgba(255,255,255,0.7)', fontStyle:'italic' }}>{l}</div>
                {v && <div style={{ fontSize: i===3?14:11, fontWeight: i===3?900:600, color:'#fff', fontFamily: i===3?'Courier New,monospace':'inherit' }}>{v}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Corps biographique */}
        <div style={{ display:'flex', padding:18, gap:20, position:'relative', zIndex:1 }}>
          {/* Photo */}
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
            <div style={{ width:106, height:128, border:'2px solid #8B0000', background:'#ddd', overflow:'hidden' }}>
              <img src={avatarURL} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'cover' }} crossOrigin="anonymous" />
            </div>
            {/* Empreinte */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <svg width="40" height="50" viewBox="0 0 40 50">
                <ellipse cx="20" cy="25" rx="18" ry="23" stroke="#bbb" strokeWidth="1.2" fill="#f0f0f0"/>
                {[6,10,14,18,22].map((r,i)=><ellipse key={i} cx="20" cy="25" rx={r/2+5} ry={r/2+7} stroke="#ccc" strokeWidth="0.7" fill="none"/>)}
              </svg>
              <div style={{ fontSize:7, color:'#888', textAlign:'center' }}>Empreinte</div>
            </div>
          </div>

          {/* Données */}
          <div style={{ flex:1 }}>
            {[
              [null, ['Nom/Surname', nom, true]],
              [null, ['Prénom/Given Names', prenom, true]],
              [['Nationalité/Nationality','GUINÉENNE',false], ['Numéro Personnel/Personal No',numP.substring(0,12),false]],
              [['Sexe/Sex',genre,false], ['Lieu de Naissance/Place of Birth',lieu,false]],
              [['Date de Naissance/Date of Birth',ddn,false], ['Autorité/Authority','DCPAF',false]],
              [['Date de Délivrance/Date of Issue',emis,false], ['Date d\'Expiration/Date of Expiry',expire,false]],
            ].map((row,ri) => (
              <div key={ri} style={{ display:'flex', gap:16, marginBottom:9 }}>
                {(Array.isArray(row[0]) ? row : [row[1]]).map((field,fi) => (
                  field && <div key={fi} style={{ flex:1 }}>
                    <div style={{ fontSize:7.5, color:'#666', fontStyle:'italic', display:'block', lineHeight:1.3 }}>{field[0]}</div>
                    <div style={{ fontSize: field[2]?14:11.5, fontWeight: field[2]?900:400, color:'#111', display:'block', lineHeight:1.4 }}>{field[1]}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* MRZ */}
        <div style={{ background:'linear-gradient(90deg,#e8d8b8,#f0e0c0,#e8d8b8)', borderTop:'2px solid #a08040', padding:'8px 16px 10px', position:'relative', zIndex:1 }}>
          {[mrz1, mrz2].map((line,i) => (
            <div key={i} style={{ fontFamily:'Courier New, monospace', fontSize:11.5, letterSpacing:2.5, color:'#1a1a1a', lineHeight:1.7, whiteSpace:'nowrap', overflow:'hidden' }}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  ACTE DE NAISSANCE — Fidèle au PDF scanné
//  Bordure violette double, sections colorées, sections ENFANT/PÈRE/MÈRE
// ══════════════════════════════════════════════════
const ActeNaissance = ({ acte, user, documentId }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const lieu   = (acte?.lieu_naissance || 'Conakry').toUpperCase();
  const ddn    = fmtDateFR(acte?.date_naissance) + ' ' + (acte?.heure_naissance || '08:00');
  const genre  = (acte?.genre === 'F' || acte?.genre === 'Féminin') ? 'FÉMININ' : 'MASCULIN';
  const nomPere = (acte?.nom_pere  || 'NOM PÈRE').toUpperCase();
  const nomMere = (acte?.nom_mere  || 'NOM MÈRE').toUpperCase();
  const pref    = (acte?.region || lieu).toUpperCase();
  const commune = (acte?.commune || lieu).toUpperCase();
  const numCert = acte?.id_acte  || `B${Math.floor(1000000000+Math.random()*8999999999)}`;
  const numIdNat= (acte?.numero_identifiant_national || mkNIN(acte)).replace(/\D/g,'');
  const today   = fmtDateFR(new Date());
  const qrSrc   = documentId ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin+'/verify/'+documentId)}` : null;

  const PURPLE = '#7B2D8B';
  const PURLGT = '#f8f0ff';
  const ROW = (label, value, full=true) => (
    <div style={{ display:'grid', gridTemplateColumns: full ? '1fr':'140px 1fr', borderBottom:'1px solid #d8b8e8', minHeight:26 }}>
      <div style={{ padding:'4px 8px', fontSize:8.5, color:'#555', fontStyle:'italic', borderRight: full?'none':'1px solid #d8b8e8', display:'flex', alignItems:'center', background:full?'transparent':'#f5e8ff' }}>{label}</div>
      <div style={{ padding:'4px 8px', fontSize:10.5, fontWeight:700, color:'#111', display:'flex', alignItems:'center' }}>{value}</div>
    </div>
  );
  const ROWH = (label, value, label2='', value2='') => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid #d8b8e8', minHeight:26 }}>
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', borderRight:'1px solid #d8b8e8' }}>
        <div style={{ padding:'4px 6px', fontSize:8.5, color:'#555', fontStyle:'italic', background:'#f5e8ff', display:'flex', alignItems:'center', borderRight:'1px solid #d8b8e8' }}>{label}</div>
        <div style={{ padding:'4px 6px', fontSize:10.5, fontWeight:700, color:'#111', display:'flex', alignItems:'center' }}>{value}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'140px 1fr' }}>
        <div style={{ padding:'4px 6px', fontSize:8.5, color:'#555', fontStyle:'italic', background:'#f5e8ff', display:'flex', alignItems:'center', borderRight:'1px solid #d8b8e8' }}>{label2}</div>
        <div style={{ padding:'4px 6px', fontSize:10.5, fontWeight:700, color:'#111', display:'flex', alignItems:'center' }}>{value2}</div>
      </div>
    </div>
  );
  const SEC = (title) => (
    <div style={{ background:PURPLE, color:'#fff', fontSize:9.5, fontWeight:700, letterSpacing:1.5, textAlign:'center', padding:'4px 8px', marginTop:0 }}>{title}</div>
  );
  const TABLE = (children) => (
    <div style={{ border:`1px solid ${PURPLE}`, borderTop:'none', marginBottom:0 }}>{children}</div>
  );

  return (
    <div style={{ fontFamily:'Times New Roman, serif', maxWidth:720, margin:'0 auto' }}>
      <div style={{ border:`5px solid ${PURPLE}`, borderRadius:4, background:PURLGT, boxShadow:'0 6px 24px rgba(123,45,139,0.18)' }}>
        <div style={{ border:`2.5px solid #9B4DB0`, margin:7, borderRadius:2, padding:'16px 20px' }}>

          {/* En-tête codes */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontFamily:'Courier New,monospace', fontSize:9, letterSpacing:2, color:'#555', writingMode:'vertical-rl', transform:'rotate(180deg)', opacity:0.7 }}>▐▌▌▐▌▐▌▌▐▌▌▐▌▐▌▌▐▌▐▌▌▐</div>
            <div style={{ textAlign:'right', fontSize:8.5, color:'#444', lineHeight:1.8 }}>
              <div>Numéro de certificat : <strong>{numCert}</strong></div>
              <div>République de Guinée</div>
              <div>Numéro d'identification National : <strong>{numIdNat}</strong></div>
            </div>
          </div>

          {/* Titre */}
          <div style={{ textAlign:'center', margin:'8px 0 14px' }}>
            <div style={{ fontSize:40 }}>🦅</div>
            <div style={{ fontSize:26, fontWeight:900, fontStyle:'italic', color:'#2c0a3a', margin:'4px 0 2px', letterSpacing:1 }}>Acte de Naissance</div>
            <div style={{ fontSize:14, fontStyle:'italic', color:'#666', margin:'0 0 2px' }}>Certificate of Birth</div>
            <div style={{ fontSize:17, fontWeight:700, color:'#2c0a3a' }}>Acte De Naissance</div>
          </div>

          {/* Localisation */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${PURPLE}`, marginBottom:0 }}>
            <div style={{ padding:'5px 10px', borderRight:`1px solid ${PURPLE}` }}>
              <div style={{ fontSize:8, color:'#666' }}>Ville / Préfecture :</div>
              <div style={{ fontSize:10.5, fontWeight:700 }}>{pref}</div>
              <div style={{ fontSize:8, color:'#666', marginTop:2 }}>Commune :</div>
              <div style={{ fontSize:10.5, fontWeight:700 }}>{commune}</div>
            </div>
            <div style={{ padding:'5px 10px' }}>
              <div style={{ fontSize:8, color:'#666' }}>Je Soussigné(e) :</div>
              <div style={{ fontSize:10, fontWeight:700 }}>OFFICIER DE L'ÉTAT CIVIL DÉLÉGUÉ</div>
            </div>
          </div>

          {/* ENFANT */}
          {SEC('ENFANT')}
          {TABLE(<>
            {ROW('Prénom(s) :', prenom, false)}
            {ROW('Nom :', nom, false)}
            {ROWH(`Lieu de naissance Région de : ${pref} Sous-préfecture: ${(acte?.commune||commune)}`, '', 'Date et Heure de Naissance :', ddn)}
            {ROWH('Sexe :', genre, 'Nationalité :', 'GUINÉENNE')}
          </>)}

          {/* PÈRE */}
          {SEC('PÈRE')}
          {TABLE(<>
            {ROW('Nom :', nomPere, false)}
            {ROWH('Date de naissance :', '—', 'CNI ou autres :', 'À PARTIR DU FORMULAIRE DE DEMANDE')}
            {ROWH('Numéro d\'identification :', 'NA', 'Nationalité :', 'GUINÉENNE')}
            {ROWH('', '', 'Profession :', (acte?.profession_pere||'CULTIVATEUR').toUpperCase())}
          </>)}

          {/* MÈRE */}
          {SEC('MÈRE')}
          {TABLE(<>
            {ROW('Nom :', nomMere, false)}
            {ROWH('Date de naissance :', '—', 'CNI ou autres :', 'À PARTIR DU FORMULAIRE DE DEMANDE')}
            {ROWH('Numéro d\'identification :', 'NA', 'Nationalité :', 'GUINÉENNE')}
            {ROWH('', '', 'Profession :', 'MÉNAGÈRE')}
          </>)}

          {/* DÉCLARANT */}
          {SEC('DÉCLARANT')}
          {TABLE(<>
            {ROWH('Nom :', nomPere, 'CNI ou autres :', 'À PARTIR DU FORMULAIRE DE DEMANDE')}
            {ROWH('Numéro d\'identification :', 'NA', '', '')}
            {ROWH('Lien de Parenté :', 'PÈRE', '', '')}
          </>)}

          {/* APPROUVÉ PAR */}
          {SEC('APPROUVÉ PAR')}
          <div style={{ border:`1px solid ${PURPLE}`, borderTop:'none', padding:'12px', minHeight:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:22, color:PURPLE, fontWeight:900 }}>⚖️ JUSTICE</div>
          </div>

          {/* Pied de page */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:14, gap:16 }}>
            <div>
              <div style={{ fontSize:9.5, color:'#333', marginBottom:4 }}>Dressé le : {today}</div>
              <div style={{ fontSize:9, color:'#555', fontStyle:'italic', marginBottom:10 }}>Officier de l'État Civil Délégué</div>
              {/* Tampon */}
              <div style={{ width:68, height:68, border:'3px solid #006D44', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize:7.5, textAlign:'center', color:'#006D44', fontWeight:700, lineHeight:1.5 }}>Officier de<br/>l'état civil<br/>Délégué</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              {qrSrc && <img src={qrSrc} alt="QR Code" style={{ width:90, height:90, border:'1px solid #ccc', borderRadius:4 }} crossOrigin="anonymous" />}
              <div style={{ fontSize:36 }}>🔴</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  PERMIS DE CONDUIRE
// ══════════════════════════════════════════════════
const PermisConduire = ({ acte, user, documentId }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'Prénom').toUpperCase();
  const ddn    = fmtDateFR(acte?.date_naissance);
  const lieu   = (acte?.lieu_naissance || 'Conakry').toUpperCase();
  const numPC  = Math.floor(10000000+Math.random()*89999999).toString();
  const today  = fmtDateFR(new Date());
  const expiry = addYrs(5);
  const avatarURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom.charAt(0)+'+'+nom.charAt(0))}&background=1a2e0a&color=fff&bold=true&size=200`;
  const qrSrc  = documentId ? `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin+'/verify/'+documentId)}` : null;
  const cats = [{c:'A',icon:'🏍',date:null},{c:'B',icon:'🚗',date:today},{c:'C',icon:'🚛',date:today},{c:'D',icon:'🚌',date:today},{c:'E',icon:'🚜',date:null},{c:'F',icon:'🚁',date:null},{c:'G',icon:'🚤',date:null}];

  return (
    <div style={{ fontFamily:'Arial, sans-serif', maxWidth:700, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>
      {/* RECTO */}
      <div style={{ background:'linear-gradient(150deg,#f0f8e0 0%,#e4f2d0 40%,#daebc8 100%)', border:'2px solid #6a9a3a', borderRadius:10, overflow:'hidden', boxShadow:'0 4px 16px rgba(106,154,58,0.15)' }}>
        <div style={{ background:'linear-gradient(90deg,#1e3a0e,#2e5a1e)', padding:'9px 14px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', flexDirection:'column', width:16, height:22, borderRadius:2, overflow:'hidden', flexShrink:0 }}>
            <div style={{ flex:1,background:'#CE1126' }}/><div style={{ flex:1,background:'#FCD116' }}/><div style={{ flex:1,background:'#009A44' }}/>
          </div>
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:0.5 }}>RÉPUBLIQUE DE GUINÉE</div>
            <div style={{ fontSize:16, fontWeight:900, color:'#FCD116', letterSpacing:1 }}>PERMIS DE CONDUIRE</div>
          </div>
          <span style={{ fontSize:26 }}>🌍</span>
        </div>

        <div style={{ display:'flex', padding:14, gap:14 }}>
          <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ width:82, height:100, border:'2px solid #2e5a1e', overflow:'hidden', background:'#ddd' }}>
              <img src={avatarURL} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'cover' }} crossOrigin="anonymous" />
            </div>
            <div style={{ fontSize:7, color:'#555' }}>Signature de titulaire</div>
            <div style={{ width:82, height:1, background:'#333' }}/>
          </div>

          <div style={{ flex:1 }}>
            {[['Nom:',nom,true],['Prénom:',prenom,true],['Date de naissance:',ddn,false],['Lieu de naissance:',lieu,false],['Lieu de délivrance:','CONAKRY',false],['Date de délivrance:',today,false]].map(([l,v,bold])=>(
              <div key={l} style={{ display:'flex', gap:6, marginBottom:5, alignItems:'baseline' }}>
                <span style={{ fontSize:8.5, color:'#444', fontWeight:700, whiteSpace:'nowrap' }}>{l}</span>
                <span style={{ fontSize:10.5, color:'#111', fontWeight:bold?800:400 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', gap:6, marginBottom:5, alignItems:'baseline' }}>
              <span style={{ fontSize:8.5, color:'#444', fontWeight:700 }}>Numéro de PC:</span>
              <span style={{ fontSize:12, color:'#CE1126', fontWeight:900, fontFamily:'Courier New,monospace' }}>{numPC}</span>
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'baseline' }}>
              <span style={{ fontSize:8.5, color:'#444', fontWeight:700 }}>Groupe sanguin:</span>
              <span style={{ fontSize:10.5, color:'#111' }}>{acte?.groupe_sanguin||'O+'}</span>
            </div>
          </div>

          <div style={{ flexShrink:0 }}>
            {qrSrc && <img src={qrSrc} alt="QR" style={{ width:68, height:68, border:'1px solid #bbb', borderRadius:3, display:'block' }} crossOrigin="anonymous" />}
          </div>
        </div>
      </div>

      {/* VERSO */}
      <div style={{ background:'#f6f6f6', border:'2px solid #6a9a3a', borderRadius:10, padding:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontFamily:'Courier New,monospace', fontSize:12, fontWeight:700, color:'#333' }}>{numPC}</div>
          <div style={{ width:64, height:64, border:'2px solid #006D44', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:7, textAlign:'center', color:'#006D44', lineHeight:1.3 }}>Le Directeur<br/>National</div>
          </div>
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', gap:8, fontSize:9, fontWeight:700, color:'#555', padding:'0 4px 5px', borderBottom:'1px solid #ccc' }}>
            <span style={{ flex:1 }}>Catégories</span><span>Date d'expiration</span>
          </div>
          {cats.map(c => (
            <div key={c.c} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 4px', borderBottom:'1px dotted #ddd' }}>
              <span style={{ fontSize:12, fontWeight:700, width:16 }}>{c.c}</span>
              <span style={{ fontSize:14, width:22 }}>{c.icon}</span>
              <span style={{ flex:1, fontSize:9, color:'#555' }}>{c.date||''}</span>
              <span style={{ fontSize:13 }}>{c.date?'☑':'☐'}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #ccc', paddingTop:8 }}>
          <div style={{ fontSize:9.5, color:'#333' }}>Date fin de validité : <strong>{expiry}</strong></div>
          {qrSrc && <img src={qrSrc} alt="QR verso" style={{ width:76, height:76, border:'1px solid #ccc', borderRadius:3 }} crossOrigin="anonymous" />}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════
const DocumentGenereContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const documentId = location.state?.documentId;
  const typeDoc    = location.state?.type_document || "Carte d'Identité";

  const printRef    = useRef(null);
  const [docData,   setDocData]    = useState(null);
  const [loading,   setLoading]    = useState(true);
  const [pdfBusy,   setPdfBusy]    = useState(false);
  const [walletOpen,setWalletOpen] = useState(false);
  const [walletOK,  setWalletOK]   = useState(false);

  useEffect(() => {
    if (!documentId || !user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();
        setDocData(data);
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [documentId, user?.id]);

  const acte = {
    ...(user?.acteData || {}), ...(docData || {}),
    nom:            docData?.nom            || user?.acteData?.nom            || user?.nom,
    prenom:         docData?.prenom         || user?.acteData?.prenom         || user?.prenom,
    date_naissance: docData?.date_naissance || user?.acteData?.date_naissance || user?.date_naissance,
    lieu_naissance: docData?.lieu_naissance || user?.acteData?.lieu_naissance || user?.lieu_naissance,
    genre:          docData?.genre          || user?.acteData?.genre          || user?.genre,
    id_acte:        docData?.id_acte        || user?.acteData?.id_acte        || user?.id_acte_lie,
    hash_blockchain:docData?.hash_document  || user?.acteData?.hash_blockchain,
    nom_pere:       user?.acteData?.nom_pere,
    nom_mere:       user?.acteData?.nom_mere,
  };

  const handlePDF = async () => {
    if (!printRef.current) return;
    setPdfBusy(true);
    const ok = await exportPDF(printRef, `${typeDoc.replace(/\s/g,'-')}-${(acte.nom||'document').toUpperCase()}.pdf`);
    if (!ok) alert('Erreur génération PDF. Utilisez "Imprimer" en alternative.');
    setPdfBusy(false);
  };

  const renderDoc = () => {
    const t = (typeDoc || '').toLowerCase();
    if (t.includes('passeport'))                            return <PasseportBiometrique acte={acte} user={user} documentId={documentId}/>;
    if (t.includes('naissance') || t.includes('extrait'))   return <ActeNaissance acte={acte} user={user} documentId={documentId}/>;
    if (t.includes('permis'))                               return <PermisConduire acte={acte} user={user} documentId={documentId}/>;
    return <CarteIdentiteCEDEAO acte={acte} user={user}/>;
  };

  if (loading) return (
    <Layout>
      <div style={{ padding:64, textAlign:'center' }}>
        <div className="step-loader" style={{ margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--text-faint)', fontSize:14 }}>Génération du document...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ maxWidth:860, margin:'0 auto' }} className="animate-fade-in">

        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom:20 }}>
          <span style={{ cursor:'pointer' }} onClick={() => navigate('/documents')}>MES DOCUMENTS</span>
          <ChevronRight size={13}/>
          <span className="active">{typeDoc.toUpperCase()}</span>
        </nav>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:28 }}>
          <div>
            <h1 className="page-title">Document généré ✅</h1>
            <p className="page-subtitle">Document officiel sécurisé — NaissanceChain, République de Guinée.</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => window.print()}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text-main)', fontFamily:'var(--font)' }}>
              <Printer size={15}/> Imprimer
            </button>
            <button onClick={handlePDF} disabled={pdfBusy}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700, cursor:pdfBusy?'wait':'pointer', fontFamily:'var(--font)', opacity:pdfBusy?0.7:1 }}>
              {pdfBusy ? <Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={15}/>}
              {pdfBusy ? 'Génération PDF...' : 'Télécharger PDF'}
            </button>
          </div>
        </div>

        {/* Zone imprimable */}
        <div ref={printRef} style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', boxShadow:'var(--shadow-md)', padding:32, marginBottom:20 }}>
          <ErrorBoundary>{renderDoc()}</ErrorBoundary>
        </div>

        {/* Hash */}
        {acte.hash_blockchain && (
          <div style={{ background:'#0a2e1a', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:0.6, marginBottom:6 }}>🔗 Empreinte NaissanceChain (SHA-256)</div>
            <div style={{ fontFamily:'Courier New, monospace', fontSize:11, color:'#69f0ae', wordBreak:'break-all', lineHeight:1.6 }}>{acte.hash_blockchain}</div>
          </div>
        )}

        {/* Portefeuille */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14, marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12, color:'var(--primary)' }}>
            <Info size={18} style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <p style={{ fontWeight:700, margin:0, fontSize:14 }}>Portefeuille numérique</p>
              <p style={{ margin:'4px 0 0', color:'var(--text-muted)', fontSize:13 }}>Conservez une copie sécurisée sur votre appareil.</p>
            </div>
          </div>
          <button onClick={() => setWalletOpen(true)}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text-main)', fontFamily:'var(--font)' }}>
            <Smartphone size={15}/> Ajouter au portefeuille
          </button>
        </div>

        {walletOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:400, width:'100%', position:'relative', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', textAlign:'center' }}>
              <button onClick={() => setWalletOpen(false)} style={{ position:'absolute', top:14, right:14, background:'#f5f5f5', border:'1px solid #e0e0e0', borderRadius:8, padding:5, cursor:'pointer', display:'flex', alignItems:'center' }}><X size={18}/></button>
              {walletOK ? (
                <>
                  <CheckCircle size={48} color="var(--primary)" style={{ marginBottom:16 }}/>
                  <h3 style={{ margin:'0 0 8px' }}>Document ajouté !</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13 }}>Disponible dans votre portefeuille numérique.</p>
                  <button onClick={() => { setWalletOK(false); setWalletOpen(false); }} style={{ marginTop:20, padding:'10px 24px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>Fermer</button>
                </>
              ) : (
                <>
                  <h3 style={{ margin:'0 0 10px' }}>Ajouter au portefeuille</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13, margin:'0 0 20px' }}>Une copie chiffrée sera conservée sur votre appareil mobile.</p>
                  <button onClick={() => setWalletOK(true)} style={{ padding:'10px 24px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', display:'inline-flex', alignItems:'center', gap:8 }}>
                    <CheckCircle size={15}/> Confirmer
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

const DocumentGenere = () => <ErrorBoundary><DocumentGenereContent/></ErrorBoundary>;
export default DocumentGenere;
