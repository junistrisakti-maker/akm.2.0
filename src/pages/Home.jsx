import React from 'react';
import FeedContainer from '../components/Feed/FeedContainer';
import DonationTracker from '../components/Transparency/DonationTracker';
import NotificationSystem from '../components/Notifications/NotificationSystem';
import PrayerDashboard from '../components/Navigation/PrayerDashboard';

const Home = () => {
    return (
        <div style={{ height: '100vh', width: '100%', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
            <DonationTracker />
            <NotificationSystem />
            <PrayerDashboard />
            <FeedContainer />
        </div>
    );
};

export default Home;
