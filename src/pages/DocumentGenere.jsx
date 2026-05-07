/**
 * DocumentGenere.jsx
 * Design pixel-perfect basé sur les vrais documents guinéens + export PDF réel
 */
import React, { useState, useEffect, useRef, Component } from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Download, Printer, CheckCircle, Info, X, Smartphone, Loader } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './DocumentGenere.css';

// ── ErrorBoundary ──────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, err: '' }; }
  static getDerivedStateFromError(e) { return { hasError: true, err: e.message }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: 40, textAlign: 'center', color: '#CE1126' }}>
        <h3>Erreur d'affichage</h3><p style={{fontSize:12,color:'#888'}}>{this.state.err}</p>
      </div>
    );
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────
const fmtDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return String(v); }
};

const fmtDateUp = (v) => {
  if (!v) return '—';
  try {
    const months = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛ','SEP','OCT','NOV','DÉC'];
    const d = new Date(v);
    return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return String(v); }
};

const addYears = (y) => { const d = new Date(); d.setFullYear(d.getFullYear() + y); return fmtDateUp(d); };

const padNIN = (acte) => {
  const y = acte?.date_naissance ? new Date(acte.date_naissance).getFullYear().toString().slice(-2) : '00';
  const seed = (acte?.id_acte || '').replace(/\D/g,'').padStart(4,'0').slice(-4);
  return `GIN${y}${seed}${Math.floor(10000000 + Math.random()*89999999)}`;
};

// ── Export PDF via html2canvas + jsPDF ─────────────
const exportPDF = async (elementRef, filename) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const el = elementRef.current;
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
    pdf.save(filename || 'document-officiel-guinee.pdf');
    return true;
  } catch (err) {
    console.error('PDF export error:', err);
    return false;
  }
};

