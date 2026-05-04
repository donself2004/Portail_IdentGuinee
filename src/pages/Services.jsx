import React from 'react';
import { ChevronRight, Shield, CreditCard, FileText, FileCheck, Car, Briefcase, Globe } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ServiceCard from '../components/dashboard/ServiceCard';

const Services = () => {
  const allServices = [
    {
      category: "Identité & Citoyenneté",
      items: [
        {
          iconType: "identity",
          title: "Carte d'Identité",
          documentType: "Carte d'Identité",
          description: "Nouvelle génération avec puce électronique sécurisée et biométrie intégrée.",
          note: "15,000 GNF • Validité 10 ans"
        },
        {
          iconType: "passport",
          title: "Passeport Biométrique",
          documentType: "Passeport",
          description: "Document de voyage international conforme aux normes OACI pour vos déplacements.",
          note: "À partir de 500,000 GNF"
        },
        {
          iconType: "birth",
          title: "Extrait de Naissance",
          documentType: "Extrait de Naissance",
          description: "Digitalisation et certification de votre acte de naissance via NaissanceChain.",
          note: "Gratuit pour les mineurs"
        }
      ]
    },
    {
      category: "Transport & Mobilité",
      items: [
        {
          iconType: "driver",
          title: "Permis de Conduire",
          documentType: "Permis de Conduire",
          description: "Renouvellement, duplication ou première demande de titre de conduite sécurisé.",
          note: "Examen requis pour 1ère demande"
        },
        {
          iconType: "identity",
          title: "Carte Grise",
          documentType: "Carte Grise",
          description: "Certificat d'immatriculation pour véhicules neufs ou mutation de propriété.",
          note: "Tarif selon puissance fiscale"
        }
      ]
    },
    {
      category: "Affaires & Professionnel",
      items: [
        {
          iconType: "passport",
          title: "Casier Judiciaire",
          documentType: "Casier Judiciaire",
          description: "Bulletin n°3 certifié pour vos démarches administratives et professionnelles.",
          note: "Délivrance en 24h"
        },
        {
          iconType: "birth",
          title: "Certificat de Nationalité",
          documentType: "Certificat de Nationalité",
          description: "Preuve officielle de la nationalité guinéenne certifiée par les autorités.",
          note: "Dossier physique requis"
        }
      ]
    }
  ];

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="processing-content animate-fade-in" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
          <nav className="breadcrumbs animate-slide-up">
            <span>TABLEAU DE BORD</span> <ChevronRight size={14} />
            <span className="active">CATALOGUE DES SERVICES</span>
          </nav>
          
          <div className="services-header animate-slide-up" style={{ marginTop: '16px', marginBottom: '40px' }}>
            <h2 className="page-title">Services Publics Digitaux</h2>
            <p className="page-subtitle">
              Accédez à l'ensemble des démarches administratives de l'État Guinéen depuis votre espace sécurisé.
            </p>
          </div>

          <div className="services-container" style={{ width: '100%' }}>
            {allServices.map((section, idx) => (
              <div key={idx} className="service-category-group animate-slide-up" style={{ animationDelay: `${0.1 * (idx + 1)}s`, marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '18px', backgroundColor: '#006D44', borderRadius: '4px' }}></div>
                  {section.category}
                </h3>
                
                <div className="services-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '24px' 
                }}>
                  {section.items.map((service, sIdx) => (
                    <ServiceCard 
                      key={sIdx}
                      iconType={service.iconType}
                      title={service.title}
                      documentType={service.documentType}
                      description={service.description}
                      note={service.note}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="info-card warning animate-slide-up" style={{ marginTop: '20px', width: '100%' }}>
            <div className="info-icon"><Shield size={24} /></div>
            <div className="info-text">
              <h4>Sécurité des données</h4>
              <p>Toutes vos demandes sont protégées par le système <strong>IdentiGuinée Secure</strong>. Vos données biométriques ne sont jamais partagées avec des tiers sans votre consentement explicite via QR Code.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Services;
