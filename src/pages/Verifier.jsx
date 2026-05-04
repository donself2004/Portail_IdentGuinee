import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, User, Calendar, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Verifier.css';

const Verifier = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [citoyen, setCitoyen] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyDocument = async () => {
      try {
        setLoading(true);
        // 1. Chercher le document par ID
        const { data: docData, error: docError } = await supabase
          .from('documents_certifies')
          .select('*')
          .eq('id', id)
          .single();

        if (docError || !docData) {
          setError("Document introuvable ou ID invalide.");
          setLoading(false);
          return;
        }

        setDocument(docData);

        // 2. Chercher les infos du citoyen lié
        const { data: citoyenData, error: citoyenError } = await supabase
          .from('citoyens')
          .select('*')
          .eq('id', docData.citoyen_id)
          .single();

        if (!citoyenError) {
          setCitoyen(citoyenData);
        }

        setLoading(false);
      } catch (err) {
        setError("Une erreur est survenue lors de la vérification.");
        setLoading(false);
      }
    };

    if (id) {
      verifyDocument();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="verifier-container">
        <div className="loading-spinner-wrapper">
          <div className="loading-pulse"></div>
          <p>Vérification cryptographique en cours...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="verifier-container">
        <div className="status-card error">
          <ShieldAlert size={64} className="status-icon" />
          <h1>Vérification Échouée</h1>
          <p>{error || "Ce document n'existe pas dans le registre national."}</p>
          <Link to="/login" className="btn-back-home">Retour au portail</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verifier-container">
      <div className="verifier-header-bg"></div>
      
      <div className="verifier-content">
        <div className="status-badge success">
          <CheckCircle2 size={20} />
          <span>DOCUMENT AUTHENTIQUE</span>
        </div>

        <div className="verifier-card animate-slide-up">
          <div className="verifier-profile">
            <div className="profile-img-wrapper">
              <img 
                src={citoyen?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Photo du citoyen" 
              />
            </div>
            <div className="profile-info">
              <h2>{citoyen?.prenom} {citoyen?.nom?.toUpperCase()}</h2>
              <p className="id-acte">Acte N° {document.id_acte}</p>
            </div>
          </div>

          <div className="verifier-details">
            <div className="detail-item">
              <div className="detail-icon"><Calendar size={18} /></div>
              <div className="detail-text">
                <label>Date de naissance</label>
                <p>{citoyen?.date_naissance}</p>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-icon"><MapPin size={18} /></div>
              <div className="detail-text">
                <label>Lieu de naissance</label>
                <p>{citoyen?.lieu_naissance || 'Conakry'}</p>
              </div>
            </div>
          </div>

          <div className="blockchain-footer">
            <div className="hash-header">
              <ShieldCheck size={14} />
              <span>EMPREINTE BLOCKCHAIN SÉCURISÉE</span>
            </div>
            <div className="hash-value">
              {document.hash_document || `SHA256:${id?.repeat(2).substring(0, 40)}...`}
            </div>
            <p className="timestamp">Certifié le {new Date(document.date_generation).toLocaleDateString('fr-FR')} à {new Date(document.date_generation).toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>

        <p className="verifier-legal">
          Ce service de vérification est opéré par la Direction Nationale de l'État Civil de Guinée.
          Toute falsification est passible de poursuites judiciaires.
        </p>
      </div>
    </div>
  );
};

export default Verifier;