// ══════════════════════════════════════════════════
//  CNI CEDEAO — design fidèle aux vraies cartes guinéennes
//  Recto : en-tête orange, photo gauche, données droite, drapeau
// ══════════════════════════════════════════════════
const CarteIdentiteCEDEAO = ({ acte, user }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = fmtDateUp(acte?.date_naissance || user?.date_naissance);
  const emis   = fmtDateUp(new Date());
  const expire = addYears(5);
  const nin    = padNIN(acte);
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const genre  = (acte?.genre || 'M').charAt(0).toUpperCase();
  const taille = acte?.taille || '1,75 m';
  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom+'+'+nom)}&background=1a4a2a&color=fff&bold=true&size=200&font-size=0.40`;

  return (
    <div className="cni-card">
      {/* ── RECTO ── */}
      <div className="cni-recto">
        {/* En-tête orange CEDEAO */}
        <div className="cni-header-bar">
          <div className="cni-header-left-col">
            <div className="cni-ecowas-logo">
              {/* Cercle étoilé CEDEAO */}
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="17" fill="#006633" stroke="#FCD116" strokeWidth="2"/>
                <circle cx="18" cy="18" r="11" fill="none" stroke="#FCD116" strokeWidth="1.5"/>
                {[...Array(15)].map((_,i)=>{
                  const a = (i*24-90)*Math.PI/180;
                  const x = 18+14*Math.cos(a), y=18+14*Math.sin(a);
                  return <polygon key={i} points={`${x},${y-2} ${x-1.5},${y+1.5} ${x+1.5},${y+1.5}`} fill="#FCD116" transform={`rotate(${i*24},${x},${y})`}/>;
                })}
                <circle cx="18" cy="18" r="4" fill="#FCD116"/>
              </svg>
            </div>
            <div>
              <div className="cni-republic-name">RÉPUBLIQUE DE GUINÉE</div>
              <div className="cni-card-type-main">CARTE D'IDENTITÉ CEDEAO</div>
              <div className="cni-card-type-sub">ECOWAS IDENTITY CARD / BILHETE DE IDENTIDADE CEDEAO</div>
            </div>
          </div>
          <div className="cni-flag-strip">
            <div style={{ flex:1, background:'#CE1126' }}/>
            <div style={{ flex:1, background:'#FCD116' }}/>
            <div style={{ flex:1, background:'#009A44' }}/>
          </div>
        </div>

        {/* Corps carte */}
        <div className="cni-body-row">
          {/* Colonne photo */}
          <div className="cni-photo-section">
            <div className="cni-photo-frame">
              <img src={avatarSrc} alt="Photo" className="cni-photo-img"
                onError={e => { e.target.style.display='none'; }}
              />
            </div>
            <div className="cni-sig-block">
              <div className="cni-sig-label-txt">Signature / Signature</div>
              <div className="cni-sig-line-draw"/>
            </div>
          </div>

          {/* Colonne données */}
          <div className="cni-data-section">
            <div className="cni-field-row">
              <div className="cni-field">
                <div className="cni-field-label">Nom / Surname</div>
                <div className="cni-field-value large">{nom}</div>
              </div>
              <div className="cni-field right-align">
                <div className="cni-field-label">Sexe / Sex</div>
                <div className="cni-field-value large">{genre}</div>
              </div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Prénom / First name</div>
              <div className="cni-field-value large">{prenom}</div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Nationalité / Nationality</div>
              <div className="cni-field-value">GUINÉENNE</div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Date de naissance / Date of birth</div>
              <div className="cni-field-value">{ddn}</div>
            </div>

            <div className="cni-two-col">
              <div className="cni-field">
                <div className="cni-field-label">Date d'émission / Date of issuance</div>
                <div className="cni-field-value">{emis}</div>
              </div>
              <div className="cni-field right-align">
                <div className="cni-field-label">Taille / Height</div>
                <div className="cni-field-value">{taille}</div>
              </div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Date d'expiration / Date of expiry</div>
              <div className="cni-field-value">{expire}</div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Numéro d'identité / ID number</div>
              <div className="cni-field-value mono">{nin}</div>
            </div>

            <div className="cni-field">
              <div className="cni-field-label">Lieu de délivrance / Place of issuance</div>
              <div className="cni-field-value">{lieu} / M.S.P.C</div>
            </div>
          </div>

          {/* Empreinte */}
          <div className="cni-thumb-col">
            <div className="cni-thumb-box">
              <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
                <ellipse cx="24" cy="30" rx="22" ry="28" stroke="#aaa" strokeWidth="1.5" fill="#f5f5f5"/>
                {[8,12,16,20,24,28,32,36].map((r,i)=>(
                  <ellipse key={i} cx="24" cy="30" rx={r/2+6} ry={r/2+8} stroke="#ccc" strokeWidth="0.8" fill="none"/>
                ))}
              </svg>
            </div>
            <div className="cni-thumb-label">Empreinte</div>
          </div>
        </div>
      </div>

      {/* ── VERSO ── */}
      <div className="cni-verso">
        <div className="cni-verso-top">
          <div className="cni-verso-chip">
            {/* Puce électronique */}
            <svg width="38" height="30" viewBox="0 0 38 30">
              <rect x="4" y="4" width="30" height="22" rx="3" fill="#C8A82C" stroke="#8B7216" strokeWidth="1"/>
              <rect x="10" y="8" width="18" height="14" rx="2" fill="#8B7216"/>
              <line x1="0" y1="10" x2="4" y2="10" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="0" y1="15" x2="4" y2="15" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="0" y1="20" x2="4" y2="20" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="34" y1="10" x2="38" y2="10" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="34" y1="15" x2="38" y2="15" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="34" y1="20" x2="38" y2="20" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="12" y1="4" x2="12" y2="0" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="19" y1="4" x2="19" y2="0" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="26" y1="4" x2="26" y2="0" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="12" y1="26" x2="12" y2="30" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="19" y1="26" x2="19" y2="30" stroke="#8B7216" strokeWidth="1.5"/>
              <line x1="26" y1="26" x2="26" y2="30" stroke="#8B7216" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="cni-verso-authority">
            <div className="cni-verso-gin">GIN</div>
            <div className="cni-verso-dgpn">Le Directeur Général de la Police Nationale</div>
            <div className="cni-verso-republic">RÉPUBLIQUE DE GUINÉE</div>
          </div>
          <div className="cni-flag-strip sm">
            <div style={{ flex:1, background:'#CE1126' }}/>
            <div style={{ flex:1, background:'#FCD116' }}/>
            <div style={{ flex:1, background:'#009A44' }}/>
          </div>
        </div>

        <div className="cni-verso-nin-row">
          <span className="cni-verso-nin-label">NIN</span>
          <span className="cni-verso-nin-val">{nin}</span>
        </div>

        <div className="cni-verso-autorite">Autorité de délivrance</div>
        <div className="cni-verso-autorite-val">Le Directeur Général de la Police Nationale</div>
        <div className="cni-verso-sig-wave">〜〜〜〜〜〜〜〜〜〜〜</div>

        <div className="cni-verso-geo-grid">
          <div className="cni-verso-geo-item">
            <div className="cni-verso-geo-label">Lieu de naissance</div>
            <div className="cni-verso-geo-val">{lieu}</div>
          </div>
          <div className="cni-verso-geo-item">
            <div className="cni-verso-geo-label">Région/Region</div>
            <div className="cni-verso-geo-val">{(acte?.region || lieu)}</div>
            <div className="cni-verso-geo-label" style={{marginTop:6}}>Préfecture</div>
            <div className="cni-verso-geo-val">{(acte?.prefecture || lieu)}</div>
          </div>
          <div className="cni-verso-geo-item">
            <div className="cni-verso-geo-label">Sous-préfecture/Commune</div>
            <div className="cni-verso-geo-val">{(acte?.commune || 'KALOUM').toUpperCase()}</div>
            <div className="cni-verso-geo-label" style={{marginTop:6}}>Quartier/District</div>
            <div className="cni-verso-geo-val">{(acte?.quartier || 'CENTRE').toUpperCase()}</div>
            <div className="cni-verso-geo-label" style={{marginTop:6}}>Secteur/Village</div>
            <div className="cni-verso-geo-val">{acte?.secteur || '01'}</div>
          </div>
        </div>

        {/* MRZ */}
        <div className="cni-mrz-zone">
          <div className="cni-mrz-line">{'I<GIN' + nin.replace(/\D/g,'').substring(0,10).padEnd(10,'<') + '<<<<<<<<<<<<<'}</div>
          <div className="cni-mrz-line">{nin.replace(/\D/g,'').substring(0,9).padEnd(9,'<') + 'GIN' + (acte?.date_naissance ? new Date(acte.date_naissance).toISOString().slice(2,4) : '00') + '0101M' + (new Date().getFullYear()+5).toString().slice(2) + '1231GIN' + '<<<<<'}</div>
          <div className="cni-mrz-line">{(nom+'<<'+prenom+'<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<').substring(0,30)}</div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  PASSEPORT BIOMÉTRIQUE
// ══════════════════════════════════════════════════
const PasseportBiometrique = ({ acte, user, documentId }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM').toUpperCase();
  const ddn    = fmtDateUp(acte?.date_naissance);
  const emis   = fmtDateUp(new Date());
  const expire = addYears(10);
  const numPasseport = `GN${Math.floor(10000000 + Math.random()*89999999)}`;
  const numPerso = padNIN(acte).replace(/\D/g,'').substring(0,10);
  const lieu   = (acte?.lieu_naissance || 'CONAKRY').toUpperCase();
  const genre  = (acte?.genre || 'M').charAt(0).toUpperCase();
  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom+'+'+nom)}&background=3a1a1a&color=fff&bold=true&size=200`;
  const mrz1 = `P<GIN${nom}<<${prenom}`.substring(0,44).padEnd(44,'<');
  const ddnMrz = acte?.date_naissance ? new Date(acte.date_naissance).toISOString().slice(2,4)+String(new Date(acte.date_naissance).getMonth()+1).padStart(2,'0')+String(new Date(acte.date_naissance).getDate()).padStart(2,'0') : '000000';
  const expMrz = (new Date().getFullYear()+10).toString().slice(2)+'0101';
  const mrz2 = (numPasseport + 'GIN' + ddnMrz + genre + expMrz + numPerso.padEnd(14,'<')).substring(0,44);

  return (
    <div className="passport-wrap">
      <div className="passport-cover-band">
        <span style={{letterSpacing:2}}>PASSEPORT / PASSPORT</span>
        <span style={{letterSpacing:1}}>REPUBLIQUE DE GUINEE / REPUBLIC OF GUINEA</span>
      </div>
      <div className="passport-page">
        {/* Watermark */}
        <div className="passport-watermark">🦅</div>

        <div className="passport-header-bar">
          <div>
            <div className="passport-republic-txt">REPUBLIQUE DE GUINEE</div>
            <div className="passport-doc-row">
              <div className="passport-mini">
                <div className="passport-mini-lbl">PASSEPORT/PASSPORT</div>
              </div>
              <div className="passport-mini">
                <div className="passport-mini-lbl">Type/Type</div>
                <div className="passport-mini-val">P</div>
              </div>
              <div className="passport-mini">
                <div className="passport-mini-lbl">Code du Pays/Country Code</div>
                <div className="passport-mini-val">GIN</div>
              </div>
              <div className="passport-mini">
                <div className="passport-mini-lbl">Passeport No/Passport No</div>
                <div className="passport-mini-val bold mono">{numPasseport}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="passport-bio-section">
          {/* Photo + empreinte */}
          <div className="passport-photo-col">
            <div className="passport-photo-frame">
              <img src={avatarSrc} alt="Photo" className="passport-photo-img"/>
            </div>
            <div className="passport-thumb-small">
              <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                <ellipse cx="20" cy="25" rx="18" ry="23" stroke="#aaa" strokeWidth="1.2" fill="#f0f0f0"/>
                {[6,10,14,18,22].map((r,i)=>(
                  <ellipse key={i} cx="20" cy="25" rx={r/2+5} ry={r/2+7} stroke="#ccc" strokeWidth="0.7" fill="none"/>
                ))}
              </svg>
              <div style={{fontSize:7,color:'#888',textAlign:'center',marginTop:2}}>Empreinte</div>
            </div>
          </div>

          {/* Données biographiques */}
          <div className="passport-bio-data">
            <div className="passport-bio-row two">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Nom/Surname</div>
                <div className="passport-bio-val bold">{nom}</div>
              </div>
            </div>
            <div className="passport-bio-row">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Prénom/Given Names</div>
                <div className="passport-bio-val bold">{prenom}</div>
              </div>
            </div>
            <div className="passport-bio-row two">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Nationalité/Nationality</div>
                <div className="passport-bio-val">GUINÉENNE</div>
              </div>
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Numéro Personnel/Personal No</div>
                <div className="passport-bio-val mono">{numPerso}</div>
              </div>
            </div>
            <div className="passport-bio-row two">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Sexe/Sex</div>
                <div className="passport-bio-val">{genre}</div>
              </div>
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Lieu de Naissance/Place of Birth</div>
                <div className="passport-bio-val">{lieu}</div>
              </div>
            </div>
            <div className="passport-bio-row two">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Date de Naissance/Date of Birth</div>
                <div className="passport-bio-val">{ddn}</div>
              </div>
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Autorité/Authority</div>
                <div className="passport-bio-val">DCPAF</div>
              </div>
            </div>
            <div className="passport-bio-row two">
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Date de Délivrance/Date of Issue</div>
                <div className="passport-bio-val">{emis}</div>
              </div>
              <div className="passport-bio-field">
                <div className="passport-bio-lbl">Date d'Expiration/Date of Expiry</div>
                <div className="passport-bio-val">{expire}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone MRZ */}
        <div className="passport-mrz-zone">
          <div className="passport-mrz-line">{mrz1}</div>
          <div className="passport-mrz-line">{mrz2}</div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
