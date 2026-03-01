import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Plus,
    Trash2,
    Pencil,
    Save,
    X,
    Activity,
    Cpu,
    Terminal,
    Zap,
    Heart,
    Share2,
    CalendarCheck,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useAdminAuth } from '../context/AdminAuthContext';

const api = axios.create({
    baseURL: 'http://localhost/AKM.2.0',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});

const DailyMissions = () => {
    const { admin } = useAdminAuth();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMission, setEditingMission] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        action_type: 'prayer_aamiin',
        target_count: 5,
        xp_reward: 50,
        icon: 'Target'
    });

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin_missions.php?admin_id=${admin.id}`);
            if (res.data.success) {
                setMissions(res.data.missions || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, admin_id: admin.id };
            let res;
            if (editingMission) {
                res = await api.put('/api/admin_missions.php', { ...payload, id: editingMission.id });
            } else {
                res = await api.post('/api/admin_missions.php', payload);
            }

            if (res.data.success) {
                setShowForm(false);
                setEditingMission(null);
                setFormData({ title: '', description: '', action_type: 'prayer_aamiin', target_count: 5, xp_reward: 50, icon: 'Target' });
                fetchMissions();
            } else {
                alert('Error: ' + res.data.error);
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to save mission.');
        }
    };

    const deleteMission = async (id) => {
        if (!window.confirm('CRITICAL: PURGE MISSION DATA? This will reset all user progress for this mission.')) return;
        try {
            const res = await api.delete(`/api/admin_missions.php?admin_id=${admin.id}&id=${id}`);
            if (res.data.success) fetchMissions();
        } catch (err) {
            alert('Delete failed.');
        }
    };

    const handleEdit = (m) => {
        setEditingMission(m);
        setFormData({
            title: m.title,
            description: m.description,
            action_type: m.action_type,
            target_count: m.target_count,
            xp_reward: m.xp_reward,
            icon: m.icon
        });
        setShowForm(true);
    };

    const getIconComponent = (name) => {
        switch (name) {
            case 'Heart': return <Heart size={20} />;
            case 'Share2': return <Share2 size={20} />;
            case 'CalendarCheck': return <CalendarCheck size={20} />;
            case 'MessageSquare': return <MessageSquare size={20} />;
            default: return <Target size={20} />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Daily Mission Matrix</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Registry: Engagement Loop Controller v1.0</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingMission(null);
                        setFormData({ title: '', description: '', action_type: 'prayer_aamiin', target_count: 5, xp_reward: 50, icon: 'Target' });
                    }}
                    className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                >
                    <Plus size={16} /> Deploy New Mission
                </button>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-[#0f172a] border border-[#334155] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-1 bg-emerald-500 opacity-50"></div>

                            <div className="px-10 py-6 border-b border-[#334155] flex justify-between items-center bg-[#020617]/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 border border-emerald-500 flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                                            {editingMission ? 'Reconfigure Mission' : 'Mission Deployment'}
                                        </h3>
                                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Protocol: Engagement Data Entry</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 border border-[#334155] bg-[#1e293b] text-slate-500 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="label-industrial">Mission Identifier (Title)</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-base font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        placeholder="MISSION_ENTRY_ID"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="label-industrial">Objective Params (Description)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-sm font-mono outline-none focus:border-emerald-500/50 transition-all min-h-[80px]"
                                        placeholder="Detailed objective description..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label-industrial">Action Trigger</label>
                                        <select
                                            value={formData.action_type}
                                            onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                                            className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        >
                                            <option value="prayer_aamiin">prayer_aamiin</option>
                                            <option value="share">share</option>
                                            <option value="check_in">check_in</option>
                                            <option value="ai_talk">ai_talk</option>
                                            <option value="donation">donation</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-industrial">Visual Token (Icon)</label>
                                        <select
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        >
                                            <option value="Target">Target (Piala)</option>
                                            <option value="Heart">Heart (Doa)</option>
                                            <option value="Share2">Share2 (Bagikan)</option>
                                            <option value="CalendarCheck">CalendarCheck (Hadir)</option>
                                            <option value="MessageSquare">MessageSquare (AI)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label-industrial">Quota (Target Count)</label>
                                        <input
                                            type="number"
                                            value={formData.target_count}
                                            onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })}
                                            className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-base font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-industrial">Credit Reward (XP)</label>
                                        <input
                                            type="number"
                                            value={formData.xp_reward}
                                            onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                                            className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-base font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 border-t border-[#334155] bg-[#020617]/80 flex justify-end gap-6">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border border-[#334155] hover:bg-[#1e293b] hover:text-white transition-all outline-none"
                                >
                                    Abort_Entry
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-12 py-3 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-4 bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                >
                                    <Save size={18} /> Commit_Mission
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* List View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-24 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                        <Cpu size={40} className="text-emerald-500 mb-6 animate-pulse opacity-20" />
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Registry Matrix...</h3>
                    </div>
                ) : missions.length === 0 ? (
                    <div className="col-span-full py-24 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={40} className="text-slate-700 mb-6" />
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Active Missions Found</h3>
                    </div>
                ) : (
                    missions.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enterprise-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 border border-emerald-500 bg-[#020617] text-emerald-500 flex items-center justify-center shrink-0">
                                    {getIconComponent(m.icon)}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(m)}
                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteMission(m.id)}
                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-2">
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors truncate">{m.title}</h4>
                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter line-clamp-2 min-h-[30px]">{m.description}</p>
                            </div>

                            <div className="pt-4 border-t border-[#334155]/30 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Target</p>
                                    <p className="text-xs font-bold text-white font-mono">{m.target_count} <span className="opacity-50 text-[10px]">OPS</span></p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">XP_Credit</p>
                                    <p className="text-xs font-bold text-emerald-500 font-mono">+{m.xp_reward}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#334155]/30">
                                <div className="flex items-center gap-2">
                                    <Zap size={10} className="text-emerald-500" />
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">Trigger: {m.action_type}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="flex justify-end p-4 border border-[#334155] bg-[#020617]/50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Mission Engine Online</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-[#334155] pl-6">
                        <Terminal size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Live Registry: {missions.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyMissions;
