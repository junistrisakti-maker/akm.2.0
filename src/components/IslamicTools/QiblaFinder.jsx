import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, Compass, RefreshCw, AlertCircle, X } from 'lucide-react';

const QiblaFinder = ({ onClose }) => {
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
    const [qiblaAngle, setQiblaAngle] = useState(0);
    const [isARMode, setIsARMode] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);

    // Calculate Qibla angle based on coordinates
    const calculateQibla = (lat, lon) => {
        const phiK = 21.4225 * Math.PI / 180.0;
        const lambdaK = 39.8262 * Math.PI / 180.0;
        const phi = lat * Math.PI / 180.0;
        const lambda = lon * Math.PI / 180.0;

        const qibla = Math.atan2(Math.sin(lambdaK - lambda), Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda));
        return (qibla * 180.0 / Math.PI + 360) % 360;
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
            setError("Gagal mengakses kamera. AR Mode tidak tersedia.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        // Get Geolocation
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lon: longitude });
                setQiblaAngle(calculateQibla(latitude, longitude));
            },
            (err) => {
                setError("Izin lokasi diperlukan untuk akurasi kiblat.");
            }
        );

        // Orientation Handler
        const handleOrientation = (e) => {
            setOrientation({
                alpha: e.alpha || 0, // Z-axis (Compass)
                beta: e.beta || 0,   // X-axis (Pitch)
                gamma: e.gamma || 0  // Y-axis (Roll)
            });

            // Switch AR Mode if phone is tilted up (beta > 45 or beta < -45)
            const tilt = Math.abs(e.beta);
            if (tilt > 50 && !isARMode) {
                setIsARMode(true);
            } else if (tilt < 40 && isARMode) {
                setIsARMode(false);
            }
        };

        const requestPermission = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const res = await DeviceOrientationEvent.requestPermission();
                    if (res === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        setPermissionGranted(true);
                    }
                } catch (err) { setError("Izin sensor ditolak."); }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
                setPermissionGranted(true);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            stopCamera();
        };
    }, [isARMode]);

    useEffect(() => {
        if (isARMode) startCamera();
        else stopCamera();
    }, [isARMode]);

    const relativeAngle = (qiblaAngle - orientation.alpha + 360) % 360;
    const isAligned = Math.abs(relativeAngle) < 5 || Math.abs(relativeAngle - 360) < 5;

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
            {/* Camera View for AR */}
            {isARMode && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                />
            )}

            {/* Overlays */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                            <Compass color="white" size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '800' }}>Qibla Finder</h2>
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                                {isARMode ? 'AR Mode' : 'Compass Mode'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Main Compass UI */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                        {/* Outer Ring */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            border: `2px solid ${isAligned ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '50%',
                            boxShadow: isAligned ? '0 0 30px var(--accent-secondary)40' : 'none',
                            transition: 'all 0.3s ease'
                        }}></div>

                        {/* Compass Disk */}
                        <motion.div
                            style={{ position: 'absolute', inset: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            animate={{ rotate: -orientation.alpha }}
                            transition={{ type: 'spring', damping: 20 }}
                        >
                            {[0, 90, 180, 270].map(deg => (
                                <span key={deg} style={{
                                    position: 'absolute',
                                    transform: `rotate(${deg}deg) translateY(-110px)`,
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    color: deg === 0 ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.4)'
                                }}>
                                    {deg === 0 ? 'U' : deg === 90 ? 'T' : deg === 180 ? 'S' : 'B'}
                                </span>
                            ))}
                        </motion.div>

                        {/* Qibla Marker (Kaaba) */}
                        <motion.div
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            animate={{ rotate: qiblaAngle - orientation.alpha }}
                            transition={{ type: 'spring', damping: 30 }}
                        >
                            <div style={{ width: '4px', height: '140px', background: 'linear-gradient(to top, transparent, var(--accent-primary))', position: 'relative', top: '-70px' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 10px var(--accent-primary))' }}>🕋</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>KIBLAT</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Center Point */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '12px',
                            height: '12px',
                            background: 'white',
                            borderRadius: '50%',
                            border: '2px solid var(--accent-primary)',
                            zIndex: 20
                        }}></div>
                    </div>

                    {/* Status Info */}
                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <div style={{
                            background: isAligned ? 'var(--accent-secondary)20' : 'rgba(255,255,255,0.05)',
                            padding: '12px 24px',
                            borderRadius: '20px',
                            border: `1px solid ${isAligned ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)'}`,
                            transition: 'all 0.3s ease'
                        }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: isAligned ? 'var(--accent-secondary)' : 'white' }}>
                                {isAligned ? 'Kiblat Terdeteksi!' : 'Putar HP Anda'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                            {orientation.alpha.toFixed(0)}° dari Utara
                        </p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '0.8rem' }}
                    >
                        <RefreshCw size={16} /> Kalibrasi
                    </button>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', bottom: '100px', left: '20px', right: '20px', background: 'var(--accent-tertiary)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', zIndex: 100 }}
                    >
                        <AlertCircle size={20} color="white" />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'white' }}>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default QiblaFinder;
