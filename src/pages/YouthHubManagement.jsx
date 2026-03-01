import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Send,
    Trash2,
    Instagram,
    MessageSquare,
    AtSign,
    Hexagon,
    Plus,
    Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/UI/LoadingScreen';

const YouthHubManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mosque, setMosque] = useState(null);
    const [broadcasts, setBroadcasts] = useState([]);
    const [newBroadcast, setNewBroadcast] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!user?.managed_mosque_id) {
            setLoading(false);
            return;
        }
        try {
            // Fetch mosque details
            const mosqueRes = await fetch(`http://localhost/AKM.2.0/api/mosques.php?action=details&id=${user.managed_mosque_id}`);
            const mosqueData = await mosqueRes.json();
            setMosque(mosqueData);

            // Fetch broadcasts
            const broadcastRes = await fetch(`http://localhost/AKM.2.0/api/broadcasts.php?mosque_id=${user.managed_mosque_id}`);
            const broadcastData = await broadcastRes.json();
            setBroadcasts(broadcastData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/mosques.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: mosque.id,
                    hub_vibe: mosque.hub_vibe,
                    instagram_handle: mosque.instagram_handle,
                    tiktok_handle: mosque.tiktok_handle,
                    org_name: mosque.org_name
                })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleAddBroadcast = async () => {
        if (!newBroadcast.trim()) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/broadcasts.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mosque_id: mosque.id,
                    content: newBroadcast,
                    admin_id: user.id
                })
            });
            if (res.ok) {
                setNewBroadcast('');
                fetchData();
                setMessage('Broadcast sent! 🚀');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteBroadcast = async (id) => {
        if (!window.confirm('Hapus broadcast ini?')) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/broadcasts.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!mosque) return <div style={{ padding: '40px', color: 'white' }}>Unauthorized access.</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '12px', color: 'white' }}>
                    <ChevronLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Youth Hub Management</h1>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ padding: '12px', background: 'var(--accent-secondary)', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '0.85rem' }}
                    >
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Info Section */}
            <section className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Layout size={20} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Hub Profile</h3>
                </div>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Hub Vibe Text</label>
                        <input
                            type="text"
                            value={mosque.hub_vibe || ''}
                            onChange={(e) => setMosque({ ...mosque, hub_vibe: e.target.value })}
                            placeholder="e.g. Center of Gen Z Spiritual Vibes"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Organization Name</label>
                        <input
                            type="text"
                            value={mosque.org_name || ''}
                            onChange={(e) => setMosque({ ...mosque, org_name: e.target.value })}
                            placeholder="e.g. RISMA (Remaja Islam Masjid)"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}><Instagram size={14} style={{ verticalAlign: 'middle' }} /> Instagram</label>
                            <input
                                type="text"
                                value={mosque.instagram_handle || ''}
                                onChange={(e) => setMosque({ ...mosque, instagram_handle: e.target.value })}
                                placeholder="@handle"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}><Hexagon size={14} style={{ verticalAlign: 'middle' }} /> TikTok</label>
                            <input
                                type="text"
                                value={mosque.tiktok_handle || ''}
                                onChange={(e) => setMosque({ ...mosque, tiktok_handle: e.target.value })}
                                placeholder="@handle"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{ marginTop: '8px', padding: '14px', borderRadius: '12px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Update Hub Info'}
                    </button>
                </form>
            </section>

            {/* Broadcast Section */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Send size={20} color="var(--accent-secondary)" />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Broadcast Youth</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
                    <textarea
                        value={newBroadcast}
                        onChange={(e) => setNewBroadcast(e.target.value)}
                        placeholder="What's happening at the hub? ✨"
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', minHeight: '80px', fontSize: '0.9rem', resize: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button
                            onClick={handleAddBroadcast}
                            disabled={!newBroadcast.trim()}
                            style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--accent-secondary)', border: 'none', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: !newBroadcast.trim() ? 0.5 : 1 }}
                        >
                            <Send size={16} /> Broadcast
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {broadcasts.map(b => (
                        <div key={b.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', flex: 1 }}>{b.content}</p>
                            <button
                                onClick={() => handleDeleteBroadcast(b.id)}
                                style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.5)', cursor: 'pointer', marginLeft: '12px' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {broadcasts.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No broadcasts yet.</p>
                    )}
                </div>
            </section>
        </motion.div>
    );
};

export default YouthHubManagement;
