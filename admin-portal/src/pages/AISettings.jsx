import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Database, Terminal, Save, Activity, CheckCircle2, AlertCircle, Cpu, BarChart3 } from 'lucide-react';

const AISettings = () => {
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/admin/ai_config.php');
            const data = await response.json();
            if (data.success) {
                setApiKey(data.settings.groq_api_key || '');
                setSystemPrompt(data.settings.ai_system_prompt || '');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost/AKM.2.0/api/admin/ai_config.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groq_api_key: apiKey,
                    ai_system_prompt: systemPrompt
                })
            });
            const data = await response.json();
            if (data.success) {
                setStatus({ type: 'success', message: 'Configuration successfully updated.' });
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Failed to update configuration.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 border border-[#334155] bg-[#020617]/50">
            <p className="text-xs font-mono font-bold text-slate-500 animate-pulse uppercase tracking-[0.2em]">INITIALIZING AI_ENGINE_KERNEL...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">AI Control Center</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Registry: GROQ_LP_NETWORK</p>
                </div>

                <div className="flex items-center gap-4">
                    {status.message && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest ${status.type === 'success'
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                                : 'border-rose-500/50 bg-rose-500/10 text-rose-500'
                                }`}
                        >
                            {status.message}
                        </motion.div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <Save size={16} /> {saving ? 'Writing...' : 'Commit Protocol'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="xl:col-span-8 space-y-8">
                    <section className="enterprise-card space-y-8">
                        <div className="flex items-center gap-3 text-emerald-500 border-b border-[#334155] pb-4">
                            <Zap size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Core LLM Interface</h3>
                        </div>

                        <form className="space-y-8">
                            <div className="space-y-3">
                                <label className="label-industrial text-white/80">Groq API Gateway Key</label>
                                <div className="relative group/input">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="••••••••••••••••••••"
                                        className="w-full bg-[#010409] border border-[#334155] text-slate-400 px-4 py-3 text-xs font-mono focus:border-emerald-500/50 focus:bg-[#020617] outline-none transition-all placeholder:text-slate-800"
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                </div>
                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter italic">
                                    [AUTH_TOKEN_ACTIVE] :: Model: Llama-3.3-70b-Versatile
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="label-industrial text-white/80">System Instruction Protocol (Persona)</label>
                                    <Terminal size={12} className="text-slate-700" />
                                </div>
                                <div className="relative group/input">
                                    <textarea
                                        rows="14"
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        className="w-full bg-[#010409] border border-[#334155] text-slate-400 px-4 py-3 text-xs font-mono focus:border-emerald-500/50 focus:bg-[#020617] outline-none transition-all resize-none leading-relaxed"
                                        placeholder="Enter system prompts..."
                                    />
                                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>

                {/* Status Sidebar */}
                <div className="xl:col-span-4 space-y-8">
                    <section className="enterprise-card bg-[#020617] space-y-6">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Activity size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Live Diagnostics</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[#0f172a] p-3 border border-[#334155]">
                                <span className="text-[10px] font-mono text-slate-500">ENDPOINT_STATUS</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-500">SECURE_LINK</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#0f172a] p-3 border border-[#334155]">
                                <span className="text-[10px] font-mono text-slate-500">LATENCY_MS</span>
                                <span className="text-[10px] font-mono font-bold text-white">42ms [AVG]</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#0f172a] p-3 border border-[#334155]">
                                <span className="text-[10px] font-mono text-slate-500">TOKEN_REMAINING</span>
                                <span className="text-[10px] font-mono font-bold text-amber-500">58,402 [FREE]</span>
                            </div>
                        </div>
                    </section>

                    <section className="enterprise-card space-y-6">
                        <div className="flex items-center gap-3 text-slate-400">
                            <BarChart3 size={14} />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Temporal Analytics</h3>
                        </div>

                        <div className="h-28 flex items-end gap-1.5 pt-4">
                            {[30, 50, 85, 40, 65, 90, 45].map((val, i) => (
                                <div key={i} className="flex-1 bg-[#334155] relative group" style={{ height: `${val}%` }}>
                                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500 transition-all cursor-pointer"></div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] font-mono text-center text-slate-600 uppercase tracking-widest pt-2">Cycle Load: Last 7 Days</p>
                    </section>

                    <div className="p-5 border border-[#334155] bg-[#020617]/50 flex items-center gap-4">
                        <Cpu size={18} className="text-slate-600" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter italic">
                            Runtime_Env: PRODUCTION_MODE
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Diagnostic */}
            <div className="p-4 border border-[#334155] bg-[#020617]/50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Database size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Model_UUID: B4C2-91A0...</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Activity size={10} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">HEARTBEAT_ACTIVE_STABLE</span>
                </div>
            </div>
        </div>
    );
};

export default AISettings;
