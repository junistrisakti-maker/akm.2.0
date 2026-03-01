import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Star, ArrowLeft, Calendar, Share2, Info, CheckCircle, MessageSquare, Edit3, Camera, Plus, Instagram, Zap, ExternalLink, ShieldAlert, Newspaper } from 'lucide-react';
import LoadingScreen from '../components/UI/LoadingScreen';
import EventCard from '../components/Social/EventCard';
import MasjidMap from '../components/Social/MasjidMap';
import ReviewCard from '../components/Social/ReviewCard';
import { useAuth } from '../context/AuthContext';
import defaultMasjidImage from '../assets/default image masjid.png';
import { useLocation } from 'react-router-dom';

const MasjidProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [masjid, setMasjid] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'reviews'
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [existingReview, setExistingReview] = useState(null); // user's own review
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('edit') === 'true' && masjid && !uploading) {
            fileInputRef.current?.click();
            // Clear the param after triggering to avoid repeat on refresh
            window.history.replaceState(null, '', location.pathname);
        }
    }, [location.search, masjid]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Masjid Details
                const masjidRes = await fetch(`http://localhost/AKM.2.0/api/mosques.php?action=details&id=${id}`);
                const masjidData = await masjidRes.json();
                setMasjid(masjidData);

                // Fetch Reviews
                const reviewsRes = await fetch(`http://localhost/AKM.2.0/api/reviews.php?action=list&masjid_id=${id}`);
                const reviewsData = await reviewsRes.json();
                const reviewsList = Array.isArray(reviewsData) ? reviewsData : [];
                setReviews(reviewsList);

                // Check if current user already has a review
                if (user) {
                    const myReview = reviewsList.find(r => String(r.user_id) === String(user.id));
                    if (myReview) {
                        setExistingReview(myReview);
                        setNewReview({ rating: parseInt(myReview.rating), comment: myReview.comment });
                    }
                }
            } catch (err) {
                console.error("Fetch data error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleCheckin = async () => {
        if (!user) return alert("Silakan login untuk check-in!");
        setCheckinLoading(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/checkin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'checkin', masjid_id: id, user_id: user.id })
            });
            const data = await res.json();
            if (res.ok) {
                setIsCheckedIn(true);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
                // Refresh masjid stats
                setMasjid(prev => ({ ...prev, points: parseInt(prev.points) + 10 }));
            } else {
                alert(data.error || "Gagal check-in");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCheckinLoading(false);
        }
    };

    const handleReviewSubmit = async () => {
        if (!user) return alert("Silakan login untuk memberi ulasan!");
        if (!newReview.comment.trim()) return alert("Tuliskan ulasan Anda!");

        const isUpdate = existingReview && isEditing;

        setSubmittingReview(true);
        try {
            const body = isUpdate
                ? { action: 'update', review_id: existingReview.id, user_id: user.id, rating: newReview.rating, comment: newReview.comment }
                : { action: 'create', masjid_id: id, user_id: user.id, rating: newReview.rating, comment: newReview.comment };

            const res = await fetch('http://localhost/AKM.2.0/api/reviews.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) {
                if (isUpdate) {
                    // Update existing review in list
                    setReviews(prev => prev.map(r =>
                        String(r.id) === String(existingReview.id)
                            ? { ...r, rating: newReview.rating, comment: newReview.comment }
                            : r
                    ));
                    setExistingReview(prev => ({ ...prev, rating: newReview.rating, comment: newReview.comment }));
                    setIsEditing(false);
                    alert("Ulasan berhasil diperbarui!");
                } else {
                    // Prepend new review to list
                    const addedReview = {
                        ...newReview,
                        id: data.id,
                        user_id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                        created_at: new Date().toISOString()
                    };
                    setReviews([addedReview, ...reviews]);
                    setExistingReview(addedReview);
                    setNewReview({ rating: newReview.rating, comment: newReview.comment });
                    alert("Ulasan berhasil dikirim! +5 Barakah Points untuk Masjid.");
                }
            } else {
                alert(data.error || "Gagal mengirim ulasan");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('http://localhost/AKM.2.0/api/upload.php', {
                method: 'POST',
                body: fd
            });
            const data = await res.json();

            if (data.url) {
                // Update masjid in DB
                const updateRes = await fetch('http://localhost/AKM.2.0/api/mosques.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update', id: id, image: data.url })
                });

                if (updateRes.ok) {
                    setMasjid(prev => ({ ...prev, image: data.url }));
                    alert("Foto masjid berhasil diperbarui! ✨");
                } else {
                    alert("Gagal memperbarui data masjid.");
                }
            } else {
                alert(data.error || "Gagal upload gambar.");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat upload.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!masjid) return <div style={{ color: 'white', padding: '20px' }}>Masjid tidak ditemukan.</div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'white', paddingBottom: '120px' }}
        >
            {/* Celebration Animation Overlay */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000,
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ fontSize: '100px', marginBottom: '20px' }}>✨🕌✨</div>
                        <h2 style={{ fontSize: '2rem', textShadow: '0 0 20px var(--accent-primary)' }}>Check-in Berhasil!</h2>
                        <p style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>+10 Barakah Points</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cover Image & Header */}
            <div style={{ position: 'relative', height: '280px', background: 'var(--card-bg)' }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    accept="image/*"
                />

                <img
                    src={masjid.image && masjid.image.trim() !== '' ? masjid.image : defaultMasjidImage}
                    alt={masjid.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        color: 'white'
                    }}
                >
                    {uploading ? (
                        <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    ) : (
                        <Camera size={20} />
                    )}
                </motion.button>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-primary))' }}></div>

                <button
                    onClick={() => navigate(-1)}
                    style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', zIndex: 10 }}
                >
                    <ArrowLeft size={20} color="white" />
                </button>

                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px', alignItems: 'center', gap: '6px' }}>
                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {reviews.length > 0
                                ? (reviews.reduce((acc, r) => acc + parseInt(r.rating), 0) / reviews.length).toFixed(1)
                                : '0.0'} ({reviews.length} Ulasan)
                        </span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{masjid.name}</h2>
                    <p style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={16} color="var(--accent-secondary)" /> {masjid.address}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', padding: '0 20px', gap: '12px', marginTop: '-25px', position: 'relative', zIndex: 5 }}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCheckin}
                    disabled={isCheckedIn || checkinLoading}
                    style={{
                        flex: 1,
                        height: '50px',
                        borderRadius: '16px',
                        background: isCheckedIn ? 'rgba(74, 222, 128, 0.2)' : 'var(--accent-primary)',
                        color: isCheckedIn ? '#4ade80' : 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: isCheckedIn ? '1px solid #4ade80' : 'none',
                        boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    {isCheckedIn ? <CheckCircle size={20} /> : <MapPin size={20} />}
                    {checkinLoading ? 'Mengecek...' : (isCheckedIn ? 'Sudah Check-in' : 'Check-in Sekarang')}
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Share2 size={20} color="white" />
                </motion.button>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', padding: '20px', gap: '12px' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '16px', textAlign: 'center', borderRadius: '20px' }}>
                    <Users size={20} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{masjid.followers_count}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Muhsinin</span>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '16px', textAlign: 'center', borderRadius: '20px' }}>
                    <Star size={20} color="var(--accent-secondary)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{masjid.points}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Barakah pts</span>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '16px', textAlign: 'center', borderRadius: '20px' }}>
                    <CheckCircle size={20} color="var(--accent-tertiary)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{reviews.length}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Reviews</span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('info')}
                    style={{
                        padding: '12px 20px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'info' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'info' ? '2px solid var(--accent-primary)' : 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Informasi
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    style={{
                        padding: '12px 20px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'reviews' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        borderBottom: activeTab === 'reviews' ? '2px solid var(--accent-primary)' : 'none',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    Ulasan <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px' }}>{reviews.length}</span>
                </button>
            </div>

            {activeTab === 'info' ? (
                <>
                    {/* Description Section */}
                    <div style={{ padding: '0 20px 20px' }}>
                        <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Info size={18} color="var(--accent-primary)" />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Tentang Masjid Ini</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {masjid.description}
                            </p>
                        </div>
                    </div>

                    {/* Youth Hub Highlight - Gen Z Side */}
                    {masjid.org_name && (
                        <div style={{ padding: '0 20px 20px' }}>
                            <div className="glass-panel" style={{
                                padding: '24px',
                                borderRadius: '28px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--accent-primary)', filter: 'blur(60px)', opacity: 0.1 }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--accent-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Official Youth Hub</span>
                                        <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>{masjid.org_name}</h3>
                                    </div>
                                    <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--accent-primary)20', color: 'var(--accent-primary)' }}>
                                        <Zap size={20} fill="currentColor" />
                                    </div>
                                </div>

                                {masjid.hub_vibe && (
                                    <div style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'rgba(0,0,0,0.2)',
                                        marginBottom: '20px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                                            "{masjid.hub_vibe}"
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {masjid.instagram_handle && (
                                        <motion.a
                                            whileTap={{ scale: 0.95 }}
                                            href={`https://instagram.com/${masjid.instagram_handle.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                color: 'white',
                                                textDecoration: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <Instagram size={16} /> Instagram
                                        </motion.a>
                                    )}
                                    {masjid.tiktok_handle && (
                                        <motion.a
                                            whileTap={{ scale: 0.95 }}
                                            href={`https://tiktok.com/@${masjid.tiktok_handle.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                color: 'white',
                                                textDecoration: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <ExternalLink size={16} /> TikTok
                                        </motion.a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Youth Announcements (Broadcasts) */}
                    {masjid.youth_broadcasts?.length > 0 && (
                        <div style={{ padding: '0 20px 32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Newspaper size={20} color="var(--accent-primary)" /> Youth Feed
                                </h3>
                                <div style={{ height: '4px', width: '40px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                {masjid.youth_broadcasts.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        whileTap={{ scale: 0.98 }}
                                        className="glass-panel"
                                        style={{
                                            minWidth: '280px',
                                            maxWidth: '280px',
                                            padding: '20px',
                                            borderRadius: '24px',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--glass-border)'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{msg.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {msg.content}
                                        </p>
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.75rem' }}
                                            >
                                                Details
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map Section */}
                    <div style={{ padding: '0 20px 32px' }}>
                        <div className="glass-panel" style={{
                            height: '200px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '1px solid var(--glass-border)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <MasjidMap mosques={[masjid]} center={masjid.coordinates ? masjid.coordinates.split(',').map(Number) : [-6.2088, 106.8456]} zoom={15} />
                        </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div style={{ padding: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Kegiatan Mendatang</h3>
                            <Calendar size={18} color="var(--accent-secondary)" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {masjid.upcoming_events?.length > 0 ? (
                                masjid.upcoming_events.map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={{ ...event, mosque_name: masjid.name }}
                                        onJoin={() => alert("Berhasil bergabung!")}
                                        isJoined={false}
                                    />
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Belum ada jadwal kegiatan.</p>
                            )}
                        </div>
                    </div>

                    {/* Mosque Admin Application Section */}
                    {user && user.role === 'user' && (
                        <div style={{ padding: '0 20px 20px' }}>
                            <div className="glass-panel" style={{
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(20, 184, 166, 0.1))',
                                border: '1px solid var(--accent-primary)40'
                            }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldAlert size={18} color="var(--accent-primary)" /> Jadi Pengurus Masjid?
                                </h3>
                                <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    Bantu masjid ini mengelola kegiatan dan kembangkan komunitas digitalnya.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span>Min. 500 Barakah Points</span>
                                        <span style={{ color: user.points >= 500 ? '#4ade80' : '#f87171' }}>{user.points}/500</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                        <div style={{ width: `${Math.min(100, (user.points / 5))}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/apply-admin/${id}`)}
                                    disabled={user.points < 500}
                                    style={{
                                        width: '100%',
                                        marginTop: '20px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: user.points >= 500 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                        color: user.points >= 500 ? 'white' : '#64748b',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        cursor: user.points >= 500 ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {user.points >= 500 ? 'Ajukan Sekarang' : 'Kumpulkan Points Lagi'}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ padding: '0 20px' }}>
                    {/* Write / Edit Review Section */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', background: 'var(--subtle-bg)', marginBottom: '32px' }}>
                        {existingReview && !isEditing ? (
                            /* User already reviewed - show their review with edit button */
                            <>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={18} color="var(--accent-secondary)" /> Ulasan Anda
                                </h3>
                                <div style={{
                                    padding: '16px', borderRadius: '16px',
                                    background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                size={16}
                                                color={star <= parseInt(existingReview.rating) ? "#fbbf24" : "var(--glass-border)"}
                                                fill={star <= parseInt(existingReview.rating) ? "#fbbf24" : "none"}
                                            />
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        {existingReview.comment}
                                    </p>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setIsEditing(true);
                                        setNewReview({ rating: parseInt(existingReview.rating), comment: existingReview.comment });
                                    }}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        background: 'none', border: '1px solid var(--accent-primary)',
                                        color: 'var(--accent-primary)', fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        cursor: 'pointer', fontSize: '0.85rem'
                                    }}
                                >
                                    <Edit3 size={16} /> Edit Ulasan
                                </motion.button>
                            </>
                        ) : (
                            /* New review or editing existing */
                            <>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isEditing
                                        ? <><Edit3 size={18} color="var(--accent-primary)" /> Edit Ulasan</>
                                        : <><MessageSquare size={18} color="var(--accent-primary)" /> Tulis Ulasan</>
                                    }
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <motion.button
                                            key={star}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                        >
                                            <Star
                                                size={24}
                                                color={star <= newReview.rating ? "#fbbf24" : "var(--glass-border)"}
                                                fill={star <= newReview.rating ? "#fbbf24" : "none"}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                                <textarea
                                    placeholder="Ceritakan pengalamanmu di masjid ini..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'var(--subtle-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        height: '100px',
                                        resize: 'none',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        marginBottom: '16px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {isEditing && (
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setNewReview({ rating: parseInt(existingReview.rating), comment: existingReview.comment });
                                            }}
                                            style={{
                                                flex: 1, padding: '14px', borderRadius: '12px',
                                                background: 'var(--subtle-bg)', color: 'var(--text-primary)',
                                                fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.85rem'
                                            }}
                                        >
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        onClick={handleReviewSubmit}
                                        disabled={submittingReview}
                                        style={{
                                            flex: isEditing ? 2 : 1,
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: 'var(--accent-primary)',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            border: 'none',
                                            opacity: submittingReview ? 0.7 : 1,
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {submittingReview ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Kirim Ulasan')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Review Feed */}
                    <div>
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Ulasan Jemaah</h3>
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <ReviewCard key={review.id} review={review} />
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                <MessageSquare size={40} style={{ marginBottom: '12px' }} />
                                <p style={{ fontSize: '0.85rem' }}>Belum ada ulasan. Jadilah jemaah pertama!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MasjidProfile;
