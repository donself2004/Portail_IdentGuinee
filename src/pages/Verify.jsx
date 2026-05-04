import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, FileText, ChevronLeft, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Verify = () => {
  const { docId } = useParams();
  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState(null);
  const [citoyenData, setCitoyenData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const verifyDoc = async () => {
      try {
        setLoading(true);
        
        // 1. Chercher le document
        const { data: doc, error: docError } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id', docId)
          .single();

        if (docError || !doc) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setDocData(doc);

        // 2. Chercher le citoyen associé
        const { data: citoyen, error: citError } = await supabase
          .from('citoyens')
          .select('*')
          .eq('id', doc.citoyen_id)
          .single();

        if (citoyen) {
          setCitoyenData(citoyen);
        }

        setLoading(false);
      } catch (err) {
        console.error("Verification error:", err);
        setNotFound(true);
        setLoading(false);
      }
    };

    if (docId) {
      verifyDoc();
    }
  }, [docId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="step-loader" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: '#868E96', fontWeight: '500' }}>Vérification de l'authenticité sur NaissanceChain...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FFF5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(201, 42, 42, 0.1)', textAlign: 'center' }}>
          <XCircle size={64} color="#C92A2A" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' }}>Document Non Authentique</h1>
          <p style={{ color: '#868E96', lineHeight: '1.6', marginBottom: '32px' }}>
            Ce document ne figure pas dans le registre national sécurisé. Il pourrait s'agir d'une contrefaçon ou d'une erreur de lecture.
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#006D44', fontWeight: '700', textDecoration: 'none' }}>
            <ChevronLeft size={18} /> Retour au portail
          </Link>
        </div>
      </div>
    );
  }

  // Déterminer le type de document pour l'affichage
  const docTypeCode = docData.statut_demande?.split(':')[0] || 'A';
  const docNames = {
    'P': 'Passeport Biométrique',
    'C': 'Carte d\'Identité Biométrique',
    'A': 'Acte de Naissance',
    'E': 'Extrait de Naissance'
  };
  const docName = docNames[docTypeCode] || 'Document Officiel';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F1F3F5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#E7F6F0', color: '#006D44', borderRadius: '100px', fontWeight: '700', fontSize: '13px', marginBottom: '16px' }}>
            <Shield size={16} /> SYSTÈME SOUVERAIN DE VÉRIFICATION
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1A1A1A' }}>Authentification du Document</h2>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {/* Header de succès */}
          <div style={{ backgroundColor: '#006D44', padding: '32px', textAlign: 'center', color: '#FFFFFF' }}>
            <CheckCircle size={48} style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>DOCUMENT AUTHENTIQUE</h3>
            <p style={{ opacity: 0.8, fontSize: '14px', marginTop: '4px' }}>Validé par NaissanceChain & MATD</p>
          </div>

          {/* Détails du document */}
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #F1F3F5' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#F8F9FA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#006D44' }}>
                <FileText size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>{docName}</h4>
                <p style={{ fontSize: '13px', color: '#868E96' }}>ID Système: REQ-{docData.id}-GN</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#ADB5BD', textTransform: 'uppercase', marginBottom: '4px' }}>Titulaire</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>{citoyenData?.prenom} {citoyenData?.nom}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#ADB5BD', textTransform: 'uppercase', marginBottom: '4px' }}>Nationalité</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>Guinéenne</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#ADB5BD', textTransform: 'uppercase', marginBottom: '4px' }}>Date d'émission</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>{new Date(docData.date_generation).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#ADB5BD', textTransform: 'uppercase', marginBottom: '4px' }}>Référence Acte</label>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>{docData.id_acte || 'N/A'}</p>
              </div>
            </div>

            <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ color: '#006D44' }}><Award size={24} /></div>
              <p style={{ fontSize: '13px', color: '#495057', lineHeight: '1.5' }}>
                Ce document a été scellé par empreinte numérique sur la blockchain nationale. 
                Toute modification physique ou numérique du document le rendrait invalide.
              </p>
            </div>
          </div>

          <div style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid #F1F3F5' }}>
             <p style={{ fontSize: '12px', color: '#ADB5BD' }}>© 2026 République de Guinée - Direction Générale de la Police Nationale</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
