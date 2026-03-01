import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Shield, UserX, UserCheck, Mail, Filter, Terminal, Activity, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';

const Users = () => {
    const { admin } = useAdminAuth();
    const [users, setUsers] = useState([]);
    const [mosques, setMosques] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUsers = () => {
        setLoading(true);
        fetch(`http://localhost/AKM.2.0/api/admin/users.php?search=${searchTerm}&adminId=${admin?.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUsers(data.users);
                }
                setLoading(false);
            });
    };

    const fetchMosques = () => {
        fetch(`http://localhost/AKM.2.0/api/admin/mosques.php`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMosques(data.mosques);
                }
            });
    };

    useEffect(() => {
        fetchMosques();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const handleAction = async (userId, action, value) => {
        try {
            const payload = { userId, action, [action]: value };
            if (action === 'assign_mosque') {
                payload.mosqueId = value;
            }

            const response = await fetch('http://localhost/AKM.2.0/api/admin/users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Action error:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header / Search Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Personnel Directory</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Management level: System Admin</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group/input w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH BY UID / EMAIL / HASH..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#010409] border border-[#334155] text-slate-300 pl-12 pr-4 py-2.5 text-xs focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-mono"
                        />
                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                    </div>
                    <button className="p-2.5 border border-[#334155] bg-[#1e293b] text-slate-400 hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Industrial Table */}
            <div className="enterprise-card p-0 overflow-hidden border-[#334155]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                        <thead>
                            <tr className="bg-[#020617] border-b border-[#334155]">
                                <th className="px-6 py-4 label-industrial">Identity Hash / Contact</th>
                                <th className="px-6 py-4 label-industrial">Node Assignment</th>
                                <th className="px-6 py-4 label-industrial">Access Level</th>
                                <th className="px-6 py-4 label-industrial">Terminal Status</th>
                                <th className="px-6 py-4 label-industrial">Registry Date</th>
                                <th className="px-6 py-4 label-industrial text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#334155]">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-[#0f172a] animate-pulse">
                                        Querying database logs...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-[#0f172a]">
                                        NO DATA MATCHES SEARCH QUERY
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-[#1e293b]/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 border border-[#334155] bg-[#020617] flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-500">{u.username[0].toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">@{u.username}</div>
                                                    <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter flex items-center gap-2">
                                                        <Mail size={10} /> {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group/select max-w-[180px]">
                                                <MapPin size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 group-hover/select:text-emerald-500 transition-colors" />
                                                <select
                                                    value={u.managed_mosque_id || ""}
                                                    onChange={(e) => handleAction(u.id, 'assign_mosque', e.target.value || null)}
                                                    className="w-full bg-[#010409] border border-[#334155] text-[10px] text-slate-400 pl-7 pr-4 py-1.5 font-bold uppercase tracking-tight outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                                                >
                                                    <option value="">UNASSIGNED NODE</option>
                                                    {mosques.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                                    ▼
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[9px] font-bold border uppercase tracking-tighter ${u.role === 'superadmin' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                                                (u.role === 'admin' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' : 'border-slate-500 text-slate-500 bg-slate-500/10')
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase ${u.status === 'active' ? 'text-slate-300' : 'text-rose-500'}`}>{u.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                {new Date(u.created_at).toISOString().split('T')[0]}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {u.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleAction(u.id, 'status', 'banned')}
                                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                                        title="Revoke Access"
                                                    >
                                                        <UserX size={14} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(u.id, 'status', 'active')}
                                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
                                                        title="Reauthorize"
                                                    >
                                                        <UserCheck size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleAction(u.id, 'role', u.role === 'admin' ? 'user' : 'admin')}
                                                    className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center"
                                                    title="Toggle Admin Privilege"
                                                >
                                                    <Shield size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-[#020617] border-t border-[#334155] flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Dataset stream finalized</span>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5 items-center">
                            <Activity size={10} className="text-emerald-500" />
                            <span className="text-[9px] font-mono font-bold text-emerald-500">SYSTEM SYNC OK</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-emerald-500"></div>
                            <div className="w-2 h-2 bg-[#1e293b]"></div>
                            <div className="w-2 h-2 bg-[#1e293b]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="flex items-center gap-3 px-6 py-3 border border-[#334155] bg-[#020617] text-slate-400 hover:text-white transition-all group">
                    <Terminal size={14} className="group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Execute Batch Reports</span>
                </button>
            </div>
        </div>
    );
};

export default Users;
