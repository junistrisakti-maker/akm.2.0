import React, { useState, useEffect } from 'react';
import { UserCheck, MapPin, Bell, Send, Loader2, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PrayerBuddies = () => {
    const { user } = useAuth();
    const [buddies, setBuddies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myActivity, setMyActivity] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchBuddies = async () => {
        if (!user) return;
        try {
            const resp = await fetch(`http://localhost/AKM.2.0/api/social.php?action=getBuddies&userId=${user.id}`);
            const data = await resp.json();
            if (Array.isArray(data)) {
                setBuddies(data);
            }
        } catch (err) {
            console.error('Failed to fetch buddies', err);
        } finally {
            setLoading(false);
        }
    };

    // Heartbeat & Initial Load
    useEffect(() => {
        fetchBuddies();

        // Update heartbeat (status online)
        const updateHeartbeat = async () => {
            if (!user) return;
            await fetch('http://localhost/AKM.2.0/api/social.php?action=updateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, activity: myActivity })
            });
        };

        const interval = setInterval(() => {
            fetchBuddies();
            updateHeartbeat();
        }, 30000); // 30 seconds

        updateHeartbeat(); // Immediate heartbeat

        return () => clearInterval(interval);
    }, [user, myActivity]);

    const handleNudge = async (buddyId) => {
        try {
            const resp = await fetch('http://localhost/AKM.2.0/api/social.php?action=nudgeBuddy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, buddyId })
            });
            const data = await resp.json();
            if (data.success) {
                alert('Berhasil menyapa teman! 🔔');
            }
        } catch (err) {
            alert('Gagal menyapa.');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsUpdatingStatus(true);
        try {
            const resp = await fetch('http://localhost/AKM.2.0/api/social.php?action=updateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, activity: myActivity })
            });
            const data = await resp.json();
            if (data.success) {
                alert('Status berhasil diperbarui! ✨');
            }
            fetchBuddies();
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" color="#60a5fa" />
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{
            padding: '20px',
            width: '100%',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <UserCheck size={20} color="#10b981" />
                    </div>
                    <span style={{ fontWeight: '700', letterSpacing: '0.5px' }}>Active Circle</span>
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {buddies.length} Online
                </div>
            </h3>

            {/* Status Update Input - Enhanced */}
            <form onSubmit={handleUpdateStatus} style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.03)',
                padding: '6px',
                borderRadius: '18px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ paddingLeft: '12px', paddingRight: '8px', opacity: 0.5 }}>
                        <Smile size={18} color="#10b981" />
                    </div>
                    <input
                        type="text"
                        placeholder="Apa kegiatanmu hari ini?"
                        value={myActivity}
                        onChange={(e) => setMyActivity(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            outline: 'none',
                            padding: '10px 0',
                            fontWeight: '500'
                        }}
                    />
                </div>
                <button type="submit" disabled={isUpdatingStatus} style={{
                    background: isUpdatingStatus ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
                    onMouseEnter={(e) => !isUpdatingStatus && (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => !isUpdatingStatus && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {buddies.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '20px',
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <p style={{ opacity: 0.5, fontSize: '0.85rem', lineHeight: '1.6' }}>
                            Belum ada teman di lingkaran Anda.<br />Mulai sapa teman baru sekarang!
                        </p>
                    </div>
                ) : buddies.map((buddy) => (
                    <div key={buddy.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: buddy.isActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.03)',
                        transition: 'transform 0.2s ease'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {buddy.avatar && buddy.avatar.length > 1 ? (
                                        <img src={buddy.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : <span style={{ color: '#94a3b8' }}>{buddy.avatar}</span>}
                                </div>
                                {buddy.isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        right: '-2px',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        border: '2.5px solid #0f172a',
                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
                                    }} />
                                )}
                            </div>

                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem', color: buddy.isActive ? 'white' : '#94a3b8' }}>{buddy.name}</div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: buddy.isActive ? '#10b981' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    marginTop: '2px'
                                }}>
                                    {buddy.status.startsWith('At ') ? <MapPin size={12} /> : <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />}
                                    {buddy.status}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleNudge(buddy.id)}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                transition: 'all 0.2s',
                                color: buddy.isActive ? '#10b981' : '#475569'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                        >
                            <Bell size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Find more friends - Premium Button */}
            <button style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.3)';
                }}
            >
                <span>Temukan Teman Baru</span>
                <Smile size={18} />
            </button>
        </div>
    );
};

export default PrayerBuddies;
