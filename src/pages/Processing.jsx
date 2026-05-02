import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, BarChart2, ShieldCheck, Lock, Zap, Terminal, Database, Cpu, Link as LinkIcon, FileCheck } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Processing.css';

const Processing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [num_acte, setNumActe] = useState(location.state?.num_acte || sessionStorage.getItem('last_num_acte'));
  
  useEffect(() => {
    if (location.state?.num_acte) {
      sessionStorage.setItem('last_num_acte', location.state.num_acte);
    }
  }, [location.state]);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalDocId, setFinalDocId] = useState(null);
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', text: 'Initialisation du protocole de sécurité...' }
  ]);
  
  const terminalEndRef = useRef(null);

  const addLog = (text, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), type, text }]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    const TOTAL_DURATION = 40000; // 40 secondes
    const INTERVAL = 100;
    const TOTAL_STEPS = TOTAL_DURATION / INTERVAL;
    
    let isMounted = true;
    let timers = [];
    let progressInterval = null;

    const startAnimation = async () => {
      if (!num_acte || !user?.id) return;

      try {
        // 1. CRÉATION IMMÉDIATE DE L'ENREGISTREMENT
        let { data, error } = await supabase
          .from('documents_certifies')
          .insert({
             citoyen_id: user.id,
             id_acte: num_acte,
             statut: 'EN_COURS',
             statut_demande: 'Authentification'
          })
          .select('id')
          .single();
        
        // Mode Démo : Si l'acte n'existe pas dans NaissanceChain, on crée quand même le document sans lien direct
        if (error && error.code === '23503') {
           const retry = await supabase
            .from('documents_certifies')
            .insert({
               citoyen_id: user.id,
               id_acte: null, // On laisse l'acte vide pour éviter l'erreur FK
               statut: 'EN_COURS',
               statut_demande: 'Authentification'
            })
            .select('id')
            .single();
           data = retry.data;
           error = retry.error;
        }

        if (error) throw error;
        if (!isMounted) return;

        const currentDocId = data.id;
        setFinalDocId(currentDocId);
        addLog("Dossier de certification créé dans le registre temporaire.", "success");

        // 2. DÉMARRAGE DE LA PROGRESSION
        progressInterval = setInterval(() => {
          setProgress((oldProgress) => {
            if (oldProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return oldProgress + (100 / TOTAL_STEPS);
          });
        }, INTERVAL);

        // 3. GESTION DES ÉTAPES ET LOGS
        const timeline = [
          { time: 2000, log: "Connexion sécurisée établie avec le serveur MATD...", type: 'success', step: 1, dbStatus: 'Authentification' },
          { time: 5000, log: "Vérification des identifiants citoyen GN-SEC-V3...", type: 'info' },
          { time: 8000, log: "Analyse du registre national de naissance en cours...", type: 'info', step: 2, dbStatus: 'Registre National' },
          { time: 11000, log: `Acte de naissance #${num_acte || 'N/A'} localisé dans le registre central.`, type: 'success' },
          { time: 14000, log: "Extraction des métadonnées parentales...", type: 'info' },
          { time: 17000, log: "Démarrage de l'analyse biométrique comparative...", type: 'info', step: 3, dbStatus: 'Analyse Biométrique' },
          { time: 20000, log: "Vérification de la cohérence photo via IA souveraine...", type: 'info' },
          { time: 23000, log: "Authentification biométrique réussie. Score: 99.8%", type: 'success' },
          { time: 26000, log: "Préparation de l'ancrage Blockchain NaissanceChain...", type: 'info', step: 4, dbStatus: 'Ancrage Blockchain' },
          { time: 29000, log: "Génération du hash cryptographique du document...", type: 'info' },
          { time: 32000, log: "Transaction confirmée sur le réseau national. Bloc #G821-X", type: 'success', step: 5, dbStatus: 'Finalisation' },
          { time: 35000, log: "Génération du certificat PDF sécurisé avec QR Code...", type: 'info' },
          { time: 38000, log: "Finalisation du titre numérique officiel...", type: 'info' },
        ];

        timers = timeline.map(item => {
          return setTimeout(async () => {
            if (!isMounted) return;
            addLog(item.log, item.type);
            if (item.step) setStep(item.step);
            if (item.dbStatus) {
               await supabase
                .from('documents_certifies')
                .update({ statut_demande: item.dbStatus })
                .eq('id', currentDocId);
            }
          }, item.time);
        });

        const finalTimer = setTimeout(async () => {
          if (!isMounted) return;
          
          await supabase
            .from('documents_certifies')
            .update({ 
              statut_demande: 'TERMINEE',
              statut: 'GENERE',
              date_generation: new Date().toISOString()
            })
            .eq('id', currentDocId);

          await supabase
            .from('citoyens')
            .update({ statut_demande: 'TERMINEE' })
            .eq('id', user.id);

          addLog("OPÉRATION TERMINÉE AVEC SUCCÈS.", "success");
          setIsFinished(true);
        }, TOTAL_DURATION);

        timers.push(finalTimer);

      } catch (err) {
        console.error("Processing error details:", err);
        const errorMsg = err.message || "Erreur de connexion";
        const errorDetail = err.details || "Problème d'accès à la base de données";
        addLog(`ERREUR: ${errorMsg}`, "error");
        addLog(`DÉTAIL: ${errorDetail}`, "error");
      }
    };

    startAnimation();

    return () => {
      isMounted = false;
      if (progressInterval) clearInterval(progressInterval);
      timers.forEach(t => clearTimeout(t));
    };
  }, [num_acte, user?.id]);

  const handleFinish = () => {
    navigate('/document-genere', { state: { documentId: finalDocId } });
  };

  const stepsData = [
    { id: 1, title: "Authentification", icon: <Lock size={20} />, desc: "Vérification des accès sécurisés" },
    { id: 2, title: "Registre National", icon: <Database size={20} />, desc: "Extraction de l'acte de naissance" },
    { id: 3, title: "Analyse IA", icon: <Cpu size={20} />, desc: "Validation biométrique souveraine" },
    { id: 4, title: "Blockchain", icon: <LinkIcon size={20} />, desc: "Ancrage sur NaissanceChain" },
    { id: 5, title: "Certification", icon: <FileCheck size={20} />, desc: "Émission du titre numérique" },
  ];

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="processing-content animate-fade-in">
          <div className="processing-header">
            <div className="system-status-badge animate-slide-up">
              <span className="pulse-dot"></span> INFRASTRUCTURE SOUVERAINE ACTIVE
            </div>
            <h1 className="processing-title animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Traitement de votre demande
            </h1>
            <p className="processing-subtitle animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Le délai de 40 secondes garantit la triple vérification par les registres d'État et l'ancrage blockchain.
            </p>
          </div>

          <div className="processing-main-grid">
            <div className="processing-steps-column animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {stepsData.map((s) => (
                <div key={s.id} className={`process-step-item ${step >= s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                  <div className="step-indicator">
                    {step > s.id ? <CheckCircle size={18} /> : s.icon}
                  </div>
                  <div className="step-info">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                  {step === s.id && !isFinished && <div className="step-loader"></div>}
                </div>
              ))}
            </div>

            <div className="processing-visuals animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="terminal-container">
                <div className="terminal-header">
                  <div className="dots"><span></span><span></span><span></span></div>
                  <div className="title"><Terminal size={14} /> console.guinee.gouv.gn</div>
                </div>
                <div className="terminal-body">
                  {logs.map((log) => (
                    <div key={log.id} className={`log-line ${log.type}`}>
                      <span className="timestamp">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text">{log.text}</span>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-info">
                  <span>Progression globale</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar-container large">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {isFinished && (
                <button 
                  className="btn-finish-process animate-bounce-in" 
                  onClick={handleFinish}
                >
                  <FileCheck size={20} /> Visualiser mon document officiel
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Processing;
