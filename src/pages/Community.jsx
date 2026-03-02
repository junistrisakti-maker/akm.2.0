import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, Sparkles, Plus, Target, X, Trophy, Star, Calendar, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrayerBuddies from '../components/Social/PrayerBuddies';
import { useAuth } from '../context/AuthContext';

const Community = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingChallenges, setLoadingChallenges] = useState(true);
    const [challenges, setChallenges] = useState([]);
    const [circles, setCircles] = useState([]);
    const [loadingCircles, setLoadingCircles] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [logTarget, setLogTarget] = useState(null);   // challenge yang sedang di-log
    const [logging, setLogging] = useState(false);
    const [logResult, setLogResult] = useState(null);   // hasil setelah log berhasil
    const [joinCode, setJoinCode] = useState('');
    const [newCircle, setNewCircle] = useState({
        name: '',
        description: '',
        kpi_name: '',
        target_value: '100',
        unit: 'kali',
        is_temporary: false,
        duration_days: '30'
    });


    const fetchCircles = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/circles.php?action=list');
            const data = await res.json();
            setCircles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCircles(false);
        }
    };

    const fetchChallenges = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/challenges.php?action=list&user_id=${user.id}`);
            const data = await res.json();
            setChallenges(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingChallenges(false);
        }
    };

    const handleLogProgress = async () => {
        if (!user || !logTarget) return;
        setLogging(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/challenges.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'log',
                    user_id: user.id,
                    challenge_id: logTarget.id
                })
            });
            const data = await res.json();
            setLogResult(data);
            if (data.success) fetchChallenges(); // refresh progress
        } catch (err) {
            setLogResult({ success: false, message: 'Gagal mencatat progress.' });
        } finally {
            setLogging(false);
        }
    };

    useEffect(() => {
        fetchCircles();
        fetchChallenges();
    }, [user?.id]);

    const handleCreateCircle = async (e) => {
        e.preventDefault();
        if (!user) return alert("Login untuk membuat lingkaran");
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/circles.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    user_id: user.id,
                    ...newCircle,
                    target_value: parseInt(newCircle.target_value),
                    duration_days: parseInt(newCircle.duration_days)
                })
            });
            if (res.ok) {
                setShowCreateModal(false);
                fetchCircles();
                setNewCircle({ name: '', description: '', kpi_name: '', target_value: '100', unit: 'kali', is_temporary: false, duration_days: '30' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleJoinByCode = async (e) => {
        e.preventDefault();
        if (!user) return alert("Login untuk bergabung");
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/circles.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    user_id: user.id,
                    invite_code: joinCode.toUpperCase()
                })
            });
            if (res.ok) {
                const data = await res.json();
                setShowJoinModal(false);
                setJoinCode('');
                fetchCircles();
                alert("Berhasil bergabung!");
            } else {
                const err = await res.json();
                alert(err.error || "Gagal bergabung");
            }
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div style={{ padding: '20px', paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Community Hub</h1>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Lingkaran Kebaikan & Ukhuwah</p>
            </div>

            {/* Social Hub Banner */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/community/social')}
                style={{
                    background: 'linear-gradient(135deg, #422AFB 0%, #673AB7 100%)',
                    borderRadius: '24px',
                    padding: '24px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(66, 42, 251, 0.2)'
                }}
            >
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', color: 'white', fontWeight: '800' }}>✨ Social Hub Baru!</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                        Ikuti Sholawat Kolektif, Dinding Doa Anonim, dan lihat aktivitas temanmu secara real-time.
                    </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', color: 'white' }}>
                    <Zap size={24} fill="white" />
                </div>
            </motion.div>


            <div style={{ marginBottom: '32px' }}>
                <PrayerBuddies />
            </div>

            {/* Lingkaran Aktif Section */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '800' }}>Lingkaran Aktif</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            <Sparkles size={16} /> Gabung via Kode
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            <Plus size={18} /> Buat Lingkaran
                        </button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {loadingCircles ? (
                        <div style={{ gridColumn: 'span 2', padding: '20px', opacity: 0.5, textAlign: 'center' }}>Memuat lingkaran...</div>
                    ) : circles.length > 0 ? circles.map((circle) => (
                        <motion.div
                            key={circle.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/community/circle/${circle.id}`)}
                            className="glass-panel"
                            style={{
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                background: 'var(--card-bg)',
                                borderRadius: '24px',
                                border: '1px solid var(--glass-border)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: `${circle.theme_color}15`,
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: circle.theme_color
                            }}>
                                <Users size={24} />
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{circle.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{circle.member_count} Anggota Bergabung</span>
                        </motion.div>
                    )) : (
                        <div style={{ gridColumn: 'span 2', padding: '20px', opacity: 0.5, textAlign: 'center' }}>Belum ada lingkaran aktif. Ayo buat satu!</div>
                    )}
                </div>
            </div>

            {/* Tantangan Spritual Section */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: '800' }}>Tantangan Spritual</h3>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                    {loadingChallenges ? (
                        <div style={{ padding: '20px', opacity: 0.5 }}>Memuat tantangan...</div>
                    ) : challenges.length > 0 ? challenges.map((challenge) => {
                        const progress = Math.min((challenge.user_progress / challenge.target_count) * 100, 100);
                        const isManual = challenge.type === 'manual' || !challenge.type;
                        return (
                            <motion.div
                                key={challenge.id}
                                className="glass-panel"
                                style={{
                                    minWidth: '280px',
                                    padding: '24px',
                                    borderRadius: '24px',
                                    background: 'var(--card-bg)',
                                    border: challenge.is_completed == 1
                                        ? '1px solid rgba(34,197,94,0.4)'
                                        : '1px solid var(--glass-border)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0'
                                }}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: challenge.is_completed == 1
                                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                    }}>
                                        {challenge.is_completed == 1 ? <CheckCircle2 size={24} /> : <Trophy size={24} />}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
                                            <Star size={14} fill="var(--accent-secondary)" />
                                            <span style={{ fontSize: '0.85rem' }}>+{challenge.points_reward} XP</span>
                                        </div>
                                        {isManual && (
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '6px' }}>manual</span>
                                        )}
                                    </div>
                                </div>

                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800' }}>{challenge.title}</h4>
                                <p style={{ margin: '0 0 14px 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{challenge.description}</p>

                                {challenge.period_type === 'seasonal' && challenge.end_date && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: 'var(--accent-secondary)', background: 'rgba(167,139,250,0.05)', padding: '5px 10px', borderRadius: '10px', width: 'fit-content' }}>
                                        <Calendar size={12} />
                                        <span style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>
                                            Hingga {new Date(challenge.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                )}

                                {/* Progress bar */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{challenge.user_progress}/{challenge.target_count}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                            style={{
                                                height: '100%', borderRadius: '3px',
                                                background: challenge.is_completed == 1 ? '#22c55e' : 'var(--accent-primary)'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Tombol Catat Progress (hanya muncul jika belum selesai & tipe manual) */}
                                {challenge.is_completed != 1 && isManual ? (
                                    <button
                                        onClick={() => { setLogTarget(challenge); setLogResult(null); }}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '14px',
                                            background: 'var(--accent-primary)', color: 'white',
                                            border: 'none', fontWeight: '700', fontSize: '0.8rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        <CheckCircle2 size={15} /> Catat Progress
                                    </button>
                                ) : challenge.is_completed == 1 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        <CheckCircle2 size={16} /> Selesai! Poin sudah diterima.
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        Progress otomatis tercatat saat aktivitas.
                                    </div>
                                )}

                                {/* Ribbon seasonal */}
                                {challenge.period_type === 'seasonal' && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-tertiary, #f59e0b)', color: 'white', fontSize: '0.55rem', padding: '3px 14px', borderBottomLeftRadius: '10px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                                        LIMITED
                                    </div>
                                )}
                            </motion.div>
                        );
                    }) : (
                        <div style={{ padding: '20px', opacity: 0.5 }}>Belum ada tantangan aktif. 🙏</div>
                    )}
                </div>
            </div>

            {/* Create Circle Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Buat Lingkaran Baru</h3>
                                <button onClick={() => setShowCreateModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCircle} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nama Lingkaran</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: Tantangan Tilawah 30 Hari"
                                        value={newCircle.name}
                                        onChange={e => setNewCircle({ ...newCircle, name: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Deskripsi</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Jelaskan tujuan lingkaran ini..."
                                        value={newCircle.description}
                                        onChange={e => setNewCircle({ ...newCircle, description: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Target size={20} color="var(--accent-primary)" />
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>KPI & Target (Opsional)</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <input
                                            placeholder="Nama KPI (misal: Tilawah)"
                                            value={newCircle.kpi_name}
                                            onChange={e => setNewCircle({ ...newCircle, kpi_name: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                placeholder="Target (Angka)"
                                                type="number"
                                                value={newCircle.target_value}
                                                onChange={e => setNewCircle({ ...newCircle, target_value: e.target.value })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                                            />
                                            <input
                                                placeholder="Unit (halaman/kali)"
                                                value={newCircle.unit}
                                                onChange={e => setNewCircle({ ...newCircle, unit: e.target.value })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setNewCircle({ ...newCircle, is_temporary: !newCircle.is_temporary })}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: newCircle.is_temporary ? 'var(--accent-primary)' : 'none' }}>
                                        {newCircle.is_temporary && <Plus size={16} color="#fff" style={{ transform: 'rotate(45deg)' }} />}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Aktifkan Batasan Waktu (Challenge)</span>
                                </div>

                                {newCircle.is_temporary && (
                                    <input
                                        placeholder="Durasi (Hari)"
                                        type="number"
                                        value={newCircle.duration_days}
                                        onChange={e => setNewCircle({ ...newCircle, duration_days: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                                    />
                                )}

                                <button
                                    type="submit"
                                    style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--primary-brand)', color: '#fff', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 8px 20px rgba(66, 42, 251, 0.3)' }}
                                >
                                    Konfirmasi & Buat Lingkaran
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Catat Progress Challenge */}
            <AnimatePresence>
                {logTarget && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-secondary)', borderRadius: '32px', padding: '32px', border: '1px solid var(--glass-border)' }}
                        >
                            {!logResult ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <Trophy size={28} />
                                        </div>
                                        <button onClick={() => setLogTarget(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '800' }}>{logTarget.title}</h3>
                                    <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{logTarget.description}</p>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{logTarget.user_progress}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Progress</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{logTarget.target_count}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Target</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-secondary)' }}>+{logTarget.points_reward}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>XP Reward</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogProgress}
                                        disabled={logging}
                                        style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--primary-brand, var(--accent-primary))', color: '#fff', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: logging ? 'not-allowed' : 'pointer', opacity: logging ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {logging ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Mencatat...</> : <><CheckCircle2 size={18} /> Konfirmasi Selesai</>}
                                    </button>
                                </>
                            ) : (
                                /* Hasil setelah log */
                                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
                                        {logResult.is_completed ? '🎉' : '✅'}
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '800' }}>
                                        {logResult.is_completed ? 'Tantangan Selesai!' : 'Progress Tercatat!'}
                                    </h3>
                                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{logResult.message}</p>
                                    {logResult.new_count !== undefined && !logResult.is_completed && (
                                        <p style={{ margin: '0 0 24px 0', color: 'var(--accent-secondary)', fontWeight: 'bold', fontSize: '1rem' }}>
                                            {logResult.new_count} / {logResult.target}
                                        </p>
                                    )}
                                    {logResult.is_completed && (
                                        <p style={{ margin: '0 0 24px 0', color: '#22c55e', fontWeight: 'bold', fontSize: '1rem' }}>
                                            +{logResult.points_awarded} XP diterima!
                                        </p>
                                    )}
                                    <button
                                        onClick={() => { setLogTarget(null); setLogResult(null); }}
                                        style={{ padding: '12px 32px', borderRadius: '16px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Join Circle Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', borderRadius: '32px', padding: '32px', border: '1px solid var(--glass-border)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Gabung via Kode</h3>
                                <button onClick={() => setShowJoinModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleJoinByCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Masukkan kode undangan yang diberikan oleh temanmu untuk bergabung ke Lingkaran mereka.</p>
                                <input
                                    required
                                    type="text"
                                    placeholder="KODE6"
                                    maxLength="6"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', textAlign: 'center', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '4px' }}
                                />
                                <button
                                    type="submit"
                                    style={{ width: '100%', padding: '16px', borderRadius: '18px', background: 'var(--primary-brand)', color: '#fff', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(66, 42, 251, 0.3)' }}
                                >
                                    Gabung Sekarang
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Community;

