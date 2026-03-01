import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music, Pause, Play, SkipForward, SkipBack } from 'lucide-react';

const playlist = [
    { name: 'Halal Vibes', src: '/audio/halal-vibes.mp3' },
    { name: 'Track 1', src: '/audio/track1.mp3' },
];

const MusicPlayer = () => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('musicMuted') === 'true';
    });
    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem('musicVolume')) || 0.3;
    });
    const [currentTrack, setCurrentTrack] = useState(0);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        localStorage.setItem('musicMuted', isMuted);
    }, [isMuted]);

    useEffect(() => {
        localStorage.setItem('musicVolume', volume);
    }, [volume]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.log);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const nextTrack = () => {
        const next = (currentTrack + 1) % playlist.length;
        setCurrentTrack(next);
        if (isPlaying && audioRef.current) {
            setTimeout(() => audioRef.current.play().catch(console.log), 100);
        }
    };

    const prevTrack = () => {
        const prev = (currentTrack - 1 + playlist.length) % playlist.length;
        setCurrentTrack(prev);
        if (isPlaying && audioRef.current) {
            setTimeout(() => audioRef.current.play().catch(console.log), 100);
        }
    };

    const handleEnded = () => {
        nextTrack();
    };

    return (
        <>
            <audio
                ref={audioRef}
                src={playlist[currentTrack].src}
                loop={playlist.length === 1}
                onEnded={handleEnded}
            />
            
            {/* Floating Music Button */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '16px',
                    zIndex: 1000,
                }}
            >
                {/* Expanded Controls Panel */}
                {showControls && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '60px',
                            right: '0',
                            background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            minWidth: '200px',
                            animation: 'slideUp 0.3s ease-out',
                        }}
                    >
                        {/* Track Info */}
                        <div style={{ 
                            color: 'white', 
                            fontSize: '12px', 
                            marginBottom: '12px',
                            textAlign: 'center',
                            opacity: 0.9
                        }}>
                            <Music size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            {playlist[currentTrack].name}
                        </div>

                        {/* Playback Controls */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            <button
                                onClick={prevTrack}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <SkipBack size={16} />
                            </button>
                            <button
                                onClick={togglePlay}
                                style={{
                                    background: 'rgba(255,255,255,0.3)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '44px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button
                                onClick={nextTrack}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <SkipForward size={16} />
                            </button>
                        </div>

                        {/* Volume Control */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px' 
                        }}>
                            <button
                                onClick={toggleMute}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'white',
                                    padding: '4px',
                                }}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                style={{
                                    flex: 1,
                                    height: '4px',
                                    appearance: 'none',
                                    background: 'rgba(255,255,255,0.3)',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Main Music Button */}
                <button
                    onClick={() => setShowControls(!showControls)}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: isPlaying 
                            ? 'linear-gradient(135deg, #2d5a3d 0%, #1a472a 100%)' 
                            : 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
                        border: 'none',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        animation: isPlaying ? 'pulse 2s infinite' : 'none',
                    }}
                >
                    <Music size={24} />
                </button>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(45, 90, 61, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(45, 90, 61, 0.6); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                }
            `}</style>
        </>
    );
};

export default MusicPlayer;
