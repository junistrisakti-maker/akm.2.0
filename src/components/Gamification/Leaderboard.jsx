import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, UserPlus, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`http://localhost/AKM.2.0/api/leaderboard.php?limit=5&currentUserId=${currentUser?.id || ''}`);
                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    setUsers(data.data);
                } else {
                    setUsers([]);
                }
            } catch (err) {
                console.error("Error loading leaderboard:", err);
                setUsers([]);
            }
        };
        fetchLeaderboard();
    }, []);

    const handleAddBuddy = async (buddyId) => {
        if (!currentUser) return alert("Please login first!");
        if (currentUser.id === buddyId) return;

        try {
            const response = await fetch('http://localhost/AKM.2.0/api/social.php?action=addBuddy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, buddyId }),
            });
            const data = await response.json();
            if (response.ok) {
                alert("Buddy request accepted! 🤝");
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Add buddy error:", error);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Trophy color="#fbbf24" fill="#fbbf24" size={24} />
                <h3 style={{ margin: 0 }}>Top Muhsinin</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.isArray(users) && users.length > 0 ? users.map((u, index) => {
                    const rank = u.rank || (index + 1);
                    return (
                        <div key={u.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px',
                            borderRadius: '12px',
                            background: rank <= 3 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                            border: rank <= 3 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#64748b'
                                }}>
                                    {rank}
                                </div>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px'
                                }}>
                                    {u.avatar ? <img src={u.avatar} style={{ width: '100%', borderRadius: '50%' }} /> : u.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600' }}>{u.username}</span>
                                    {u.rank_name && (
                                        <span style={{ fontSize: '0.65rem', color: u.rank_color || 'var(--text-secondary)', fontWeight: 'bold' }}>
                                            {u.rank_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#fbbf24', minWidth: '60px', textAlign: 'right' }}>
                                    {u.xp || 0} XP
                                </div>
                                {currentUser && currentUser.id !== u.id && !u.is_buddy && (
                                    <motion.button
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => handleAddBuddy(u.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Add Buddy (+)"
                                    >
                                        <Plus size={18} color="var(--accent-primary)" strokeWidth={3} />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Belum ada peringkat.</p>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
