import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppearanceSettings = () => {
    const { theme, setTheme, actualTheme } = useTheme();
    const navigate = useNavigate();

    const themeOptions = [
        { id: 'light', label: 'Terang', icon: Sun, desc: 'Tampilan bersih dan cerah' },
        { id: 'dark', label: 'Gelap', icon: Moon, desc: 'Nyaman untuk mata di malam hari' },
        { id: 'system', label: 'Sistem', icon: Monitor, desc: 'Mengikuti pengaturan perangkat Anda' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{
                padding: '24px',
                paddingBottom: '110px',
                minHeight: '100vh',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Tampilan</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {themeOptions.map((option) => (
                    <motion.div
                        key={option.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTheme(option.id)}
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            padding: '20px',
                            borderRadius: '20px',
                            border: `2px solid ${theme === option.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            position: 'relative',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: theme === option.id ? 'var(--accent-primary)20' : 'rgba(255,255,255,0.05)',
                            color: theme === option.id ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}>
                            <option.icon size={24} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{option.label}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {option.desc}
                            </p>
                        </div>

                        {theme === option.id && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    background: 'var(--accent-primary)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    color: 'white'
                                }}
                            >
                                <Check size={16} />
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Preview Section */}
            <div style={{ marginTop: '40px' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', opacity: 0.7 }}>Pratinjau</h2>
                <div style={{
                    padding: '24px',
                    borderRadius: '24px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '20px',
                        background: 'var(--accent-primary)',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <Sun size={32} color="white" />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0' }}>Barakah Mode</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Tema aktif saat ini: <strong>{actualTheme === 'dark' ? 'Gelap' : 'Terang'}</strong>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default AppearanceSettings;
