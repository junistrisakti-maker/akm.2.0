import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Heart, MessageSquare, Send, Search, Activity, Hand, Shield, Utensils, Briefcase, Landmark, Smile, Users as UsersIcon, Home, Moon, HeartHandshake, Coins, FileText, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PrayerCircle = ({ onClose }) => {
    const { user } = useAuth();
    const [newPrayer, setNewPrayer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchTemplate, setSearchTemplate] = useState('');

    const templates = [
        { id: 1, name: 'Kesembuhan Penyakit', icon: <Activity />, color: '#f43f5e', text: 'Ya Allah, berikanlah kesembuhan kepada hamba-Mu yang sedang sakit ini...' },
        { id: 2, name: 'Mohon Ampunan & Perlindungan', icon: <Heart size={24} />, color: '#ec4899', text: 'Ya Allah, ampunilah dosa-dosaku dan lindungilah hamba dari segala mara bahaya...' },
        { id: 3, name: 'Akhlak Baik', icon: <HeartHandshake />, color: '#8b5cf6', text: 'Ya Allah, hiasilah hamba dengan akhlak yang mulia dan sabar...' },
        { id: 4, name: 'Makan dan Minum', icon: <Utensils />, color: '#f43f5e', text: 'Alhamdulillah, terima kasih ya Allah atas rezeki makanan dan minuman hari ini...' },
        { id: 5, name: 'Bepergian', icon: <Briefcase />, color: '#ec4899', text: 'Bismillah, lancarkanlah perjalananku dan lindungilah hingga sampai tujuan...' },
        { id: 6, name: 'Haji dan Umrah', icon: <Landmark />, color: '#8b5cf6', text: 'Ya Allah, panggillah hamba-Mu ini untuk bisa beribadah ke Tanah Suci-Mu...' },
        { id: 7, name: 'Kebahagiaan & Kemudahan', icon: <Smile />, color: '#fbbf24', text: 'Ya Allah, mudahkanlah segala urusanku dan berikanlah kebahagiaan di dunia & akhirat...' },
        { id: 8, name: 'Rumah Tangga & Keluarga', icon: <UsersIcon />, color: '#ec4899', text: 'Ya Allah, jadikanlah keluarga hamba sakinah, mawaddah, warahmah...' },
        { id: 9, name: 'Aktivitas Rumah', icon: <Home />, color: '#8b5cf6', text: 'Berkahilah segala rutinitas dan aktivitas di dalam rumah ini ya Allah...' },
        { id: 10, name: 'Masjid', icon: <Landmark />, color: '#f43f5e', text: 'Ya Allah, jadikanlah hati hamba selalu terpaut dengan masjid-Mu...' },
        { id: 11, name: 'Ramadhan', icon: <Moon />, color: '#fbbf24', text: 'Ya Allah, berkahilah hamba di bulan Ramadhan dan terimalah amal ibadah hamba...' },
        { id: 12, name: 'Keteguhan Hati', icon: <HeartHandshake />, color: '#ec4899', text: 'Ya Allah, teguhkanlah hati hamba di atas agama-Mu...' },
        { id: 13, name: 'Rezeki', icon: <Coins />, color: '#fbbf24', text: 'Ya Allah, bukakanlah pintu rezeki yang halal dan barokah dari segala penjuru...' },
        { id: 14, name: 'Doa Lainnya', icon: <FileText />, color: '#8b5cf6', text: '' }
    ];

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTemplate.toLowerCase())
    );

    useEffect(() => {
        // No need to fetch anything here for now as it's just a form
    }, []);

    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = async () => {
        if (!user) return alert("Silakan login terlebih dahulu.");
        if (!newPrayer.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'postPrayer',
                    userId: user.id,
                    content: newPrayer,
                    isAnonymous: isAnonymous ? 1 : 0
                })
            });
            if (res.ok) {
                setNewPrayer('');
                onClose(); // Close the drawer after success
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

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
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="neon-glow" style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart color="white" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Simpul Doa</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Tautkan Doa & Harapan</span>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'var(--subtle-bg)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                    <X size={18} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Tuliskan Simpul Doa Kamu
                </label>

                <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <textarea
                        placeholder="Apa hajatmu saat ini? Mari kita aminkan bersama..."
                        value={newPrayer}
                        onChange={(e) => setNewPrayer(e.target.value)}
                        maxLength={1000}
                        style={{
                            width: '100%',
                            height: '180px',
                            padding: '20px',
                            borderRadius: '24px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            outline: 'none',
                            resize: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        Kirim sebagai Anonim (Hamba Allah)
                    </label>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Sisa {1000 - newPrayer.length} karakter
                    </p>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={submitting || !newPrayer.trim()}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '40px',
                        background: 'linear-gradient(135deg, #422AFB 0%, #673AB7 100%)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: 'none',
                        cursor: submitting ? "not-allowed" : "pointer",
                        marginBottom: '40px',
                        boxShadow: '0 8px 20px rgba(66, 42, 251, 0.3)'
                    }}
                >
                    {submitting ? 'MEMPROSES...' : 'KIRIM SIMPUL DOA'}
                </motion.button>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                        Gunakan Template Doa
                    </h3>
                    <div style={{
                        background: 'var(--subtle-bg)',
                        padding: '12px 16px',
                        borderRadius: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '20px'
                    }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Cari doa"
                            value={searchTemplate}
                            onChange={(e) => setSearchTemplate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', flex: 1 }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--glass-border)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                        {filteredTemplates.map(template => (
                            <motion.button
                                key={template.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setNewPrayer(template.text)}
                                style={{
                                    background: 'var(--card-bg)',
                                    padding: '16px 8px',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ color: template.color }}>
                                    {template.icon}
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'center', lineHeight: '1.2' }}>
                                    {template.name}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PrayerCircle;
