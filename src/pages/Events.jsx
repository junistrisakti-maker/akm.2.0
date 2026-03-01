import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Ticket, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/Social/EventCard';
import LoadingScreen from '../components/UI/LoadingScreen';
import AddEventModal from '../components/Social/AddEventModal';
import EventRSVP from '../components/Engagement/EventRSVP';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinedEvents, setJoinedEvents] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [myMosques, setMyMosques] = useState([]);
    const { user, isAdmin, canManageMosque } = useAuth();

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('vibes'); // 'vibes' or 'tickets'

    const fetchEvents = async () => {
        try {
            const baseUrl = 'http://localhost/AKM.2.0/api/events.php';
            const params = new URLSearchParams();
            if (selectedCategory !== 'All') params.append('category', selectedCategory);
            if (user?.id) params.append('userId', user.id);

            const response = await fetch(`${baseUrl}?${params.toString()}`);
            const data = await response.json();
            setEvents(data);
        } catch (err) {
            console.error("Error loading events:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyMosques = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/mosques.php?action=list');
            const data = await res.json();
            if (user.role === 'superadmin') {
                setMyMosques(data);
            } else if (user.managed_mosque_id) {
                const filtered = data.filter(m => parseInt(m.id) === parseInt(user.managed_mosque_id));
                setMyMosques(filtered);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchMyMosques();
    }, [selectedCategory, user]);

    const categories = ['All', 'Kajian', 'Volunteer', 'Social', 'Sport'];

    const handleJoin = async (eventId) => {
        if (!user) {
            alert("Please login to join events!");
            return;
        }

        try {
            const response = await fetch('http://localhost/AKM.2.0/api/events.php?action=join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, eventId }),
            });
            const data = await response.json();

            if (response.ok) {
                setJoinedEvents(prev => new Set([...prev, eventId]));
                fetchEvents(); // Refresh to update counts
            } else {
                alert(data.error || "Failed to join event");
            }
        } catch (error) {
            console.error("Join error:", error);
        }
    };

    const handleAddEvent = async (formData) => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/events.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId: user.id })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Event published! 🕌✨");
                setIsModalOpen(false);
                fetchEvents();
            } else {
                alert(data.error || "Gagal membuat event");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    if (loading && events.length === 0) return <LoadingScreen />;

    return (
        <div style={{ padding: '20px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Tab Header */}
            <div style={{ display: 'flex', gap: '8px', background: 'var(--subtle-bg)', padding: '6px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveTab('vibes')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        background: activeTab === 'vibes' ? 'var(--accent-primary)' : 'transparent',
                        color: activeTab === 'vibes' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: '0.3s'
                    }}
                >
                    <Sparkles size={16} /> Upcoming Vibes
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        background: activeTab === 'tickets' ? 'var(--accent-primary)' : 'transparent',
                        color: activeTab === 'tickets' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: '0.3s'
                    }}
                >
                    <Ticket size={16} /> Tiket Saya
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'vibes' ? (
                    <motion.div
                        key="vibes"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="text-gradient" style={{ margin: 0 }}>Vibes Masjid</h2>
                            {isAdmin() && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsModalOpen(true)}
                                    style={{
                                        padding: '10px 16px',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                                    }}
                                >
                                    <Plus size={18} /> Tambah
                                </motion.button>
                            )}
                        </div>

                        {/* Filter Chips */}
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--glass-border)',
                                        background: selectedCategory === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        transition: '0.3s'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {events.length > 0 ? (
                                events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onJoin={handleJoin}
                                        isJoined={event.rsvp_status !== null}
                                    />
                                ))
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No upcoming events found.
                                </div>
                            )}
                        </div>

                        <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <p>No more events near you.</p>
                            <button style={{ marginTop: '8px', color: 'var(--accent-primary)', textDecoration: 'underline' }}>Change Location</button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="tickets"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <EventRSVP />
                    </motion.div>
                )}
            </AnimatePresence>

            <AddEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddEvent}
                mosques={myMosques}
                userId={user?.id}
            />
        </div>
    );
};

export default Events;
