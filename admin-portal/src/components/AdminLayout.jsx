import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    ShieldAlert,
    Target,
    Settings,
    LogOut,
    Menu,
    Bell,
    User,
    ChevronRight,
    Search,
    Music,
    Calendar,
    Cpu,
    Activity,
    Box,
    Command,
    Terminal,
    MapPin,
    Radio
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminLayout = ({ children }) => {
    const { admin, logout } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
        { icon: <MapPin size={18} />, label: 'Youth Hub Profile', path: '/hub-profile' },
        { icon: <Radio size={18} />, label: 'Broadcasts', path: '/broadcasts' },
        { icon: <Calendar size={18} />, label: 'Event Management', path: '/events' },
        { icon: <Users size={18} />, label: 'Management Users', path: '/users' },
        { icon: <ShieldAlert size={18} />, label: 'Moderation', path: '/moderation' },
        { icon: <Target size={18} />, label: 'Management Challenges', path: '/challenges' },
        { icon: <Cpu size={18} />, label: 'System API', path: '/ai-control' },
        { icon: <Music size={18} />, label: 'Vibes Music', path: '/vibes-music' },
        { icon: <Target size={18} />, label: 'Daily Missions', path: '/missions' },
        { icon: <Settings size={18} />, label: 'System Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageTitle = () => {
        const item = menuItems.find(m => m.path === location.pathname);
        return item ? item.label : 'System Access';
    };

    return (
        <div className="min-h-screen w-full bg-[#0f172a] text-slate-200 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`flex-shrink-0 bg-[#020617] border-r border-[#334155] transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-20'}`}
            >
                {/* Brand Logo Section */}
                <div className="h-20 border-b border-[#334155] flex items-center px-6 gap-4 bg-[#010409]">
                    <div className="w-8 h-8 border-2 border-emerald-500 flex items-center justify-center shrink-0">
                        <Box size={18} className="text-emerald-500" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                            <h1 className="text-sm font-bold tracking-[0.2em] text-white uppercase whitespace-nowrap">AKM Core</h1>
                            <p className="text-[9px] font-mono text-emerald-500/70 font-bold uppercase tracking-tighter">Enterprise v2.0</p>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-4 py-3 transition-all group relative
                                ${isActive ? 'bg-[#1e293b] text-white border-l-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            <div className={`shrink-0 transition-colors ${location.pathname === item.path ? 'text-emerald-500' : 'group-hover:text-slate-300'}`}>
                                {item.icon}
                            </div>
                            {isSidebarOpen && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                                    {item.label}
                                </motion.span>
                            )}
                            {!isSidebarOpen && location.pathname === item.path && (
                                <div className="absolute left-0 w-1 h-6 bg-emerald-500" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Section - System Status & User */}
                <div className="p-4 border-t border-[#334155] space-y-4 bg-[#010409]">
                    {isSidebarOpen && (
                        <div className="p-3 bg-[#0f172a] border border-[#334155]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="label-industrial">Instance Status</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-500">PROD</span>
                            </div>
                            <div className="h-1 bg-[#1e293b] w-full mb-1">
                                <div className="h-full bg-emerald-500 w-[85%]"></div>
                            </div>
                            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Mem Load: 42.8 GB / 128 GB</p>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-rose-500 hover:bg-rose-500/10 transition-colors group"
                    >
                        <LogOut size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                        {isSidebarOpen && <span className="text-[11px] font-bold uppercase tracking-wider">Detach Session</span>}
                    </button>

                    {isSidebarOpen && (
                        <div className="pt-2 border-t border-[#334155]/30">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 bg-[#1e293b] border border-[#334155] flex items-center justify-center shrink-0">
                                    <User size={16} className="text-slate-400" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-bold text-white uppercase truncate">{admin?.username}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <p className="text-[9px] font-mono text-slate-500 uppercase">{admin?.role}</p>
                                        {admin?.mosque_name && (
                                            <>
                                                <span className="text-slate-700 mx-1">/</span>
                                                <p className="text-[9px] font-mono text-emerald-500/80 uppercase truncate max-w-[100px]">{admin.mosque_name}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Workspace Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Navbar */}
                <header className="h-20 bg-[#020617] border-b border-[#334155] flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 border border-[#334155] bg-[#1e293b] text-slate-400 hover:text-white transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <Terminal size={14} className="text-emerald-500" />
                            <div className="hidden sm:block">
                                <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5 tracking-tighter">Kernel :: Management :: Portal</p>
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">{getPageTitle()}</h2>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* System Quick Monitoring */}
                        <div className="hidden md:flex items-center gap-12 px-8 border-x border-[#334155]/50 h-20 text-[10px]">
                            <div>
                                <p className="label-industrial mb-1">Node Uplink</p>
                                <p className="font-mono font-bold text-emerald-500 leading-none">942.8 KB/S</p>
                            </div>
                            <div>
                                <p className="label-industrial mb-1">Latency</p>
                                <p className="font-mono font-bold text-emerald-500 leading-none">12 MS</p>
                            </div>
                            <div>
                                <p className="label-industrial mb-1">Security</p>
                                <div className="flex items-center gap-1.5 leading-none">
                                    <ShieldAlert size={10} className="text-emerald-500" />
                                    <p className="font-mono font-bold text-white uppercase italic">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="p-2.5 bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white transition-colors relative">
                                <Bell size={18} />
                                <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-[#020617]" />
                            </button>
                            <button className="p-2.5 bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-white transition-colors">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Application Content Surface */}
                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
                    {/* Decorative grid background overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
