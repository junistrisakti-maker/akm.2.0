import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, Calendar, ChevronLeft, Plus, Award, X, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CircleDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logValue, setLogValue] = useState('');
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [membersPage, setMembersPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchDetails = async () => {
        try {
            const url = `http://localhost/AKM.2.0/api/circles.php?action=details&id=${id}${user ? `&user_id=${user.id}` : ''}`;
            const res = await fetch(url);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id, user]);

    const fetchMembers = async (page = 1) => {
        setLoadingMore(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/circles.php?action=members&id=${id}&page=${page}`);
            const json = await res.json();
            if (page === 1) setAllMembers(json);
            else setAllMembers(prev => [...prev, ...json]);
            setMembersPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (showMembersModal) fetchMembers(1);
    }, [showMembersModal]);

    const handleJoin = async () => {
        if (!user) return alert("Login untuk bergabung");
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/circles.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    circle_id: id,
                    user_id: user.id
                })
            });
            if (res.ok) fetchDetails();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogProgress = async (kpiId) => {
        if (!logValue || isNaN(logValue)) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/circles.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'log_progress',
                    circle_id: id,
                    user_id: user.id,
                    kpi_id: kpiId,
                    value: parseInt(logValue)
                })
            });
            if (res.ok) {
                setLogValue('');
                fetchDetails();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat detail lingkaran...</div>;
    if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Lingkaran tidak ditemukan.</div>;

    const { circle, kpis, progress } = data;

    return (
        <div style={{ padding: '20px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}
            >
                <ChevronLeft size={20} /> Kembali
            </button>

            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{
                    padding: '24px',
                    background: `linear-gradient(135deg, ${circle.theme_color}33 0%, rgba(255,255,255,0.03) 100%)`,
                    borderRadius: '30px',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '24px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: `${circle.theme_color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: circle.theme_color }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>{circle.name}</h2>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{circle.category}</span>
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{circle.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={16} color="var(--accent-primary)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{circle.member_count} Anggota</span>
                        </div>
                        {circle.invite_code && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} color="var(--accent-secondary)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Code: {circle.invite_code}</span>
                            </div>
                        )}
                    </div>

                    {!data.is_member && (
                        <button
                            onClick={handleJoin}
                            style={{
                                background: 'var(--primary-brand)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '8px 20px',
                                fontWeight: '800',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(66, 42, 251, 0.2)'
                            }}
                        >
                            Gabung Lingkaran
                        </button>
                    )}
                </div>
            </motion.div>

            {/* KPI Section */}
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '800' }}>Target & Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {progress.map((p, idx) => {
                    const percentage = Math.min(Math.round((p.current_value / p.target_value) * 100), 100);
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-panel"
                            style={{ padding: '20px', borderRadius: '24px', background: 'var(--card-bg)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Target size={20} color={circle.theme_color} />
                                    <span style={{ fontWeight: '700' }}>{p.kpi_name}</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{p.current_value || 0} / {p.target_value} {p.unit}</span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    style={{ height: '100%', background: circle.theme_color, borderRadius: '10px' }}
                                />
                            </div>

                            {/* Log Progress Input - ONLY FOR MEMBERS */}
                            {data.is_member && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        placeholder={`Tambah ${p.unit}...`}
                                        value={logValue}
                                        onChange={(e) => setLogValue(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '10px',
                                            color: '#fff',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => handleLogProgress(p.kpi_id)}
                                        style={{
                                            background: circle.theme_color,
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '0 20px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Log
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {progress.length === 0 && (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', opacity: 0.5, borderRadius: '24px' }}>
                        Belum ada target diatur untuk lingkaran ini.
                    </div>
                )}
            </div>

            {/* Leaderboard Section */}
            <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Peringkat Kontributor</h3>
                    <button
                        onClick={() => setShowMembersModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Lihat Lengkap
                    </button>
                </div>
                <div className="glass-panel" style={{ padding: '4px', borderRadius: '24px', background: 'var(--card-bg)' }}>
                    {data.leaderboard.map((member, idx) => (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: idx < data.leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: idx < 3 ? '#000' : '#fff' }}>
                                {idx + 1}
                            </div>
                            <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{member.name || member.username}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{member.total_contribution || 0} poin kontribusi</div>
                            </div>
                            {idx < 3 && <Trophy size={18} color={idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#b45309'} />}
                        </div>
                    ))}
                    {data.leaderboard.length === 0 && (
                        <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>Belum ada kontribusi.</div>
                    )}
                </div>
            </div>

            {/* Achievement / Stats */}
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: '800' }}>Statistik Lingkaran</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', background: 'var(--card-bg)', textAlign: 'center' }}>
                        <Award size={24} color="#fbbf24" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>Level 1</div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Kekompakan Grup</span>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', background: 'var(--card-bg)', textAlign: 'center' }}>
                        <TrendingUp size={24} color="#34d399" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>+12%</div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Kenaikan Minggu Ini</span>
                    </div>
                </div>
            </div>

            {/* Members List Modal */}
            {showMembersModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: '500px', height: '80vh', background: 'var(--bg-secondary)', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', padding: '24px', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Semua Anggota</h3>
                            <button onClick={() => setShowMembersModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', color: '#fff' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {allMembers.map((member, idx) => (
                                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <span style={{ width: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                    <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700' }}>{member.name || member.username}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Total kontribusi: {member.total_contribution || 0}</div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => fetchMembers(membersPage + 1)}
                                disabled={loadingMore}
                                style={{ margin: '20px auto', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px 24px', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                            >
                                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default CircleDetail;
