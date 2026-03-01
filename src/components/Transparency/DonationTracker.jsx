import React, { useState, useEffect } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DonationTracker = () => {
    const [stats, setStats] = useState({ total: 0, target: 10000000, recent: [] });
    const [progress, setProgress] = useState(0);

    const fetchDonations = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/donations.php');
            const data = await res.json();
            setStats(data);

            // Calculate progress percentage (max 100%)
            const percent = Math.min((data.total / data.target) * 100, 100);
            setProgress(percent);
        } catch (error) {
            console.error("Donation fetch error:", error);
        }
    };

    useEffect(() => {
        fetchDonations();
        const interval = setInterval(fetchDonations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            zIndex: 50,
            pointerEvents: 'none' // Let clicks pass through to feed
        }}>
            <div className="glass-panel" style={{
                padding: '12px',
                pointerEvents: 'auto', // Re-enable clicks
                borderRadius: '16px',
                background: 'rgba(15, 23, 42, 0.6)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            background: 'var(--accent-secondary)',
                            borderRadius: '50%',
                            padding: '4px'
                        }}>
                            <Wallet size={16} color="white" />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white' }}>Masjid Construction</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
                        {formatCurrency(stats.total)} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>/ {formatCurrency(stats.target)}</span>
                    </span>
                </div>

                {/* Progress Bar Container */}
                <div style={{
                    height: '8px',
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #34d399 0%, #a78bfa 50%, #f43f5e 100%)',
                            boxShadow: '0 0 10px rgba(52, 211, 153, 0.5)'
                        }}
                    />
                </div>

                {/* Recent Donor Ticker */}
                {stats.recent?.length > 0 && (
                    <div style={{ marginTop: '8px', overflow: 'hidden', height: '16px' }}>
                        <motion.div
                            animate={{ y: [0, -20 * stats.recent.length] }}
                            transition={{
                                repeat: Infinity,
                                duration: stats.recent.length * 3,
                                ease: "linear",
                                repeatType: "loop"
                            }}
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            {stats.recent.concat(stats.recent).map((donor, idx) => ( // Duplicate for infinite loop illusion
                                <div key={idx} style={{
                                    fontSize: '0.7rem',
                                    color: '#cbd5e1',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span style={{ color: '#fbbf24' }}>★</span>
                                    {donor.donor_name} donated {formatCurrency(donor.amount)}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonationTracker;
