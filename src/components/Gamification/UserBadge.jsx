import React from 'react';
import { motion } from 'framer-motion';

const UserBadge = ({ title, icon, unlocked, color = '#fbbf24' }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass-panel"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                width: '100px',
                height: '120px',
                opacity: unlocked ? 1 : 0.5,
                filter: unlocked ? 'none' : 'grayscale(100%)',
                cursor: 'pointer'
            }}
        >
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: unlocked ? `rgba(${color}, 0.2)` : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                border: unlocked ? `2px solid ${color}` : '2px solid #475569',
                fontSize: '24px'
            }}>
                {icon}
            </div>
            <span style={{
                fontSize: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: unlocked ? '#f1f5f9' : '#94a3b8'
            }}>
                {title}
            </span>
        </motion.div>
    );
};

export default UserBadge;
