import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import DemandForm from './pages/DemandForm'
import Login from './pages/Login'
import Processing from './pages/Processing'
import DocumentGenere from './pages/DocumentGenere'
import Tracking from './pages/Tracking'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import Services from './pages/Services'
import Verify from './pages/Verify'
import Notifications from './pages/Notifications'
import { NotificationProvider } from './context/NotificationContext'
import './App.css'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/nouvelle-demande" element={<PrivateRoute><DemandForm /></PrivateRoute>} />
            <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
            <Route path="/traitement" element={<PrivateRoute><Processing /></PrivateRoute>} />
            <Route path="/document-genere" element={<PrivateRoute><DocumentGenere /></PrivateRoute>} />
            <Route path="/suivi" element={<PrivateRoute><Tracking /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
            <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/verify/:docId" element={<Verify />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}



export default App
