import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// ── Auth admin ──
import { isAdminLoggedIn } from './admin/AdminLayout';

// ── Page de connexion UNIQUE ──
import Login from './pages/Login';

// ── Portail Citoyen ──
import Dashboard      from './pages/Dashboard';
import DemandForm     from './pages/DemandForm';
import Processing     from './pages/Processing';
import DocumentGenere from './pages/DocumentGenere';
import Tracking       from './pages/Tracking';
import Documents      from './pages/Documents';
import Settings       from './pages/Settings';
import Aide           from './pages/Aide';
import Services       from './pages/Services';
import Notifications  from './pages/Notifications';

// ── Vérification publique ──
import Verify   from './pages/Verify';
import Verifier from './pages/Verifier';

// ── Interface Administration ──
import AdminDashboard     from './admin/AdminDashboard';
import AdminDemandes, { AdminDemandeDetail } from './admin/AdminDemandes';
import AdminUtilisateurs  from './admin/AdminUtilisateurs';
import AdminProcessus     from './admin/AdminProcessus';
import AdminJournal       from './admin/AdminJournal';

// ── Route protégée citoyen ──
const CitoyenRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

// ── Route protégée admin ──
const AdminRoute = ({ children }) => {
  return isAdminLoggedIn() ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>

            {/* ═══════════════════════════════════
                PAGE D'ACCUEIL = LOGIN (racine /)
            ═══════════════════════════════════ */}
            <Route path="/" element={<LoginOrDashboard />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* ═══════════════════════════════════
                PORTAIL CITOYEN (authentifié)
            ═══════════════════════════════════ */}
            <Route path="/dashboard"         element={<CitoyenRoute><Dashboard /></CitoyenRoute>} />
            <Route path="/nouvelle-demande"  element={<CitoyenRoute><DemandForm /></CitoyenRoute>} />
            <Route path="/traitement"        element={<CitoyenRoute><Processing /></CitoyenRoute>} />
            <Route path="/document-genere"   element={<CitoyenRoute><DocumentGenere /></CitoyenRoute>} />
            <Route path="/suivi"             element={<CitoyenRoute><Tracking /></CitoyenRoute>} />
            <Route path="/documents"         element={<CitoyenRoute><Documents /></CitoyenRoute>} />
            <Route path="/parametres"        element={<CitoyenRoute><Settings /></CitoyenRoute>} />
            <Route path="/aide"              element={<CitoyenRoute><Aide /></CitoyenRoute>} />
            <Route path="/services"          element={<CitoyenRoute><Services /></CitoyenRoute>} />
            <Route path="/notifications"     element={<CitoyenRoute><Notifications /></CitoyenRoute>} />

            {/* ═══════════════════════════════════
                VÉRIFICATION PUBLIQUE (sans login)
            ═══════════════════════════════════ */}
            <Route path="/verify/:docId"  element={<Verify />} />
            <Route path="/verifier/:id"   element={<Verifier />} />

            {/* ═══════════════════════════════════
                INTERFACE ADMINISTRATION
            ═══════════════════════════════════ */}
            <Route path="/admin"                      element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/demandes"             element={<AdminRoute><AdminDemandes /></AdminRoute>} />
            <Route path="/admin/demandes/:id"         element={<AdminRoute><AdminDemandeDetail /></AdminRoute>} />
            <Route path="/admin/utilisateurs"         element={<AdminRoute><AdminUtilisateurs /></AdminRoute>} />
            <Route path="/admin/processus"            element={<AdminRoute><AdminProcessus /></AdminRoute>} />
            <Route path="/admin/journal"              element={<AdminRoute><AdminJournal /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

// Composant intelligent : si déjà connecté → redirige, sinon affiche Login
const LoginOrDashboard = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  if (isAdminLoggedIn()) return <Navigate to="/admin" replace />;
  return <Login />;
};

export default App;
