import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';
import RealtimeToast from '../components/UI/RealtimeToast';
import { AnimatePresence } from 'framer-motion';

const RealtimeContext = createContext();

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) return;

        // Pusher client keys (hardcoded temporarily for demo, or fetched from API)
        const pusher = new Pusher('584dc1397fe1b471959d', {
            cluster: 'ap1'
        });

        const channel = pusher.subscribe(`user-${user.id}`);

        channel.bind('notification', (data) => {
            const id = Date.now();
            setNotifications(prev => [...prev, { ...data, id }]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        });

        return () => {
            pusher.unsubscribe(`user-${user.id}`);
            pusher.disconnect();
        };
    }, [user]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <RealtimeContext.Provider value={{ notifications }}>
            {children}
            <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence>
                    {notifications.map(notif => (
                        <RealtimeToast
                            key={notif.id}
                            notification={notif}
                            onClose={() => removeNotification(notif.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </RealtimeContext.Provider>
    );
};
