import React, { useState, useEffect, useRef, Component } from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Share2, Download, Smartphone, CheckCircle, Info, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './DocumentGenere.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
          <h2>Erreur d'affichage du document</h2>
          <p>{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const DocumentGenereContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  // Persistance de l'ID du document via sessionStorage pour supporter le rafraîchissement
  const [documentId, setDocumentId] = useState(() => {
    return location.state?.documentId || sessionStorage.getItem('last_document_id');
  });

  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAdded, setWalletAdded] = useState(false);
  const printRef = useRef(null);
  const typeDoc = location.state?.type_document || sessionStorage.getItem('last_type_document') || "Carte d'Identité";

  useEffect(() => {
    if (location.state?.documentId) {
      sessionStorage.setItem('last_document_id', location.state.documentId);
    }
    if (location.state?.type_document) {
      sessionStorage.setItem('last_type_document', location.state.type_document);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId || !user?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();
        if (error) throw error;
        setDocData(data);
      } catch (err) {
        console.error('Erreur chargement document:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, user?.id]);

  const acte = user?.acteData || docData || {};
  const documentTitle = typeDoc || 'Document officiel';
  const documentNumber = acte.id_acte || acte.id_acte || 'N/A';

  const handlePrint = () => {
    if (!printRef.current) return;
    window.print();
  };

  const handleDownloadPNG = () => {
    alert('Téléchargement PNG non disponible dans cette version.');
  };

  const handleDownloadPDF = () => {
    alert('Téléchargement PDF non disponible dans cette version.');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div className="step-loader" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Chargement du document...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="doc-page-content animate-fade-in">
          <div className="doc-header-section animate-slide-up">
            <div className="doc-header-left">
              <nav className="breadcrumbs">
                <span>MES DOCUMENTS</span> <ChevronRight size={14} />
                <span className="active">{documentTitle}</span>
              </nav>
              <h1 className="doc-title">Votre Document est Prêt ✅</h1>
              <p className="doc-subtitle">Document officiel généré et sécurisé par les services de l'État guinéen.</p>
            </div>
            <div className="doc-header-actions">
              <button className="btn-secondary" type="button" onClick={handlePrint}>
                <Download size={18} /> Imprimer
              </button>
              <button className="btn-secondary" type="button" onClick={handleDownloadPNG}>
                <Smartphone size={18} /> Télécharger (PNG)
              </button>
              <button className="btn-primary-doc" type="button" onClick={handleDownloadPDF}>
                <Download size={18} /> Télécharger (PDF)
              </button>
            </div>
          </div>

          <div className="doc-grid animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="document-container" ref={printRef}>
              <div className="official-document">
                <div className="doc-top-bar"></div>
                <div className="doc-republic-header">
                  <div className="rep-title-group">
                    <p className="rep-title">République de Guinée</p>
                    <p className="rep-motto">Travail - Justice - Solidarité</p>
                  </div>
                  <div className="card-type">{documentTitle}</div>
                </div>
                <div className="doc-body">
                  <div className="doc-photo-col">
                    <img className="id-photo" src={user?.avatar || 'https://ui-avatars.com/api/?name=IdentiGuin%C3%A9e&background=006D44&color=fff'} alt="Photo" />
                    <div className="hash-bar">{acte.hash_blockchain || 'HASH_NON_DISPONIBLE'}</div>
                  </div>
                  <div className="doc-info-col">
                    <div className="info-group">
                      <label>Nom complet</label>
                      <p className="info-val">{acte.prenom || user?.prenom || '—'} {acte.nom || user?.nom || '—'}</p>
                    </div>
                    <div className="info-row-2">
                      <div className="info-group">
                        <label>Numéro de l'acte</label>
                        <p className="info-val">{documentNumber}</p>
                      </div>
                      <div className="info-group">
                        <label>Date d'émission</label>
                        <p className="info-val">{new Date().toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="info-group">
                      <label>Type de document</label>
                      <p className="info-val">{documentTitle}</p>
                    </div>
                    <div className="info-row-2">
                      <div className="info-group">
                        <label>Genre</label>
                        <p className="info-val">{acte.genre || '—'}</p>
                      </div>
                      <div className="info-group">
                        <label>Identifiant</label>
                        <p className="info-val">{acte.numero_identifiant_national || user?.matricule || '—'}</p>
                      </div>
                    </div>
                    <div className="signature-area">
                      <p className="signature-label">Signature Electronique</p>
                      <p className="signature-text">Ministère de l'Administration du Territoire</p>
                    </div>
                  </div>
                </div>
                <div className="doc-footer">
                  <div>
                    <p className="stamp-label">Certificateur officiel</p>
                    <p className="stamp-ministry">Ministère de l'Administration du Territoire</p>
                  </div>
                  {/* QR Code — vérification publique via /verify/:documentId */}
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={
                        'https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=' +
                        encodeURIComponent(
                          window.location.origin + '/verify/' + (docData?.hash_document || documentId || 'demo')
                        )
                      }
                      style={{ width: 84, height: 84, display: 'block', margin: '0 auto 4px', borderRadius: 4, background: '#fff', padding: 4 }}
                      alt="QR Vérification"
                    />
                    <p style={{ fontSize: 8, color: '#888', margin: 0, lineHeight: 1.3, textAlign: 'center' }}>
                      Scanner pour<br />vérifier l'authenticité
                    </p>
                  </div>
                  <p className="generation-timestamp">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="wallet-panel animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="wallet-info-card">
              <Info size={18} />
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>Portefeuille numérique</p>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>Ajoutez votre document à votre application de portefeuille pour une consultation hors ligne.</p>
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setWalletOpen(true)}>
              <Smartphone size={18} /> Ajouter au portefeuille
            </button>
          </div>

          {walletOpen && (
            <div className="wallet-modal">
              <div className="wallet-modal-card">
                <button type="button" className="wallet-close" onClick={() => setWalletOpen(false)}>
                  <X size={18} />
                </button>
                {walletAdded ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={42} color="#006D44" />
                    <h3>Document ajouté !</h3>
                    <p>Votre document est désormais disponible dans votre portefeuille numérique.</p>
                    <button type="button" className="btn-primary-doc" onClick={() => setWalletOpen(false)}>Fermer</button>
                  </div>
                ) : (
                  <>
                    <h3>Ajouter au portefeuille</h3>
                    <p>Cette action conserve une copie sécurisée de votre document sur votre appareil mobile.</p>
                    <button type="button" className="btn-primary-doc" onClick={() => setWalletAdded(true)}>
                      <CheckCircle size={18} /> Ajouter
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
  <ErrorBoundary>
    <DocumentGenereContent />
  </ErrorBoundary>
);

export default DocumentGenere;
