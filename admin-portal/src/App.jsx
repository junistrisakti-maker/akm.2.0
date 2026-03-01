import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Moderation from './pages/Moderation';
import Challenges from './pages/Challenges';
import Settings from './pages/Settings';
import VibesMusic from './pages/VibesMusic';
import Events from './pages/Events';
import AISettings from './pages/AISettings';
import YouthHubProfile from './pages/YouthHubProfile';
import Broadcasts from './pages/Broadcasts';
import DailyMissions from './pages/DailyMissions';

const ProtectedRoute = ({ children }) => {
    const { admin, loading } = useAdminAuth();
    if (loading) return <div>Loading...</div>;
    if (!admin) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <AdminAuthProvider>
            <Routes>
                <Route path="login" element={<Login />} />

                <Route path="*" element={
                    <ProtectedRoute>
                        <AdminLayout>
                            <Routes>
                                <Route index element={<Analytics />} />
                                <Route path="hub-profile" element={<YouthHubProfile />} />
                                <Route path="broadcasts" element={<Broadcasts />} />
                                <Route path="moderation" element={<Moderation />} />
                                <Route path="users" element={<Users />} />
                                <Route path="challenges" element={<Challenges />} />
                                <Route path="vibes-music" element={<VibesMusic />} />
                                <Route path="events" element={<Events />} />
                                <Route path="missions" element={<DailyMissions />} />
                                <Route path="ai-control" element={<AISettings />} />
                                <Route path="settings" element={<Settings />} />
                            </Routes>
                        </AdminLayout>
                    </ProtectedRoute>
                } />
            </Routes>
        </AdminAuthProvider>
    );
}

export default App;
