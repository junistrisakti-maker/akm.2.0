import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, User, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuditLog = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/audit_logs.php?admin_id=${currentUser.id}`);
            const data = await res.json();
            if (data.logs) setLogs(data.logs);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Audit Logs</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Retrieving logs...</p>
                ) : logs.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No logs found.</p>
                ) : logs.map(log => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: 'var(--glass-bg)',
                            padding: '16px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                                <Activity size={16} />
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{log.action}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                <Clock size={14} />
                                <span>{formatDate(log.created_at)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <User size={14} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.85rem' }}>Admin: <strong>{log.admin_name}</strong></span>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{log.details}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AuditLog;
