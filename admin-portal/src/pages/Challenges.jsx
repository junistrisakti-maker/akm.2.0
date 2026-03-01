import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Power, PowerOff, Award, Zap, Activity, Cpu, X, Terminal, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';

const Challenges = () => {
    const { admin } = useAdminAuth();
    const [challenges, setChallenges] = useState([]);
    const [mosques, setMosques] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({
        title: '',
        description: '',
        points_reward: 100,
        target_count: 40,
        period_type: 'always',
        start_date: '',
        end_date: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (admin?.role === 'superadmin') {
            fetchAllMosques();
            if (!admin.managed_mosque_id) {
                fetchChallenges(''); // Fetch global/all challenges by default
            }
        }
        if (admin?.managed_mosque_id) {
            setSelectedId(admin.managed_mosque_id);
            fetchChallenges(admin.managed_mosque_id);
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

    const fetchChallenges = (id) => {
        setLoading(true);
        const fetchId = id || '';
        fetch(`http://localhost/AKM.2.0/api/admin/challenges.php?mosqueId=${fetchId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setChallenges(data.challenges || []);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost/AKM.2.0/api/admin/challenges.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newChallenge, action: 'create', mosqueId: selectedId })
        });
        if (response.ok) {
            setShowNewModal(false);
            setNewChallenge({
                title: '',
                description: '',
                points_reward: 100,
                target_count: 40,
                period_type: 'always',
                start_date: '',
                end_date: ''
            });
            fetchChallenges(selectedId);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await fetch('http://localhost/AKM.2.0/api/admin/challenges.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus, action: 'status' })
        });
        fetchChallenges(selectedId);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: DELETE CHALLENGE PROTOCOL?")) return;
        await fetch('http://localhost/AKM.2.0/api/admin/challenges.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'delete' })
        });
        fetchChallenges(selectedId);
    };

    if (loading && !mosques.length) return (
        <div className="flex flex-col items-center justify-center h-64 border border-[#334155] bg-[#020617]/50 gap-4">
            <Cpu size={24} className="text-emerald-500 animate-spin" />
            <p className="text-xs font-mono font-bold text-emerald-500/50 animate-pulse uppercase tracking-[0.2em]">INITIALIZING_MATRIX...</p>
        </div>
    );


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Challenge Protocols</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">
                        Node: {selectedId ? mosques.find(m => m.id == selectedId)?.name || 'Local Node' : 'Global Matrix'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {admin?.role === 'superadmin' && (
                        <select
                            value={selectedId || ''}
                            onChange={(e) => {
                                setSelectedId(e.target.value);
                                fetchChallenges(e.target.value);
                            }}
                            className="bg-[#010409] border border-[#334155] text-[10px] font-mono text-emerald-500 font-bold p-2 outline-none cursor-pointer"
                        >
                            <option value="">SWITCH NODE...</option>
                            {mosques.map(m => (
                                <option key={m.id} value={m.id} className="bg-[#0f172a]">{m.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <Plus size={16} /> New Protocol
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {challenges.length === 0 ? (
                    <div className="col-span-full py-24 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                        <Radio size={40} className="text-slate-700 mb-6" />
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Challenges in this Node</h3>
                    </div>
                ) : (
                    challenges.map(c => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`enterprise-card flex flex-col gap-6 transition-all duration-300 group ${c.status === 'active' ? 'border-[#334155]' : 'border-[#334155]/20 opacity-50 grayscale'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 border border-[#334155] flex items-center justify-center shrink-0 transition-colors ${c.status === 'active' ? 'bg-[#020617] text-emerald-500' : 'bg-[#0f172a] text-slate-700'}`}>
                                    <Award size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggle(c.id, c.status)}
                                        className={`w-8 h-8 border border-[#334155] flex items-center justify-center transition-all ${c.status === 'active' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#020617] text-slate-500 hover:text-white'}`}
                                    >
                                        {c.status === 'active' ? <Power size={14} /> : <PowerOff size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{c.title}</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{c.description}</p>
                            </div>

                            <div className="pt-6 border-t border-[#334155] flex justify-between items-center text-[10px] font-mono font-bold uppercase">
                                <span className={c.period_type === 'seasonal' ? 'text-amber-500' : 'text-emerald-500'}>
                                    {c.period_type === 'seasonal' ? `ENDS: ${c.end_date}` : 'ALWAYS ACTIVE'}
                                </span>
                                <span className="text-white">+{c.points_reward} XP</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewModal(false)} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-[#0f172a] border border-[#334155] p-10">
                            <h3 className="text-xl font-bold text-white uppercase mb-8 border-b border-[#334155] pb-4">New Challenge</h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="label-industrial">Title</label>
                                    <input required value={newChallenge.title} onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} className="input-obsidian" />
                                </div>
                                <div className="space-y-2">
                                    <label className="label-industrial">Description</label>
                                    <textarea required value={newChallenge.description} onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} className="input-obsidian min-h-[100px]" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="label-industrial">Points Reward</label>
                                        <input type="number" required value={newChallenge.points_reward} onChange={e => setNewChallenge({ ...newChallenge, points_reward: e.target.value })} className="input-obsidian" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-industrial">Target Count</label>
                                        <input type="number" required value={newChallenge.target_count} onChange={e => setNewChallenge({ ...newChallenge, target_count: e.target.value })} className="input-obsidian" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="label-industrial">Period Type</label>
                                    <select value={newChallenge.period_type} onChange={e => setNewChallenge({ ...newChallenge, period_type: e.target.value })} className="input-obsidian">
                                        <option value="always">ALWAYS ACTIVE</option>
                                        <option value="seasonal">LIMITED PERIOD (SEASONAL)</option>
                                    </select>
                                </div>

                                {newChallenge.period_type === 'seasonal' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="label-industrial">Start Date</label>
                                            <input type="date" required value={newChallenge.start_date} onChange={e => setNewChallenge({ ...newChallenge, start_date: e.target.value })} className="input-obsidian" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label-industrial">End Date</label>
                                            <input type="date" required value={newChallenge.end_date} onChange={e => setNewChallenge({ ...newChallenge, end_date: e.target.value })} className="input-obsidian" />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 py-3 text-[11px] font-bold uppercase border border-[#334155] text-slate-500">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 text-[11px] font-bold uppercase bg-emerald-500 text-white">Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-end p-4 border border-[#334155] bg-[#020617]/50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Challenges;
