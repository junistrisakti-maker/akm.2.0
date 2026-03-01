import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ShieldAlert, Key, Globe, Layout, ChevronLeft, Cpu, Activity, Terminal, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const Settings = () => {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/settings.php');
            const data = await res.json();
            if (data.settings) {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (group, key, value) => {
        setSettings(prev => ({
            ...prev,
            [group]: prev[group].map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
        }));
    };

    const saveSettings = async () => {
        if (!admin) return;
        setSaving(true);
        const payload = {};
        Object.values(settings).flat().forEach(s => {
            payload[s.setting_key] = s.setting_value;
        });

        try {
            const res = await fetch('http://localhost/AKM.2.0/api/settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: payload,
                    user_id: admin.id
                })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 border border-[#334155] bg-[#020617]/50">
            <p className="text-xs font-mono font-bold text-slate-500 animate-pulse uppercase tracking-[0.2em]">ACCESSING SYSTEM KERNEL...</p>
        </div>
    );

    const groupIcons = {
        ai: <Cpu size={14} />,
        whatsapp: <Globe size={14} />,
        payment: <Database size={14} />,
        general: <ShieldAlert size={14} />
    };

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">System Configuration</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Registry: Global Matrix</p>
                </div>

                <div className="flex items-center gap-4">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest ${message.toLowerCase().includes('success')
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                                : 'border-rose-500/50 bg-rose-500/10 text-rose-500'
                                }`}
                        >
                            {message}
                        </motion.div>
                    )}
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <Save size={16} /> {saving ? 'Writing...' : 'Commit Changes'}
                    </button>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {Object.entries(settings).map(([group, items]) => (
                    <motion.section
                        key={group}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="enterprise-card flex flex-col gap-8"
                    >
                        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                            <div className="flex items-center gap-3 text-emerald-500">
                                {groupIcons[group] || <ShieldAlert size={14} />}
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{group.charAt(0).toUpperCase() + group.slice(1)} Protocols</h3>
                            </div>
                            <Activity size={12} className="text-slate-700" />
                        </div>

                        <div className="space-y-8">
                            {items.map(item => (
                                <div key={item.setting_key} className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <label className="label-industrial text-white/80">
                                            {item.setting_key.replace(/_/g, ' ')}
                                        </label>
                                        <div className="w-1.5 h-1.5 bg-[#334155]"></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                                        {item.description}
                                    </p>
                                    <div className="relative group/input">
                                        <input
                                            type="text"
                                            value={item.setting_value}
                                            onChange={(e) => handleUpdate(group, item.setting_key, e.target.value)}
                                            className="w-full bg-[#010409] border border-[#334155] text-slate-400 px-4 py-3 text-xs font-mono focus:border-emerald-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-800"
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </div>

            {/* Footer Diagnostic */}
            <div className="p-4 border border-[#334155] bg-[#020617]/50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Config Hash: 0x3A2B...F1E</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-mono font-bold uppercase tracking-tighter">
                    <span className="text-slate-600">Access Trace:</span>
                    <span className="text-emerald-500/70 underline">SECURE_TUNNEL_ESTABLISHED</span>
                </div>
            </div>
        </div>
    );
};

export default Settings;
