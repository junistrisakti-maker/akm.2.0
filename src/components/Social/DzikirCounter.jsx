import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DzikirCounter = () => {
    const { user } = useAuth();
    const [counter, setCounter] = useState(null);
    const [isTallying, setIsTallying] = useState(false);

    useEffect(() => {
        const fetchCounter = async () => {
            try {
                const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php?action=getCounts');
                const data = await res.json();
                if (data && data.length > 0) {
                    setCounter(data[0]); // Take the first active counter
                }
            } catch (err) {
                console.error("Counter fetch error:", err);
            }
        };

        fetchCounter();
        const interval = setInterval(fetchCounter, 5000); // Polling for real-time vibe
        return () => clearInterval(interval);
    }, []);

    const handleTally = async () => {
        if (!counter || isTallying) return;
        setIsTallying(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'tally',
                    counter_key: counter.counter_key,
                    increment: 1
                })
            });
            const data = await res.json();
            setCounter({ ...counter, current_value: data.current_value });
        } catch (err) {
            console.error("Tally error:", err);
        } finally {
            setTimeout(() => setIsTallying(false), 100);
        }
    };

    if (!counter) return null;

    const progress = Math.min((counter.current_value / counter.target_value) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'var(--subtle-bg)',
                borderRadius: '24px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center'
            }}
        >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{counter.title}</h4>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', marginBottom: '15px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    {counter.current_value.toLocaleString()}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    / {counter.target_value.toLocaleString()}
                </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{ height: '100%', background: 'var(--accent-primary)' }}
                />
            </div>

            {progress >= 100 ? (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '16px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                    <h2 style={{ margin: 0, color: '#4ade80', fontSize: '24px' }}>✨ TARGET TERCAPAI! ✨</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Mubarak! Goal kolektif hari ini berhasi dilampaui. Terus berdzikir!</p>
                </div>
            ) : (
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleTally}
                    style={{
                        background: 'linear-gradient(135deg, #422AFB 0%, #673AB7 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '100px',
                        height: '100px',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 12px 24px rgba(66, 42, 251, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9, marginBottom: '-4px' }}>TAP</span>
                    +1
                </motion.button>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px', fontStyle: 'italic' }}>
                {progress >= 100 ? "Mari lalui target selanjutnya bersama-sama!" : "Sentuh untuk menambah sholawat kolektif secara nasional"}
            </p>
        </motion.div>
    );
};

export default DzikirCounter;
