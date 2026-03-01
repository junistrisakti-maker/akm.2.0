import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Compass, ChevronDown, ChevronUp } from 'lucide-react';

const PrayerDashboard = () => {
    const [timings, setTimings] = useState(null);
    const [nextPrayer, setNextPrayer] = useState({ name: '', time: '', remaining: '' });
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const [locationName, setLocationName] = useState('Jakarta');

    const fetchPrayerTimes = async (lat = null, lng = null) => {
        try {
            let url = 'https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=2';

            if (lat && lng) {
                url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`;
                setLocationName('My Location');
            }

            const res = await fetch(url);
            const data = await res.json();
            if (data.code === 200) {
                setTimings(data.data.timings);
                calculateNextPrayer(data.data.timings);
                if (lat && lng && data.data.meta.timezone) {
                    // Optionally update location name from timezone or meta if available
                }
            }
        } catch (error) {
            console.error("Prayer fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateNextPrayer = (times) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        let found = false;
        for (const name of prayerNames) {
            const [hours, minutes] = times[name].split(':').map(Number);
            const prayerTotalMinutes = hours * 60 + minutes;

            if (prayerTotalMinutes > currentTime) {
                const diff = prayerTotalMinutes - currentTime;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                setNextPrayer({
                    name: name,
                    time: times[name],
                    remaining: `${h > 0 ? h + 'j ' : ''}${m}m`
                });
                found = true;
                break;
            }
        }

        if (!found) {
            setNextPrayer({
                name: 'Fajr',
                time: times['Fajr'],
                remaining: 'Besok'
            });
        }
    };

    useEffect(() => {
        // Initial fetch with default city (Jakarta) immediately
        fetchPrayerTimes();

        const detectLocation = async () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
                    },
                    async (err) => {
                        console.warn("Geolocation blocked/failed, trying IP fallback:", err.message);
                        try {
                            const ipRes = await fetch('https://ipapi.co/json/');
                            const ipData = await ipRes.json();
                            if (ipData.latitude && ipData.longitude) {
                                setLocationName(ipData.city || 'My Location');
                                fetchPrayerTimes(ipData.latitude, ipData.longitude);
                            }
                        } catch (ipErr) {
                            // Already have Jakarta from initial call
                        }
                    },
                    { enableHighAccuracy: false, timeout: 3000, maximumAge: 3600000 }
                );
            }
        };

        detectLocation();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (timings) calculateNextPrayer(timings);
        }, 60000);
        return () => clearInterval(interval);
    }, [timings]);

    // OPTIMIZATION: Never return null, show default if not yet loaded (Jakarta fallback)
    if (!timings && loading) return (
        <div style={{ position: 'absolute', top: '110px', left: '16px', right: '16px', zIndex: 45 }}>
            <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.4)', opacity: 0.5 }}>
                <p style={{ margin: 0, fontSize: '0.7rem' }}>Memuat jadwal sholat...</p>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'absolute',
            top: '110px', // Below Donation Tracker & Notifs
            left: '16px',
            right: '16px',
            zIndex: 45,
            pointerEvents: 'none'
        }}>
            <motion.div
                className="glass-panel"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    padding: '12px 16px',
                    borderRadius: '20px',
                    pointerEvents: 'auto',
                    background: 'rgba(15, 23, 42, 0.4)',
                }}
            >
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '12px' }}>
                            <Clock size={18} color="white" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                                Next: {nextPrayer.name} • {locationName}
                            </p>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>
                                {nextPrayer.time} <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'normal' }}>• {nextPrayer.remaining} lagi</span>
                            </h4>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '10px' }}>
                            <Compass size={18} color="var(--accent-secondary)" />
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && timings && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                {prayerNames.map(name => (
                                    <div key={name} style={{ textAlign: 'center', flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: nextPrayer.name === name ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                            {name}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: nextPrayer.name === name ? 'white' : 'rgba(255,255,255,0.8)' }}>
                                            {timings[name]}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Qibla Section Placeholder */}
                            <div className="glass-panel" style={{
                                padding: '12px',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        style={{ color: 'var(--accent-secondary)' }}
                                    >
                                        <Compass size={24} />
                                    </motion.div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>Qibla Direction</p>
                                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{locationName}: Auto-detecting...</p>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                    PRECISION MODE
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default PrayerDashboard;
