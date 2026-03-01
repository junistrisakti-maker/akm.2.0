import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, Coffee, Volume2, Users, Calendar } from 'lucide-react';

const NOTIFICATIONS = [
    { type: 'social', message: 'Fulan just checked in at Massey Al-Ikhlas! 📍', icon: MapPin, color: '#60a5fa' },
    { type: 'reminder', message: 'Psst, Asr prayer is in 15 mins! ⏳', icon: Bell, color: '#fbbf24' },
    { type: 'fun', message: 'Kajian malam ini ada free coffee lho! ☕️', icon: Coffee, color: '#a78bfa' },
    { type: 'system', message: 'Ustadz Hanan just posted a new lecture! 🎙️', icon: Volume2, color: '#34d399' }
];

import { useAuth } from '../../context/AuthContext';

const NotificationSystem = () => {
    const [activeNotification, setActiveNotification] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchRealNotifications = async () => {
            if (!user) return;
            try {
                const response = await fetch(`http://localhost/AKM.2.0/api/notifications.php?userId=${user.id}`);
                const data = await response.json();

                // If there are new/all notifications, show the latest one if it's recent
                if (data && data.length > 0) {
                    const latest = data[0];
                    // For demo, just show the latest one whenever we poll
                    setActiveNotification({
                        type: latest.type,
                        message: latest.message,
                        icon: latest.type === 'buddy' ? Users : latest.type === 'event' ? Calendar : Bell,
                        color: latest.type === 'buddy' ? '#a78bfa' : '#fbbf24'
                    });

                    setTimeout(() => setActiveNotification(null), 5000);
                }
            } catch (err) {
                console.error("Notif fetch error:", err);
            }
        };

        // Poll for notifications every 10 seconds
        const interval = setInterval(fetchRealNotifications, 10000);

        // Initial fetch
        fetchRealNotifications();

        return () => clearInterval(interval);
    }, [user]);

    // Keep the random mock notifications fallback if user is not logged in
    useEffect(() => {
        if (user) return;

        const triggerMock = () => {
            const randomNotif = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
            setActiveNotification(randomNotif);
            setTimeout(() => setActiveNotification(null), 4000);
        };
        const interval = setInterval(triggerMock, 20000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <AnimatePresence>
            {activeNotification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                    style={{
                        position: 'fixed',
                        top: '80px', // Below Donation Tracker
                        left: '50%',
                        zIndex: 60,
                        width: '90%',
                        maxWidth: '350px',
                        background: 'rgba(30, 41, 59, 0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{
                        padding: '8px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <activeNotification.icon size={20} color={activeNotification.color} />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: '500' }}>
                        {activeNotification.message}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationSystem;
