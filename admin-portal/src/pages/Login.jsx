import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, User, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAdminAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="h-screen flex bg-[#0f172a] font-sans overflow-hidden">
            {/* Left Side - Industrial Branding */}
            <div className="flex-[1.5] relative hidden lg:flex flex-col justify-center p-20 border-r border-[#334155] bg-[#020617]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent opacity-50"></div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="w-16 h-16 border border-emerald-500 flex items-center justify-center mb-12">
                        <ShieldCheck size={32} className="text-emerald-500" />
                    </div>

                    <h1 className="text-5xl font-bold tracking-tighter text-white uppercase leading-none mb-6">
                        AKM Enterprise <br />
                        <span className="text-emerald-500">Core OS v2.0</span>
                    </h1>

                    <div className="space-y-4 max-w-md">
                        <p className="text-sm text-slate-400 font-medium leading-relaxed italic border-l-2 border-[#334155] pl-6">
                            Sistem kendali terpusat untuk modernisasi manajemen masjid. Performa tinggi, keamanan tingkat enterprise, dan integritas data maksimal.
                        </p>

                        <div className="flex items-center gap-6 mt-12 py-6 border-y border-[#334155]">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500"></span> ONLINE
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Enc</p>
                                <p className="text-xs font-mono font-bold text-slate-300">AES-256-GCM</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reg</p>
                                <p className="text-xs font-mono font-bold text-slate-300">SEA-CENTRAL-1</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="absolute bottom-12 left-20">
                    <p className="text-[10px] font-mono font-bold text-slate-600 tracking-tighter">
                        TERMINAL ACCESS :: 0x7FFD2B1A90
                    </p>
                </div>
            </div>

            {/* Right Side - Authentication Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#0f172a]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-12">
                        <span className="label-industrial mb-2 italic">Authentication Required</span>
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Operator Login</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="label-industrial">Credential ID</label>
                            <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors">
                                    <User size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="w-full bg-[#010409] border border-[#334155] text-slate-300 pl-12 pr-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-mono"
                                    required
                                />
                                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="label-industrial">Security Pass-key</label>
                            <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#010409] border border-[#334155] text-slate-300 pl-12 pr-4 py-3 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-mono"
                                    required
                                />
                                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/50 flex items-center gap-3">
                                <Activity size={16} className="text-rose-500" />
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-4 font-bold text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {loading ? 'Authorizing...' : 'Initialize Session'}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-[#334155]">
                        <div className="flex justify-between items-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                            <span>System Integrity</span>
                            <span className="text-emerald-500/50">Verified</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
