import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import { ChevronRight, Save, User, Mail, Lock, ShieldAlert, CheckCircle, Phone, MapPin, Calendar, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [availableFields, setAvailableFields] = useState([]);
  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    currentPassword: '',
    newPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const avatarFieldKey = useMemo(() => {
    if (availableFields.includes('avatar')) return 'avatar';
    if (availableFields.includes('avatar_url')) return 'avatar_url';
    if (availableFields.includes('photo_url')) return 'photo_url';
    return null;
  }, [availableFields]);

  const generateFallbackAvatar = (prenom, nom) =>
    `https://ui-avatars.com/api/?name=${prenom}+${nom}&background=006D44&color=fff`;

  useEffect(() => {
    const loadCitizenData = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('citoyens')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setAvailableFields(Object.keys(data));
        const dbAvatar = data.avatar || data.avatar_url || data.photo_url || user?.avatar;
        setFormData((prev) => ({
          ...prev,
          prenom: data.prenom || '',
          nom: data.nom || '',
          email: data.email || '',
          telephone: data.telephone || data.telephone1 || '',
          adresse: data.adresse || '',
          date_naissance: data.date_naissance || ''
        }));
        setAvatarPreview(dbAvatar || generateFallbackAvatar(data.prenom || '', data.nom || ''));
      }
    };

    loadCitizenData();
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!user?.id) {
      setError('Utilisateur non authentifié. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    const payload = {
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email
    };

    if (availableFields.includes('telephone')) payload.telephone = formData.telephone;
    if (availableFields.includes('telephone1')) payload.telephone1 = formData.telephone;
    if (availableFields.includes('adresse')) payload.adresse = formData.adresse;
    if (availableFields.includes('date_naissance')) payload.date_naissance = formData.date_naissance || null;

    if (formData.newPassword.trim()) {
      if (!formData.currentPassword.trim()) {
        setError('Veuillez renseigner votre mot de passe actuel pour le modifier.');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase
        .from('citoyens')
        .select('password')
        .eq('id', user.id)
        .single();

      if (authError || !authData || authData.password !== formData.currentPassword.trim()) {
        setError('Le mot de passe actuel est incorrect.');
        setLoading(false);
        return;
      }

      payload.password = formData.newPassword.trim();
    }

    // Mise à jour uniquement dans Supabase pour les textes
    const { error: updateError } = await supabase
      .from('citoyens')
      .update(payload)
      .eq('id', user.id);

    if (updateError) {
      setError(`Erreur de mise à jour: ${updateError.message}`);
      setLoading(false);
      return;
    }

    // Pour l'avatar (qui n'existe pas en base de données), on utilise le Base64
    // stocké localement via le AuthContext pour la démo.
    const finalAvatar = selectedAvatarFile || avatarPreview || generateFallbackAvatar(formData.prenom, formData.nom);

    // Attention: AuthContext expose "login" pour mettre à jour l'état local
    const login = (userData) => {
      // Small trick to dynamically get login from context since updateUser was undefined
      const savedUser = JSON.parse(localStorage.getItem('identiguinee_user') || '{}');
      const updatedUser = { ...savedUser, ...userData };
      localStorage.setItem('identiguinee_user', JSON.stringify(updatedUser));
      // Reload is needed to trigger state change across all components since we can't easily 
      // extract login function without changing the top level import destructuring.
    };

    // Update context via the login method
    const updatedUserData = {
      ...user,
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      avatar: finalAvatar
    };
    
    // Save to local storage
    localStorage.setItem('identiguinee_user', JSON.stringify(updatedUserData));
    
    // Force reload to apply avatar changes globally without needing AuthContext refactor
    window.location.reload();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // On convertit l'image en Base64 pour la sauvegarder dans le navigateur
    // sans avoir besoin du bucket Supabase.
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAvatarFile(reader.result);
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="form-page-content animate-fade-in">
          <nav className="breadcrumbs animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span>TABLEAU DE BORD</span> <ChevronRight size={14} />
            <span className="active">PARAMÈTRES</span>
          </nav>

          <div className="form-header animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="page-title">Paramètres du compte</h2>
            <p className="page-subtitle">
              Modifiez vos informations personnelles. Toute modification est immédiatement synchronisée avec votre compte citoyen.
            </p>
          </div>

          <div className="form-grid animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="form-sections">
              <section className="form-card">
                <div className="section-header-form">
                  <div className="icon-badge"><User size={18} /></div>
                  <h3>Informations personnelles</h3>
                </div>

                <form onSubmit={handleSave}>
                  <div className="input-group-row">
                    <div className="input-field">
                      <label htmlFor="field-prenom"><User size={14} /> PRÉNOM</label>
                      <input
                        id="field-prenom" name="prenom"
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-field">
                      <label htmlFor="field-nom"><User size={14} /> NOM</label>
                      <input
                        id="field-nom" name="nom"
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field" style={{ width: '100%' }}>
                      <label htmlFor="field-email-settings"><Mail size={14} /> EMAIL</label>
                      <input
                        id="field-email-settings" name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field" style={{ width: '100%' }}>
                      <label htmlFor="field-tel-settings"><Phone size={14} /> TÉLÉPHONE</label>
                      <input
                        id="field-tel-settings" name="telephone"
                        type="text"
                        placeholder="Ex: +224 620 00 00 00"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field" style={{ width: '100%' }}>
                      <label htmlFor="field-adresse"><MapPin size={14} /> ADRESSE</label>
                      <input
                        id="field-adresse" name="adresse"
                        type="text"
                        placeholder="Quartier, Commune, Ville"
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field" style={{ width: '100%' }}>
                      <label htmlFor="field-ddn"><Calendar size={14} /> DATE DE NAISSANCE</label>
                      <input
                        id="field-ddn" name="date_naissance"
                        type="date"
                        value={formData.date_naissance}
                        onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field" style={{ width: '100%' }}>
                      <label htmlFor="field-avatar"><Upload size={14} /> PHOTO DE PROFIL</label>
                      <input id="field-avatar" name="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                  </div>

                  <div className="input-group-row">
                    <div className="input-field">
                      <label htmlFor="field-current-password"><Lock size={14} /> MOT DE PASSE ACTUEL</label>
                      <input
                        id="field-current-password" name="current-password"
                        type="password"
                        placeholder="Requis pour modifier le mot de passe"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="input-field">
                      <label htmlFor="field-new-password"><Lock size={14} /> NOUVEAU MOT DE PASSE</label>
                      <input
                        id="field-new-password" name="new-password"
                        type="password"
                        placeholder="Laisser vide pour conserver l'actuel"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '24px' }}>
                    <button type="submit" className="btn-next" disabled={loading}>
                      <Save size={16} />
                      {loading ? 'Synchronisation...' : 'Enregistrer'}
                    </button>
                  </div>

                  {message && (
                    <p style={{ color: '#2B8A3E', marginTop: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> {message}
                    </p>
                  )}
                  {error && (
                    <p style={{ color: '#C92A2A', marginTop: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={16} /> {error}
                    </p>
                  )}
                </form>
              </section>
            </div>

            <aside className="form-sidebar">
              <div className="warning-card">
                <ShieldAlert size={20} />
                <p>Pour des raisons de sécurité, vérifiez toujours votre adresse email avant d'enregistrer vos changements.</p>
              </div>
              <div className="preview-card">
                <div className="preview-header">COMPTE ACTUEL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={avatarPreview || user?.avatar}
                    alt="Avatar utilisateur"
                    style={{ width: '56px', height: '56px', borderRadius: '50%' }}
                  />
                  <div>
                    <h4 className="preview-title" style={{ marginBottom: '4px' }}>{user?.prenom} {user?.nom}</h4>
                    <p style={{ fontSize: '13px', color: '#868E96' }}>{formData.email || 'Email non renseigné'}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
    </Layout>
  );
};

export default Settings;
