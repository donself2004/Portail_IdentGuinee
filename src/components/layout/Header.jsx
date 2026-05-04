import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, X, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import './Header.css';

const NOTIFICATIONS = [
  { id: 1, title: "Carte d'identité disponible", desc: "Votre CNI biométrique est prête à être retirée au centre de Kaloum.", time: "Il y a 2h", read: false },
  { id: 2, title: "Vérification NaissanceChain réussie", desc: "Votre acte de naissance a été confirmé avec succès dans le registre.", time: "Hier", read: false },
  { id: 3, title: "Rappel rendez-vous", desc: "Votre rendez-vous au centre de Conakry est demain à 10h00.", time: "Il y a 2 jours", read: true },
  { id: 4, title: "Bienvenue sur IdentiGuinée", desc: "Découvrez tous nos services de documents officiels en ligne.", time: "Il y a 3 jours", read: true },
];

const Header = () => {
  const { user } = useAuth();
  const { unreadCount: contextUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${user?.prenom || 'Citoyen'}+${user?.nom || ''}&background=006D44&color=fff`;

  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState([
    { from: 'agent', text: "Bonjour ! Je suis l'assistant IdentiGuinée. Comment puis-je vous aider ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [searchVal, setSearchVal] = useState('');

  const localUnreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const content = chatInput.trim();
    setChatMessages(prev => [...prev, { from: 'user', text: content }]);
    setChatInput('');
    setTimeout(() => {
      const lower = content.toLowerCase();
      let reply = "Je transmets votre demande à un agent disponible. Temps d'attente : ~5 min.";
      if (lower.includes('acte') || lower.includes('naissance')) {
        reply = "Pour un extrait de naissance, allez dans 'Nouvelle demande' → 'Extrait de Naissance' et entrez votre numéro GN-AAAA-NNNNN.";
      } else if (lower.includes('passeport')) {
        reply = "Pour un passeport, cliquez sur 'Nouvelle demande' → 'Passeport'. Délai : 7-14 jours ouvrables.";
      } else if (lower.includes('carte') || lower.includes('identit')) {
        reply = "La carte d'identité biométrique est gratuite depuis 2025. Demandez-la via 'Nouvelle demande'.";
      } else if (lower.includes('permis')) {
        reply = "Pour un permis de conduire, passez d'abord l'examen ANASER, puis faites votre demande ici.";
      } else if (lower.includes('bonjour') || lower.includes('salut')) {
        reply = `Bonjour ${user?.prenom || 'citoyen'} ! En quoi puis-je vous aider aujourd'hui ?`;
      }
      setChatMessages(prev => [...prev, { from: 'agent', text: reply }]);
    }, 800);
  };

  return (
    <>
      <header className="header animate-fade-in">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un dossier, un guide..."
            className="search-input"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <button
            className="notification-btn"
            onClick={() => { setChatOpen(open => !open); setNotifOpen(false); }}
            title="Chat support"
            type="button"
            style={{ position: 'relative' }}
          >
            <MessageSquare size={20} />
          </button>

          <button
            type="button"
            className="notification-btn"
            onClick={() => { setNotifOpen(open => !open); setChatOpen(false); }}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {(localUnreadCount || contextUnreadCount) > 0 && (
              <span className="notification-badge" style={{
                position: 'absolute', top: 4, right: 4,
                background: '#CE1126', color: '#fff',
                borderRadius: '50%', width: 17, height: 17,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{localUnreadCount || contextUnreadCount}</span>
            )}
          </button>

          <div className="user-full-profile">
            <div className="user-details">
              <p className="user-name">{user?.prenom} {user?.nom}</p>
              <p className="user-id">MATRICULE: {user?.matricule || '—'}</p>
            </div>
            <div className="avatar-container">
              <img src={avatarSrc} alt="Profile" className="avatar-header" />
              <span className="status-indicator"></span>
            </div>
          </div>
        </div>
      </header>

      {notifOpen && (
        <div style={{
          position: 'fixed', top: 68, right: 24, width: 360, background: '#fff',
          borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          zIndex: 9998, overflow: 'hidden', border: '1px solid #eee'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Notifications</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {localUnreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#006D44', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCheck size={14} /> Tout marquer lu
                </button>
              )}
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={16} /></button>
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.map(n => (
              <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                  background: n.read ? '#fff' : '#f0fdf4',
                  display: 'flex', gap: 12, alignItems: 'flex-start'
                }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: n.read ? 'transparent' : '#006D44', border: n.read ? '2px solid #ccc' : 'none'
                }} />
                <div>
                  <p style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, margin: '0 0 3px', color: '#1a1a1a' }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>{n.desc}</p>
                  <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          {localUnreadCount === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: 13 }}>
              ✅ Toutes les notifications sont lues
            </div>
          )}
        </div>
      )}

      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, width: 360,
          background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden'
        }}>
          <div style={{ background: '#006D44', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#006D44" />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>Support IdentiGuinée</p>
                <p style={{ color: '#b8ffd9', fontSize: 11, margin: 0 }}>● En ligne maintenant</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, maxHeight: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMessages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                  background: msg.from === 'user' ? '#006D44' : '#f0f0f0',
                  color: msg.from === 'user' ? '#fff' : '#333',
                  fontSize: 13, lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre message..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 13, outline: 'none' }}
            />
            <button onClick={handleSendMessage} style={{ background: '#006D44', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
