import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ShieldAlert, Globe, Database, Terminal, Activity, Eye, EyeOff, Key, Cpu, Zap } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const SENSITIVE_KEYS = ['secret', 'key', 'token', 'password', 'api_key', 'api_secret', 'server_key', 'client_key'];

const isSensitive = (key) =>
    SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s));

const SettingInput = ({ item, group, onUpdate }) => {
    const [visible, setVisible] = useState(false);
    const sensitive = isSensitive(item.setting_key);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-start">
                <label className="label-industrial text-white/80 flex items-center gap-2">
                    {sensitive && <Key size={10} className="text-amber-500" />}
                    {item.setting_key.replace(/_/g, ' ')}
                </label>
                <div className="w-1.5 h-1.5 bg-[#334155]"></div>
            </div>
            {item.description && (
                <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                    {item.description}
                </p>
            )}
            <div className="relative group/input">
                <input
                    type={sensitive && !visible ? 'password' : 'text'}
                    value={item.setting_value || ''}
                    onChange={(e) => onUpdate(group, item.setting_key, e.target.value)}
                    placeholder={sensitive ? '••••••••••••••••' : ''}
                    className="w-full bg-[#010409] border border-[#334155] text-slate-400 px-4 py-3 text-xs font-mono focus:border-emerald-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-800 pr-10"
                />
                {sensitive && (
                    <button
                        type="button"
                        onClick={() => setVisible(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
            </div>
        </div>
    );
};

const groupConfig = {
    ai:           { icon: <Cpu size={14} />,       label: 'AI Protocols' },
    whatsapp:     { icon: <Globe size={14} />,      label: 'WhatsApp Gateway' },
    payment:      { icon: <Database size={14} />,   label: 'Payment Integration' },
    integrations: { icon: <Zap size={14} />,        label: 'External Integrations' },
    cloudinary:   { icon: <Zap size={14} />,        label: 'Cloudinary CDN' },
    pusher:       { icon: <Activity size={14} />,   label: 'Pusher Realtime' },
    general:      { icon: <ShieldAlert size={14} />, label: 'General Config' },
};

const Settings = () => {
    const { admin } = useAdminAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/settings.php', {
                headers: admin?.id ? { 'X-Admin-ID': String(admin.id) } : {}
            });
            const data = await res.json();
            if (data.settings) setSettings(data.settings);
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
                body: JSON.stringify({ settings: payload, user_id: admin.id })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            setTimeout(() => setMessage(''), 3000);
        } catch {
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">System Configuration</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Registry: Global Matrix · API Keys are masked by default</p>
                </div>
                <div className="flex items-center gap-4">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest ${message.toLowerCase().includes('success')
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                                : 'border-rose-500/50 bg-rose-500/10 text-rose-500'}`}
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

            {/* Settings Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {Object.entries(settings).map(([group, items]) => {
                    const cfg = groupConfig[group] || { icon: <ShieldAlert size={14} />, label: group.charAt(0).toUpperCase() + group.slice(1) };
                    return (
                        <motion.section
                            key={group}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="enterprise-card flex flex-col gap-8"
                        >
                            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                                <div className="flex items-center gap-3 text-emerald-500">
                                    {cfg.icon}
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{cfg.label}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {items.some(i => isSensitive(i.setting_key)) && (
                                        <span className="text-[9px] font-mono text-amber-500/70 uppercase tracking-widest flex items-center gap-1">
                                            <Key size={9} /> Contains secrets
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8">
                                {items.map(item => (
                                    <SettingInput
                                        key={item.setting_key}
                                        item={item}
                                        group={group}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </div>
                        </motion.section>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border border-[#334155] bg-[#020617]/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-slate-500" />
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Config Hash: 0x3A2B...F1E · Sensitive fields masked</span>
                </div>
                <div className="flex items-center gap-3">
                    <Activity size={10} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">SECURE_TUNNEL_ESTABLISHED</span>
                </div>
            </div>
        </div>
    );
};

export default Settings;
