import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const StreakCounter = ({ streak = 0 }) => {
    return (
        <div className="glass-panel" style={{
            padding: '12px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))',
            border: '1px solid rgba(249, 115, 22, 0.3)'
        }}>
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <Flame size={24} color="#f97316" fill="#f97316" />
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f97316', lineHeight: 1 }}>{streak}</span>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>Day Streak</span>
            </div>
        </div>
    );
};

export default StreakCounter;
