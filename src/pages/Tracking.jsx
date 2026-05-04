import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, FileText, Clock, CheckCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabase';

const Tracking = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!user?.id) {
        setDocuments([]);
        return;
      }

      // 1. Récupérer les documents certifiés
      const { data: certDocs } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut_demande, statut, created_at, date_generation')
        .eq('citoyen_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Récupérer le statut actuel du citoyen (pour les demandes en attente)
      const { data: citoyen } = await supabase
        .from('citoyens')
        .select('statut_demande, id_acte_lie')
        .eq('id', user.id)
        .single();

      let finalDocs = certDocs || [];

      setDocuments(finalDocs);
    };

    fetchTracking();
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
            <span className="active">SUIVI DES DEMANDES</span>
          </nav>
          
          <h2 className="page-title animate-slide-up" style={{ marginTop: '16px', marginBottom: '8px' }}>
            Suivi de vos demandes
          </h2>
          <p className="page-subtitle animate-slide-up" style={{ marginBottom: '32px' }}>
            Consultez l'état d'avancement de vos démarches administratives.
          </p>

          <div className="form-card animate-slide-up" style={{ width: '100%', padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EEEEEE', backgroundColor: '#F8F9FA' }}>
                  <th style={{ padding: '16px 24px', fontSize: '13px', color: '#868E96' }}>TYPE DE DEMANDE</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', color: '#868E96' }}>RÉFÉRENCE</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', color: '#868E96' }}>DATE</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', color: '#868E96' }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', fontSize: '14px', color: '#868E96' }}>
                      Aucune demande en cours pour le moment.
                    </td>
                  </tr>
                )}
                {documents.map((doc) => {
                  const rawStatutDemande = doc.statut_demande || '';
                  const hasPrefix = rawStatutDemande.includes(':');
                  const docTypeCode = hasPrefix ? rawStatutDemande.split(':')[0] : 'A';
                  const cleanStatutDemande = hasPrefix ? rawStatutDemande.split(':')[1] : rawStatutDemande;

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
                  
                  const statutValue = (doc.statut || '').toUpperCase();
                  const statutDemandeValue = cleanStatutDemande.toUpperCase();
                  const isDone =
                    statutValue === 'GENERE' ||
                    statutValue === 'GÉNÉRÉ' ||
                    statutDemandeValue === 'TERMINEE' ||
                    statutDemandeValue === 'TERMINÉE';
                  const displayDate = doc.date_generation || doc.created_at;

                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #EEEEEE' }}>
                      <td style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', backgroundColor: isDone ? '#F1F3F5' : '#E7F6F0', color: isDone ? '#868E96' : '#006D44', borderRadius: '10px' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '15px' }}>{docName}</p>
                          <p style={{ fontSize: '13px', color: '#868E96' }}>Ref: {doc.id_acte || 'N/A'}</p>
                        </div>
                      </td>
                      <td style={{ padding: '24px', fontSize: '14px', fontFamily: 'monospace' }}>REQ-{doc.id}-GN</td>
                      <td style={{ padding: '24px', fontSize: '14px' }}>{formatDate(displayDate)}</td>
                      <td style={{ padding: '24px' }}>
                        {!isDone ? (
                          <span style={{ padding: '6px 12px', backgroundColor: '#FFF3BF', color: '#E67700', borderRadius: '100px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} /> {cleanStatutDemande || 'En cours'}
                          </span>
                        ) : (
                          <span style={{ padding: '6px 12px', backgroundColor: '#E7F6F0', color: '#006D44', borderRadius: '100px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={14} /> Terminée
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tracking;
