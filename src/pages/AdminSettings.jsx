import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Save, ShieldAlert, Key, Globe, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/settings.php');
            const data = await res.json();
            if (data.settings) {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (group, key, value) => {
        setSettings(prev => ({
            ...prev,
            [group]: prev[group].map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
        }));
    };

    const saveSettings = async () => {
        setSaving(true);
        const payload = {};
        Object.values(settings).flat().forEach(s => {
            payload[s.setting_key] = s.setting_value;
        });

        try {
            const res = await fetch('http://localhost/AKM.2.0/api/settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: payload,
                    user_id: user.id
                })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Memuat Konfigurasi...</div>;

    const groupIcons = {
        ai: <Key size={18} />,
        whatsapp: <Globe size={18} />,
        payment: <Layout size={18} />,
        general: <ShieldAlert size={18} />
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--text-primary)' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>System Admin</h1>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Centralized API Hub</p>
                    </div>
                </div>

                <button
                    onClick={saveSettings}
                    disabled={saving}
                    style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: message.includes('success') ? 'var(--accent-secondary)20' : 'var(--accent-tertiary)20',
                    color: message.includes('success') ? 'var(--accent-secondary)' : 'var(--accent-tertiary)',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {Object.entries(settings).map(([group, items]) => (
                    <section key={group}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--accent-primary)' }}>
                            {groupIcons[group] || <ShieldAlert size={18} />}
                            <h3 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{group}</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {items.map(item => (
                                <div key={item.setting_key} className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {item.setting_key}
                                    </label>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                        {item.description}
                                    </p>
                                    <input
                                        type="text"
                                        value={item.setting_value}
                                        onChange={(e) => handleUpdate(group, item.setting_key, e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </motion.div>
    );
};

export default AdminSettings;
