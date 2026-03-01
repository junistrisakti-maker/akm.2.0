import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';

const SohibMasjidBuddy = () => {
    const [tip, setTip] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchTip = async () => {
            try {
                const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php?action=getSohibTips');
                const data = await res.json();
                setTip(data.tip);
            } catch (err) {
                console.error("Sohib tips error:", err);
            }
        };

        fetchTip();
        const interval = setInterval(fetchTip, 60000); // New tip every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#1a1a2e',
                            borderRadius: '24px',
                            padding: '20px',
                            width: '260px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            marginBottom: '15px',
                            position: 'relative',
                            border: '1px solid var(--accent-primary)'
                        }}
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Sparkles size={18} color="var(--accent-primary)" />
                            <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--accent-primary)' }}>SohibMasjid AI</span>
                        </div>

                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', fontWeight: '500' }}>
                            "{tip}"
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #422AFB 0%, #673AB7 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(66, 42, 251, 0.4)',
                    position: 'relative'
                }}
            >
                <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#f43f5e', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    NEW
                </div>
                <MessageCircle size={28} />
            </motion.button>
        </div>
    );
};

export default SohibMasjidBuddy;
