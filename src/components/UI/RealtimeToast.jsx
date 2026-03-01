import React from 'react';
import { motion } from 'framer-motion';
import { Bell, UserPlus, Calendar, Trophy, X, MessageSquare } from 'lucide-react';

const RealtimeToast = ({ notification, onClose }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'buddy': return <UserPlus color="#34d399" />;
            case 'event': return <Calendar color="#8b5cf6" />;
            case 'event_checkin': return <Trophy color="#fbbf24" />;
            case 'nudge': return <MessageSquare color="#34d399" />;
            default: return <Bell color="var(--accent-primary)" />;
        }
    };

    const getTitle = () => {
        switch (notification.type) {
            case 'buddy': return "New Buddy Request";
            case 'event': return "Event Update";
            case 'event_checkin': return "Check-in Berhasil!";
            case 'nudge': return "Seseorang Menyapa";
            default: return "Notifikasi";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            style={{
                width: '320px',
                padding: '16px',
                borderRadius: '24px',
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                gap: '12px',
                position: 'relative',
                pointerEvents: 'auto'
            }}
        >
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {getIcon()}
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>{getTitle()}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                    {notification.message}
                </p>
            </div>

            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer'
                }}
            >
                <X size={14} />
            </button>

            {/* Progress Bar */}
            <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    background: 'var(--accent-primary)',
                    borderRadius: '0 0 0 24px'
                }}
            />
        </motion.div>
    );
};

export default RealtimeToast;
