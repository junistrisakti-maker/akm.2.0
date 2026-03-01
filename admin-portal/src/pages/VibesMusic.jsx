import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Upload, Trash2, Play, Pause, Plus, ZoomIn, ZoomOut, Scissors, Save, X, AlertCircle, Pencil, Activity, Cpu, Terminal, Zap } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.esm.js';
import axios from 'axios';
import { useAdminAuth } from '../context/AdminAuthContext';

// Helper for absolute URLs since we are cross-origin
const api = axios.create({
    baseURL: 'http://localhost/AKM.2.0',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});

const VibesMusic = () => {
    const { admin } = useAdminAuth();
    const [vibes, setVibes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);

    // WaveSurfer states & refs
    const wavesurferRef = useRef(null);
    const containerRef = useRef(null);
    const timelineRef = useRef(null);
    const [audioFile, setAudioFile] = useState(null);
    const [name, setName] = useState('');
    const [zoom, setZoom] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [region, setRegion] = useState({ start: 0, end: 15 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const previewAudioRef = useRef(new Audio());

    useEffect(() => {
        const audio = previewAudioRef.current;
        const handleEnded = () => setPreviewUrl(null);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.pause();
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    useEffect(() => {
        fetchVibes();
    }, []);

    const fetchVibes = async () => {
        try {
            const res = await api.get('/api/get_backsound.php');
            if (res.data.success) {
                setVibes(res.data.list || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initialize WaveSurfer v7
    useEffect(() => {
        if (!showUpload || !audioFile || !containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#334155',
            progressColor: '#10b981',
            cursorColor: '#10b981',
            cursorWidth: 2,
            barWidth: 2,
            barGap: 3,
            height: 180,
            autoCenter: true,
            autoScroll: true,
            minPxPerSec: 0,
            normalize: true,
            interact: true,
            dragToSeek: true,
        });

        // Register Plugins
        ws.registerPlugin(TimelinePlugin.create({
            container: timelineRef.current,
            primaryColor: '#64748b',
            secondaryColor: '#334155',
            primaryFontColor: '#64748b',
            height: 25,
        }));

        ws.registerPlugin(HoverPlugin.create({
            lineColor: '#10b981',
            lineWidth: 2,
            labelBackground: '#020617',
            labelColor: '#fff',
            labelSize: '10px',
        }));

        const wsRegions = ws.registerPlugin(RegionsPlugin.create());

        ws.on('ready', () => {
            const d = ws.getDuration();
            setDuration(d);

            const end = Math.min(15, d);
            wsRegions.addRegion({
                start: 0,
                end: end,
                color: 'rgba(16, 185, 129, 0.15)',
                drag: true,
                resize: true,
            });
            setRegion({ start: 0, end: end });
        });

        wsRegions.on('region-updated', (region) => {
            setRegion({ start: region.start, end: region.end });
            ws.setTime(region.start);
        });

        ws.on('timeupdate', () => setCurrentTime(ws.getCurrentTime()));
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));

        ws.loadBlob(audioFile);
        wavesurferRef.current = ws;

        return () => ws.destroy();
    }, [showUpload, audioFile]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleZoom = (e) => {
        const val = Number(e.target.value);
        setZoom(val);
        if (wavesurferRef.current) {
            wavesurferRef.current.zoom(val);
        }
    };

    const processUpload = async () => {
        if (!audioFile || !name) return;
        setIsProcessing(true);

        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('name', name);
        formData.append('start', region.start.toFixed(2));
        formData.append('duration', (region.end - region.start).toFixed(2));

        try {
            const res = await api.post('/admin/api/process_audio.php', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setShowUpload(false);
                setAudioFile(null);
                fetchVibes();
            } else {
                alert('Error: ' + res.data.error);
            }
        } catch (err) {
            console.error('Process error:', err);
            alert('Gagal memproses audio.');
        } finally {
            setIsProcessing(false);
        }
    };

    const deleteVibe = async (id) => {
        if (!window.confirm('CRITICAL: PURGE AUDIO STREAM?')) return;
        try {
            const res = await api.get(`/admin/api/vibe_delete.php?id=${id}`);
            if (res.data.success) fetchVibes();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const toggleStatus = async (id) => {
        try {
            const res = await api.get(`/admin/api/vibe_toggle.php?id=${id}`);
            if (res.data.success) fetchVibes();
        } catch (err) {
            alert('Failed to toggle');
        }
    };

    const handleRename = async (vibe) => {
        const newName = window.prompt('PROTOCOL_OVERRIDE: ENTER NEW VIBE ID:', vibe.name);
        if (!newName || newName === vibe.name) return;

        try {
            const formData = new FormData();
            formData.append('id', vibe.id);
            formData.append('name', newName);

            const res = await api.post('/admin/api/vibe_rename.php', formData);
            if (res.data.success) {
                fetchVibes();
            }
        } catch (err) {
            alert('Rename protocol failed.');
        }
    };

    const handlePreview = (url) => {
        const audio = previewAudioRef.current;
        if (previewUrl === url) {
            audio.pause();
            setPreviewUrl(null);
        } else {
            audio.src = url;
            audio.play();
            setPreviewUrl(url);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#334155] pb-8">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Audio Asset Matrix</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Processor: VibeHD Trimmer Engine</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                >
                    <Upload size={16} /> New Asset Entry
                </button>
            </div>

            {/* Trimmer Modal - Slate Overhaul */}
            <AnimatePresence>
                {showUpload && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowUpload(false); setAudioFile(null); }}
                            className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-6xl bg-[#0f172a] border border-[#334155] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="h-1 bg-emerald-500 opacity-50"></div>

                            <div className="px-10 py-6 border-b border-[#334155] flex justify-between items-center bg-[#020617]/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 border border-emerald-500 flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                                        <Scissors size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Precision Audio Scalpel</h3>
                                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Operation: Visual Trim & Transcode</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowUpload(false); setAudioFile(null); }} className="p-2 border border-[#334155] bg-[#1e293b] text-slate-500 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                {!audioFile ? (
                                    <div className="relative group border-2 border-dashed border-[#334155] bg-[#020617]/30 hover:bg-[#1e293b]/10 hover:border-emerald-500/50 transition-all cursor-pointer py-32 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 border border-[#334155] bg-[#020617] flex items-center justify-center mb-6 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all">
                                            <Music size={24} />
                                        </div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-3">Load Binary Media</h4>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Support: MP3 / WAV / OGG [Max 20MB]</p>
                                        <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-2">
                                                <label className="label-industrial">Asset Identifier (Name)</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full bg-[#010409] border border-[#334155] text-white px-6 py-4 text-base font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                                                        placeholder="VIBE_ENTRY_ALPHA"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 group-focus-within/input:w-full transition-all duration-500"></div>
                                                </div>
                                            </div>
                                            <div className="enterprise-card bg-[#020617] !p-6 flex flex-col justify-center space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="label-industrial text-emerald-500">Matrix Resolution (Zoom)</label>
                                                    <span className="text-[10px] font-mono font-bold text-slate-500">{zoom}PX</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <ZoomOut size={16} className="text-slate-600" />
                                                    <input type="range" min="0" max="1000" value={zoom} onChange={handleZoom} className="flex-1 h-1 bg-[#334155] accent-emerald-500 appearance-none cursor-pointer" />
                                                    <ZoomIn size={16} className="text-emerald-500" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="enterprise-card !p-0 bg-[#020617] border-[#334155] shadow-2xl relative overflow-hidden group">
                                            <div ref={timelineRef} className="px-12 pt-6 opacity-60" />
                                            <div ref={containerRef} className="my-10 px-8" />

                                            <div className="px-10 py-8 bg-[#010409] border-t border-[#334155] flex flex-col md:flex-row justify-between items-center gap-8">
                                                <div className="flex items-center gap-8">
                                                    <button
                                                        onClick={() => wavesurferRef.current?.playPause()}
                                                        className="w-16 h-16 border border-emerald-500 bg-[#020617] flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                    >
                                                        {isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-1" />}
                                                    </button>
                                                    <div className="font-mono text-2xl font-bold tracking-tighter">
                                                        <span className="text-emerald-500">{currentTime.toFixed(2)}s</span>
                                                        <span className="text-slate-700 mx-3">/</span>
                                                        <span className="text-slate-400">{duration.toFixed(2)}s</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="px-6 py-3 border border-[#334155] bg-[#0f172a] text-center min-w-[120px]">
                                                        <p className="label-industrial mb-1">In-Point</p>
                                                        <p className="text-sm font-mono font-bold text-white">{region.start.toFixed(2)}s</p>
                                                    </div>
                                                    <div className="px-6 py-3 border border-emerald-500/30 bg-emerald-500/5 text-center min-w-[120px]">
                                                        <p className="label-industrial text-emerald-500 mb-1">Window</p>
                                                        <p className="text-sm font-mono font-bold text-emerald-500">{(region.end - region.start).toFixed(2)}s</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-5">
                                            <Zap size={20} className="text-emerald-500 shrink-0" />
                                            <div className="flex-1">
                                                <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Connectivity Established</h5>
                                                <p className="text-[9px] font-mono text-emerald-500/70 mt-1 uppercase tracking-tighter">Transcoding: 128KBPS VibeHD Stream • Target: Cloud Storage Bucket ALPHA</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="px-10 py-8 border-t border-[#334155] bg-[#020617]/80 flex justify-end gap-6">
                                <button
                                    onClick={() => { setShowUpload(false); setAudioFile(null); }}
                                    className="px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 border border-[#334155] hover:bg-[#1e293b] hover:text-white transition-all outline-none"
                                >
                                    Abort_INIT
                                </button>
                                <button
                                    onClick={processUpload}
                                    disabled={!audioFile || isProcessing}
                                    className={`px-12 py-3 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-4 transition-all outline-none ${isProcessing ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                        }`}
                                >
                                    {isProcessing ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                                    {isProcessing ? 'Transcoding...' : 'Commit_Asset'}
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
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Querying Media Matrix...</h3>
                    </div>
                ) : vibes.length === 0 ? (
                    <div className="col-span-full py-24 border border-[#334155] bg-[#020617]/30 flex flex-col items-center justify-center text-center">
                        <Music size={40} className="text-slate-700 mb-6" />
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Asset Packets Detected</h3>
                    </div>
                ) : (
                    vibes.map((v, idx) => (
                        <motion.div
                            key={v.id || `vibe-${idx}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enterprise-card group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 border border-[#334155] flex items-center justify-center shrink-0 transition-colors ${v.is_active ? 'bg-[#020617] text-emerald-500' : 'bg-[#0f172a] text-slate-700'
                                    }`}>
                                    <Music size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRename(v)}
                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-500 hover:text-white transition-all flex items-center justify-center"
                                        title="Rename"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteVibe(v.id)}
                                        className="w-8 h-8 border border-[#334155] bg-[#020617] text-slate-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center"
                                        title="Purge"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight truncate group-hover:text-emerald-500 transition-colors">{v.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-1 ${v.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Asset_Type :: Soundtrack</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleStatus(v.id)}
                                    className={`px-3 py-1 text-[8px] font-bold border uppercase tracking-widest transition-all ${v.is_active ? 'border-emerald-500/50 text-emerald-500' : 'border-slate-700 text-slate-700'
                                        }`}
                                >
                                    {v.is_active ? 'STREAMS_ACTIVE' : 'STREAMS_OFF'}
                                </button>
                            </div>

                            <button
                                onClick={() => handlePreview(v.url)}
                                className={`w-full py-4 border text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all ${previewUrl === v.url
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                    : 'border-[#334155] bg-[#020617] text-slate-400 hover:text-white hover:border-slate-400'
                                    }`}
                            >
                                {previewUrl === v.url ? <Pause size={14} /> : <Play size={14} />}
                                {previewUrl === v.url ? 'Stop_Terminal' : 'Preview_Link'}
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="flex justify-end p-4 border border-[#334155] bg-[#020617]/50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Buffer Link Stable</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-[#334155] pl-6">
                        <Terminal size={12} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Loaded Assets: {vibes.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VibesMusic;
