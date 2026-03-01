import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Events from './pages/Events';
import Messages from './pages/Messages';
import Community from './pages/Community';
import CircleDetail from './pages/CircleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import AdminSettings from './pages/AdminSettings';
import MasjidProfile from './pages/MasjidProfile';
import IslamicChannel from './pages/IslamicChannel';
import ApplyAdmin from './pages/ApplyAdmin';
import AppearanceSettings from './pages/AppearanceSettings';
import YouthHubManagement from './pages/YouthHubManagement';
import SocialHub from './pages/SocialHub';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import LoadingScreen from './components/UI/LoadingScreen';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isSuperadmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isSuperadmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="community/social" element={<ProtectedRoute><SocialHub /></ProtectedRoute>} />
                <Route path="community/circle/:id" element={<ProtectedRoute><CircleDetail /></ProtectedRoute>} />
                <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="settings/appearance" element={<ProtectedRoute><AppearanceSettings /></ProtectedRoute>} />
                <Route path="settings/admin" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                <Route path="settings/youth-hub" element={<ProtectedRoute><YouthHubManagement /></ProtectedRoute>} />
                <Route path="masjid/:id" element={<ProtectedRoute><MasjidProfile /></ProtectedRoute>} />
                <Route path="apply-admin/:mosqueId" element={<ProtectedRoute><ApplyAdmin /></ProtectedRoute>} />
                <Route path="channel" element={<ProtectedRoute><IslamicChannel /></ProtectedRoute>} />
              </Route>
            </Routes>
          </AnimatePresence>
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
