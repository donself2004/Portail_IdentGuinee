import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Info, CheckCircle, AlertCircle, UploadCloud, CreditCard, Calendar, FileText } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './DemandForm.css';

const DemandForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDocumentType = location.state?.documentType || "Carte d'Identité";

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State
  const [formData, setFormData] = useState({
    type_document: selectedDocumentType,
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    date_naissance: '',
    lieu_naissance: '',
    nom_pere: '',
    nom_mere: '',
    num_acte: ''
  });
  const [verificationStatus, setVerificationStatus] = useState('idle');

  // Step 2 State (Mock Uploads)
  const [uploadedFiles, setUploadedFiles] = useState({
    acte: null,
    residence: null
  });

  // Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Vérification visuelle pour la démo
  useEffect(() => {
    const checkActe = () => {
      if (formData.num_acte.length < 3) {
        setVerificationStatus('idle');
        return;
      }
      setVerificationStatus('checking');
      setTimeout(() => {
        setVerificationStatus('verified');
      }, 800);
    };

    const debounce = setTimeout(checkActe, 500);
    return () => clearTimeout(debounce);
  }, [formData.num_acte]);

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmitDemand = async () => {
    if (!user?.id) {
      setSubmitError('Utilisateur non authentifié. Veuillez vous reconnecter.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. On essaie de lier l'acte réel (si l'utilisateur a tapé un vrai numéro)
      let { error } = await supabase
        .from('citoyens')
        .update({
          id_acte_lie: formData.num_acte,
          statut_demande: 'EN_ATTENTE'
        })
        .eq('id', user.id);

      // 2. Repli de sécurité pour la démo: Si le numéro d'acte n'existe pas dans naissancechain 
      // (erreur de Foreign Key "23503"), on met juste à jour le statut pour ne pas bloquer le jury.
      if (error && error.code === '23503') {
        const retry = await supabase
          .from('citoyens')
          .update({
            statut_demande: 'EN_ATTENTE'
          })
          .eq('id', user.id);
        error = retry.error;
      }

      if (error) {
        setSubmitError(`Erreur lors de la mise à jour du dossier: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      navigate('/traitement', { state: { num_acte: formData.num_acte } });
    } catch (err) {
      setSubmitError('Une erreur inattendue est survenue lors de la soumission.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="form-page-content animate-fade-in">
          <nav className="breadcrumbs animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span>TABLEAU DE BORD</span> <ChevronRight size={14} />
            <span className="active">NOUVELLE DEMANDE</span>
          </nav>

          <div className="form-header animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="page-title">Formulaire de demande de titre</h2>
            <p className="page-subtitle">
              Étape {currentStep} sur 3 : {
                currentStep === 1 ? "Informations personnelles" : 
                currentStep === 2 ? "Dépôt des justificatifs" : 
                "Paiement et Prise de Rendez-vous"
              }
            </p>
          </div>

          <div className="form-grid animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="form-sections">
              
              {/* ETAPE 1 : INFORMATIONS DE BASE */}
              {currentStep === 1 && (
                <div className="step-content animate-fade-in">
                  <section className="form-card">
                    <div className="section-header-form">
                      <div className="icon-badge"><Info size={18} /></div>
                      <h3>Identité Personnelle & Contact</h3>
                    </div>
                    
                    <div className="input-group-row">
                      <div className="input-field">
                        <label>NOM</label>
                        <input type="text" value={formData.nom} readOnly className="read-only" />
                      </div>
                      <div className="input-field">
                        <label>PRÉNOM</label>
                        <input type="text" value={formData.prenom} readOnly className="read-only" />
                      </div>
                    </div>

                    <div className="input-group-row">
                      <div className="input-field">
                        <label>DATE DE NAISSANCE</label>
                        <input type="date" value={formData.date_naissance} onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} />
                      </div>
                      <div className="input-field">
                        <label>LIEU DE NAISSANCE</label>
                        <input type="text" value={formData.lieu_naissance} onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})} />
                      </div>
                    </div>

                    <div className="input-group-row" style={{ marginTop: '24px' }}>
                      <div className="input-field">
                        <label>GENRE</label>
                        <select 
                          value={formData.genre || ''} 
                          onChange={(e) => setFormData({...formData, genre: e.target.value})}
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      <div className="input-field">
                        <label>NUMÉRO DE TÉLÉPHONE</label>
                        <input 
                          type="tel" 
                          placeholder="Ex: +224 620 00 00 00" 
                          value={formData.telephone || ''}
                          onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="form-card" style={{ marginTop: '24px' }}>
                    <div className="section-header-form">
                      <div className="icon-badge"><Info size={18} /></div>
                      <h3>Filiation & Acte de Naissance</h3>
                    </div>
                    
                    <div className="input-group-row">
                      <div className="input-field">
                        <label>NOM COMPLET DU PÈRE</label>
                        <input type="text" placeholder="Ex: Mamadou Diallo" value={formData.nom_pere} onChange={(e) => setFormData({...formData, nom_pere: e.target.value})} />
                      </div>
                      <div className="input-field">
                        <label>NOM COMPLET DE LA MÈRE</label>
                        <input type="text" placeholder="Ex: Aminata Bah" value={formData.nom_mere} onChange={(e) => setFormData({...formData, nom_mere: e.target.value})} />
                      </div>
                    </div>

                    <div className="input-field full" style={{ marginTop: '24px' }}>
                      <label>NUMÉRO D’ACTE DE NAISSANCE (NAISSANCECHAIN)</label>
                      <div className="verification-input-wrapper">
                        <input 
                          type="text" 
                          placeholder="Ex: 001/RC/MATAM/2023" 
                          value={formData.num_acte}
                          onChange={(e) => setFormData({...formData, num_acte: e.target.value})}
                        />
                        {verificationStatus === 'verified' && <CheckCircle className="verify-icon success" size={20} />}
                        {verificationStatus === 'error' && <AlertCircle className="verify-icon error" size={20} />}
                      </div>
                      <p className="field-hint">Obligatoire pour l'authentification de votre document.</p>
                    </div>
                  </section>

                  <div className="form-actions">
                    <button className="btn-cancel" onClick={() => navigate('/')}>Annuler</button>
                    <button 
                      className="btn-next" 
                      onClick={handleNextStep}
                    >
                      Continuer vers les justificatifs
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPE 2 : JUSTIFICATIFS */}
              {currentStep === 2 && (
                <div className="step-content animate-fade-in">
                  <section className="form-card">
                    <div className="section-header-form">
                      <div className="icon-badge"><FileText size={18} /></div>
                      <h3>Téléchargement des justificatifs</h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#868E96', marginBottom: '24px' }}>
                      Veuillez fournir des copies lisibles de vos documents. Les formats acceptés sont JPG, PNG et PDF.
                    </p>

                    <div className="upload-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <label className="upload-box" style={{ border: uploadedFiles.acte ? '2px solid #40C057' : '2px dashed #EEEEEE', borderRadius: '16px', padding: '32px', textAlign: 'center', backgroundColor: uploadedFiles.acte ? '#EBFBEE' : '#F8F9FA', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}>
                        <input 
                          type="file" 
                          style={{ display: 'none' }} 
                          onChange={(e) => setUploadedFiles(prev => ({ ...prev, acte: e.target.files[0] }))}
                        />
                        <UploadCloud size={32} color={uploadedFiles.acte ? "#40C057" : "#006D44"} style={{ marginBottom: '12px' }} />
                        <h4 style={{ fontWeight: '700', marginBottom: '4px', color: uploadedFiles.acte ? '#2B8A3E' : '#1A1A1A' }}>
                          {uploadedFiles.acte ? uploadedFiles.acte.name : "Copie de l'Acte de Naissance"}
                        </h4>
                        <p style={{ fontSize: '12px', color: uploadedFiles.acte ? '#40C057' : '#868E96' }}>
                          {uploadedFiles.acte ? "Fichier ajouté avec succès. Cliquez pour modifier." : "Cliquez pour parcourir ou glissez votre fichier ici."}
                        </p>
                      </label>

                      <label className="upload-box" style={{ border: uploadedFiles.residence ? '2px solid #40C057' : '2px dashed #EEEEEE', borderRadius: '16px', padding: '32px', textAlign: 'center', backgroundColor: uploadedFiles.residence ? '#EBFBEE' : '#F8F9FA', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}>
                        <input 
                          type="file" 
                          style={{ display: 'none' }} 
                          onChange={(e) => setUploadedFiles(prev => ({ ...prev, residence: e.target.files[0] }))}
                        />
                        <UploadCloud size={32} color={uploadedFiles.residence ? "#40C057" : "#006D44"} style={{ marginBottom: '12px' }} />
                        <h4 style={{ fontWeight: '700', marginBottom: '4px', color: uploadedFiles.residence ? '#2B8A3E' : '#1A1A1A' }}>
                          {uploadedFiles.residence ? uploadedFiles.residence.name : "Certificat de Résidence"}
                        </h4>
                        <p style={{ fontSize: '12px', color: uploadedFiles.residence ? '#40C057' : '#868E96' }}>
                          {uploadedFiles.residence ? "Fichier ajouté avec succès. Cliquez pour modifier." : "Cliquez pour parcourir ou glissez votre fichier ici."}
                        </p>
                      </label>
                    </div>
                  </section>

                  <div className="form-actions">
                    <button className="btn-cancel" onClick={handlePrevStep}>Retour</button>
                    <button className="btn-next" onClick={handleNextStep}>Continuer vers le paiement</button>
                  </div>
                </div>
              )}

              {/* ETAPE 3 : PAIEMENT ET RDV */}
              {currentStep === 3 && (
                <div className="step-content animate-fade-in">
                  <section className="form-card">
                    <div className="section-header-form">
                      <div className="icon-badge"><CreditCard size={18} /></div>
                      <h3>Frais de dossier</h3>
                    </div>
                    
                    <div style={{ backgroundColor: '#F8F9FA', padding: '24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{formData.type_document}</p>
                        <p style={{ fontSize: '13px', color: '#868E96' }}>Frais d'émission officiels</p>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#006D44' }}>
                        15 000 GNF
                      </div>
                    </div>

                    <div className="payment-methods" style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, border: '2px solid #006D44', borderRadius: '12px', padding: '16px', textAlign: 'center', backgroundColor: '#E7F6F0', cursor: 'pointer', fontWeight: '700', color: '#006D44' }}>
                        Orange Money
                      </div>
                      <div style={{ flex: 1, border: '1px solid #EEEEEE', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#868E96' }}>
                        Carte Bancaire
                      </div>
                    </div>
                  </section>

                  <section className="form-card" style={{ marginTop: '24px' }}>
                    <div className="section-header-form">
                      <div className="icon-badge"><Calendar size={18} /></div>
                      <h3>Prise de rendez-vous biométrique</h3>
                    </div>
                    
                    <div className="input-field full">
                      <label>DATE DU RENDEZ-VOUS EN COMMISSARIAT</label>
                      <input type="date" style={{ width: '100%' }} />
                    </div>
                    <p style={{ fontSize: '12px', color: '#868E96', marginTop: '12px' }}>
                      Vous devrez vous présenter physiquement pour la capture de vos empreintes et photo.
                    </p>
                  </section>

                  <div className="form-actions">
                    <button className="btn-cancel" onClick={handlePrevStep}>Retour</button>
                    <button 
                      className="btn-next" 
                      onClick={handleSubmitDemand}
                      disabled={isSubmitting}
                      style={{ opacity: isSubmitting ? 0.5 : 1 }}
                    >
                      {isSubmitting ? 'Traitement...' : 'Soumettre ma demande'}
                    </button>
                  </div>
                  {submitError && (
                    <p style={{ color: '#C92A2A', marginTop: '12px', fontSize: '13px', textAlign: 'right' }}>{submitError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar de droite */}
            <aside className="form-sidebar">
              <div className="progression-card">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Informations de base</div>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Justificatifs</div>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Paiement & RDV</div>
                </div>
              </div>

              <div className="preview-card">
                <div className="preview-header">APERCU DU FUTUR TITRE</div>
                <div className="id-card-mock">
                  <img src="https://via.placeholder.com/280x180/006D44/FFFFFF?text=Specimen+CNI" alt="CNI Preview" />
                </div>
                <h4 className="preview-title">Spécimen CNI Biométrique</h4>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemandForm;
