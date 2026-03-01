import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    ShieldAlert,
    Ban,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (search = '') => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/users.php?admin_id=${currentUser.id}&search=${search}`);
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, updates) => {
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/users.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: currentUser.id,
                    user_id: userId,
                    ...updates
                })
            });
            const data = await res.json();
            setMessage(data.message || data.error);
            fetchUsers(searchTerm);
            setSelectedUser(null);

            // Auto-hide message
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Failed to update user:', err);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'superadmin': return <ShieldAlert size={16} color="#f43f5e" />;
            case 'admin': return <Shield size={16} color="#a78bfa" />;
            default: return <Users size={16} color="#94a3b8" />;
        }
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '110px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <button
                    onClick={() => navigate('/admin')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Users</h1>
            </div>

            {/* Search Bar */}
            <div style={{
                background: 'var(--glass-bg)',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--glass-border)',
                marginBottom: '24px'
            }}>
                <Search size={20} color="var(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        fetchUsers(e.target.value);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        width: '100%',
                        outline: 'none',
                        fontSize: '1rem'
                    }}
                />
            </div>

            {/* Notification */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            padding: '12px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</p>
                ) : users.map(u => (
                    <div
                        key={u.id}
                        style={{
                            background: 'var(--glass-bg)',
                            padding: '16px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                color: 'white'
                            }}>
                                {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h4 style={{ margin: 0 }}>{u.username}</h4>
                                    {getRoleIcon(u.role)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    {/* Authority Badge */}
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: '900',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: u.level === 5 ? 'linear-gradient(45deg, #10b981, #34d399)' :
                                            u.level === 4 ? '#a78bfa' :
                                                u.level === 3 ? '#fbbf24' :
                                                    u.level === 2 ? '#94a3b8' : '#22d3ee',
                                        color: u.level === 5 || u.level === 4 ? 'white' : 'black',
                                        textTransform: 'uppercase'
                                    }}>
                                        {u.level === 5 ? 'MASTER' : u.level === 4 ? 'CHIEF' : u.level === 3 ? 'ELITE' : u.level === 2 ? 'PRO' : 'ROOKIE'}
                                    </span>

                                    {/* XP Progress Bar */}
                                    <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, (u.xp / (u.level === 5 ? 50000 : u.level === 4 ? 15000 : u.level === 3 ? 5000 : 1000)) * 100)}%`,
                                            height: '100%',
                                            background: 'var(--accent-primary)'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{u.xp} XP</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {selectedUser === u.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        right: '40px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        zIndex: 10,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <button
                                        onClick={() => handleUpdateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        <Shield size={16} /> {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                    </button>
                                    <button
                                        onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: u.status === 'active' ? '#f43f5e' : '#10b981', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        {u.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
