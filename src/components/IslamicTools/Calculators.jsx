import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calculator, Info, CheckCircle, X } from 'lucide-react';

const Calculators = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('zakat'); // 'zakat', 'waris'
    const [zakatType, setZakatType] = useState('wealth'); // 'wealth', 'gold', 'silver'

    // Zakat State
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState(null);

    // Waris State (Simplified for MVP)
    const [warisInput, setWarisInput] = useState({ totalAssets: '', hasWife: true, sons: 1, daughters: 1 });

    const NISAB_GOLD = 85;
    const NISAB_SILVER = 595;
    const GOLD_PRICE = 1200000; // Mock price in IDR per gram

    const calculateZakat = () => {
        const val = parseFloat(amount) || 0;
        let nisab = 0;

        if (zakatType === 'wealth') nisab = NISAB_GOLD * GOLD_PRICE;
        else if (zakatType === 'gold') nisab = NISAB_GOLD;
        else if (zakatType === 'silver') nisab = NISAB_SILVER;

        if (val >= nisab) {
            setResult({
                total: val * 0.025,
                message: 'Wajib Zakat (2.5%)'
            });
        } else {
            setResult({
                total: 0,
                message: 'Belum mencapai Nisab'
            });
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
                background: 'var(--bg-secondary)',
                borderRadius: '28px',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}
        >
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="neon-glow" style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calculator color="white" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Kalkulator Islami</h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Zakat & Waris Digital</p>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'var(--subtle-bg)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                    <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid var(--glass-border)' }}>
                {['zakat', 'waris'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setResult(null); }}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: 'bold',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : 'none',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {activeTab === 'zakat' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Zakat Type Selector */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['wealth', 'gold', 'silver'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setZakatType(type)}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '12px',
                                        background: zakatType === type ? 'var(--accent-primary)20' : 'var(--card-bg)',
                                        border: `1px solid ${zakatType === type ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                                        color: zakatType === type ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {type === 'wealth' ? 'Harta' : type === 'gold' ? 'Emas' : 'Perak'}
                                </button>
                            ))}
                        </div>

                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                {zakatType === 'wealth' ? 'Total Harta (IDR)' : `Total Berat (${zakatType === 'gold' ? 'g' : 'g'})`}
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '1.2rem', outline: 'none' }}
                            />

                            <button
                                onClick={calculateZakat}
                                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold', marginTop: '20px' }}
                            >
                                Hitung Zakat
                            </button>
                        </div>

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel"
                                style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--accent-secondary)30' }}
                            >
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hasil Perhitungan:</span>
                                <h2 style={{ margin: '8px 0', color: 'var(--accent-secondary)' }}>
                                    {zakatType === 'wealth' ? `Rp ${result.total.toLocaleString('id-ID')}` : `${result.total} gram`}
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{result.message}</p>
                            </motion.div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', opacity: 0.7 }}>
                            <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                Nisab Emas: 85g, Perak: 595g. Harta mencapai nisab jika setara 85g emas dan telah dimiliki selama 1 tahun (haul).
                            </p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Simulasi Waris</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                Kalkulator ini hanya memberikan estimasi dasar. Untuk pembagian akurat, harap konsultasikan dengan ahli waris/ustadz.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Aset (IDR)</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', marginTop: '4px' }} placeholder="Masukkan jumlah" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Ada Istri?</span>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Jumlah Anak Laki-laki</span>
                                    <input type="number" defaultValue={1} style={{ width: '60px', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', textAlign: 'center' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Jumlah Anak Perempuan</span>
                                    <input type="number" defaultValue={1} style={{ width: '60px', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', textAlign: 'center' }} />
                                </div>
                            </div>

                            <button style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold', marginTop: '24px' }}>
                                Hitung Estimasi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Calculators;
