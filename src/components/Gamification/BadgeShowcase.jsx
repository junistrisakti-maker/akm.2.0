import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, Star, Shield, Heart, Flame, Users } from 'lucide-react';

const BadgeShowcase = ({ userId }) => {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await fetch(`http://localhost/AKM.2.0/api/badges.php?userId=${userId}`);
                const data = await res.json();
                if (data.earned) {
                    setEarnedBadges(data.earned);
                }
            } catch (err) {
                console.error("Badge fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchBadges();
    }, [userId]);

    const getIcon = (type) => {
        switch (type) {
            case 'medal': return <Medal size={24} />;
            case 'fire': return <Flame size={24} />;
            case 'heart': return <Heart size={24} />;
            case 'users': return <Users size={24} />;
            case 'star': return <Star size={24} />;
            default: return <Shield size={24} />;
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Memuat Badge...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
            {earnedBadges.map((badge) => (
                <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'help'
                    }}
                    title={badge.description}
                >
                    <div style={{
                        color: 'var(--accent-primary)',
                        filter: 'drop-shadow(0 0 8px rgba(66, 42, 251, 0.4))'
                    }}>
                        {getIcon(badge.icon_type)}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
                        {badge.name}
                    </span>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent)',
                        pointerEvents: 'none'
                    }} />
                </motion.div>
            ))}
            {earnedBadges.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Belum ada badge. Terus istiqomah ya! 🔥
                </div>
            )}
        </div>
    );
};

export default BadgeShowcase;
