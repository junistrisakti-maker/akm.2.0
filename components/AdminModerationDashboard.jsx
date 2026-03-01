import React, { useState, useEffect } from 'react';
import { 
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
  Image as ImageIcon
} from 'lucide-react';

const AdminModerationDashboard = ({ adminId }) => {
  const [reports, setReports] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [takedownReason, setTakedownReason] = useState('');
  const [takedownAction, setTakedownAction] = useState('remove');
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState(7);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `/api/admin_moderation.php?action=reports&status=${filterStatus}&limit=50&admin_id=${adminId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/admin_moderation.php?action=stats&admin_id=${adminId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPostDetails = async (postId) => {
    try {
      const response = await fetch(
        `/api/admin_moderation.php?action=post_details&post_id=${postId}&admin_id=${adminId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setSelectedPost(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch post details:', error);
    }
  };

  const handleTakedown = async () => {
    if (!selectedPost || !takedownReason) return;

    try {
      const response = await fetch('/api/admin_moderation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'takedown',
          admin_id: adminId,
          post_id: selectedPost.id,
          reason: takedownReason,
          takedown_action: takedownAction
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowTakedownModal(false);
        setSelectedPost(null);
        setTakedownReason('');
        fetchReports();
        fetchStats();
        alert('Post has been taken down successfully');
      } else {
        alert(result.error || 'Failed to take down post');
      }
    } catch (error) {
      alert('Failed to take down post: ' + error.message);
    }
  };

  const handleUserSuspension = async () => {
    if (!selectedUser || !suspensionReason) return;

    try {
      const response = await fetch('/api/admin_moderation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'suspend_user',
          admin_id: adminId,
          user_id: selectedUser.id,
          reason: suspensionReason,
          duration: suspensionDuration
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowUserModal(false);
        setSelectedUser(null);
        setSuspensionReason('');
        fetchReports();
        fetchStats();
        alert('User has been suspended successfully');
      } else {
        alert(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      alert('Failed to suspend user: ' + error.message);
    }
  };

  const filteredReports = reports.filter(report =>
    report.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ReportCard = ({ report }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img 
            src={report.profile_image || '/default-avatar.png'} 
            alt={report.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{report.username}</h3>
            <p className="text-sm text-gray-500">
              {new Date(report.latest_report).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            report.report_count >= 3 
              ? 'bg-red-100 text-red-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {report.report_count} reports
          </span>
          
          <button
            onClick={() => fetchPostDetails(report.id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-gray-900 line-clamp-2">{report.caption}</p>
        {report.report_reasons && (
          <p className="text-sm text-gray-500 mt-1">
            Reasons: {report.report_reasons}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedPost(report);
            setShowTakedownModal(true);
          }}
          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Takedown
        </button>
        
        <button
          onClick={() => {
            setSelectedUser({ id: report.user_id, username: report.username });
            setShowUserModal(true);
          }}
          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
        >
          <UserX className="w-4 h-4" />
          Suspend User
        </button>
      </div>
    </div>
  );

  const StatsCard = ({ icon: Icon, label, value, change, color = 'blue' }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-8 h-8 text-${color}-500`} />
        {change && (
          <span className={`text-sm font-medium ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Moderation Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage reported content and enforce community guidelines
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              icon={AlertTriangle} 
              label="Pending Reports" 
              value={stats.pending_reports}
              color="yellow"
            />
            <StatsCard 
              icon={CheckCircle} 
              label="Resolved Today" 
              value={stats.resolved_reports}
              color="green"
            />
            <StatsCard 
              icon={Trash2} 
              label="Posts Removed" 
              value={stats.posts_removed}
              color="red"
            />
            <StatsCard 
              icon={UserX} 
              label="Users Suspended" 
              value={stats.users_suspended}
              color="orange"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts or users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <button className="p-2 border rounded-lg hover:bg-gray-50">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No reports match the current filter'}
            </p>
          </div>
        )}

        {/* Post Details Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Post Details</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Media Preview */}
                  <div>
                    <h3 className="font-medium mb-3">Media Content</h3>
                    <div className="space-y-3">
                      {selectedPost.media_files?.map((media, index) => (
                        <div key={media.url} className="relative">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt={`Post media ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="relative">
                              <video 
                                src={media.url} 
                                controls
                                className="w-full h-48 rounded-lg"
                              />
                              <Play className="absolute inset-0 m-auto w-12 h-12 text-white/80 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Post Information */}
                  <div>
                    <h3 className="font-medium mb-3">Post Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">User</p>
                        <p className="font-medium">{selectedPost.username}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Caption</p>
                        <p className="whitespace-pre-wrap">{selectedPost.caption}</p>
                      </div>

                      {selectedPost.location_name && (
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{selectedPost.location_name}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-600">Reports</p>
                        <p className="font-medium">{selectedPost.report_count} reports</p>
                        <p className="text-sm text-gray-500">{selectedPost.report_details}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">
                          {new Date(selectedPost.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Takedown Modal */}
        {showTakedownModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Take Down Post</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={takedownAction}
                    onChange={(e) => setTakedownAction(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="remove">Remove (soft delete)</option>
                    <option value="delete">Delete permanently</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={takedownReason}
                    onChange={(e) => setTakedownReason(e.target.value)}
                    placeholder="Please provide a reason for this action..."
                    className="w-full p-2 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTakedownModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakedown}
                  disabled={!takedownReason}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  Take Down
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Suspension Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Suspend User</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-medium">{selectedUser?.username}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <select
                    value={suspensionDuration}
                    onChange={(e) => setSuspensionDuration(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={-1}>Permanent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Please provide a reason for suspension..."
                    className="w-full p-2 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUserSuspension}
                  disabled={!suspensionReason}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModerationDashboard;
