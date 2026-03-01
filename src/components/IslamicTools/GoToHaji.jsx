import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Bookmark, Share2, Info, MapPin, ClipboardList, X, Plane } from 'lucide-react';

const GoToHaji = ({ onClose }) => {
    const categories = ['Edukasi', 'Tips Solo', 'Packing', 'Budget'];
    const [activeCat, setActiveCat] = useState('Edukasi');

    const content = [
        {
            id: 1,
            title: 'Persiapan Fisik Gen Z',
            subtitle: 'Tips latihan kardio untuk Tawaf & Sa\'i',
            image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=400',
            duration: '5 min read',
            category: 'Edukasi'
        },
        {
            id: 2,
            title: 'Checklist Umrah Mandiri',
            subtitle: 'Semua yang perlu kamu bawa di tas kabin',
            image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=400',
            duration: '10 min read',
            category: 'Packing'
        },
        {
            id: 3,
            title: 'Haji Muda: Mengapa Sekarang?',
            subtitle: 'Spiritualitas di masa produktif',
            image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=400',
            duration: 'Video 3:20',
            category: 'Edukasi',
            isVideo: true
        }
    ];

    const filteredContent = content.filter(c => c.category === activeCat || activeCat === 'Edukasi');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            className="glass-panel"
            style={{
                position: 'fixed',
                top: '10vh',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '448px',
                height: '75vh',
                background: 'var(--bg-secondary)',
                borderRadius: '28px',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}
        >
            {/* Header with Visual Backdrop */}
            <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                <img
                    src="https://images.unsplash.com/photo-1563905317-063a12903332?auto=format&fit=crop&q=80&w=600"
                    alt="Hajj"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), var(--bg-secondary))' }}></div>

                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ position: 'absolute', bottom: '20px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                        <Plane color="white" size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem', fontWeight: '800' }}>GoToHaji</h2>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Panduan Haji & Umrah</span>
                    </div>
                </div>
            </div>

            {/* Category Scroll */}
            <div style={{ padding: '20px', display: 'flex', gap: '12px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            background: activeCat === cat ? 'var(--accent-primary)' : 'var(--card-bg)',
                            color: activeCat === cat ? 'white' : 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            border: '1px solid var(--glass-border)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {filteredContent.map(item => (
                        <motion.div
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                background: 'var(--card-bg)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ position: 'relative', height: '120px' }}>
                                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {item.isVideo && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Play size={20} color="white" fill="white" />
                                        </div>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem' }}>
                                    {item.duration}
                                </div>
                            </div>
                            <div style={{ padding: '12px' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', lineHeight: '1.4' }}>{item.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{item.subtitle}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Fitur Utama</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { icon: <MapPin size={20} />, title: 'Peta Interaktif Makkah', color: '#10b981' },
                            { icon: <ClipboardList size={20} />, title: 'Manajemen Dokumen', color: '#7c3aed' },
                            { icon: <Info size={20} />, title: 'Info Vaksin & Visa', color: '#f43f5e' }
                        ].map((fitur, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ color: fitur.color }}>{fitur.icon}</div>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{fitur.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default GoToHaji;
