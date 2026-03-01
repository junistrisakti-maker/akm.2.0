import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityTicker = () => {
    const [activities, setActivities] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php?action=getActivityFeed');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setActivities(data);
                }
            } catch (err) {
                console.error("Ticker error:", err);
            }
        };

        fetchFeed();
        const interval = setInterval(fetchFeed, 30000); // 30s update
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activities.length > 0) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % activities.length);
            }, 5000); // 5s rotation
            return () => clearInterval(timer);
        }
    }, [activities]);

    if (activities.length === 0) return null;

    const current = activities[currentIndex];

    // Format helper
    const formatActivity = (act) => {
        switch (act.type) {
            case 'checkin':
                return `📍 @${act.username} baru saja check-in di ${act.detail}`;
            case 'rankup':
                return `🔥 Selamat! @${act.username} naik ke ${act.detail}`;
            case 'prayer':
                return `✨ Simpul Doa baru: "${act.detail.substring(0, 30)}..."`;
            case 'tally_milestone':
                return `✨ ${act.detail}`;
            case 'goal_achieved':
                return `🏆 ${act.detail}`;
            default:
                return act.detail;
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(90deg, #422AFB 0%, #673AB7 100%)',
            color: 'white',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px'
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                >
                    {formatActivity(current)}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default ActivityTicker;
