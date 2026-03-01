import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CheckInScanner = () => {
    const { user } = useAuth();
    const [token, setToken] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const [eventTitle, setEventTitle] = useState('');

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!token) return;
        if (!user) {
            setStatus('error');
            setMessage("Silakan login sebagai petugas scan.");
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/events.php?action=checkIn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrToken: token,
                    adminId: user.id
                })
            });
            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
                setEventTitle(data.event_title);
                setToken(''); // Reset for next scan
            } else {
                setStatus('error');
                setMessage(data.error || 'Terjadi kesalahan');
            }
        } catch (err) {
            setStatus('error');
            setMessage("Koneksi gagal");
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <QrCode size={24} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Admin Scan Simulator</h3>
            </div>

            <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Masukkan Token QR secara manual untuk mensimulasikan scan petugas masjid.
                </p>
                <input
                    type="text"
                    placeholder="Contoh: a1b2c3d4..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '0.9rem',
                        outline: 'none'
                    }}
                />
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={status === 'loading'}
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={18} /> : 'Check-In Peserta'}
                </motion.button>
            </form>

            <div style={{ marginTop: '20px' }}>
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', display: 'flex', gap: '12px', alignItems: 'center' }}
                    >
                        <CheckCircle color="#10b981" />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>{message}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, color: '#10b981' }}>Acara: {eventTitle}</p>
                        </div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', display: 'flex', gap: '12px', alignItems: 'center' }}
                    >
                        <AlertCircle color="#ef4444" />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', fontWeight: '800' }}>{message}</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CheckInScanner;
