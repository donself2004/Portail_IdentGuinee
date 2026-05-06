import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, MapPin, FileText, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

// ── Page détail d'une demande ──
export const AdminDemandeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [acte, setActe] = useState(null);

  // Données simulées par défaut (calquées sur la maquette)
  const defaultData = {
    id: `REG-2024-${id || '8812'}`,
    nom: 'Mamadou Diallo',
    date_naissance: '14 Mai 1992',
    lieu_naissance: 'Conakry, Guinée',
    profession: 'Ingénieur Logiciel',
    avatar: 'https://ui-avatars.com/api/?name=Mamadou+Diallo&background=1a3a2a&color=fff&size=128',
    confiance: 100,
    statut: 'DOSSIER PRIORITAIRE',
    hash: '0x7F3A...B291',
    id_acte: `GN-294-A-X`,
    audit: [
      { label: 'Validation Finale Automation', time: "Aujourd'hui, 09:42 — Système Central", dot: 'full' },
      { label: 'Correspondance Biométrique Établie', time: "Aujourd'hui, 09:41 — Module BioCheck v2", dot: 'mid' },
      { label: 'Soumission du dossier', time: 'Hier, 18:20 — Portail Citoyen (Mobile)', dot: 'empty' },
    ]
  };

  useEffect(() => {
    const fetchActe = async () => {
      const { data } = await supabase
        .from('naissancechain')
        .select('*')
        .limit(1)
        .single();
      if (data) setActe(data);
    };
    fetchActe();
  }, [id]);

  const d = acte ? {
    ...defaultData,
    nom: `${acte.prenom} ${acte.nom}`,
    date_naissance: acte.date_naissance,
    lieu_naissance: `${acte.lieu_naissance}, Guinée`,
    id_acte: acte.id_acte,
    hash: acte.hash_blockchain?.substring(0, 12) + '...' || defaultData.hash,
  } : defaultData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      {/* Header page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <button onClick={() => navigate('/admin/demandes')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 13, marginBottom: 8, padding: 0 }}>
            <ArrowLeft size={15} /> Retour aux demandes
          </button>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: '0 0 4px' }}>
            DÉTAILS DE LA DEMANDE #{d.id}
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0a2e1a', margin: 0 }}>{d.nom}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span style={{
              background: '#0a2e1a', color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '4px 10px', borderRadius: 4, letterSpacing: 0.8
            }}>{d.statut}</span>
            <span style={{ fontSize: 12, color: '#888' }}>Mis à jour il y a 12 minutes par IA Engine v4.2</span>
          </div>
        </div>
        <button onClick={handlePrint} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#333'
        }}>
          <Printer size={16} /> Imprimer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 20 }}>
        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profil citoyen */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <img src={d.avatar} alt={d.nom} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  background: '#006D44', borderRadius: '50%', padding: 4,
                  border: '2px solid #fff'
                }}>
                  <CheckCircle size={12} color="#fff" fill="#fff" />
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0a2e1a', margin: '0 0 2px' }}>Candidat ID-{id || '8812'}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Vérification de citoyenneté</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'NOM COMPLET', val: d.nom },
                { label: 'DATE DE NAISSANCE', val: d.date_naissance },
                { label: 'LIEU DE NAISSANCE', val: d.lieu_naissance },
                { label: 'PROFESSION DÉCLARÉE', val: d.profession },
              ].map((f, i) => (
                <div key={i}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: '0 0 3px' }}>{f.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0a2e1a', margin: 0 }}>{f.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Localisation */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MapPin size={16} color="#006D44" />
              <p style={{ fontWeight: 700, fontSize: 14, color: '#0a2e1a', margin: 0 }}>Localisation Géographique</p>
            </div>
            {(() => {
              const GEO_MAP = {
                'Conakry': [9.537, -13.677], 'Labé': [11.318, -12.287],
                'Kankan': [10.385, -9.303], 'Kindia': [10.066, -12.870],
                'Faranah': [10.040, -10.745], 'Nzérékoré': [7.756, -8.818],
                'Mamou': [10.376, -12.086], 'Boké': [10.933, -14.283],
                'Dalaba': [10.686, -12.247], 'Guinée': [10.7, -10.9],
              };
              const place = d.lieu_naissance || 'Guinée';
              const coords = GEO_MAP[place.split(',')[0].trim()] || GEO_MAP['Guinée'];
              const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords[1]-1.2},${coords[0]-1.2},${coords[1]+1.2},${coords[0]+1.2}&layer=mapnik&marker=${coords[0]},${coords[1]}`;
              return (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #ddd', height: 160 }}>
                  <iframe
                    title="Carte géographique"
                    src={mapUrl}
                    width="100%" height="160"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                  />
                </div>
              );
            })()}
            <p style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 }}>
              📍 {d.lieu_naissance}
            </p>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Résultat de l'analyse */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 10 }}>
                  <CheckCircle size={24} color="#006D44" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e1a', margin: '0 0 4px' }}>Résultat de l'analyse</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#006D44', fontWeight: 600 }}>● Validé automatiquement</span>
                    <span style={{
                      background: '#f0fdf4', border: '1px solid #006D44',
                      borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#006D44'
                    }}>✓ SCEAU NUMÉRIQUE</span>
                  </div>
                </div>
              </div>
              <div style={{
                background: '#fff0f0', border: '1px solid #CE1126',
                borderRadius: 10, padding: '8px 14px', textAlign: 'center'
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#CE1126', margin: '0 0 2px', letterSpacing: 0.5 }}>CERTIFIÉ PAR LE</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#CE1126', margin: 0 }}>SYSTÈME</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Métrique de confiance */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: '0 0 10px' }}>MÉTRIQUE DE CONFIANCE</p>
                <p style={{ fontSize: 44, fontWeight: 900, color: '#0a2e1a', margin: '0 0 4px' }}>{d.confiance}%</p>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>Correspondance</p>
                <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${d.confiance}%`, height: '100%', background: '#006D44', borderRadius: 3 }} />
                </div>
              </div>

              {/* Vérification biométrique */}
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1, margin: '0 0 10px' }}>VÉRIFICATION BIOMÉTRIQUE</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 8 }}>
                    <User size={22} color="#006D44" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0a2e1a', margin: '0 0 2px' }}>Empreintes vérifiées</p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Base de données biométrique</p>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Pièces jointes */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Certificat de Naissance', sub: 'Digital_Copy_RNN_8812.pdf', icon: <FileText size={20} color="#006D44" /> },
                { label: "Ancienne Carte d'Identité", sub: 'Scan_OCR_Verified.jpg', icon: <User size={20} color="#006D44" /> },
              ].map((doc, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  border: '1px solid #eee', borderRadius: 12, background: '#fafafa',
                  cursor: 'pointer', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 8 }}>{doc.icon}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#0a2e1a', margin: '0 0 2px' }}>{doc.label}</p>
                      <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{doc.sub}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: '#aaa' }}>👁</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journal d'audit */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span>🕐</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0a2e1a', margin: 0 }}>Journal d'audit du dossier</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {d.audit.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: i === 0 ? '#0a2e1a' : i === 1 ? '#888' : 'transparent',
                    border: i === 2 ? '2px solid #ccc' : 'none'
                  }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#0a2e1a', margin: '0 0 2px' }}>{entry.label}</p>
                    <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ── Liste de toutes les demandes ──
