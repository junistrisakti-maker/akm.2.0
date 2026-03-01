import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Upload, CheckCircle, Info, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/UI/LoadingScreen';

const ApplyAdmin = () => {
    const { mosqueId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mosque, setMosque] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchMosque = async () => {
            try {
                const res = await fetch(`http://localhost/AKM.2.0/api/mosques.php?action=details&id=${mosqueId}`);
                const data = await res.json();
                setMosque(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMosque();
    }, [mosqueId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!docUrl) return alert("Silakan masukkan link dokumen atau foto verifikasi!");

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/requests.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    userId: user.id,
                    mosqueId: mosqueId,
                    documentUrl: docUrl
                })
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                alert(data.error || "Gagal mengirim pengajuan");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!mosque) return <div style={{ color: 'white', padding: '20px' }}>Masjid tidak ditemukan.</div>;

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '40px 20px', textAlign: 'center', color: 'white', minHeight: '100vh', background: 'var(--bg-primary)' }}
            >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle size={40} color="#4ade80" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Pengajuan Terkirim!</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
                    Terima kasih telah bersedia menjadi bagian dari pengurus digital <b>{mosque.name}</b>. Tim kami akan melakukan verifikasi dalam 1-3 hari kerja.
                </p>
                <button
                    onClick={() => navigate(`/masjid/${mosqueId}`)}
                    style={{ padding: '14px 32px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Kembali ke Masjid
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'white' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <ChevronLeft size={20} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Pengajuan Pengurus</h1>
            </div>

            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Shield size={24} color="var(--accent-primary)" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Verifikasi Identitas</h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mosque.name}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '12px' }}>
                        <Info size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#93c5fd', lineHeight: '1.5' }}>
                            Untuk memastikan keamanan komunitas, kami memerlukan bukti legalitas berupa <b>SK Pengurus</b> atau <b>ID Card Masjid</b> yang sah.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Link Dokumen / Foto SK</label>
                            <div style={{ position: 'relative' }}>
                                <FileText size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="url"
                                    placeholder="https://drive.google.com/..."
                                    value={docUrl}
                                    onChange={(e) => setDocUrl(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        borderRadius: '12px',
                                        background: 'var(--subtle-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <p style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Pastikan link bisa diakses (Public/Anyone with the link).
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={submitting}
                            type="submit"
                            style={{
                                width: '100%',
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
                                opacity: submitting ? 0.7 : 1,
                                marginTop: '12px'
                            }}
                        >
                            {submitting ? 'Mengirim...' : <><Upload size={20} /> Kirim Pengajuan</>}
                        </motion.button>
                    </form>
                </div>
            </div>

            <div style={{ textAlign: 'center', opacity: 0.5 }}>
                <p style={{ fontSize: '0.75rem' }}>Data Anda aman dan hanya digunakan untuk keperluan verifikasi internal AyoKeMasjid.</p>
            </div>
        </motion.div>
    );
};

export default ApplyAdmin;
