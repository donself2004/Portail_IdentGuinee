import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, ArrowRight, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Login.css';

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    identifiant: '',
    num_acte: '', // Nouveau champ
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: '',
    telephone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        if (!formData.identifiant) {
          setErrorMsg('Veuillez saisir votre email, téléphone ou numéro d\'acte.');
          setLoading(false);
          return;
        }

        // Mode Connexion
        let query = supabase
          .from('citoyens')
          .select('*')
          .eq('password', formData.password)
          .or(`email.eq.${formData.identifiant},telephone.eq.${formData.identifiant},id_acte_lie.eq.${formData.identifiant}`);

        const { data, error } = await query.single();

        if (error || !data) {
          setErrorMsg('Identifiant ou mot de passe incorrect.');
          setLoading(false);
          return;
        }

        // Connexion réussie
        let enrichedData = { ...data };
        
        // Enrichissement via NaissanceChain si un acte est lié
        if (data.id_acte_lie) {
          const { data: chainData } = await supabase
            .from('naissancechain')
            .select('*')
            .eq('id_acte', data.id_acte_lie)
            .maybeSingle();
          
          if (chainData) {
            enrichedData = { ...enrichedData, ...chainData };
          }
        }

        // Normalisation de la date (YYYY-MM-DD)
        let formattedDate = enrichedData.date_naissance;
        if (formattedDate && formattedDate.includes('/')) {
          const parts = formattedDate.split('/');
          if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        const profileAvatar = data.avatar || data.avatar_url || data.photo_url || `https://ui-avatars.com/api/?name=${data.prenom}+${data.nom}&background=006D44&color=fff`;
        login({
          id: data.id,
          nom: enrichedData.nom || data.nom,
          prenom: enrichedData.prenom || data.prenom,
          date_naissance: formattedDate,
          lieu_naissance: enrichedData.lieu_naissance,
          nom_pere: enrichedData.nom_pere,
          nom_mere: enrichedData.nom_mere,
          genre: enrichedData.genre,
          telephone: data.telephone,
          matricule: data.id_acte_lie || `GN-${data.id}`,
          avatar: profileAvatar,
          id_acte_lie: data.id_acte_lie
        });
        navigate('/');

      } else {
        // Mode Inscription
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }

        if (!formData.num_acte) {
          setErrorMsg('Le numéro d\'acte de naissance est obligatoire.');
          setLoading(false);
          return;
        }

        // 1. VÉRIFICATION DANS NAISSANCECHAIN
        const { data: chainData, error: chainError } = await supabase
          .from('naissancechain')
          .select('*')
          .eq('id_acte', formData.num_acte)
          .maybeSingle();

        if (chainError || !chainData) {
          setErrorMsg('Numéro d\'acte invalide. Ce numéro n\'existe pas dans le registre national.');
          setLoading(false);
          return;
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const { data: existingUser } = await supabase
          .from('citoyens')
          .select('id')
          .or(`email.eq.${formData.email},telephone.eq.${formData.telephone},id_acte_lie.eq.${formData.num_acte}`)
          .maybeSingle();

        if (existingUser) {
          setErrorMsg('Ce compte (email, téléphone ou acte) existe déjà.');
          setLoading(false);
          return;
        }

        // 3. Insérer le nouvel utilisateur avec les données de la blockchain
        const { data: newUser, error } = await supabase
          .from('citoyens')
          .insert([
            { 
              email: formData.email, 
              telephone: formData.telephone,
              id_acte_lie: formData.num_acte,
              nom: chainData.nom, // Donnée officielle
              prenom: chainData.prenom, // Donnée officielle
              date_naissance: chainData.date_naissance, // Donnée officielle
              lieu_naissance: chainData.lieu_naissance, // Donnée officielle
              password: formData.password 
            }
          ])
          .select()
          .single();

        if (error) {
          setErrorMsg(`Erreur lors de l'inscription: ${error.message}`);
          setLoading(false);
          return;
        }

        // Inscription réussie
        const profileAvatar = `https://ui-avatars.com/api/?name=${chainData.prenom}+${chainData.nom}&background=006D44&color=fff`;
        login({
          id: newUser.id,
          nom: chainData.nom,
          prenom: chainData.prenom,
          matricule: formData.num_acte,
          avatar: profileAvatar
        });
        navigate('/');
      }
    } catch (err) {
      console.error(err);

      setErrorMsg('Une erreur inattendue est survenue.');
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrorMsg('');
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', identifiant: '', num_acte: '' }));
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-brand">
          <div className="brand-icon">
            <Shield size={32} />
          </div>
          <h1>Identi<span>Guinée</span></h1>
          <p>Portail Citoyen Sécurisé</p>
        </div>

        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${isLoginMode ? 'active' : ''}`} 
            onClick={() => toggleMode()}
            type="button"
          >
            Connexion
          </button>
          <button 
            className={`toggle-btn ${!isLoginMode ? 'active' : ''}`} 
            onClick={() => toggleMode()}
            type="button"
          >
            Inscription
          </button>
        </div>

        {errorMsg && (
          <div className="error-alert animate-slide-up">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLoginMode && (
            <>
              <div className="input-group animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label><User size={16} /> Numéro d'acte de naissance</label>
                <input 
                  type="text" 
                  placeholder="Ex: GN-102-2024" 
                  required={!isLoginMode}
                  value={formData.num_acte}
                  onChange={(e) => setFormData({...formData, num_acte: e.target.value})}
                />
                <small style={{ fontSize: '10px', color: '#868E96', marginTop: '4px' }}>
                  Vos données (nom, prénom, etc.) seront extraites de NaissanceChain.
                </small>
              </div>

              <div className="input-group animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label><User size={16} /> Téléphone</label>
                <input
                  type="text"
                  placeholder="Ex: +224620000000"
                  required={!isLoginMode}
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>

              <div className="input-group animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <label><Mail size={16} /> Email Citoyen</label>
                <input 
                  type="email" 
                  placeholder="Ex: amadou@email.com" 
                  required={!isLoginMode}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </>
          )}

          {isLoginMode && (
            <div className="input-group animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label><Mail size={16} /> Email, Téléphone ou Acte</label>
              <input
                type="text"
                placeholder="Identifiant IdentiGuinée"
                required
                value={formData.identifiant}
                onChange={(e) => setFormData({ ...formData, identifiant: e.target.value })}
              />
            </div>
          )}

          <div className="input-group animate-slide-up" style={{ animationDelay: isLoginMode ? '0.3s' : '0.4s' }}>
            <label><Lock size={16} /> Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#868E96',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <div className="input-group animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <label><Lock size={16} /> Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#868E96',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button animate-slide-up" 
            style={{ animationDelay: isLoginMode ? '0.4s' : '0.6s' }}
            disabled={loading}
          >
            {loading ? 'Vérification...' : (isLoginMode ? 'Se connecter' : 'Créer mon compte')} 
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="login-footer">
          Système protégé par <strong>NaissanceChain</strong>
        </p>
      </div>
      
      <div className="login-bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
      </div>
    </div>
  );
};

export default Login;
