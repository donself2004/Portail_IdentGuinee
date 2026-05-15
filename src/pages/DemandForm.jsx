/**
 * DemandForm.jsx — Formulaire simplifié
 * Étape unique : Type de document + données personnelles pré-remplies + confirmation
 * Plus de section rendez-vous, justificatifs, paiement complexe
 */
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, FileText, Car, FileCheck, Shield, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './DemandForm.css';

const DOCUMENTS = [
  {
    key: "Carte d'Identité",
    code: 'C',
    label: "Carte Nationale d'Identité Biométrique",
    description: "Document d'identité officiel CEDEAO, valable 10 ans",
    icon: <CreditCard size={22} />,
    prix: '100 000 GNF',
    prixNum: 50000,
    couleur: '#9B1B5A',
    delai: '72h ouvrables',
  },
  {
    key: "Passeport",
    code: 'P',
    label: "Passeport Biométrique",
    description: "Document de voyage international, valable 10 ans",
    icon: <FileText size={22} />,
    prix: '500 000 GNF',
    prixNum: 500000,
    couleur: '#0054A6',
    delai: '15 jours ouvrables',
  },
  {
    key: "Extrait de Naissance",
    code: 'A',
    label: "Extrait d'Acte de Naissance",
    description: "Extrait officiel du registre d'état civil",
    icon: <FileCheck size={22} />,
    prix: '5 000 GNF',
    prixNum: 5000,
    couleur: '#7B2D8B',
    delai: '24h ouvrables',
  },
  {
    key: "Permis de Conduire",
    code: 'D',
    label: "Permis de Conduire",
    description: "Autorisation officielle de conduire un véhicule",
    icon: <Car size={22} />,
    prix: '350 000 GNF',
    prixNum: 350000,
    couleur: '#B45309',
    delai: '7 jours ouvrables',
  },
];

// Génère un hash SHA-256 simulé
const genHash = (str) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return '0x' + Math.abs(h).toString(16).padStart(8,'0') + Math.abs(h * 0x9e3779b9).toString(16).padStart(8,'0') + Math.abs(h ^ 0xdeadbeef).toString(16).padStart(8,'0');
};