const AdminDemandes = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);

  const FALLBACK = [
    { id: 'd1', nom: 'Mamadou Diallo',    lieu: 'Conakry',   statut: 'valide',   id_doc: 'GN-294-A-X', avatar: 'https://ui-avatars.com/api/?name=Mamadou+Diallo&background=006D44&color=fff' },
    { id: 'd2', nom: 'Fatoumata Camara',  lieu: 'Labé',      statut: 'rejete',   id_doc: 'GN-213-B-L', avatar: 'https://ui-avatars.com/api/?name=Fatoumata+Camara&background=CE1126&color=fff' },
    { id: 'd3', nom: 'Ibrahima Sory Sow', lieu: 'Kankan',    statut: 'valide',   id_doc: 'GN-882-B-Z', avatar: 'https://ui-avatars.com/api/?name=Ibrahima+Sow&background=006D44&color=fff' },
    { id: 'd4', nom: 'Aissatou Bah',      lieu: 'Nzérékoré', statut: 'en_cours', id_doc: 'GN-571-C-K', avatar: 'https://ui-avatars.com/api/?name=Aissatou+Bah&background=FCD116&color=333' },
    { id: 'd5', nom: 'Alpha Condé Barry', lieu: 'Kindia',    statut: 'valide',   id_doc: 'GN-193-D-M', avatar: 'https://ui-avatars.com/api/?name=Alpha+Barry&background=006D44&color=fff' },
  ];

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const { data: docs } = await supabase
          .from('naissancechain')
          .select('id, id_acte, nom, prenom, lieu_naissance, hash_blockchain')
          .order('created_at', { ascending: false })
          .limit(20);

        if (docs && docs.length > 0) {
          const mapped = docs.map((d, i) => {
            // Statut simulé réaliste basé sur hash_blockchain
            let statut = 'valide';
            if (!d.hash_blockchain) statut = 'en_cours';
            else if (i % 7 === 3) statut = 'rejete';
            const bg = statut === 'valide' ? '006D44' : statut === 'rejete' ? 'CE1126' : 'FCD116';
            const tc = statut === 'en_cours' ? '333' : 'fff';
            return {
              id: d.id,
              nom: `${d.prenom} ${d.nom}`,
              lieu: d.lieu_naissance || 'Guinée',
              statut,
              id_doc: d.id_acte || `GN-${i + 100}`,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.prenom + '+' + d.nom)}&background=${bg}&color=${tc}`,
            };
          });
          setDemandes(mapped);
        } else {
          setDemandes(FALLBACK);
        }
      } catch { setDemandes(FALLBACK); }
    };
    fetchDemandes();
  }, []);

  const statutConfig = {
    valide: { label: 'Validé automatiquement', bg: '#f0fdf4', color: '#006D44', icon: <CheckCircle size={13} /> },
    rejete: { label: 'Rejeté automatiquement', bg: '#fff0f0', color: '#CE1126', icon: <span>✕</span> },
    en_cours: { label: 'En cours d\'analyse', bg: '#fffbeb', color: '#d97706', icon: <span>⏳</span> },
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0a2e1a', margin: '0 0 6px' }}>Toutes les demandes</h1>
        <p style={{ color: '#666', fontSize: 14, margin: 0 }}>Traitement automatique — aucune intervention humaine</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
              {['Citoyen', 'Lieu', 'ID Document', 'Statut', 'Action'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 0.8 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(demandes.length > 0 ? demandes : FALLBACK).map((d, i) => {
              const sc = statutConfig[d.statut] || statutConfig.en_cours;
              return (
                <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fdf9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate(`/admin/demandes/${d.id}`)}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={d.avatar} alt={d.nom} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0a2e1a' }}>{d.nom}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#666' }}>{d.lieu}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#0a2e1a' }}>
                    {d.motif || d.id_doc}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 12 }}>
                      {sc.icon} {sc.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: '#006D44', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Voir détail
                    </button>
                    <a href={'/verify/' + d.id} target='_blank' rel='noreferrer' style={{ background: '#f0fdf4', color: '#006D44', border: '1px solid #c3e6cb', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={12} /> Vérifier
                    </a>
                  </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminDemandes;
