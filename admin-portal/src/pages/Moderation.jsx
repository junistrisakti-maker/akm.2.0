import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, AlertTriangle, Clock, Shield, ExternalLink, MessageSquare, Terminal, Filter } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Moderation = () => {
    const { admin } = useAdminAuth();
    const [activeTab, setActiveTab] = useState('content'); // 'content' or 'admin_requests'
    const [reviews, setReviews] = useState([]);
    const [adminRequests, setAdminRequests] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);

    const fetchReviews = () => {
        setLoading(true);
        fetch(`http://localhost/AKM.2.0/api/admin/moderation.php?type=${filter}&admin_id=${admin?.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setReviews(data.reviews);
                }
                setLoading(false);
            });
    };

    const fetchAdminRequests = () => {
        setLoading(true);
        fetch(`http://localhost/AKM.2.0/api/requests.php?status=${filter}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAdminRequests(data.requests);
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        if (activeTab === 'content') {
            fetchReviews();
        } else {
            fetchAdminRequests();
        }
    }, [filter, activeTab]);

    const handleAction = async (reviewId, postId, action) => {
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/admin/moderation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, postId, action, admin_id: admin?.id })
            });
            if (response.ok) {
                fetchReviews();
            }
        } catch (error) {
            console.error("Moderation action error:", error);
        }
    };

    const handleAdminRequestAction = async (requestId, status) => {
        const note = prompt(`Enter note for ${status}:`);
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/requests.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'review',
                    requestId,
                    status,
                    note,
                    adminId: admin?.id
                })
            });
            if (response.ok) {
                fetchAdminRequests();
            }
        } catch (error) {
            console.error("Admin request action error:", error);
        }
    };

    return (
        <div className="space-y-8 min-h-full">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div className="flex items-center gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Access & Content</h2>
                        <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Moderation Control Panel</p>
                    </div>

                    <div className="flex bg-[#020617] border border-[#334155] p-1">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Payload Queue
                        </button>
                        <button
                            onClick={() => setActiveTab('admin_requests')}
                            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'admin_requests' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Admin Requests
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-[#010409] border border-[#334155]">
                        <Filter size={12} className="text-slate-500" />
                        <div className="flex gap-1">
                            {['pending', 'approved', 'rejected'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all ${filter === t ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-[#1e293b]'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => activeTab === 'content' ? fetchReviews() : fetchAdminRequests()} className="p-2 border border-[#334155] bg-[#1e293b] text-slate-400 hover:text-white transition-colors">
                        <Clock size={16} />
                    </button>
                </div>
            </div>

            {/* Queue Area */}
            {activeTab === 'content' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.length === 0 && !loading && (
                        <div className="col-span-full py-20 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                            <CheckCircle size={40} className="text-emerald-500 mb-6 opacity-20" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Buffer Clean</h3>
                            <p className="text-[10px] font-mono text-slate-600 mt-2">NO PENDING PAYLOADS DETECTED</p>
                        </div>
                    )}

                    {reviews.map((r) => (
                        <motion.div
                            key={r.review_id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enterprise-card flex flex-col p-0 overflow-hidden group hover:border-slate-400 transition-colors"
                        >
                            <div className="relative aspect-video bg-[#020617] border-b border-[#334155]">
                                {r.post_type === 'image' ? (
                                    <img src={r.media_url} alt="Review payload" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100" />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                                        <Activity size={32} />
                                        <span className="text-[9px] font-mono font-bold uppercase">Binary Feed Stream</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <div className="p-2 bg-[#020617]/90 border border-[#334155] flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 ${r.confidence_score > 0.8 ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                        <span className="text-[9px] font-mono font-bold text-white">SCORE: {Math.round(r.confidence_score * 100)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 space-y-4">
                                <div className="flex items-center gap-3 py-1 border-b border-[#334155]/50">
                                    <AlertTriangle size={12} className="text-rose-500" />
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{r.reason}</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                                    "{r.content || 'System Note: Null payload content'}"
                                </p>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border border-[#334155] bg-[#020617] flex items-center justify-center">
                                            <User size={10} className="text-slate-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">@{r.username}</span>
                                    </div>
                                    <button className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-2 uppercase tracking-tighter underline underline-offset-4">
                                        <Eye size={12} /> Trace Origin
                                    </button>
                                </div>
                            </div>

                            {filter === 'pending' && (
                                <div className="flex border-t border-[#334155]">
                                    <button
                                        onClick={() => handleAction(r.review_id, r.post_id, 'reject')}
                                        className="flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/10 border-r border-[#334155] transition-colors"
                                    >
                                        Drop Payload
                                    </button>
                                    <button
                                        onClick={() => handleAction(r.review_id, r.post_id, 'approve')}
                                        className="flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                    >
                                        Authorize
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="enterprise-card p-0 overflow-hidden border-[#334155]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono">
                            <thead>
                                <tr className="bg-[#020617] border-b border-[#334155]">
                                    <th className="px-6 py-4 label-industrial">Identity Hash</th>
                                    <th className="px-6 py-4 label-industrial">Assigned Node (Mosque)</th>
                                    <th className="px-6 py-4 label-industrial">Verification Docs</th>
                                    <th className="px-6 py-4 label-industrial">Terminal Status</th>
                                    {filter === 'pending' && <th className="px-6 py-4 label-industrial text-right">Operations</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#334155]">
                                {adminRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-[#0f172a]">
                                            No active applicant requests detected in stream
                                        </td>
                                    </tr>
                                )}
                                {adminRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-[#1e293b]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-bold text-white uppercase">@{req.username}</div>
                                            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">TIMESTAMP: {new Date(req.created_at).toISOString().split('T')[0]}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{req.mosque_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={req.document_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-500 flex items-center gap-2 hover:underline">
                                                <ExternalLink size={12} /> BLOB_LINK.PDF
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[9px] font-bold border uppercase tracking-tighter ${req.status === 'approved' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' :
                                                (req.status === 'rejected' ? 'border-rose-500/50 text-rose-500 bg-rose-500/10' : 'border-slate-500/50 text-slate-500 bg-slate-500/10')
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        {filter === 'pending' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleAdminRequestAction(req.id, 'rejected')} className="w-8 h-8 border border-[#334155] bg-[#020617] text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                                                        <XCircle size={16} />
                                                    </button>
                                                    <button onClick={() => handleAdminRequestAction(req.id, 'approved')} className="w-8 h-8 border border-[#334155] bg-[#020617] text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-[#020617] border-t border-[#334155] flex justify-between items-center">
                        <span className="text-[9px] font-mono text-slate-600 uppercase">End of binary stream</span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-[#334155]"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500/50"></div>
                            <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Moderation;
