import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, Trash2, Send, Clock, X, Terminal, Activity, Cpu, Megaphone, LayoutGrid, List } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const Broadcasts = () => {
    const { admin } = useAdminAuth();
    const [broadcasts, setBroadcasts] = useState([]);
    const [mosques, setMosques] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newBroadcast, setNewBroadcast] = useState({ title: '', content: '', media_url: '' });
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        if (admin?.role === 'superadmin') {
            fetchAllMosques();
            if (!admin.managed_mosque_id) {
                setLoading(false);
            }
        }
        if (admin?.managed_mosque_id) {
            setSelectedId(admin.managed_mosque_id);
            fetchBroadcasts(admin.managed_mosque_id);
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

    const fetchBroadcasts = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin/broadcasts.php?mosqueId=${id}`);
            const data = await res.json();
            if (data.success) {
                setBroadcasts(data.broadcasts || []);
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
            const res = await fetch('http://localhost/AKM.2.0/api/admin/broadcasts.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newBroadcast,
                    mosqueId: selectedId,
                    action: 'create'
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowNewModal(false);
                setNewBroadcast({ title: '', content: '', media_url: '' });
                fetchBroadcasts(selectedId);
            }
        } catch (err) {
            console.error('Submission error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: PURGE BROADCAST DATA?")) return;
        try {
            await fetch('http://localhost/AKM.2.0/api/admin/broadcasts.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    mosqueId: selectedId,
                    action: 'delete'
                })
            });
            fetchBroadcasts(selectedId);
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 border border-[#334155] bg-[#020617]/50 gap-4">
            <Cpu size={24} className="text-emerald-500 animate-spin" />
            <p className="text-xs font-mono font-bold text-emerald-500/50 animate-pulse uppercase tracking-[0.2em]">SYNCHRONIZING TRANSMISSIONS...</p>
        </div>
    );

    if (!selectedId) return (
        <div className="enterprise-card border-slate-500/30 bg-slate-500/5 p-16 text-center space-y-8">
            <div className="space-y-2">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-lg">UPLINK_INITIALIZATION_REQUIRED</h3>
                <p className="text-slate-500 text-xs font-mono">No active node selected for broadcast management. Please select a node to begin transmission.</p>
            </div>

            {admin?.role === 'superadmin' && (
                <div className="max-w-md mx-auto space-y-4">
                    <select
                        onChange={(e) => {
                            setSelectedId(e.target.value);
                            fetchBroadcasts(e.target.value);
                        }}
                        className="input-obsidian text-center"
                    >
                        <option value="">SELECT NODE TO BROADCAST...</option>
                        {mosques.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
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
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Youth Broadcast Engine</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Transmission: Localized Node Overlays</p>
                </div>

                <div className="flex items-center gap-4">
                    {admin?.role === 'superadmin' && (
                        <div className="flex items-center gap-2 border border-[#334155] bg-[#010409] p-1 px-3">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Switch_Node:</span>
                            <select
                                value={selectedId || ''}
                                onChange={(e) => {
                                    setSelectedId(e.target.value);
                                    fetchBroadcasts(e.target.value);
                                }}
                                className="bg-transparent border-none text-[10px] font-mono text-emerald-500 font-bold outline-none cursor-pointer"
                            >
                                <option value="" className="bg-[#0f172a]">SELECT NODE...</option>
                                {mosques.map(m => (
                                    <option key={m.id} value={m.id} className="bg-[#0f172a]">{m.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex bg-[#010409] border border-[#334155] p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#1e293b] text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 ${viewMode === 'list' ? 'bg-[#1e293b] text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                            <List size={14} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <Plus size={16} /> New Broadcast
                    </button>
                </div>
            </div>

            {/* List/Grid Content Area */}
            {broadcasts.length === 0 ? (
                <div className="py-24 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                    <Radio size={40} className="text-slate-700 mb-6" />
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Active Broadcasts Detected</h3>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                    {broadcasts.map(b => (
                        <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`enterprise-card group ${viewMode === 'list' ? 'flex items-center gap-6 py-4' : ''}`}
                        >
                            <div className={`shrink-0 w-12 h-12 border border-[#334155] bg-[#020617] flex items-center justify-center text-emerald-500 ${viewMode === 'list' ? '' : 'mb-6'}`}>
                                <Megaphone size={18} />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">
                                            {b.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 mb-2">
                                            <Clock size={10} />
                                            <span>{new Date(b.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {!viewMode === 'list' && (
                                        <button
                                            onClick={() => handleDelete(b.id)}
                                            className="p-1.5 border border-[#334155] text-slate-600 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>

                                <p className={`text-[11px] text-slate-400 leading-relaxed line-clamp-2 ${viewMode === 'list' ? 'hidden md:block' : ''}`}>
                                    {b.content}
                                </p>
                            </div>

                            {viewMode === 'list' && (
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="p-3 border border-[#334155] text-slate-600 hover:bg-rose-500 hover:text-white transition-all shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            {viewMode === 'grid' && (
                                <div className="pt-6 border-t border-[#334155] mt-auto">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-slate-500 uppercase tracking-tighter">Status: Transmitting</span>
                                        <span className="text-emerald-500 font-bold uppercase">Active</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Industrial Modal */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewModal(false)}
                            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-[#0f172a] border border-[#334155] p-10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-50"></div>

                            <div className="mb-10 flex justify-between items-end border-b border-[#334155] pb-6">
                                <div>
                                    <span className="label-industrial mb-1 italic text-emerald-500">Transmission Buffer</span>
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Compose Broadcast</h3>
                                </div>
                                <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="label-industrial">Subject (Title)</label>
                                    <div className="relative group/input">
                                        <input
                                            placeholder="e.g. YOUTH_SUMMIT_2026_REMINDER"
                                            required
                                            value={newBroadcast.title}
                                            onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                                            className="input-obsidian"
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-industrial">Transmission Payload (Content)</label>
                                    <div className="relative group/input">
                                        <textarea
                                            placeholder="Enter message content for the community..."
                                            required
                                            value={newBroadcast.content}
                                            onChange={e => setNewBroadcast({ ...newBroadcast, content: e.target.value })}
                                            className="input-obsidian min-h-[120px]"
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewModal(false)}
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border border-[#334155] hover:bg-[#1e293b] hover:text-white transition-all outline-none"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    >
                                        Transmit_ALL
                                    </button>
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
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Uplink Stable</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-[#334155] pl-6">
                        <Terminal size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Load: {broadcasts.length} Packets</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Broadcasts;
