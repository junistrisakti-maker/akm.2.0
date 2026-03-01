import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, User, Calendar, Sparkles, Zap } from 'lucide-react';
import styles from './BottomNav.module.css';

// Custom Mosque icon (dome + minaret silhouette)
const MosqueIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v2" />
        <path d="M8 7c0-2.2 1.8-4 4-4s4 1.8 4 4" />
        <path d="M6 11c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <rect x="4" y="11" width="16" height="10" rx="1" />
        <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
        <path d="M2 21h20" />
        <path d="M20 7v4" />
        <circle cx="20" cy="6" r="1" />
    </svg>
);

const BottomNav = () => {
    // Helper to determine active class
    const getNavLinkClass = ({ isActive }) => {
        return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
    };

    return (
        <nav className={styles.navContainer}>
            <NavLink to="/" className={getNavLinkClass} end>
                <Compass className={styles.navIcon} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/community" className={getNavLinkClass} end>
                <MosqueIcon className={styles.navIcon} />
                <span>Circle</span>
            </NavLink>
            <NavLink to="/community/social" className={getNavLinkClass}>
                <Zap className={styles.navIcon} />
                <span>Hub</span>
            </NavLink>
            <NavLink to="/channel" className={getNavLinkClass}>
                <Sparkles className={styles.navIcon} />
                <span>Islami</span>
            </NavLink>
            <NavLink to="/events" className={getNavLinkClass}>
                <Calendar className={styles.navIcon} />
                <span>Event</span>
            </NavLink>
            <NavLink to="/profile" className={getNavLinkClass}>
                <User className={styles.navIcon} />
                <span>Profil</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
