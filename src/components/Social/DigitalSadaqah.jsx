import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Gift, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DigitalSadaqah = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const options = [
        { id: 'v1', xp: 100, value: 'Rp 1.000', title: 'Sedekah Subuh' },
        { id: 'v2', xp: 500, value: 'Rp 5.000', title: 'Infaq Dakwah' },
        { id: 'v3', xp: 1000, value: 'Rp 10.000', title: 'Wakaf Digital' },
    ];

    const handleRedeem = async (option) => {
        if (!user || (user.xp || 0) < option.xp || loading) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/redemption.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    type: 'infaq_voucher',
                    points: option.xp,
                    metadata: { title: option.title, value: option.value }
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setSuccess(true);
                if (refreshUser) refreshUser();
                setTimeout(() => setSuccess(false), 3000);
            } else {
                alert(data.error || "Gagal menukar XP");
            }
        } catch (err) {
            console.error("Redemption error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'var(--subtle-bg)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Heart size={20} color="#f43f5e" fill="#f43f5e" />
                        Digital Sadaqah
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Tukarkan XP-mu menjadi amal jariyah nyata!
                    </p>
                </div>
                <div style={{ background: 'rgba(66, 42, 251, 0.1)', color: 'var(--accent-primary)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    {(user?.xp || 0).toLocaleString()} XP Tersedia
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {options.map((option) => (
                    <motion.div
                        key={option.id}
                        whileHover={{ x: 5 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--accent-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', color: 'white' }}>
                                <Gift size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{option.title}</div>
                                <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>Setara {option.value}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleRedeem(option)}
                            disabled={!user || (user?.xp || 0) < option.xp || loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: (user?.xp || 0) >= option.xp ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                color: (user?.xp || 0) >= option.xp ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: (user?.xp || 0) >= option.xp ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s'
                            }}
                        >
                            {loading ? "..." : (
                                <>
                                    {option.xp} XP
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'rgba(74, 222, 128, 0.1)',
                        border: '1px solid #4ade80',
                        borderRadius: '12px',
                        color: '#4ade80',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <CheckCircle size={16} />
                    Alhamdulillah, XP-mu telah dikonversi menjadi Sedekah! ✨
                </motion.div>
            )}
        </div>
    );
};

export default DigitalSadaqah;
