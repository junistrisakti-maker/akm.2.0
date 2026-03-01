import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Trophy, Loader2, Sparkles, Heart, Share2, CalendarCheck, MessageSquare, ChevronRight } from 'lucide-react';

const DailyMissions = () => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null);

    const iconMap = {
        'Target': Target,
        'Heart': Heart,
        'Share2': Share2,
        'CalendarCheck': CalendarCheck,
        'MessageSquare': MessageSquare
    };

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        try {
            const response = await fetch('/api/missions.php');
            const data = await response.json();
            if (data.success) {
                setMissions(data.missions);
            }
        } catch (error) {
            console.error('Error fetching missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (missionId) => {
        setClaiming(missionId);
        try {
            const response = await fetch('/api/missions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mission_id: missionId })
            });
            const data = await response.json();
            if (data.success) {
                // Success animation/toast handled by parent or context if needed
                fetchMissions(); // Refresh
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error claiming mission:', error);
        } finally {
            setClaiming(null);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" color="var(--accent-primary)" />
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Misi Harian</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Selesaikan & dapatkan bonus XP</p>
                </div>
                <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {missions.filter(m => m.status === 'claimed').length}/{missions.length}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <AnimatePresence>
                    {missions.map((mission) => {
                        const IconComponent = iconMap[mission.icon] || Target;
                        const isCompleted = mission.status === 'completed';
                        const isClaimed = mission.status === 'claimed';
                        const progress = Math.min((mission.current_count / mission.target_count) * 100, 100);

                        return (
                            <motion.div
                                key={mission.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    background: isClaimed ? 'rgba(0,0,0,0.1)' : 'var(--subtle-bg)',
                                    border: isCompleted ? '1px solid var(--accent-secondary)' : '1px solid var(--glass-border)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    opacity: isClaimed ? 0.6 : 1
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: isCompleted ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        flexShrink: 0
                                    }}>
                                        {isClaimed ? <CheckCircle2 size={24} /> : <IconComponent size={24} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{mission.title}</h3>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-primary)' }}>+{mission.xp_reward} XP</span>
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{mission.description}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', position: 'relative', background: 'var(--glass-border)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            background: isCompleted ? 'var(--accent-secondary)' : 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                                            borderRadius: '3px',
                                            boxShadow: isCompleted ? '0 0 10px var(--accent-secondary)' : 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        {mission.current_count}/{mission.target_count} Selesai
                                    </span>

                                    {isCompleted && !isClaimed && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleClaim(mission.id)}
                                            disabled={claiming === mission.id}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '20px',
                                                background: 'var(--accent-secondary)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                            }}
                                        >
                                            {claiming === mission.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>Klaim Hadiah <Sparkles size={14} /></>
                                            )}
                                        </motion.button>
                                    )}

                                    {isClaimed && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Diklaim <CheckCircle2 size={14} />
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DailyMissions;
