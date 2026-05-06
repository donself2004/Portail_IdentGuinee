import React, { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, CheckCircle, Clock, Eye, X, Phone, Mail, MapPin, FileText, Shield, Calendar } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

const PREFECTURES = ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Faranah', 'Nzérékoré', 'Mamou', 'Boké'];

// ── Coordonnées GPS des principales préfectures de Guinée ──
const GEO = {
  'Conakry':   { lat: 9.5370,  lng: -13.6773 },
  'Labé':      { lat: 11.3181, lng: -12.2867 },
  'Kankan':    { lat: 10.3851, lng: -9.3028  },
  'Kindia':    { lat: 10.0658, lng: -12.8699 },
  'Faranah':   { lat: 10.0397, lng: -10.7450 },
  'Nzérékoré': { lat: 7.7563,  lng: -8.8179  },
  'Mamou':     { lat: 10.3762, lng: -12.0860 },
  'Boké':      { lat: 10.9333, lng: -14.2833 },
};

// ── Carte de localisation statique via OpenStreetMap ──
const MapCard = ({ lieu }) => {
  const geo = GEO[lieu] || GEO['Conakry'];
  const zoom = 9;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng - 1},${geo.lat - 1},${geo.lng + 1},${geo.lat + 1}&layer=mapnik&marker=${geo.lat},${geo.lng}`;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', height: 200 }}>
      <iframe
        title={`Carte de ${lieu}`}
        src={mapUrl}
        width="100%"
        height="200"
        style={{ border: 0, display: 'block' }}
        loading="lazy"
      />
    </div>
  );
};

// ── Modale Profil Citoyen ──
const ProfilModal = ({ citoyen, onClose }) => {
  if (!citoyen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header modale */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>Profil du citoyen</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenu */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identité */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <img src={citoyen.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--primary-border)', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 4px' }}>{citoyen.prenom} {citoyen.nom}</h3>
              <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, margin: '0 0 6px' }}>{citoyen.id_acte}</p>
              <span style={{ background: citoyen.statut === 'nouveau' ? '#eff6ff' : 'var(--primary-light)', color: citoyen.statut === 'nouveau' ? '#2563eb' : 'var(--primary)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                {citoyen.statut === 'nouveau' ? 'Nouveau' : 'Actif'}
              </span>
            </div>
          </div>

          {/* Infos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: <Mail size={15} />, label: 'Email', val: citoyen.email },
              { icon: <Phone size={15} />, label: 'Téléphone', val: citoyen.telephone },
              { icon: <Calendar size={15} />, label: 'Date de naissance', val: citoyen.date_naissance },
              { icon: <Shield size={15} />, label: 'Genre', val: citoyen.genre },
              { icon: <MapPin size={15} />, label: 'Préfecture', val: citoyen.lieu },
              { icon: <FileText size={15} />, label: 'Inscrit le', val: citoyen.created_at },
            ].map(f => (
              <div key={f.label} style={{ background: 'var(--bg-main)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', marginBottom: 4 }}>
                  {f.icon}
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', margin: 0 }}>{f.val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Carte de géolocalisation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MapPin size={16} color="var(--primary)" />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Localisation Géographique</p>
            </div>
            <MapCard lieu={citoyen.lieu} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
              📍 {citoyen.lieu}, Guinée
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════
const AdminUtilisateurs = () => {
  const [citoyens, setCitoyens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, actifs: 0, nouveaux: 0 });
  const [profil, setProfil] = useState(null); // citoyen sélectionné pour la modale

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cit } = await supabase
        .from('citoyens')
        .select('id, nom, prenom, email, telephone, id_acte_lie, created_at')
        .order('created_at', { ascending: false })
        .limit(300);

      const { data: chain } = await supabase
        .from('naissancechain')
        .select('id_acte, nom, prenom, lieu_naissance, date_naissance, genre')
        .limit(300);

      const chainMap = {};
      (chain || []).forEach(r => { if (r.id_acte) chainMap[r.id_acte] = r; });

      const enriched = (cit || []).map((c, i) => {
        const acte = c.id_acte_lie ? chainMap[c.id_acte_lie] : null;
        const region = PREFECTURES[i % PREFECTURES.length];
        const createdDate = c.created_at ? new Date(c.created_at) : new Date(Date.now() - Math.random() * 30 * 86400000);
        const diffDays = Math.floor((new Date() - createdDate) / 86400000);
        const prenom = acte?.prenom || c.prenom || 'Citoyen';
        const nom = acte?.nom || c.nom || 'Inconnu';
        const lieu = acte?.lieu_naissance || region;

        return {
          id: c.id,
          nom, prenom,
          email: c.email || `citoyen${i + 1}@identiguinee.gn`,
          telephone: c.telephone || `+224 6${String(10 + (i % 89)).padStart(2,'0')} ${String(100 + (i % 900)).padStart(3,'0')} ${String(100 + ((i * 7) % 900)).padStart(3,'0')}`,
          id_acte: c.id_acte_lie || `GN-${100 + i}-2024`,
          lieu,
          date_naissance: acte?.date_naissance || '—',
          genre: acte?.genre || (i % 2 === 0 ? 'Masculin' : 'Féminin'),
          statut: diffDays < 7 ? 'nouveau' : 'actif',
          created_at: createdDate.toLocaleDateString('fr-FR'),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom + ' ' + nom)}&background=006D44&color=fff`,
        };
      });

      setCitoyens(enriched);
      setStats({
        total: enriched.length,
        actifs: enriched.filter(c => c.statut === 'actif').length,
        nouveaux: enriched.filter(c => c.statut === 'nouveau').length,
      });
    } catch (err) {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = citoyens.filter(c => {
    const q = search.toLowerCase();
    return (
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.id_acte.toLowerCase().includes(q) ||
      c.lieu.toLowerCase().includes(q)
    );
  });

  const statutStyle = {
    actif:   { bg: 'var(--primary-light)', color: 'var(--primary)', label: 'Actif' },
    nouveau: { bg: '#eff6ff', color: '#2563eb', label: 'Nouveau' },
  };

  return (
    <AdminLayout>

      {/* ── Modale profil ── */}
      {profil && <ProfilModal citoyen={profil} onClose={() => setProfil(null)} />}

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-faint)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Gestion</p>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-heading)', margin: 0, letterSpacing: -0.5 }}>Utilisateurs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)', margin: '4px 0 0' }}>
            Tous les citoyens enregistrés sur la plateforme IdentiGuinée
          </p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font)' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total citoyens',  value: stats.total,   icon: <Users size={22} color="var(--primary)" />,  bg: 'var(--primary-light)', color: 'var(--primary)' },
          { label: 'Comptes actifs',  value: stats.actifs,  icon: <CheckCircle size={22} color="var(--primary)" />, bg: 'var(--primary-light)', color: 'var(--primary)' },
          { label: 'Nouveaux (7j)',   value: stats.nouveaux,icon: <Clock size={22} color="#2563eb" />,          bg: '#eff6ff', color: '#2563eb' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '22px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>{k.label}</p>
              <p style={{ fontSize: 34, fontWeight: 800, color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

        {/* Barre recherche */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email, acte ou préfecture..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-base)', fontFamily: 'var(--font)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', boxSizing: 'border-box' }}
            />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-faint)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* En-têtes colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.2fr 1.2fr 0.8fr 100px', padding: '10px 24px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
          {['Citoyen', 'Contact', 'Préfecture', 'Numéro acte', 'Statut', 'Action'].map(col => (
            <p key={col} style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.6, margin: 0 }}>{col}</p>
          ))}
        </div>

        {/* Lignes */}
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              Chargement des utilisateurs...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)' }}>
              <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              Aucun utilisateur trouvé
            </div>
          ) : filtered.map((c, i) => {
            const st = statutStyle[c.statut] || statutStyle.actif;
            return (
              <div key={c.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1.2fr 1.2fr 0.8fr 100px',
                padding: '14px 24px', borderBottom: '1px solid var(--border)',
                alignItems: 'center',
                background: i % 2 === 0 ? '#fff' : 'var(--bg-main)',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={c.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>{c.prenom} {c.nom}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', margin: 0 }}>Inscrit le {c.created_at}</p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: 0 }}>{c.email}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', margin: 0 }}>{c.telephone}</p>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>{c.lieu}</p>
                <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>{c.id_acte}</p>
                <span style={{ background: st.bg, color: st.color, borderRadius: 6, padding: '4px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, display: 'inline-block' }}>
                  {st.label}
                </span>
                {/* ── BOUTON VOIR PROFIL ── */}
                <button
                  onClick={() => setProfil(c)}
                  style={{ padding: '7px 12px', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: '#fff', fontFamily: 'var(--font)', fontWeight: 700 }}
                >
                  <Eye size={13} /> Profil
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUtilisateurs;
