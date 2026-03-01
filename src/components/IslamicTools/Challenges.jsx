import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, Star, Clock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Challenges = ({ onClose }) => {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch(`http://localhost/AKM.2.0/api/challenges.php?action=list&user_id=${user.id}`);
                const data = await res.json();
                setChallenges(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, [user.id]);

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
                        <Trophy color="white" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Tantangan</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star size={12} color="var(--accent-primary)" fill="var(--accent-primary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{user.points || 0} Points</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'var(--subtle-bg)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                    <X size={18} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="var(--accent-tertiary)" /> Aktif Sekarang
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Memuat tantangan...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {challenges.map(challenge => {
                            const progress = (challenge.user_progress / challenge.target_count) * 100;
                            return (
                                <div
                                    key={challenge.id}
                                    className="glass-panel"
                                    style={{
                                        padding: '24px',
                                        borderRadius: '24px',
                                        background: 'var(--card-bg)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                        }}>
                                            <Trophy size={28} />
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>+{challenge.points_reward} Pts</span>
                                            <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Reward Badge</p>
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{challenge.title}</h4>
                                    <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        {challenge.description}
                                    </p>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Progres: {challenge.user_progress}/{challenge.target_count}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                style={{ height: '100%', background: 'var(--accent-secondary)', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>

                                    {challenge.is_completed == 1 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '12px' }}>
                                            <CheckCircle2 size={16} /> Selesai!
                                        </div>
                                    )}

                                    {/* Seasonal Indicator */}
                                    {challenge.period_type === 'seasonal' && (
                                        <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-tertiary)', color: 'white', fontSize: '0.6rem', padding: '4px 12px', borderBottomLeftRadius: '12px', fontWeight: 'bold' }}>
                                            LIMITED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rewards Info Section */}
                <div style={{ marginTop: '32px', padding: '24px', borderRadius: '24px', background: 'rgba(167, 139, 250, 0.05)', border: '1px dashed var(--accent-primary)40' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>Tentang Tantangan</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Selesaikan tantangan harian atau musiman untuk mendapatkan Barakah Points dan lencana eksklusif yang bisa kamu pamerkan di profil!
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Challenges;
