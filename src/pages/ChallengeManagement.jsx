import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ChallengeManagement = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_count: 1,
        points_reward: 10,
        is_active: 1
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/challenges.php?action=list&admin_id=${currentUser.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setChallenges(data);
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (id = null) => {
        const method = id ? 'PUT' : 'POST';
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/challenges.php', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: currentUser.id,
                    id: id,
                    ...formData
                })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            fetchChallenges();
            setIsAdding(false);
            setEditingId(null);
            setFormData({ title: '', description: '', target_count: 1, points_reward: 10, is_active: 1 });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this challenge?')) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/challenges.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: currentUser.id, id })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            fetchChallenges();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '110px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Challenges</h1>
                </div>
                <button
                    onClick={() => { setIsAdding(true); setEditingId(null); }}
                    style={{
                        background: 'var(--accent-primary)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                    }}
                >
                    <Plus size={18} /> Add
                </button>
            </div>

            {/* Notification */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            padding: '12px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            textAlign: 'center'
                        }}
                    >
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form for Add/Edit */}
            <AnimatePresence>
                {(isAdding || editingId) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            overflow: 'hidden',
                            background: 'var(--glass-bg)',
                            borderRadius: '20px',
                            border: '1px solid var(--glass-border)',
                            padding: '20px',
                            marginBottom: '24px'
                        }}
                    >
                        <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Challenge' : 'New Challenge'}</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <input
                                type="text" placeholder="Title"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                            />
                            <textarea
                                placeholder="Description"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', minHeight: '80px' }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="number" placeholder="Target Count"
                                    value={formData.target_count} onChange={e => setFormData({ ...formData, target_count: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                                />
                                <input
                                    type="number" placeholder="Points"
                                    value={formData.points_reward} onChange={e => setFormData({ ...formData, points_reward: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button onClick={() => handleSave(editingId)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Save size={18} /> Save
                                </button>
                                <button onClick={() => { setIsAdding(false); setEditingId(null); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div style={{ display: 'grid', gap: '12px' }}>
                {loading ? <p>Loading...</p> : challenges.map(c => (
                    <div key={c.id} style={{
                        background: 'var(--glass-bg)',
                        padding: '16px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        opacity: c.is_active ? 1 : 0.6
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{c.title}</h3>
                                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.description}</p>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', marginTop: '8px' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>Target: {c.target_count}</span>
                                    <span style={{ color: '#10b981' }}>{c.points_reward} XP</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => {
                                        setEditingId(c.id);
                                        setFormData({ title: c.title, description: c.description, target_count: c.target_count, points_reward: c.points_reward, is_active: c.is_active });
                                    }}
                                    style={{ background: 'rgba(167, 139, 250, 0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#a78bfa', cursor: 'pointer' }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#f43f5e', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChallengeManagement;
