import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Image as ImageIcon, Check } from 'lucide-react';

const AddEventModal = ({ isOpen, onClose, onSubmit, mosques, userId }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        category: 'Kajian',
        image: '',
        mosqueId: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mosques && mosques.length === 1) {
            setFormData(prev => ({ ...prev, mosqueId: mosques[0].id, location: mosques[0].name }));
        }
    }, [mosques]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        borderRadius: '24px',
                        padding: '24px',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: '1px solid var(--glass-border)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }} className="text-gradient">Post New Event</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Event Title</label>
                            <input
                                required
                                type="text"
                                placeholder="Contoh: Kajian Akbar Akhir Pekan"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Time</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-secondary)' }} />
                                    <input
                                        required
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Mosque / Location</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-tertiary)' }} />
                                <select
                                    required
                                    value={formData.mosqueId}
                                    onChange={(e) => {
                                        const selected = mosques.find(m => m.id == e.target.value);
                                        setFormData({ ...formData, mosqueId: e.target.value, location: selected ? selected.name : '' });
                                    }}
                                    style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', appearance: 'none' }}
                                >
                                    <option value="" disabled style={{ background: '#0f172a' }}>Select Mosque</option>
                                    {mosques.map(m => (
                                        <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                >
                                    {['Kajian', 'Volunteer', 'Social', 'Sport'].map(cat => (
                                        <option key={cat} value={cat} style={{ background: '#0f172a' }}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>Banner Image URL</label>
                                <div style={{ position: 'relative' }}>
                                    <ImageIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            style={{
                                marginTop: '12px',
                                padding: '16px',
                                borderRadius: '16px',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Posting...' : <><Check size={20} /> Publish Event</>}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddEventModal;