//  ACTE DE NAISSANCE OFFICIEL
// ══════════════════════════════════════════════════
const ActeNaissance = ({ acte, user, documentId }) => {
  const nom    = (acte?.nom    || user?.nom    || 'NOM').toUpperCase();
  const prenom = (acte?.prenom || user?.prenom || 'PRÉNOM');
  const lieu   = (acte?.lieu_naissance || 'Conakry').toUpperCase();
  const prefecture = (acte?.region || lieu);
  const commune = (acte?.commune || lieu);
  const ddn    = fmtDate(acte?.date_naissance);
  const numCert = acte?.id_acte || `B${Math.floor(1000000000 + Math.random()*8999999999)}`;
  const numIdNat = padNIN(acte).replace(/\D/g,'');
  const nomPere = (acte?.nom_pere || 'PÈRE').toUpperCase();
  const nomMere = (acte?.nom_mere || 'MÈRE').toUpperCase();
  const genre  = (acte?.genre === 'F' || acte?.genre === 'Féminin') ? 'FÉMININ' : 'MASCULIN';
  const today  = fmtDate(new Date());

  return (
    <div className="acte-outer">
      <div className="acte-inner">
        {/* En-tête codes */}
        <div className="acte-top-codes">
          <div className="acte-barcode-vert">▐▌▌▐▌▐▌▌▐▌▌▐▌▐▌▌▐▌▐▌▌▐</div>
          <div className="acte-refs-right">
            <div>Numéro de certificat : <strong>{numCert}</strong></div>
            <div>République de Guinée</div>
            <div>Numéro d'identification National : <strong>{numIdNat}</strong></div>
          </div>
        </div>

        {/* Titre central */}
        <div className="acte-title-area">
          <div className="acte-eagle">🦅</div>
          <h1 className="acte-h1">Acte de Naissance</h1>
          <div className="acte-h1-en">Certificate of Birth</div>
          <div className="acte-h1-sub">Acte De Naissance</div>
        </div>

        {/* Préfecture */}
        <div className="acte-loc-header">
          <div className="acte-loc-cell border-r">
            <span className="acte-loc-lbl">Ville / Préfecture :</span>
            <span className="acte-loc-val">{prefecture.toUpperCase()}</span>
          </div>
          <div className="acte-loc-cell">
            <span className="acte-loc-lbl">Je Soussigné(e) :</span>
            <span className="acte-loc-val">OFFICIER DE L'ÉTAT CIVIL DÉLÉGUÉ</span>
          </div>
        </div>
        <div className="acte-loc-header" style={{borderTop:0}}>
          <div className="acte-loc-cell">
            <span className="acte-loc-lbl">Commune :</span>
            <span className="acte-loc-val">{commune.toUpperCase()}</span>
          </div>
        </div>

        {/* Section ENFANT */}
        <div className="acte-section-head">ENFANT</div>
        <div className="acte-fields-grid">
          <div className="acte-grid-row full">
            <span className="acte-grid-lbl">Prénom(s) :</span>
            <span className="acte-grid-val">{prenom.toUpperCase()}</span>
          </div>
          <div className="acte-grid-row full">
            <span className="acte-grid-lbl">Nom :</span>
            <span className="acte-grid-val">{nom}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Lieu de naissance Région de : {prefecture.toUpperCase()}</span>
            <span className="acte-grid-val">Sous-préfecture : {(acte?.commune || commune).toUpperCase()}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Date et Heure de Naissance :</span>
            <span className="acte-grid-val">{ddn} {acte?.heure_naissance || '08:00'}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Sexe :</span>
            <span className="acte-grid-val">{genre}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Nationalité :</span>
            <span className="acte-grid-val">GUINÉENNE</span>
          </div>
        </div>

        {/* Section PÈRE */}
        <div className="acte-section-head">PÈRE</div>
        <div className="acte-fields-grid">
          <div className="acte-grid-row full">
            <span className="acte-grid-lbl">Nom :</span>
            <span className="acte-grid-val">{nomPere}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Date de naissance :</span>
            <span className="acte-grid-val">—</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Numéro d'identification :</span>
            <span className="acte-grid-val">NA</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Nationalité :</span>
            <span className="acte-grid-val">GUINÉENNE</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Profession :</span>
            <span className="acte-grid-val">{(acte?.profession_pere || 'CULTIVATEUR').toUpperCase()}</span>
          </div>
        </div>

        {/* Section MÈRE */}
        <div className="acte-section-head">MÈRE</div>
        <div className="acte-fields-grid">
          <div className="acte-grid-row full">
            <span className="acte-grid-lbl">Nom :</span>
            <span className="acte-grid-val">{nomMere}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Nationalité :</span>
            <span className="acte-grid-val">GUINÉENNE</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Profession :</span>
            <span className="acte-grid-val">MÉNAGÈRE</span>
          </div>
        </div>

        {/* Section DÉCLARANT */}
        <div className="acte-section-head">DÉCLARANT</div>
        <div className="acte-fields-grid">
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Nom :</span>
            <span className="acte-grid-val">{nomPere}</span>
          </div>
          <div className="acte-grid-row half">
            <span className="acte-grid-lbl">Lien de Parenté :</span>
            <span className="acte-grid-val">PÈRE</span>
          </div>
        </div>

        {/* APPROUVÉ PAR */}
        <div className="acte-section-head">APPROUVÉ PAR</div>
        <div className="acte-approved-area">
          <div className="acte-justice-img">⚖️ JUSTICE</div>
        </div>

        {/* Pied de page */}
        <div className="acte-footer-row">
          <div className="acte-footer-left-col">
            <div className="acte-footer-date">Dressé le : {today}</div>
            <div className="acte-footer-officier">Officier de l'État Civil Délégué</div>
            <div className="acte-stamp-circle">
              <div className="acte-stamp-inner">Officier de<br/>l'état civil<br/>Délégué</div>
            </div>
          </div>
          <div className="acte-footer-right-col">
            {documentId && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin+'/verify/'+documentId)}`}
                alt="QR Code" className="acte-qr-img"
                crossOrigin="anonymous"
              />
            )}
            <div className="acte-red-seal">🔴</div>
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
  const ddn    = fmtDate(acte?.date_naissance);
  const lieu   = (acte?.lieu_naissance || 'Conakry').toUpperCase();
  const numPC  = Math.floor(10000000 + Math.random()*89999999).toString();
  const today  = fmtDate(new Date());
  const avatarSrc = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom+'+'+nom)}&background=1a2a1a&color=fff&bold=true&size=200`;

  const cats = [
    {c:'A', icon:'🏍', date:null},
    {c:'B', icon:'🚗', date:today},
    {c:'C', icon:'🚛', date:today},
    {c:'D', icon:'🚌', date:today},
    {c:'E', icon:'🚜', date:null},
    {c:'F', icon:'🚁', date:null},
    {c:'G', icon:'🚤', date:null},
  ];

  return (
    <div className="permis-wrap">
      {/* RECTO */}
      <div className="permis-recto-card">
        <div className="permis-header-bar">
          <div className="permis-flag-v">
            <div style={{flex:1,background:'#CE1126'}}/>
            <div style={{flex:1,background:'#FCD116'}}/>
            <div style={{flex:1,background:'#009A44'}}/>
          </div>
          <div className="permis-header-text">
            <div className="permis-republic">RÉPUBLIQUE DE GUINÉE</div>
            <div className="permis-type-txt">PERMIS DE CONDUIRE</div>
          </div>
          <div className="permis-header-ecowas">🌍</div>
        </div>

        <div className="permis-body">
          <div className="permis-photo-col">
            <div className="permis-photo-frame">
              <img src={avatarSrc} alt="Photo" className="permis-photo-img"/>
            </div>
            <div className="permis-sig-label">Signature de titulaire</div>
            <div className="permis-sig-line"/>
          </div>

          <div className="permis-data-col">
            <div className="permis-field"><span className="permis-lbl">Nom:</span><span className="permis-val bold">{nom}</span></div>
            <div className="permis-field"><span className="permis-lbl">Prénom:</span><span className="permis-val bold">{prenom}</span></div>
            <div className="permis-field"><span className="permis-lbl">Date de naissance:</span><span className="permis-val">{ddn}</span></div>
            <div className="permis-field"><span className="permis-lbl">Lieu de naissance:</span><span className="permis-val">{lieu}</span></div>
            <div className="permis-field"><span className="permis-lbl">Lieu de délivrance:</span><span className="permis-val">CONAKRY</span></div>
            <div className="permis-field"><span className="permis-lbl">Date de délivrance:</span><span className="permis-val">{today}</span></div>
            <div className="permis-field">
              <span className="permis-lbl">Numéro de PC:</span>
              <span className="permis-val bold" style={{color:'#CE1126',fontFamily:'monospace'}}>{numPC}</span>
            </div>
            <div className="permis-field"><span className="permis-lbl">Groupe sanguin:</span><span className="permis-val">{acte?.groupe_sanguin||'O+'}</span></div>
          </div>

          <div className="permis-qr-col">
            {documentId && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(window.location.origin+'/verify/'+documentId)}`}
                alt="QR" className="permis-qr-img" crossOrigin="anonymous"
              />
            )}
          </div>
        </div>
      </div>

      {/* VERSO */}
      <div className="permis-verso-card">
        <div className="permis-verso-top-row">
          <div className="permis-verso-num">{numPC}</div>
          <div className="permis-verso-sig-stamp">
            <div className="permis-verso-stamp-circle">
              <div style={{fontSize:7,textAlign:'center',color:'#006D44',lineHeight:1.3}}>Le Directeur<br/>National</div>
            </div>
          </div>
        </div>

        <div className="permis-cat-section">
          <div className="permis-cat-hdr">
            <span style={{flex:1}}>Catégories</span>
            <span>Date d'expiration</span>
          </div>
          {cats.map(c => (
            <div key={c.c} className="permis-cat-row">
              <span className="permis-cat-letter">{c.c}</span>
              <span className="permis-cat-icon">{c.icon}</span>
              <span className="permis-cat-date" style={{flex:1}}>{c.date||''}</span>
              <span className="permis-cat-check">{c.date?'☑':'☐'}</span>
            </div>
          ))}
        </div>

        <div className="permis-verso-footer">
          <span>Date fin de validité : <strong>{addYears(5)}</strong></span>
          {documentId && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin+'/verify/'+documentId)}`}
              alt="QR verso" className="permis-qr-verso-img" crossOrigin="anonymous"
            />
          )}
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

  const printRef   = useRef(null);
  const [docData,  setDocData]   = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAdded,setWalletAdded]= useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId || !user?.id) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();
        setDocData(data);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchDocument();
  }, [documentId, user?.id]);

  // Données fusionnées
  const acte = {
    ...(user?.acteData || {}),
    ...(docData || {}),
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

  // ── PDF réel ──
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setPdfLoading(true);
    const ok = await exportPDF(printRef, `${typeDoc.replace(/\s/g,'-')}-${acte.nom||'document'}.pdf`);
    if (!ok) alert('Erreur lors de la génération du PDF. Utilisez "Imprimer" comme alternative.');
    setPdfLoading(false);
  };

  // ── Impression ──
  const handlePrint = () => window.print();

  const renderDocument = () => {
    const t = typeDoc.toLowerCase();
    if (t.includes('passeport'))                         return <PasseportBiometrique acte={acte} user={user} documentId={documentId}/>;
    if (t.includes('naissance') || t.includes('extrait')) return <ActeNaissance acte={acte} user={user} documentId={documentId}/>;
    if (t.includes('permis'))                            return <PermisConduire acte={acte} user={user} documentId={documentId}/>;
    return <CarteIdentiteCEDEAO acte={acte} user={user} documentId={documentId}/>;
  };

  if (loading) return (
    <Layout>
      <div style={{ padding:64, textAlign:'center' }}>
        <div className="step-loader" style={{ margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--text-faint)', fontSize:14 }}>Génération du document officiel...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="doc-page-wrap animate-fade-in">

        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom:20 }}>
          <span style={{cursor:'pointer'}} onClick={() => navigate('/documents')}>MES DOCUMENTS</span>
          <ChevronRight size={13}/>
          <span className="active">{typeDoc.toUpperCase()}</span>
        </nav>

        <div className="doc-top-bar animate-slide-up">
          <div>
            <h1 className="page-title">Document généré ✅</h1>
            <p className="page-subtitle">Document officiel sécurisé par les services de l'État guinéen — NaissanceChain.</p>
          </div>
          <div className="doc-actions-row">
            <button className="doc-btn-secondary" onClick={handlePrint}>
              <Printer size={15}/> Imprimer
            </button>
            <button className="doc-btn-primary" onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? <Loader size={15} className="spin"/> : <Download size={15}/>}
              {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
            </button>
          </div>
        </div>

        {/* Zone document imprimable */}
        <div className="doc-print-zone animate-slide-up" ref={printRef}>
          <ErrorBoundary>
            {renderDocument()}
          </ErrorBoundary>
        </div>

        {/* Hash blockchain */}
        {acte.hash_blockchain && (
          <div className="doc-hash-bar animate-slide-up">
            <span className="doc-hash-label">🔗 Empreinte NaissanceChain (SHA-256)</span>
            <span className="doc-hash-val">{acte.hash_blockchain}</span>
          </div>
        )}

        {/* Portefeuille numérique */}
        <div className="doc-wallet-panel animate-slide-up">
          <div style={{ display:'flex', alignItems:'flex-start', gap:12, color:'var(--primary)' }}>
            <Info size={18} style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <p style={{ fontWeight:700, margin:0, fontSize:14 }}>Portefeuille numérique</p>
              <p style={{ margin:'4px 0 0', color:'var(--text-muted)', fontSize:13 }}>
                Conservez une copie sécurisée de votre document sur votre appareil.
              </p>
            </div>
          </div>
          <button className="doc-btn-secondary" onClick={() => setWalletOpen(true)}>
            <Smartphone size={15}/> Ajouter au portefeuille
          </button>
        </div>

        {walletOpen && (
          <div className="doc-modal-overlay">
            <div className="doc-modal-card">
              <button className="doc-modal-close" onClick={() => setWalletOpen(false)}><X size={18}/></button>
              {walletAdded ? (
                <div style={{ textAlign:'center' }}>
                  <CheckCircle size={48} color="var(--primary)"/>
                  <h3 style={{ margin:'16px 0 8px' }}>Document ajouté !</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13 }}>Disponible dans votre portefeuille numérique.</p>
                  <button className="doc-btn-primary" style={{ marginTop:16 }} onClick={() => { setWalletAdded(false); setWalletOpen(false); }}>Fermer</button>
                </div>
              ) : (
                <>
                  <h3 style={{ margin:'0 0 10px' }}>Ajouter au portefeuille</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13, margin:'0 0 20px' }}>
                    Cette action conserve une copie chiffrée de votre document sur votre appareil mobile.
                  </p>
                  <button className="doc-btn-primary" onClick={() => setWalletAdded(true)}>
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

const DocumentGenere = () => (
  <ErrorBoundary><DocumentGenereContent/></ErrorBoundary>
);
export default DocumentGenere;
