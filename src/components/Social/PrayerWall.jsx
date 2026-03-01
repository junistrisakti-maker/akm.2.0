import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Heart, Send, User } from 'lucide-react';

const PrayerWall = ({ layout = 'vertical', showPostForm = true }) => {
    const { user } = useAuth();
    const [prayers, setPrayers] = useState([]);
    const [newPrayer, setNewPrayer] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    const [liveInteractions, setLiveInteractions] = useState([]);
    const [processedInteractions, setProcessedInteractions] = useState(new Set());

    const fetchPrayers = async () => {
        try {
            const url = user ? `http://localhost/AKM.2.0/api/social_hub.php?action=getPrayers&currentUserId=${user.id}` : 'http://localhost/AKM.2.0/api/social_hub.php?action=getPrayers';
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setPrayers(data);
        } catch (err) {
            console.error("Prayers error:", err);
        }
    };

    const fetchLiveInteractions = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php?action=getLiveInteractions');
            const data = await res.json();
            if (Array.isArray(data)) {
                const newInteractions = data.filter(item => !processedInteractions.has(`${item.prayer_id}-${item.user_id}`));
                if (newInteractions.length > 0) {
                    setLiveInteractions(prev => [...prev, ...newInteractions]);
                    setProcessedInteractions(prev => {
                        const next = new Set(prev);
                        newInteractions.forEach(item => next.add(`${item.prayer_id}-${item.user_id}`));
                        return next;
                    });

                    // Clear animations after 3 seconds
                    setTimeout(() => {
                        setLiveInteractions(prev => prev.filter(item => !newInteractions.includes(item)));
                    }, 3000);
                }
            }
        } catch (err) {
            console.error("Live interaction error:", err);
        }
    };

    useEffect(() => {
        fetchPrayers();
        const mainInterval = setInterval(fetchPrayers, 15000);
        const liveInterval = setInterval(fetchLiveInteractions, 4000); // Poll every 4s for liveliness
        return () => {
            clearInterval(mainInterval);
            clearInterval(liveInterval);
        };
    }, [processedInteractions]);

    const handlePost = async () => {
        if (!newPrayer.trim() || isPosting) return;
        setIsPosting(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'postPrayer',
                    userId: user.id,
                    content: newPrayer,
                    isAnonymous: isAnonymous ? 1 : 0
                })
            });
            if (res.ok) {
                setNewPrayer('');
                fetchPrayers();
            }
        } catch (err) {
            console.error("Post error:", err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleAamiin = async (prayerId) => {
        if (!user) return alert("Login untuk mengaminkan");
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/social_hub.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'aamiin',
                    prayerId,
                    userId: user.id
                })
            });
            if (res.ok) {
                fetchPrayers();
            } else {
                const data = await res.json();
                alert(data.error || "Gagal mengaminkan");
            }
        } catch (err) {
            console.error("Aamiin error:", err);
        }
    };

    const handleShare = (prayer) => {
        const text = `Doa dari ${prayer.is_anonymous == 1 ? 'Hamba Allah' : prayer.username}: "${prayer.content}"`;
        if (navigator.share) {
            navigator.share({ title: 'Simpul Doa Ummat', text, url: window.location.href }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert("Link disalin!");
        }
    };

    const isHorizontal = layout === 'horizontal';

    return (
        <div style={{ marginBottom: isHorizontal ? '32px' : '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: isHorizontal ? '1.2rem' : '1.1rem', fontWeight: '800' }}>
                    <Heart size={20} fill="var(--accent-primary)" color="var(--accent-primary)" />
                    Simpul Doa Ummat
                </h4>
            </div>

            {/* Input Box - Only if showPostForm is true */}
            {showPostForm && (
                <div style={{ background: 'var(--subtle-bg)', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                    <textarea
                        placeholder="Apa hajatmu hari ini? Mari kita aminkan bersama..."
                        value={newPrayer}
                        onChange={(e) => setNewPrayer(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            resize: 'none',
                            minHeight: '80px',
                            fontFamily: 'inherit'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                style={{ accentColor: 'var(--accent-primary)' }}
                            />
                            Sebagai Anonim
                        </label>
                        <button
                            onClick={handlePost}
                            disabled={!newPrayer.trim() || isPosting}
                            style={{
                                background: 'linear-gradient(135deg, #422AFB 0%, #673AB7 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                padding: '10px 20px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                opacity: (!newPrayer.trim() || isPosting) ? 0.5 : 1,
                                boxShadow: '0 4px 12px rgba(66, 42, 251, 0.2)'
                            }}
                        >
                            <Send size={18} />
                            Kirim
                        </button>
                    </div>
                </div>
            )}

            {/* Prayer List Container */}
            <div style={{
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                gap: '16px',
                overflowX: isHorizontal ? 'auto' : 'visible',
                paddingBottom: isHorizontal ? '12px' : '0',
                scrollbarWidth: 'none'
            }}>
                <AnimatePresence>
                    {prayers.map((prayer) => (
                        <motion.div
                            key={prayer.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel"
                            style={{
                                minWidth: isHorizontal ? '300px' : 'auto',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '24px',
                                padding: '0',
                                overflow: 'hidden',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div style={{ padding: '20px', position: 'relative' }}>
                                {/* Live Heart Burst Animation */}
                                <AnimatePresence>
                                    {liveInteractions
                                        .filter(item => item.prayer_id == prayer.id)
                                        .map((item, idx) => (
                                            <motion.div
                                                key={`${item.prayer_id}-${item.user_id}-${idx}`}
                                                initial={{ opacity: 0, y: 0, x: Math.random() * 40 - 20, scale: 0.5 }}
                                                animate={{ opacity: [0, 1, 0], y: -100, x: Math.random() * 100 - 50, scale: [0.5, 1.5, 1] }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 2, ease: "easeOut" }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '40px',
                                                    left: '50%',
                                                    zIndex: 10,
                                                    pointerEvents: 'none',
                                                    color: 'var(--accent-primary)'
                                                }}
                                            >
                                                <Heart size={24} fill="currentColor" />
                                            </motion.div>
                                        ))
                                    }
                                </AnimatePresence>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <img
                                        src={prayer.is_anonymous == 1 ? `https://api.dicebear.com/7.x/bottts/svg?seed=anon${prayer.id}` : (prayer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${prayer.username}`)}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }}
                                        alt=""
                                    />
                                    <div>
                                        <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                                            {prayer.is_anonymous == 1 ? 'Hamba Allah' : prayer.username}
                                        </h5>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {isHorizontal ? 'Baru saja' : 'Mengirim doa'}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 16px 0', minHeight: isHorizontal ? '60px' : 'auto' }}>
                                    {prayer.content}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Heart size={14} fill="var(--accent-tertiary)" color="var(--accent-tertiary)" />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        diaminkan <b>{prayer.aamiin_count}</b> kali
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', borderTop: '1px solid var(--glass-border)' }}>
                                <button
                                    onClick={() => !prayer.is_aamiined && handleAamiin(prayer.id)}
                                    disabled={prayer.is_aamiined}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: prayer.is_aamiined ? 'rgba(255,255,255,0.05)' : 'none',
                                        border: 'none',
                                        cursor: prayer.is_aamiined ? 'default' : 'pointer',
                                        borderRight: '1px solid var(--glass-border)',
                                        color: prayer.is_aamiined ? 'var(--accent-primary)' : 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        opacity: prayer.is_aamiined ? 0.8 : 1
                                    }}
                                >
                                    {prayer.is_aamiined ? '🙏 Telah Diaminkan' : '🙏 Aamiin'}
                                </button>
                                <button
                                    onClick={() => handleShare(prayer)}
                                    style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700' }}
                                >
                                    Bagikan
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PrayerWall;
