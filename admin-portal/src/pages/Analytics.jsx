import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
    Users,
    MessageSquare,
    ShieldAlert,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Zap,
    Cpu,
    Database,
    Terminal
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, trend, trendValue, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="enterprise-card flex items-center gap-6"
    >
        <div className="w-12 h-12 border border-[#334155] bg-[#020617] flex items-center justify-center shrink-0" style={{ color }}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="label-industrial mb-1">{title}</p>
            <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold font-mono ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trendValue}
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

const Analytics = () => {
    const { admin } = useAdminAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mosqueId = admin?.role === 'admin' ? admin.managed_mosque_id : '';
        fetch(`http://localhost/AKM.2.0/api/admin/analytics.php?mosqueId=${mosqueId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Analytics fetch error:", err);
                setLoading(false);
            });
    }, [admin]);

    if (loading) return (
        <div className="flex items-center justify-center h-64 border border-[#334155] bg-[#020617]/50">
            <p className="text-xs font-mono font-bold text-slate-500 animate-pulse uppercase tracking-[0.2em]">Initializing Data Stream...</p>
        </div>
    );

    if (!stats) return (
        <div className="p-8 border border-rose-500/30 bg-rose-500/5 text-rose-500 flex flex-col items-center gap-4">
            <ShieldAlert size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Core Data Link Failed</p>
        </div>
    );

    const summary = stats.summary;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#334155] pb-6">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">System Overview</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Real-time engagement telemetry</p>
                </div>
                <div className="flex items-center gap-4 bg-[#020617] p-2 border border-[#334155]">
                    <Activity size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-tighter">Live Monitor Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Registered Users"
                    value={summary.totalUsers}
                    icon={<Users size={20} />}
                    trend="up"
                    trendValue={`+${summary.newUsersToday}`}
                    color="#10b981"
                    delay={0.1}
                />
                <StatCard
                    title="Total Feed Interactions"
                    value={summary.totalPosts}
                    icon={<MessageSquare size={20} />}
                    trend="up"
                    trendValue={`+${summary.postsToday}`}
                    color="#10b981"
                    delay={0.2}
                />
                <StatCard
                    title="Suspicious Activity"
                    value={summary.pendingReviews}
                    icon={<ShieldAlert size={20} />}
                    trend={summary.pendingReviews > 10 ? "up" : null}
                    trendValue="CRITICAL"
                    color="#f43f5e"
                    delay={0.3}
                />
                <StatCard
                    title="API Payload Health"
                    value="98.2%"
                    icon={<Cpu size={20} />}
                    trend="up"
                    trendValue="0.4%"
                    color="#10b981"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-12 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="col-span-12 lg:col-span-8 enterprise-card"
                >
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <span className="label-industrial mb-1">Engagement Analysis</span>
                            <h4 className="text-lg font-bold text-white uppercase tracking-tight">Activity Delta (24H)</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500"></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Input</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-[#334155]"></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Baseline</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trends}>
                                <defs>
                                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#334155" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: '700', fontFamily: 'IBM Plex Mono' }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: '700', fontFamily: 'IBM Plex Mono' }}
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#020617',
                                        border: '1px solid #334155',
                                        borderRadius: '0px',
                                        padding: '12px',
                                        boxShadow: 'none'
                                    }}
                                    itemStyle={{ color: '#10b981', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}
                                    cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="posts"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPosts)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="col-span-12 lg:col-span-4 space-y-6"
                >
                    <div className="enterprise-card bg-[#020617]">
                        <div className="flex items-center gap-3 mb-8">
                            <Zap size={14} className="text-emerald-500" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Active Protocols</h4>
                        </div>

                        <div className="space-y-1">
                            {[
                                { label: 'Moderate Flagged Content', count: summary.pendingReviews, severity: summary.pendingReviews > 0 ? 'high' : 'low' },
                                { label: 'Review User Admin Requests', count: 4, severity: 'med' },
                                { label: 'API Security Audit', status: 'Healthy', severity: 'low' },
                                { label: 'Database Structural Check', status: 'Clean', severity: 'low' }
                            ].map((action, idx) => (
                                <div key={idx} className="p-4 border border-[#334155] bg-[#0f172a] hover:bg-[#1e293b] transition-all cursor-pointer flex justify-between items-center group">
                                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
                                    <span className={`text-[9px] font-mono font-bold px-3 py-1 border ${action.severity === 'high' ? 'border-rose-500/50 text-rose-500 bg-rose-500/10' :
                                        action.severity === 'med' ? 'border-amber-500/50 text-amber-500 bg-amber-500/10' :
                                            'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                                        }`}>
                                        {action.count !== undefined ? action.count : action.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="w-full bg-[#1e293b] border border-[#334155] hover:bg-[#334155] text-white py-4 font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group">
                        <Terminal size={14} className="text-slate-500 group-hover:text-emerald-500 transition-colors" />
                        Execute Full System Audit
                    </button>

                    <div className="p-4 border border-[#334155] bg-[#020617] flex items-center gap-4">
                        <Database size={16} className="text-slate-500" />
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Database Snapshot</p>
                            <p className="text-[10px] font-mono font-bold text-white uppercase italic">Last Sync: T-04:22:01</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
