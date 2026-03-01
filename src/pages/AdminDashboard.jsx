import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Trophy,
    ShieldCheck,
    Activity,
    ChevronRight,
    ArrowLeft,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    UserX,
    Trash2,
    Eye,
    Search,
    Filter,
    TrendingUp,
    Clock,
    FileText,
    Play,
    ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { isSuperadmin, user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeChallenges: 0,
        recentLogs: 0,
        pendingReports: 0,
        resolvedReports: 0,
        postsRemoved: 0,
        usersSuspended: 0
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isSuperadmin()) {
            navigate('/settings');
            return;
        }
        fetchModerationStats();
        if (activeTab === 'moderation') {
            fetchReports();
        }
    }, [isSuperadmin, navigate, activeTab, filterStatus]);

    const fetchModerationStats = async () => {
        try {
            const response = await fetch(`http://localhost/AKM.2.0/api/admin_moderation.php?action=stats&admin_id=${user.id}`);
            const data = await response.json();
            if (data.success) {
                setStats(prev => ({ ...prev, ...data.data }));
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost/AKM.2.0/api/admin_moderation.php?action=reports&status=${filterStatus}&limit=50&admin_id=${user.id}`);
            const data = await response.json();
            if (data.success) {
                setReports(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTakedown = async (postId, reason, action = 'remove') => {
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/admin_moderation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'takedown',
                    admin_id: user.id,
                    post_id: postId,
                    reason: reason,
                    takedown_action: action
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Post has been taken down successfully');
                fetchReports();
                fetchModerationStats();
            } else {
                alert(data.error || 'Failed to take down post');
            }
        } catch (error) {
            alert('Failed to take down post: ' + error.message);
        }
    };

    const menuItems = [
        {
            id: 'overview',
            title: 'Overview',
            description: 'System statistics and overview',
            icon: <TrendingUp size={24} />,
            path: '/admin',
            color: '#3b82f6'
        },
        {
            id: 'moderation',
            title: 'Content Moderation',
            description: 'Manage reported posts and content',
            icon: <Shield size={24} />,
            path: '/admin/moderation',
            color: '#ef4444'
        },
        {
            id: 'users',
            title: 'User Management',
            description: 'Manage roles and account status',
            icon: <Users size={24} />,
            path: '/admin/users',
            color: '#7c3aed'
        },
        {
            id: 'challenges',
            title: 'Challenge Control',
            description: 'Create and edit masjid challenges',
            icon: <Trophy size={24} />,
            path: '/admin/challenges',
            color: '#10b981'
        },
        {
            id: 'settings',
            title: 'System Config',
            description: 'Setup API & parameters',
            icon: <ShieldCheck size={24} />,
            path: '/settings/admin',
            color: '#f43f5e'
        },
        {
            id: 'logs',
            title: 'Audit Logs',
            description: 'Monitor system activity',
            icon: <Activity size={24} />,
            path: '/admin/logs',
            color: '#3b82f6'
        },
        {
            id: 'missions',
            title: 'Daily Missions',
            description: 'Manage daily reward tasks',
            icon: <Trophy size={24} />,
            path: '/admin/missions',
            color: '#fbbf24'
        }
    ];

    return (
        <div style={{ padding: '24px', paddingBottom: '110px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '12px' }}>
                <button
                    onClick={() => navigate('/settings')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }} className="text-gradient">
                    Admin Hub
                </h1>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: activeTab === item.id ? `${item.color}20` : 'transparent',
                            border: activeTab === item.id ? `1px solid ${item.color}` : '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            color: activeTab === item.id ? item.color : 'var(--text-secondary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {item.icon}
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.title}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <div style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            textAlign: 'center'
                        }}>
                            <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '8px' }} />
                            <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '700' }}>{stats.pendingReports || 0}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Reports</p>
                        </div>

                        <div style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            textAlign: 'center'
                        }}>
                            <CheckCircle size={32} color="#10b981" style={{ marginBottom: '8px' }} />
                            <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '700' }}>{stats.resolvedReports || 0}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resolved Today</p>
                        </div>

                        <div style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            textAlign: 'center'
                        }}>
                            <Trash2 size={32} color="#ef4444" style={{ marginBottom: '8px' }} />
                            <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '700' }}>{stats.postsRemoved || 0}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts Removed</p>
                        </div>

                        <div style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            textAlign: 'center'
                        }}>
                            <UserX size={32} color="#f97316" style={{ marginBottom: '8px' }} />
                            <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '700' }}>{stats.usersSuspended || 0}</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Users Suspended</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        {menuItems.slice(1).map((item) => (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    background: 'var(--glass-bg)',
                                    backdropFilter: 'blur(var(--glass-blur))',
                                    padding: '20px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                            >
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: `${item.color}20`,
                                    color: item.color
                                }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{item.title}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {item.description}
                                    </p>
                                </div>
                                <ChevronRight size={20} color="var(--text-secondary)" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'moderation' && (
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                backgroundColor: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search posts or users..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    backgroundColor: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    paddingLeft: '40px'
                                }}
                            />
                            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    {/* Reports List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto' }}></div>
                            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading reports...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            {reports.map((report) => (
                                <div key={report.id} style={{
                                    background: 'var(--glass-bg)',
                                    backdropFilter: 'blur(var(--glass-blur))',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                                        <img
                                            src={report.profile_image || `https://ui-avatars.com/api/?name=${report.username}&background=random&color=fff`}
                                            alt={report.username}
                                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                        />

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <div>
                                                    <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: '700' }}>{report.username}</h3>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(report.latest_report).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: report.report_count >= 3 ? '#ef444420' : '#f59e0b20',
                                                        color: report.report_count >= 3 ? '#ef4444' : '#f59e0b',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {report.report_count} reports
                                                    </span>

                                                    <button
                                                        onClick={() => alert('View post details - feature coming soon')}
                                                        style={{
                                                            padding: '8px',
                                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Eye size={16} color="white" />
                                                    </button>
                                                </div>
                                            </div>

                                            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {report.caption}
                                            </p>

                                            {report.report_reasons && (
                                                <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Reasons: {report.report_reasons}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Enter reason for takedown:');
                                                        if (reason) {
                                                            handleTakedown(report.id, reason, 'remove');
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px',
                                                        backgroundColor: '#ef4444',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Remove Post
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Enter reason for user suspension:');
                                                        if (reason) {
                                                            // Handle user suspension
                                                            alert('User suspension feature coming soon');
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px',
                                                        backgroundColor: '#f97316',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Suspend User
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {reports.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <FileText size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No reports found</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                {searchTerm ? 'Try adjusting your search terms' : 'No reports match the current filter'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'missions' && (
                <AdminMissions user={user} />
            )}

            {activeTab !== 'overview' && activeTab !== 'moderation' && activeTab !== 'missions' && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        padding: '40px',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(var(--glass-blur))',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Coming Soon</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            {menuItems.find(item => item.id === activeTab)?.description} feature is under development.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminMissions = ({ user }) => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMission, setEditingMission] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        action_type: 'prayer_aamiin',
        target_count: 5,
        xp_reward: 50,
        icon: 'Target'
    });

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin_missions.php?admin_id=${user.id}`);
            const data = await res.json();
            if (data.success) setMissions(data.missions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingMission ? 'PUT' : 'POST';
        const body = editingMission ? { ...formData, id: editingMission.id } : formData;

        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin_missions.php?admin_id=${user.id}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                alert(editingMission ? 'Mission updated!' : 'Mission created!');
                setEditingMission(null);
                setShowForm(false);
                setFormData({ title: '', description: '', action_type: 'prayer_aamiin', target_count: 5, xp_reward: 50, icon: 'Target' });
                fetchMissions();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mission? All user progress for this mission will be lost.')) return;
        try {
            const res = await fetch(`http://localhost/AKM.2.0/api/admin_missions.php?admin_id=${user.id}&id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchMissions();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (mission) => {
        setEditingMission(mission);
        setFormData({
            title: mission.title,
            description: mission.description,
            action_type: mission.action_type,
            target_count: mission.target_count,
            xp_reward: mission.xp_reward,
            icon: mission.icon
        });
        setShowForm(true);
    };

    if (loading && !showForm) return <div style={{ textAlign: 'center', padding: '40px' }}><div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto' }}></div></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Daily Missions Manager</h2>
                <button
                    onClick={() => {
                        setEditingMission(null);
                        setFormData({ title: '', description: '', action_type: 'prayer_aamiin', target_count: 5, xp_reward: 50, icon: 'Target' });
                        setShowForm(!showForm);
                    }}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {showForm ? 'Cancel' : '+ New Mission'}
                </button>
            </div>

            {showForm && (
                <div style={{ background: 'var(--glass-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mission Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', minHeight: '80px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Action Type</label>
                                <select
                                    value={formData.action_type}
                                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                >
                                    <option value="prayer_aamiin">prayer_aamiin</option>
                                    <option value="share">share</option>
                                    <option value="check_in">check_in</option>
                                    <option value="ai_talk">ai_talk</option>
                                    <option value="donation">donation</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Icon Name</label>
                                <select
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                >
                                    <option value="Target">Target</option>
                                    <option value="Heart">Heart</option>
                                    <option value="Share2">Share2</option>
                                    <option value="CalendarCheck">CalendarCheck</option>
                                    <option value="MessageSquare">MessageSquare</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Target Count</label>
                                <input
                                    type="number"
                                    value={formData.target_count}
                                    onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>XP Reward</label>
                                <input
                                    type="number"
                                    value={formData.xp_reward}
                                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--subtle-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            style={{ padding: '14px', borderRadius: '12px', background: 'var(--accent-secondary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                        >
                            {editingMission ? 'Save Changes' : 'Create Mission'}
                        </button>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {missions.map((mission) => (
                    <div key={mission.id} style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{mission.title}</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {mission.action_type} • {mission.target_count} times • {mission.xp_reward} XP
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEdit(mission)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                            <button onClick={() => handleDelete(mission.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
