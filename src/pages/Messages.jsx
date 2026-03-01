import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreHorizontal, MessageSquare, Send, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/UI/LoadingScreen';

const Messages = () => {
    const { user, loading: authLoading } = useAuth();
    const [buddies, setBuddies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuddies = async () => {
            if (!user) return;
            try {
                const res = await fetch(`http://localhost/AKM.2.0/api/social.php?action=getBuddies&userId=${user.id}`);
                const data = await res.json();
                setBuddies(data);
            } catch (err) {
                console.error("Fetch buddies error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) fetchBuddies();
    }, [user, authLoading]);

    if (loading || authLoading) return <LoadingScreen />;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                height: '100vh',
                background: 'var(--bg-primary)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                paddingBottom: '80px'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="text-gradient">Messages</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <Search size={20} color="var(--text-secondary)" />
                    </div>
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <MoreHorizontal size={20} color="var(--text-secondary)" />
                    </div>
                </div>
            </div>

            {/* Active Buddies Ticker */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Active Buddies
                </p>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                    {buddies.map(buddy => (
                        <div key={buddy.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                padding: '2px',
                                background: 'linear-gradient(45deg, var(--accent-secondary), var(--accent-primary))',
                                position: 'relative'
                            }}>
                                <img
                                    src={buddy.avatar}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--bg-primary)', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: '12px',
                                    height: '12px',
                                    background: '#10b981',
                                    border: '2px solid var(--bg-primary)',
                                    borderRadius: '50%'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{buddy.username?.split(' ')[0] || buddy.username}</span>
                        </div>
                    ))}
                    {buddies.length === 0 && (
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No buddies active right now.</p>
                    )}
                </div>
            </div>

            {/* Conversation List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Recent Chats
                </p>
                {buddies.length > 0 ? buddies.map(buddy => (
                    <motion.div
                        key={buddy.id}
                        whileTap={{ scale: 0.98 }}
                        className="glass-panel"
                        style={{
                            padding: '16px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            cursor: 'pointer'
                        }}
                    >
                        <img src={buddy.avatar} style={{ width: '50px', height: '50px', borderRadius: '15px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{buddy.username}</h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>2m ago</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Heart size={12} color="var(--accent-tertiary)" fill="var(--accent-tertiary)" />
                                Sent you a Spirit ✨
                            </p>
                        </div>
                    </motion.div>
                )) : (
                    <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
                        <MessageSquare size={48} style={{ marginBottom: '16px' }} />
                        <p>Belum ada chat. Ajak buddy kamu ibadah bareng! ✨</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Messages;
