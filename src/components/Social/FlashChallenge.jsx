import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Users } from 'lucide-react';

const FlashChallenge = () => {
    const [challenge, setChallenge] = useState(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php?action=getFlashChallenge');
                const data = await res.json();
                if (data && data.id) {
                    setChallenge(data);
                } else {
                    setChallenge(null);
                }
            } catch (err) {
                console.error("Flash challenge error:", err);
            }
        };

        fetchChallenge();
        const interval = setInterval(fetchChallenge, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!challenge) return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                borderRadius: '24px',
                padding: '24px',
                color: 'white',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(244, 63, 94, 0.3)'
            }}
        >
            {/* Background Icon */}
            <Zap
                size={80}
                style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '-10px',
                    opacity: 0.1,
                    transform: 'rotate(-15deg)'
                }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'white', color: '#f43f5e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                    FLASH EVENT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', opacity: 0.9 }}>
                    <Clock size={14} />
                    <span>Limited Time Only!</span>
                </div>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>{challenge.title}</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>
                {challenge.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <span style={{ fontSize: '12px', display: 'block', marginBottom: '4px', opacity: 0.8 }}>Progress Bersama</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '150px', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(challenge.points_earned / challenge.target_points) * 100}%` }}
                                style={{ height: '100%', background: 'white' }}
                            />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                            {Math.round((challenge.points_earned / challenge.target_points) * 100)}%
                        </span>
                    </div>
                </div>
                <button style={{
                    background: 'white',
                    color: '#f43f5e',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    Ayo Join!
                </button>
            </div>
        </motion.div>
    );
};

export default FlashChallenge;
