import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import UGCButton from './UGCButton';
import LoadingScreen from '../UI/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import UploadModal from './UploadModal'; // Assuming UploadModal is in the same directory

const FeedContainer = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { user } = useAuth();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            // Pass current user ID to get interaction status (without filtering by user)
            const url = user ? `http://localhost/AKM.2.0/api/feed.php?currentUserId=${user.id}` : 'http://localhost/AKM.2.0/api/feed.php';
            console.log('Fetching posts from:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch feed');
            }
            const data = await response.json();

            console.log('Posts fetched:', data);
            setPosts(data);
        } catch (err) {
            console.error('Feed fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [user]);

    if (error) return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        }}>
            <p style={{ opacity: 0.7 }}>Oops! Ada kendala saat memuat konten.</p>
            <button
                onClick={fetchPosts}
                style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Coba Lagi
            </button>
        </div>
    );

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
            <style>
                {`
                .feed-scroll-container::-webkit-scrollbar {
                    display: none;
                }
                `}
            </style>

            <div
                style={{
                    height: '100%',
                    width: '100%',
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
                className="feed-scroll-container"
            >
                {loading ? (
                    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid rgba(255,255,255,0.1)',
                            borderTopColor: 'var(--accent-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : posts.map((post) => (
                    <div key={`post-${post.id}`} style={{ scrollSnapAlign: 'start', height: '100vh' }}>
                        <PostCard post={post} />
                    </div>
                ))}
            </div>

            {/* Floating UGC Button */}
            <UGCButton onClick={() => setIsUploadModalOpen(true)} />

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchPosts}
            />
        </div>
    );
};

export default FeedContainer;
