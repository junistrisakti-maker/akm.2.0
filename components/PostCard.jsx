import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Flag, MapPin, Play } from 'lucide-react';

const PostCard = ({ post, currentUser, onReport, onLike, onComment, onShare, onSave }) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleReport = async () => {
    if (!currentUser) {
      alert('Please login to report posts');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const response = await fetch('/api/report_post.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: post.id,
          reporter_id: currentUser.id,
          reason: reportReason,
          description: reportDescription
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Post reported successfully. Our team will review it shortly.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        onReport?.(post.id, result);
      } else {
        alert(result.error || 'Failed to report post');
      }
    } catch (error) {
      alert('Failed to report post: ' + error.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please login to like posts');
      return;
    }

    try {
      const response = await fetch('/api/interactions.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'like',
          post_id: post.id,
          user_id: currentUser.id
        })
      });

      const result = await response.json();
      if (result.success) {
        onLike?.(post.id, result.data);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('Please login to save posts');
      return;
    }

    try {
      const response = await fetch('/api/interactions.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save',
          post_id: post.id,
          user_id: currentUser.id
        })
      });

      const result = await response.json();
      if (result.success) {
        onSave?.(post.id, result.data);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const renderMedia = () => {
    if (!post.media_files || post.media_files.length === 0) {
      return null;
    }

    if (post.media_files.length === 1) {
      const media = post.media_files[0];
      return (
        <div className="relative">
          {media.type === 'image' ? (
            <img 
              src={media.url} 
              alt={post.caption}
              className="w-full h-auto max-h-96 object-cover rounded-lg"
            />
          ) : (
            <div className="relative">
              <video 
                src={media.url} 
                controls
                className="w-full h-auto max-h-96 rounded-lg"
                poster={media.thumbnail}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="w-16 h-16 text-white/80" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Multiple files - grid layout
    return (
      <div className={`grid gap-2 ${
        post.media_files.length === 2 ? 'grid-cols-2' : 
        post.media_files.length === 3 ? 'grid-cols-2 grid-rows-2' : 
        'grid-cols-2'
      }`}>
        {post.media_files.slice(0, 4).map((media, index) => (
          <div key={media.url} className={`relative ${index === 3 && post.media_files.length > 4 ? 'col-span-2 row-span-2' : ''}`}>
            {media.type === 'image' ? (
              <img 
                src={media.url} 
                alt={`${post.caption} - ${index + 1}`}
                className={`w-full h-full object-cover rounded-lg ${
                  index === 3 && post.media_files.length > 4 ? 'max-h-48' : 'max-h-48'
                }`}
              />
            ) : (
              <div className="relative">
                <video 
                  src={media.url} 
                  className={`w-full h-full object-cover rounded-lg ${
                    index === 3 && post.media_files.length > 4 ? 'max-h-48' : 'max-h-48'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white/80" />
                </div>
              </div>
            )}
            
            {index === 3 && post.media_files.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <span className="text-white text-2xl font-bold">+{post.media_files.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.profile_image || '/default-avatar.png'} 
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{post.username}</h3>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Flag className="w-4 h-4" />
                Report Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Content */}
      <div className="px-4 pb-4">
        {renderMedia()}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-gray-900 whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {/* Location */}
      {post.location_name && (
        <div className="px-4 pb-3 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{post.location_name}</span>
        </div>
      )}

      {/* Tags */}
      {post.tags && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.tags.split(',').map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm font-medium">{post.likes || 0}</span>
            </button>

            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments || 0}</span>
            </button>

            <button
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-1 hover:text-green-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{post.shares || 0}</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`hover:text-yellow-500 transition-colors ${
              post.is_saved ? 'text-yellow-500 fill-yellow-500' : ''
            }`}
          >
            <Bookmark className={`w-5 h-5 ${post.is_saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Report Post</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="violence">Violent or graphic content</option>
                  <option value="copyright">Copyright violation</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="hate_speech">Hate speech</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide any additional context..."
                  className="w-full p-2 border rounded-lg resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || isSubmittingReport}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReport ? 'Submitting...' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
