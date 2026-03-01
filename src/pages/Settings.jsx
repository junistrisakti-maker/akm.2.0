import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, User, Bell, Shield, Moon, HelpCircle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SettingsItem = ({ icon: Icon, label, value }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'var(--subtle-bg)',
        borderRadius: '12px',
        marginBottom: '8px',
        cursor: 'pointer'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--subtle-bg)' }}>
                <Icon size={20} color="var(--accent-primary)" />
            </div>
            <span style={{ fontWeight: '500' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {value && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{value}</span>}
            <ChevronRight size={18} color="var(--text-secondary)" />
        </div>
    </div>
);

const Settings = () => {
    const navigate = useNavigate();
    const { isSuperadmin, user } = useAuth();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ padding: '20px', paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    Back
                </button>
                <h2 className="text-gradient">Settings</h2>
            </div>

            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account</h3>
                <SettingsItem icon={User} label="Edit Profile" />
                <SettingsItem icon={Shield} label="Privacy & Security" />
            </section>

            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Preferences</h3>
                <SettingsItem icon={Bell} label="Notifications" value="On" />
                <div onClick={() => navigate('/settings/appearance')}>
                    <SettingsItem icon={Moon} label="Appearance" />
                </div>
            </section>

            {/* Masjid Management - For Admins & Superadmins */}
            {(user?.role === 'admin' || isSuperadmin()) && (
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Masjid Management</h3>
                    <div onClick={() => navigate('/settings/youth-hub')}>
                        <SettingsItem icon={Globe} label="Info Youth Hub" value="Manage Hub" />
                    </div>
                </section>
            )}

            {/* System Admin - Only for Superadmin */}
            {isSuperadmin() && (
                <section style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>System Admin</h3>
                    <div onClick={() => window.location.href = 'http://localhost:5174'}>
                        <SettingsItem icon={Globe} label="Admin Hub" value="Manage System" />
                    </div>
                </section>
            )}

            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Support</h3>
                <SettingsItem icon={HelpCircle} label="Help Center" />
            </section>

            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <p>Ayokemasjid v2.0.0-beta</p>
                <p style={{ marginTop: '4px' }}>Made with ❤️ for Gen Z Ummah</p>
            </div>
        </motion.div>
    );
};

export default Settings;
