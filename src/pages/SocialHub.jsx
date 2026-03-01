import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ActivityTicker from '../components/Social/ActivityTicker';
import DzikirCounter from '../components/Social/DzikirCounter';
import PrayerWall from '../components/Social/PrayerWall';
import Leaderboard from '../components/Gamification/Leaderboard';
import FlashChallenge from '../components/Social/FlashChallenge';
import SohibMasjidBuddy from '../components/Social/SohibMasjidBuddy';
import DigitalSadaqah from '../components/Social/DigitalSadaqah';
import { Users, Zap, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SocialHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('hub');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                paddingBottom: '80px'
            }}
        >
            {/* Header Ticker */}
            <ActivityTicker />

            <div style={{ padding: '20px' }}>
                <header style={{ marginBottom: '24px' }}>
                    <h2 className="text-gradient" style={{ margin: '0 0 4px 0' }}>Social Hub</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Terhubung, Berdoa, dan Berjuang Bersama ✨
                    </p>
                </header>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--subtle-bg)',
                    borderRadius: '16px',
                    padding: '4px',
                    marginBottom: '24px'
                }}>
                    <TabButton
                        active={activeTab === 'hub'}
                        onClick={() => setActiveTab('hub')}
                        icon={<Zap size={18} />}
                        label="Aktivitas"
                    />
                    <TabButton
                        active={activeTab === 'leaderboard'}
                        onClick={() => setActiveTab('leaderboard')}
                        icon={<Users size={18} />}
                        label="Ranking"
                    />
                </div>

                <main>
                    {activeTab === 'hub' ? (
                        <>
                            <FlashChallenge />
                            <DzikirCounter />
                            <DigitalSadaqah />
                            <PrayerWall layout="horizontal" />
                            <SohibMasjidBuddy />
                        </>
                    ) : (
                        <div style={{ background: 'var(--subtle-bg)', borderRadius: '24px', padding: '16px' }}>
                            <h4 style={{ margin: '0 0 16px 0', padding: '0 8px' }}>Global Leaderboard</h4>
                            <Leaderboard />
                        </div>
                    )}
                </main>
            </div>
        </motion.div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            border: 'none',
            borderRadius: '12px',
            background: active ? 'var(--accent-primary)' : 'transparent',
            color: active ? 'white' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        }}
    >
        {icon}
        {label}
    </button>
);

export default SocialHub;
