import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Info, Map as MapIcon, Smartphone, Maximize, RotateCcw, X, Sparkles } from 'lucide-react';

const ARTourViewer = ({ onClose }) => {
    const [tours, setTours] = useState([]);
    const [activeTour, setActiveTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGyroActive, setIsGyroActive] = useState(false);
    const viewerRef = useRef(null);

    useEffect(() => {
        fetch('http://localhost/AKM.2.0/api/tours.php')
            .then(res => res.json())
            .then(data => {
                setTours(data);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (activeTour && window.pannellum) {
            const firstScene = activeTour.scenes[0];
            const viewer = window.pannellum.viewer('panorama-container', {
                type: 'equirectangular',
                panorama: firstScene.panorama,
                autoLoad: true,
                title: firstScene.title,
                author: activeTour.name,
                hotSpots: firstScene.hotspots,
                compass: true,
                orientationOnByDefault: false,
            });
            viewerRef.current = viewer;

            return () => {
                if (viewerRef.current) {
                    viewerRef.current.destroy();
                }
            };
        }
    }, [activeTour]);

    const toggleGyro = () => {
        if (!viewerRef.current) return;

        if (!isGyroActive) {
            // Request permission for iOS
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            viewerRef.current.startOrientation();
                            setIsGyroActive(true);
                        }
                    });
            } else {
                viewerRef.current.startOrientation();
                setIsGyroActive(true);
            }
        } else {
            viewerRef.current.stopOrientation();
            setIsGyroActive(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            className="glass-panel"
            style={{
                position: 'fixed',
                top: '10vh',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '448px',
                height: '75vh',
                background: '#000',
                borderRadius: '28px',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}
        >
            {/* Pannellum Script Injection */}
            {!window.pannellum && (
                <>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
                    <script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"></script>
                </>
            )}

            {!activeTour ? (
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                                <Sparkles color="white" size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '800' }}>Jelajah 360</h3>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Masjid Virtual Reality</span>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <X size={18} />
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>Memuat Tur...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {tours.map(tour => (
                                <motion.div
                                    key={tour.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveTour(tour)}
                                    style={{
                                        position: 'relative',
                                        height: '180px',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <img src={tour.thumbnail} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                                    <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{tour.name}</h3>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{tour.location}</p>
                                    </div>
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        360 VR
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ position: 'relative', flex: 1 }}>
                    <div id="panorama-container" style={{ width: '100%', height: '100%' }}></div>

                    {/* Overlay Controls */}
                    <div style={{ position: 'absolute', top: '24px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                        <button onClick={() => setActiveTour(null)} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <ChevronLeft size={20} />
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={toggleGyro} style={{ background: isGyroActive ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Smartphone size={20} />
                            </button>
                            <button style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', padding: '10px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Info size={20} />
                            </button>
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '32px', left: '20px', right: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{activeTour.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Gerakkan ponsel atau geser layar untuk menjelajah interior masjid secara imersif.</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ARTourViewer;