const DemandForm = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const preselected = location.state?.documentType || "Carte d'Identité";
  const [selectedDoc, setSelectedDoc] = useState(preselected);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [acteData, setActeData]       = useState(null);

  // Charger les données de l'acte depuis NaissanceChain
  useEffect(() => {
    const loadActe = async () => {
      if (!user?.id_acte_lie && !user?.matricule) return;
      const idActe = user.id_acte_lie || user.matricule;
      const { data } = await supabase
        .from('naissancechain')
        .select('*')
        .eq('id_acte', idActe)
        .maybeSingle();
      if (data) setActeData(data);
    };
    loadActe();
  }, [user?.id_acte_lie, user?.matricule]);

  const docConfig = DOCUMENTS.find(d => d.key === selectedDoc) || DOCUMENTS[0];

  // Infos affichées (depuis acteData ou user)
  const nom    = acteData?.nom    || user?.nom    || '—';
  const prenom = acteData?.prenom || user?.prenom || '—';
  const ddn    = acteData?.date_naissance
    ? new Date(acteData.date_naissance).toLocaleDateString('fr-FR')
    : user?.date_naissance || '—';
  const lieu   = acteData?.lieu_naissance || user?.lieu_naissance || '—';
  const genre  = acteData?.genre  || user?.genre  || '—';
  const idActe = user?.id_acte_lie || user?.matricule || '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!user?.id) throw new Error('Session expirée. Reconnectez-vous.');
      if (!idActe || idActe === '—') throw new Error('Numéro d\'acte de naissance introuvable dans votre profil.');

      const hashSrc  = `${idActe}-${docConfig.code}-${Date.now()}`;
      const hashDoc  = genHash(hashSrc);
      const statusKey = `${docConfig.code}:TERMINEE`;

      // Vérifier si doc déjà existant (par citoyen_id OU id_acte)
      let existing = null;
      if (user.id) {
        const { data: e1 } = await supabase
          .from('documents_certifies')
          .select('id, statut_demande')
          .eq('citoyen_id', user.id)
          .eq('statut', 'GENERE')
          .order('date_generation', { ascending: false })
          .limit(20);
        if (e1) {
          existing = e1.find(d => d.statut_demande && d.statut_demande.startsWith(docConfig.code + ':'));
        }
      }

      if (existing) {
        navigate('/document-genere', {
          state: { documentId: existing.id, type_document: docConfig.key }
        });
        return;
      }

      // Colonnes réelles de documents_certifies:
      // id, id_acte, citoyen_id, statut_demande, hash_document, qr_code_url, pdf_url, date_generation, statut, created_at
      const { data: inserted, error: insertErr } = await supabase
        .from('documents_certifies')
        .insert([{
          citoyen_id:      user.id,
          id_acte:         idActe,
          statut:          'GENERE',
          statut_demande:  statusKey,
          hash_document:   hashDoc,
          date_generation: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Notifier
      addNotification({
        title: `${docConfig.label} généré !`,
        subtitle: `Votre document est disponible dans "Mes documents".`,
        type: 'success',
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/document-genere', {
          state: { documentId: inserted.id, type_document: docConfig.key }
        });
      }, 1200);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Une erreur est survenue. Réessayez.');
    }
    setSubmitting(false);
  };

  if (success) return (
    <Layout>
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ width: 72, height: 72, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={36} color="#006D44" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0a2e1a', margin: '0 0 10px' }}>Document en cours de génération</h2>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>Vous allez être redirigé vers votre document...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto' }} className="animate-fade-in">
        {/* Fil d'Ariane */}
        <nav className="breadcrumbs animate-slide-up" style={{ marginBottom: 20 }}>
          <span>Tableau de bord</span>
          <ChevronRight size={13} />
          <span className="active">Nouvelle demande</span>
        </nav>

        <h1 className="page-title animate-slide-up">Nouvelle demande</h1>
        <p className="page-subtitle animate-slide-up" style={{ marginBottom: 28 }}>
          Sélectionnez le document souhaité. Vos données personnelles sont vérifiées depuis NaissanceChain.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#CE1126', fontWeight: 600 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── ÉTAPE 1 : Choisir le type de document ── */}
          <div className="form-card animate-slide-up" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#006D44" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a2e1a' }}>Type de document</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Choisissez le document que vous souhaitez obtenir</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {DOCUMENTS.map(doc => {
                const isSelected = selectedDoc === doc.key;
                return (
                  <div
                    key={doc.key}
                    onClick={() => setSelectedDoc(doc.key)}
                    style={{
                      border: isSelected ? `2px solid ${doc.couleur}` : '2px solid #e8e8e8',
                      borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                      background: isSelected ? `${doc.couleur}08` : '#fff',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 22, height: 22, background: doc.couleur,
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckCircle size={13} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      width: 42, height: 42, background: `${doc.couleur}15`,
                      borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: doc.couleur, marginBottom: 10
                    }}>
                      {doc.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e1a', marginBottom: 4 }}>{doc.label}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 10, lineHeight: 1.4 }}>{doc.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: doc.couleur }}>{doc.prix}</span>
                      <span style={{ fontSize: 10, color: '#aaa' }}>⏱ {doc.delai}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ÉTAPE 2 : Données personnelles (lecture seule) ── */}
          <div className="form-card animate-slide-up" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color="#006D44" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0a2e1a' }}>Identité vérifiée — NaissanceChain</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Données extraites automatiquement de votre acte de naissance</p>
              </div>
            </div>

            {/* Badge vérification */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
              <CheckCircle size={15} color="#006D44" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#006D44' }}>
                Acte vérifié : {idActe}
              </span>
              {acteData?.hash_blockchain && (
                <span style={{ fontSize: 10, color: '#666', marginLeft: 'auto', fontFamily: 'monospace' }}>
                  {acteData.hash_blockchain.substring(0, 18)}...
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Nom', value: nom.toUpperCase() },
                { label: 'Prénom(s)', value: prenom },
                { label: 'Date de naissance', value: ddn },
                { label: 'Lieu de naissance', value: lieu },
                { label: 'Genre', value: genre },
                { label: 'Numéro d\'acte', value: idActe },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                  <div style={{
                    padding: '10px 14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8, fontSize: 14, fontWeight: 600,
                    color: '#0a2e1a',
                    fontFamily: label === 'Numéro d\'acte' ? 'monospace' : 'inherit'
                  }}>
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RÉCAPITULATIF ── */}
          <div style={{ background: '#0a2e1a', borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Récapitulatif de la demande</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{docConfig.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Pour : {prenom} {nom.toUpperCase()} · Acte : {idActe}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FCD116' }}>{docConfig.prix}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Délai : {docConfig.delai}</div>
              </div>
            </div>
          </div>

          {/* ── BOUTON SOUMETTRE ── */}
          <button type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '16px 24px',
              background: submitting ? '#aaa' : 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: submitting ? 'wait' : 'pointer',
              fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity 0.2s',
              marginBottom: 40,
            }}
          >
            {submitting ? (
              <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Génération en cours...</>
            ) : (
              <><CheckCircle size={18} /> Confirmer et générer le document</>
            )}
          </button>

        </form>
      </div>
    </Layout>
  );
};

export default DemandForm;
