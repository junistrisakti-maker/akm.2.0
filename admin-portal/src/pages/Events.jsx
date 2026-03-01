import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Edit2, Trash2, Eye, EyeOff, Search, X, Check, Clock, Terminal, Activity, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';

const Events = () => {
    const { admin } = useAdminAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const adminId = admin?.id;

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin/events.php?admin_id=${adminId}`);
            const data = await res.json();
            if (data.success) {
                setEvents(data.events);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleToggleStatus = async (eventId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/admin/events.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_status', eventId, status: newStatus, admin_id: adminId })
            });
            if (res.ok) {
                fetchEvents();
            }
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: AUTHORIZE EVENT DELETION?")) return;
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/admin/events.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, admin_id: adminId })
            });
            if (res.ok) {
                fetchEvents();
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/admin/events.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingEvent, admin_id: adminId })
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchEvents();
            }
        } catch (err) {
            console.error("Update error:", err);
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.mosque_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Event Registry</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Status: Active Monitor</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group/input w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="FILTER BY EVENT / MOSQUE / UID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#010409] border border-[#334155] text-slate-300 pl-12 pr-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-mono"
                        />
                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95">
                        <Plus size={16} /> New Entry
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div className="enterprise-card p-0 overflow-hidden border-[#334155]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                        <thead>
                            <tr className="bg-[#020617] border-b border-[#334155]">
                                <th className="px-6 py-4 label-industrial">Payload Details</th>
                                <th className="px-6 py-4 label-industrial">Node Association</th>
                                <th className="px-6 py-4 label-industrial">Execution Schedule</th>
                                <th className="px-6 py-4 label-industrial">Channel Status</th>
                                <th className="px-6 py-4 label-industrial text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#334155]">
                            {loading && events.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-[#0f172a] animate-pulse">
                                        Initializing event packets...
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-[#0f172a]">
                                        QUERY RETURNED NULL DATA
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((e) => (
                                    <tr key={e.id} className="hover:bg-[#1e293b]/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 border border-[#334155] bg-[#020617] overflow-hidden grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100 flex items-center justify-center">
                                                    {e.image ? (
                                                        <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Calendar size={20} className="text-slate-700" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{e.title}</div>
                                                    <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter italic border-l border-[#334155] pl-2">{e.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[180px]">{e.mosque_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-white uppercase tracking-tight">{new Date(e.date).toISOString().split('T')[0]}</div>
                                            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter flex items-center gap-1.5">
                                                <Clock size={10} /> {e.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(e.id, e.status)}
                                                className={`px-3 py-1.5 text-[9px] font-bold border uppercase tracking-widest flex items-center gap-2 transition-all ${e.status === 'active' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'border-slate-500/50 text-slate-500 bg-slate-500/10 opacity-50'
                                                    }`}
                                            >
                                                <div className={`w-1 h-1 ${e.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                                {e.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingEvent(e); setIsEditModalOpen(true); }}
                                                    className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-400 hover:text-white transition-all flex items-center justify-center"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(e.id)}
                                                    className="w-8 h-8 border border-[#334155] bg-[#020617] text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-[#020617] border-t border-[#334155] flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase">
                    <div className="flex items-center gap-4">
                        <span>Total Records: {filteredEvents.length}</span>
                        <span className="border-l border-[#334155] pl-4 italic">Filter: {searchTerm || 'NONE'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-emerald-500 font-bold uppercase">H_UPLINK_STABLE</span>
                    </div>
                </div>
            </div>

            {/* Edit Modal - Overhauled for Slate Aesthetic */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-xl bg-[#0f172a] border border-[#334155] p-10 overflow-hidden"
                        >
                            {/* Decorative banner */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-50"></div>

                            <div className="mb-10 flex justify-between items-end border-b border-[#334155] pb-6">
                                <div>
                                    <span className="label-industrial mb-1 italic text-emerald-500">Kernel: Override Mode</span>
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Edit Event Payload</h3>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="label-industrial">Event Descriptor (Title)</label>
                                    <div className="relative group/input">
                                        <input
                                            type="text"
                                            value={editingEvent.title}
                                            onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                            className="w-full bg-[#010409] border border-[#334155] text-slate-300 px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all font-mono"
                                            required
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="label-industrial">Execution Date</label>
                                        <div className="relative group/input">
                                            <input
                                                type="date"
                                                value={editingEvent.date}
                                                onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                                                className="w-full bg-[#010409] border border-[#334155] text-slate-300 px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all font-mono [color-scheme:dark]"
                                                required
                                            />
                                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="label-industrial">Execution Time</label>
                                        <div className="relative group/input">
                                            <input
                                                type="time"
                                                value={editingEvent.time}
                                                onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
                                                className="w-full bg-[#010409] border border-[#334155] text-slate-300 px-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all font-mono [color-scheme:dark]"
                                                required
                                            />
                                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-industrial">Classification Category</label>
                                    <select
                                        value={editingEvent.category}
                                        onChange={e => setEditingEvent({ ...editingEvent, category: e.target.value })}
                                        className="w-full bg-[#020617] border border-[#334155] text-slate-200 px-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all font-mono appearance-none"
                                    >
                                        {['Kajian', 'Volunteer', 'Social', 'Sport'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border border-[#334155] hover:bg-[#1e293b] hover:text-white transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    >
                                        Commit Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Events;
