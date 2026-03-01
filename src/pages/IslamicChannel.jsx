import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Compass, Heart, MessageSquare, Menu, X, Bell, User, Calculator, Globe, Trophy, Sparkles as SparklesIcon, Star, Plus, Edit3, Navigation, Plane, Sun, Moon, Monitor, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import QiblaFinder from '../components/IslamicTools/QiblaFinder';
import Calculators from '../components/IslamicTools/Calculators';
import GoToHaji from '../components/IslamicTools/GoToHaji';
import ARTourViewer from '../components/IslamicTools/ARTourViewer';
import MasjidAI from '../components/AI/MasjidAI';
import MasjidMap from '../components/Social/MasjidMap';
import AddMasjidModal from '../components/Social/AddMasjidModal';
import EventRSVP from '../components/Engagement/EventRSVP';
import CheckInScanner from '../components/Engagement/CheckInScanner';
import DailyMissions from '../components/Gamification/DailyMissions';
import defaultMasjidImage from '../assets/default image masjid.png';
import { Link, useNavigate } from 'react-router-dom';

const IslamicChannel = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [activeTool, setActiveTool] = useState(null);
    const [showAI, setShowAI] = useState(false);

    // Mosque related states
    const [masjids, setMasjids] = useState([]);
    const [nearbyMasjids, setNearbyMasjids] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('loading');
    const [showAllNearby, setShowAllNearby] = useState(false);
    const [loadingMasjids, setLoadingMasjids] = useState(true);
    const locationRequested = useRef(false);

    // Geolocation logic
    useEffect(() => {
        if (locationRequested.current) return;
        locationRequested.current = true;
        if (!navigator.geolocation) {
            setLocationStatus('denied');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(loc);
                setLocationStatus('granted');
            },
            () => setLocationStatus('denied'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }, []);

    // Nearby mosques logic
    useEffect(() => {
        if (!userLocation) return;
        const fetchNearby = async () => {
            try {
                const res = await fetch(`http://localhost/AKM.2.0/api/mosques.php?action=nearby&lat=${userLocation.lat}&lng=${userLocation.lng}&radius=0.5&limit=20`);
                const data = await res.json();
                if (Array.isArray(data)) setNearbyMasjids(data);
            } catch (err) { console.error(err); }
        };
        fetchNearby();
    }, [userLocation]);

    // Search mosques logic
    useEffect(() => {
        const fetchMasjids = async () => {
            try {
                const url = searchQuery
                    ? `http://localhost/AKM.2.0/api/mosques.php?action=search&q=${searchQuery}`
                    : 'http://localhost/AKM.2.0/api/mosques.php?action=list';
                const res = await fetch(url);
                const data = await res.json();
                setMasjids(data);
            } catch (err) { console.error(err); } finally { setLoadingMasjids(false); }
        };
        const timer = setTimeout(fetchMasjids, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const tools = [
        { id: 'qibla', title: 'Kiblat', subtitle: 'AR & Kompas', icon: <Navigation size={28} />, color: '#34d399' },
        { id: 'calculator', title: 'Kalkulator', subtitle: 'Zakat & Waris', icon: <Calculator size={28} />, color: '#f43f5e' },
        { id: 'gotohaji', title: 'GoToHaji', subtitle: 'Haji & Umrah', icon: <Plane size={28} />, color: '#fbbf24' },
        { id: 'tours', title: '360 Tour', subtitle: 'Masjid Virtual', icon: <SparklesIcon size={28} />, color: '#8b5cf6' }
    ];

    const displayMasjids = showAllNearby ? (nearbyMasjids.length > 0 ? nearbyMasjids : masjids) : (nearbyMasjids.length > 0 ? nearbyMasjids : masjids).slice(0, 6);

    return (
        <div style={{ padding: '24px', paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Islamic Tools</h1>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gen Z Lifestyle & Mosque Info</p>
                </div>

                <div style={{ display: 'flex', background: 'var(--subtle-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <button onClick={() => setTheme('light')} style={{ padding: '8px', borderRadius: '8px', background: theme === 'light' ? 'var(--accent-primary)' : 'transparent', color: theme === 'light' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', border: 'none' }}><Sun size={18} /></button>
                    <button onClick={() => setTheme('dark')} style={{ padding: '8px', borderRadius: '8px', background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent', color: theme === 'dark' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', border: 'none' }}><Moon size={18} /></button>
                    <button onClick={() => setTheme('system')} style={{ padding: '8px', borderRadius: '8px', background: theme === 'system' ? 'var(--accent-primary)' : 'transparent', color: theme === 'system' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', border: 'none' }}><Monitor size={18} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {tools.map((tool) => (
                    <motion.div key={tool.id} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', height: '160px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                        onClick={() => {
                            if (tool.id === 'quran') {
                                window.location.href = 'http://localhost/AKM.2.0/quran-pro/index.php';
                            } else {
                                setActiveTool(tool.id);
                            }
                        }}
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${tool.color}15`, color: tool.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{tool.icon}</div>
                        <div><h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{tool.title}</h3><p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tool.subtitle}</p></div>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', background: tool.color, filter: 'blur(30px)', opacity: 0.3 }}></div>
                    </motion.div>
                ))}
            </div>

            {/* Daily Missions Section */}
            <DailyMissions />

            {/* Mosque Section */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Info Masjid</h2>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsModalOpen(true)} style={{ background: 'var(--accent-primary)', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: 'none' }}>
                        <Plus size={16} /> Tambah Masjid
                    </motion.button>
                </div>

                {/* Search Bar */}
                <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'var(--subtle-bg)' }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input type="text" placeholder="Cari masjid..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', flex: 1, outline: 'none' }} />
                </div>

                {/* Masjid Terdekat */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><h3 style={{ margin: 0, fontSize: '1rem' }}>Masjid Terdekat</h3>{locationStatus === 'granted' && <Navigation size={14} color="var(--accent-secondary)" />}</div>
                    {nearbyMasjids.length > 6 && <button onClick={() => setShowAllNearby(prev => !prev)} style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', background: 'none', border: 'none' }}>{showAllNearby ? 'TAMPIL SEDIKIT' : 'LIHAT SEMUA'}</button>}
                </div>

                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                    {displayMasjids.length > 0 ? displayMasjids.map((masjid) => (
                        <div key={masjid.id} style={{ position: 'relative', minWidth: '220px' }}>
                            <Link to={`/masjid/${masjid.id}`} style={{ textDecoration: 'none' }}>
                                <motion.div whileTap={{ scale: 0.96 }} className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--subtle-border)' }}>
                                    <div style={{ height: '120px', width: '100%', position: 'relative' }}>
                                        <img src={masjid.image && masjid.image.trim() !== '' ? masjid.image : defaultMasjidImage} alt={masjid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                                            <Star size={12} color="#fbbf24" fill={parseFloat(masjid.avg_rating) > 0 ? "#fbbf24" : "none"} />
                                            <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>{parseFloat(masjid.avg_rating) > 0 ? parseFloat(masjid.avg_rating).toFixed(1) : '-'}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{masjid.name}</h4>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {masjid.address?.split(',')[0]}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{masjid.followers_count} Muhsinin</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            {/* Simple Edit Icon Shortcut */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/masjid/${masjid.id}?edit=true`);
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    right: '12px',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 5,
                                    color: 'white'
                                }}
                            >
                                <Edit3 size={14} />
                            </motion.button>
                        </div>
                    )) : <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Mencari masjid...</p>}
                </div>

                {/* Map Discovery */}
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Peta Masjid</h3>
                    <motion.div whileTap={{ scale: 0.98 }} className="glass-panel" style={{ height: '300px', borderRadius: '24px', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', zIndex: 1, position: 'relative' }}>
                        <MasjidMap mosques={nearbyMasjids.length > 0 ? nearbyMasjids : masjids} userLocation={userLocation} />
                    </motion.div>
                </div>

                {/* Admin Check-in Simulator (For Demo) */}
                <div style={{ marginTop: '48px' }}>
                    <CheckInScanner />
                </div>
            </div>

            <AnimatePresence>
                {/* Quran handled via direct redirect now */}
                {activeTool === 'qibla' && <QiblaFinder onClose={() => setActiveTool(null)} />}
                {activeTool === 'tours' && <ARTourViewer onClose={() => setActiveTool(null)} />}
                {activeTool === 'calculator' && <Calculators onClose={() => setActiveTool(null)} />}
                {activeTool === 'gotohaji' && <GoToHaji onClose={() => setActiveTool(null)} />}
                {showAI && <MasjidAI onClose={() => setShowAI(false)} />}
            </AnimatePresence>

            {/* Floating AI Orb */}
            {!activeTool && (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowAI(true)} style={{ position: 'fixed', bottom: '100px', right: '24px', width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(167, 139, 250, 0.4)', border: 'none', zIndex: 100, cursor: 'pointer' }}>
                    <SparklesIcon size={28} />
                </motion.button>
            )}

            <AddMasjidModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userLocation={userLocation} onAdd={() => {
                const fetchMasjids = async () => {
                    try { const res = await fetch('http://localhost/AKM.2.0/api/mosques.php?action=list'); const data = await res.json(); setMasjids(data); } catch (err) { console.error(err); }
                };
                fetchMasjids();
            }} />
        </div>
    );
};

export default IslamicChannel;
