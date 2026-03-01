import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, QrCode, CheckCircle, X, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EventRSVP = ({ mosqueId }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const fetchEvents = async () => {
        try {
            const url = `http://localhost/AKM.2.0/api/events.php?userId=${user?.id || ''}${mosqueId ? `&mosqueId=${mosqueId}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setEvents(data);
        } catch (err) {
            console.error("Fetch events error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [mosqueId, user]);

    const handleRSVP = async (eventId) => {
        if (!user) {
            alert("Silakan login untuk reservasi acara.");
            return;
        }

        try {
            const res = await fetch('http://localhost/AKM.2.0/api/events.php?action=rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, eventId })
            });
            const data = await res.json();
            if (data.qr_code_token) {
                fetchEvents(); // Refresh list to show status
                const event = events.find(e => e.id === eventId);
                setSelectedEvent({ ...event, qr_code_token: data.qr_code_token });
                setShowQR(true);
            } else if (data.error) {
                alert(data.error);
            }
        } catch (err) {
            console.error("RSVP error:", err);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Memuat Acara...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((event) => (
                <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            <img
                                src={event.image || 'https://images.unsplash.com/photo-1542744095-2ad4870f608e?w=200'}
                                alt={event.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    color: 'var(--accent-primary)',
                                    background: 'rgba(66, 42, 251, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    marginBottom: '4px'
                                }}>
                                    {event.category || 'Event'}
                                </span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{event.title}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    <Calendar size={12} /> {event.date} • {event.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    <MapPin size={12} /> {event.location || event.mosque_name}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Users size={14} /> <b>{event.attendees_count}</b> <span style={{ opacity: 0.7 }}>Terdaftar</span>
                        </div>

                        {event.rsvp_status === 'checked_in' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: '700' }}>
                                <CheckCircle size={16} /> Hadir
                            </div>
                        ) : event.rsvp_status === 'rsvp' ? (
                            <button
                                onClick={() => {
                                    setSelectedEvent(event);
                                    setShowQR(true);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--accent-primary)',
                                    color: 'var(--accent-primary)',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <QrCode size={14} /> My Ticket
                            </button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRSVP(event.id)}
                                style={{
                                    background: 'var(--accent-primary)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                Reservasi Sekarang
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            ))}

            {events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', opacity: 0.5, fontSize: '0.85rem' }}>
                    Belum ada acara mendatang di masjid ini.
                </div>
            )}

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '24px'
                        }}
                        onClick={() => setShowQR(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '360px',
                                background: '#fff',
                                borderRadius: '32px',
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                color: '#1e293b'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800' }}>
                                    EVENT TICKET
                                </div>
                                <button onClick={() => setShowQR(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{selectedEvent.title}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{selectedEvent.mosque_name}</p>
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                padding: '20px',
                                borderRadius: '24px',
                                border: '2px dashed #e2e8f0',
                                position: 'relative'
                            }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedEvent.qr_code_token}&color=1e293b&bgcolor=f8fafc`}
                                    alt="QR Ticket"
                                    style={{ width: '200px', height: '200px' }}
                                />
                                {selectedEvent.rsvp_status === 'checked_in' && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        background: 'rgba(255,255,255,0.9)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        borderRadius: '24px'
                                    }}>
                                        <CheckCircle size={64} color="#10b981" />
                                        <span style={{ color: '#10b981', fontWeight: '800', marginTop: '12px' }}>DIGUNAKAN</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ width: '100%', background: '#f1f5f9', padding: '16px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <Info size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', lineHeight: '1.5' }}>
                                    Tunjukkan QR Code ini ke petugas masjid saat acara berlangsung untuk mendapatkan <b>+100 XP</b> & pencatatan kehadiran.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventRSVP;
