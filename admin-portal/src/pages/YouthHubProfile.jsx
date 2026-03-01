import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, MapPin, Globe, Layout, Cpu, Activity, Terminal, Instagram, Zap, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const YouthHubProfile = () => {
    const { admin } = useAdminAuth();
    const [hub, setHub] = useState(null);
    const [mosques, setMosques] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (admin?.role === 'superadmin') {
            fetchAllMosques();
            if (!admin.managed_mosque_id) {
                setLoading(false);
            }
        }
        if (admin?.managed_mosque_id) {
            setSelectedId(admin.managed_mosque_id);
            fetchHubData(admin.managed_mosque_id);
        } else if (admin?.role !== 'superadmin') {
            setLoading(false);
        }
    }, [admin]);

    const fetchAllMosques = async () => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/admin/mosques.php');
            const data = await res.json();
            if (data.success) {
                setMosques(data.mosques || []);
            }
        } catch (err) {
            console.error('Fetch mosques error:', err);
        }
    };

    const fetchHubData = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin/mosques.php?id=${id}`);
            const data = await res.json();
            if (data.success) {
                setHub(data.mosque);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (field, value) => {
        setHub(prev => ({ ...prev, [field]: value }));
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/admin/mosques.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hub)
            });
            const data = await res.json();
            if (data.success) {
                setMessage('CORE_IDENTITY_SYNCHRONIZED');
            } else {
                setMessage('ERROR: ' + data.error);
            }
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('PROTOCOL_FAILURE');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 border border-[#334155] bg-[#020617]/50 gap-4">
            <Cpu size={24} className="text-emerald-500 animate-spin" />
            <p className="text-xs font-mono font-bold text-emerald-500/50 animate-pulse uppercase tracking-[0.2em]">ACCESSING NODE METADATA...</p>
        </div>
    );

    if (!hub) return (
        <div className="enterprise-card border-slate-500/30 bg-slate-500/5 p-16 text-center space-y-8">
            <div className="space-y-2">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-lg">HUB_INITIALIZATION_REQUIRED</h3>
                <p className="text-slate-500 text-xs font-mono">No managed node detected in session buffer. Please select a node to manage.</p>
            </div>

            {admin?.role === 'superadmin' && (
                <div className="max-w-md mx-auto space-y-4">
                    <select
                        onChange={(e) => fetchHubData(e.target.value)}
                        className="input-obsidian text-center"
                    >
                        <option value="">SELECT NODE TO CONFIGURE...</option>
                        {mosques.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.org_name || 'No Org'})</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Youth Hub Configuration</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Node identifier: {hub.name}</p>
                </div>

                <div className="flex items-center gap-4">
                    {admin?.role === 'superadmin' && (
                        <div className="flex items-center gap-2 border border-[#334155] bg-[#010409] p-1 px-3">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Switch_Node:</span>
                            <select
                                value={hub.id}
                                onChange={(e) => fetchHubData(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-mono text-emerald-500 font-bold outline-none cursor-pointer"
                            >
                                {mosques.map(m => (
                                    <option key={m.id} value={m.id} className="bg-[#0f172a]">{m.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest ${message.includes('ERROR') ? 'border-rose-500/50 text-rose-500' : 'border-emerald-500/50 text-emerald-500'}`}
                        >
                            {message}
                        </motion.div>
                    )}
                    <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <Save size={16} /> {saving ? 'Writing...' : 'Update Matrix'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Identity Matrix */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="enterprise-card space-y-8">
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <Zap size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Identity Matrix</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="label-industrial">Organization Name (Remaja Masjid)</label>
                                <input
                                    type="text"
                                    value={hub.org_name || ''}
                                    onChange={(e) => handleUpdate('org_name', e.target.value)}
                                    placeholder="e.g. RISMA AL-BARKAH"
                                    className="input-obsidian"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="label-industrial">Mosque Legal Name</label>
                                <input
                                    type="text"
                                    value={hub.name || ''}
                                    onChange={(e) => handleUpdate('name', e.target.value)}
                                    className="input-obsidian"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="label-industrial">Hub Vibe / Tagline</label>
                            <textarea
                                value={hub.hub_vibe || ''}
                                onChange={(e) => handleUpdate('hub_vibe', e.target.value)}
                                placeholder="A short catchphrase that defines your community focal point..."
                                className="input-obsidian min-h-[80px]"
                            />
                        </div>
                    </section>

                    <section className="enterprise-card space-y-8">
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <Globe size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Social Uplink Matrix</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="label-industrial flex items-center gap-2">
                                        <Instagram size={12} /> Instagram Handle
                                    </label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">@</span>
                                    <input
                                        type="text"
                                        value={hub.instagram_handle || ''}
                                        onChange={(e) => handleUpdate('instagram_handle', e.target.value)}
                                        className="input-obsidian pl-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="label-industrial flex items-center gap-2">
                                    <svg size={12} viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13-.09-.26-.17-.38-.26v7.34c0 1.95-.51 3.86-1.61 5.43-1.12 1.6-2.73 2.82-4.57 3.47-1.87.66-3.92.81-5.85.34-1.92-.47-3.7-1.57-4.99-3.13-1.3-1.58-2-3.64-1.99-5.71.01-2.07.75-4.11 2.08-5.67 1.33-1.56 3.14-2.6 5.1-2.95.8-.14 1.62-.19 2.43-.14v4.03c-.5-.07-1.01-.06-1.51.02-1.22.19-2.34.88-3.08 1.88-.74 1-1.05 2.27-1 3.5.05 1.25.46 2.47 1.25 3.42.79.95 1.92 1.58 3.12 1.81.71.13 1.45.1 2.15-.08 1.1-.3 2-1.04 2.58-1.98.54-.88.75-1.93.73-2.96V0z" /></svg>
                                    TikTok Handle
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">@</span>
                                    <input
                                        type="text"
                                        value={hub.tiktok_handle || ''}
                                        onChange={(e) => handleUpdate('tiktok_handle', e.target.value)}
                                        className="input-obsidian pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right: Operational Specs */}
                <div className="space-y-8">
                    <section className="enterprise-card space-y-6">
                        <div className="flex items-center gap-3 text-emerald-500 mb-2">
                            <MapPin size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Geo-fencing Specs</h3>
                        </div>

                        <div className="space-y-3">
                            <label className="label-industrial">Physical Deployment (Address)</label>
                            <textarea
                                value={hub.address || ''}
                                onChange={(e) => handleUpdate('address', e.target.value)}
                                className="input-obsidian min-h-[100px] text-[11px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="label-industrial">Latitude</label>
                                <input
                                    type="text"
                                    value={hub.latitude || ''}
                                    onChange={(e) => handleUpdate('latitude', e.target.value)}
                                    className="input-obsidian text-[11px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="label-industrial">Longitude</label>
                                <input
                                    type="text"
                                    value={hub.longitude || ''}
                                    onChange={(e) => handleUpdate('longitude', e.target.value)}
                                    className="input-obsidian text-[11px]"
                                />
                            </div>
                        </div>

                        <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-mono text-emerald-500 uppercase tracking-tight">
                            Geofencing active. Users within 500m of these coordinates will auto-connect to this hub.
                        </div>
                    </section>

                    <div className="enterprise-card bg-[#020617] border-[#334155]/30">
                        <div className="flex items-center justify-between mb-4">
                            <span className="label-industrial">Network Status</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-500 flex items-center gap-1">
                                <Activity size={10} /> SYNCED
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                                <span className="text-slate-500">Node Population</span>
                                <span className="text-white">{hub.followers_count || 0} Entities</span>
                            </div>
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                                <span className="text-slate-500">Karma Points</span>
                                <span className="text-white">{hub.points || 0} Units</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Diagnostic */}
            <div className="p-4 border border-[#334155] bg-[#020617]/50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Core_Checksum: 0xHub_{hub.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-mono font-bold uppercase tracking-tighter">
                    <span className="text-slate-600">Session Trace:</span>
                    <span className="text-emerald-500/70 underline">OPERATIONAL_READY</span>
                </div>
            </div>
        </div>
    );
};

export default YouthHubProfile;
