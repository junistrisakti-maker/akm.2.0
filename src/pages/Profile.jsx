import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StreakCounter from '../components/Gamification/StreakCounter';
import BadgeShowcase from '../components/Gamification/BadgeShowcase';
import Leaderboard from '../components/Gamification/Leaderboard';
import LoadingScreen from '../components/UI/LoadingScreen';
import { LogOut, Star, Shield, Settings, Heart, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, loading: authLoading, logout, updateUser } = useAuth();
    const [buddies, setBuddies] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            try {
                // Fetch buddies
                const buddyRes = await fetch(`http://localhost/AKM.2.0/api/social.php?action=getBuddies&userId=${user.id}`);
                const buddyData = await buddyRes.json();
                setBuddies(buddyData);

                // Fetch user posts
                const postRes = await fetch(`http://localhost/AKM.2.0/api/feed.php?userId=${user.id}&currentUserId=${user.id}`);
                const postData = await postRes.json();
                setPosts(postData);
            } catch (err) {
                console.error("Error loading profile data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchProfileData();
        }
    }, [user, authLoading]);

    const handleLogout = () => {
        if (window.confirm("Yakin mau logout? 🥹")) {
            logout();
        }
    };

    const handleSendSpirit = async (targetUserId, targetUsername) => {
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/notifications.php?action=sendSpirit&userId=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId,
                    senderName: user.username
                })
            });
            if (res.ok) {
                alert(`Spirit ✨ terkirim ke @${targetUsername}!`);
            }
        } catch (err) {
            console.error("Spirit error:", err);
        }
    };

    if (loading || authLoading) return <LoadingScreen />;
    if (!user) return <div style={{ color: 'var(--text-primary)', padding: '20px' }}>Please login to view profile.</div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '20px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Link to="/settings" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', padding: '8px', background: 'var(--subtle-bg)', borderRadius: '12px' }}>
                        <Settings size={22} color="var(--text-secondary)" />
                    </Link>
                    <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                        <LogOut size={20} color="#ef4444" />
                    </button>
                </div>
                <h3 className="text-gradient" style={{ margin: 0 }}>My Profile</h3>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <input
                        type="file"
                        id="avatar-upload"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            // 1. Upload to CDN/Storage (Simulated for this demo using Base64 or existing upload API)
                            const formData = new FormData();
                            formData.append('image', file);

                            try {
                                const uploadRes = await fetch('http://localhost/AKM.2.0/api/upload.php', {
                                    method: 'POST',
                                    body: formData
                                });
                                const uploadData = await uploadRes.json();

                                if (uploadData.url) {
                                    // 2. Update User Profile in DB
                                    const updateRes = await fetch(`http://localhost/AKM.2.0/api/profile.php?action=updateAvatar`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: user.id, avatarUrl: uploadData.url })
                                    });

                                    if (updateRes.ok) {
                                        updateUser({ avatar: uploadData.url });
                                        alert("Foto profil berhasil diubah! ✨");
                                    }
                                }
                            } catch (err) {
                                console.error("Upload error:", err);
                                alert("Gagal mengupload foto.");
                            }
                        }}
                    />
                    <label htmlFor="avatar-upload" className="neon-glow" style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        padding: '4px',
                        background: 'linear-gradient(45deg, #a78bfa, #34d399)',
                        margin: '0 auto 16px',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'transform 0.3s'
                    }}>
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt="profile"
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                border: '4px solid var(--bg-primary)',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '15px',
                            right: '0',
                            background: 'var(--accent-primary)',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--bg-primary)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}>
                            <Settings size={12} color="white" />
                        </div>
                    </label>
                </div>
                <h2 className="text-gradient" style={{ margin: '0 0 8px 0', fontSize: '1.8rem' }}>{user.username}</h2>

                {/* The Five Pillars Rank Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: user.level === 5 ? 'linear-gradient(45deg, #10b981, #34d399)' :
                            user.level === 4 ? '#8b5cf6' :
                                user.level === 3 ? '#f59e0b' :
                                    user.level === 2 ? '#64748b' : '#06b6d4',
                        color: 'white',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {user.level === 5 ? '🔥 MASTER' : user.level === 4 ? '👑 CHIEF' : user.level === 3 ? '💎 ELITE' : user.level === 2 ? '🛡️ PRO' : '🌱 ROOKIE'}
                    </span>
                </div>

                {/* XP Progress Bar */}
                <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Progress XP</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.xp || 0} / {user.level === 5 ? 50000 : user.level === 4 ? 15000 : user.level === 3 ? 5000 : 1000} XP</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((user.xp || 0) / (user.level === 5 ? 50000 : user.level === 4 ? 15000 : user.level === 3 ? 5000 : 1000)) * 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--accent-primary), #8b5cf6)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Streak Section */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '1px solid var(--subtle-border)' }}>
                <StreakCounter streak={user.streak || 0} />
            </div>

            {/* Achievements Section */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Medal size={20} color="var(--accent-primary)" />
                    Achievements
                </h3>
                <BadgeShowcase userId={user.id} />
            </div>

            {/* My Content Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>My Content</h3>
                {posts.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {posts.map(post => (
                            <motion.div
                                key={post.id}
                                whileHover={{ scale: 0.98 }}
                                style={{
                                    aspectRatio: '1/1',
                                    background: post.bgColor || 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '1px solid var(--subtle-border)'
                                }}
                            >
                                {post.url ? (
                                    <img src={post.url} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="flex-center" style={{ height: '100%', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {post.caption?.substring(0, 30)}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Share your first post! ✨</p>
                    </div>
                )}
            </div>

            {/* Prayer Buddies */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3>Prayer Buddies</h3>
                    <button style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700' }}>FIND MORE</button>
                </div>
                {buddies.length > 0 ? (
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                        {buddies.map(buddy => (
                            <div key={buddy.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(45deg, #ec4899, #8b5cf6)',
                                        padding: '2px',
                                        marginBottom: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        <img src={buddy.avatar} alt={buddy.username} style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--bg-primary)', objectFit: 'cover' }} />
                                    </div>
                                    <button
                                        onClick={() => handleSendSpirit(buddy.id, buddy.username)}
                                        style={{
                                            position: 'absolute',
                                            bottom: '-4px',
                                            right: '-4px',
                                            background: 'var(--accent-secondary)',
                                            border: '2px solid var(--bg-primary)',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                        }}
                                        title="Send Spirit ✨"
                                    >
                                        <Heart size={12} color="white" fill="white" />
                                    </button>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>{buddy.username}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>🔥 {buddy.streak}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connection is key! Add some buddies.</p>
                    </div>
                )}
            </div>

            {/* Global Leaderboard Section */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Muhsinin Leaderboard</h3>
                <Leaderboard />
            </div>
        </motion.div>
    );
};

export default Profile;
