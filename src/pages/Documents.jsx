import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ChevronRight, FileCode2, Download, Shield } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabase';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user?.id) {
        setDocuments([]);
        return;
      }

      const { data } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut, statut_demande, created_at, date_generation, pdf_url, qr_code_url, hash_document')
        .eq('citoyen_id', user.id)
        .eq('statut', 'GENERE')
        .order('created_at', { ascending: false });

      setDocuments(data || []);
    };

    fetchDocuments();
  }, [user?.id]);

  const formatDate = (dateValue) =>
    new Date(dateValue).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="processing-content animate-fade-in" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
          <nav className="breadcrumbs animate-slide-up">
            <span>TABLEAU DE BORD</span> <ChevronRight size={14} />
            <span className="active">MES DOCUMENTS</span>
          </nav>
          
          <h2 className="page-title animate-slide-up" style={{ marginTop: '16px', marginBottom: '8px' }}>
            Vos documents sécurisés
          </h2>
          <p className="page-subtitle animate-slide-up" style={{ marginBottom: '32px' }}>
            Retrouvez tous vos documents officiels certifiés par NaissanceChain.
          </p>

          <div className="services-grid animate-slide-up" style={{ width: '100%' }}>
            {documents.length === 0 && (
              <div className="form-card" style={{ padding: '24px' }}>
                <p style={{ fontSize: '14px', color: '#868E96' }}>
                  Aucun document généré pour le moment.
                </p>
              </div>
            )}
            {documents.map((doc) => {
              const rawStatutDemande = doc.statut_demande || '';
              const hasPrefix = rawStatutDemande.includes(':');
              const docTypeCode = hasPrefix ? rawStatutDemande.split(':')[0] : 'A';
              
              const docNames = {
                'P': 'Passeport GN',
                'C': 'Carte d\'Identité GN',
                'A': 'Acte de Naissance GN',
                'E': 'Extrait de Naissance GN',
                'D': 'Permis de Conduire GN',
                'G': 'Carte Grise GN',
                'J': 'Casier Judiciaire GN',
                'N': 'Certificat de Nationalité GN'
              };
              
              const docName = docNames[docTypeCode] || 'Document Officiel GN';

              return (
                <div key={doc.id} className="form-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: '12px', backgroundColor: '#E7F6F0', color: '#006D44', borderRadius: '12px', display: 'inline-block' }}>
                      <FileCode2 size={24} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#006D44', backgroundColor: '#E7F6F0', padding: '4px 8px', borderRadius: '100px' }}>
                      <Shield size={12} /> VÉRIFIÉ
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {docName}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#868E96' }}>
                      Généré le {formatDate(doc.date_generation || doc.created_at)}
                    </p>
                  </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <Link 
                    to="/document-genere" 
                    state={{ 
                      documentId: doc.id, 
                      type_document: docTypeCode === 'P' ? 'Passeport' : 'Carte d\'Identité' 
                    }}
                    style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#F8F9FA', color: '#1A1A1A', borderRadius: '100px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Consulter
                  </Link>
                  {doc.pdf_url ? (
                    <a
                      href={doc.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '12px', backgroundColor: '#F8F9FA', color: '#1A1A1A', borderRadius: '100px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Download size={18} />
                    </a>
                  ) : (
                    <button style={{ padding: '12px', backgroundColor: '#F8F9FA', color: '#1A1A1A', borderRadius: '100px', border: 'none', cursor: 'pointer' }}>
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
