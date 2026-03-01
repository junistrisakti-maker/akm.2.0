import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music2, Star, Check, Plus as PlusIcon, MoreHorizontal, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './PostCard.module.css';
import CommentModal from './CommentModal';

const PostCard = ({ post }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.isLiked || false);
    const [bookmarked, setBookmarked] = useState(post.isSaved || false);
    const [likeCount, setLikeCount] = useState(post.likes || 0);
    const [saveCount, setSaveCount] = useState(post.saves || 0);
    const [shareCount, setShareCount] = useState(post.shares || 0);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const audioRef = useRef(null);

    const audioUrl = post.audioUrl || post.audio_url || (post.audioName && post.audioName.startsWith('http') ? post.audioName : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3");

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                setIsAudioLoading(true);
                setAudioError(false);

                // Reload source if it changed
                audioRef.current.load();

                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error("Audio Play Error:", e);
                        // If local fails, try a direct fallback link
                        if (audioRef.current.src.includes('/audio/')) {
                            console.log("Retrying with fallback...");
                            audioRef.current.src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
                            audioRef.current.play().catch(err => {
                                console.error("Fallback failed too:", err);
                                setIsPlaying(false);
                                setAudioError(true);
                                setIsAudioLoading(false);
                            });
                        } else {
                            setIsPlaying(false);
                            setAudioError(true);
                            setIsAudioLoading(false);
                        }
                    });
                }
            } else {
                audioRef.current.pause();
                setIsAudioLoading(false);
            }
        }
    }, [isPlaying, audioUrl]);

    const handleAudioLoaded = () => {
        setIsAudioLoading(false);
    };

    const handleAudioError = () => {
        setAudioError(true);
        setIsAudioLoading(false);
        setIsPlaying(false);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleInteraction = async (type) => {
        if (!user) {
            alert("Sst! Login dulu yuk biar bisa interaksi ✨");
            return;
        }

        try {
            const response = await fetch('http://localhost/AKM.2.0/api/interactions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    postId: post.id,
                    type: type
                }),
            });
            const data = await response.json();

            if (response.ok) {
                if (type === 'like') {
                    setLiked(data.status === 'added');
                    setLikeCount(prev => data.status === 'added' ? prev + 1 : prev - 1);
                } else if (type === 'save') {
                    setBookmarked(data.status === 'added');
                    setSaveCount(prev => data.status === 'added' ? prev + 1 : prev - 1);
                } else if (type === 'share') {
                    setShareCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error("Interaction error:", error);
        }
    };

    const handleComment = () => {
        setIsCommentModalOpen(true);
    };

    const handleFollow = (e) => {
        e.stopPropagation();
        setIsFollowed(!isFollowed);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Cek postingan @${post.user} di Ayokemasjid!`,
                    text: post.caption,
                    url: window.location.href,
                });
                handleInteraction('share');
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback for desktop/non-supported browsers
            handleInteraction('share');
            alert('Link berhasil disalin ke clipboard! (Simulasi)');
        }
    };

    const handleReport = async () => {
        if (!user) {
            alert('Please login to report posts');
            return;
        }

        setIsSubmittingReport(true);
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/report_post.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_id: post.id,
                    reporter_id: user.id,
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
            } else {
                alert(result.error || 'Failed to report post');
            }
        } catch (error) {
            alert('Failed to report post: ' + error.message);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const renderMedia = () => {
        // Handle multiple media files
        if (post.media_files && post.media_files.length > 0) {
            if (post.media_files.length === 1) {
                const media = post.media_files[0];
                return (
                    <div style={{
                        width: '100%',
                        height: '100vh',
                        backgroundColor: post.bgColor || '#000',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {media.type === 'image' ? (
                            <img
                                src={media.url || 'https://images.unsplash.com/photo-1542156822-6924d1a71ace'}
                                alt="Post content"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <video
                                src={media.url || null}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        )}
                    </div>
                );
            } else {
                // Multiple files grid
                return (
                    <div style={{
                        width: '100%',
                        height: '100vh',
                        display: 'grid',
                        gridTemplateColumns: post.media_files.length === 2 ? '1fr 1fr' : 'repeat(2, 1fr)',
                        gap: '2px',
                        backgroundColor: '#000'
                    }}>
                        {post.media_files.slice(0, 4).map((media, index) => (
                            <div key={`${media.url}-${index}`} style={{
                                position: 'relative',
                                overflow: 'hidden',
                                ...(index === 3 && post.media_files.length > 4 ? {
                                    gridColumn: '1 / -1',
                                    gridRow: 'span 2'
                                } : {})
                            }}>
                                {media.type === 'image' ? (
                                    <img
                                        src={media.url}
                                        alt={`Post media ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <video
                                        src={media.url}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                )}

                                {index === 3 && post.media_files.length > 4 && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span style={{
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold'
                                        }}>
                                            +{post.media_files.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
        }

        // Fallback to single media (old posts)
        return (
            <div style={{
                width: '100%',
                height: '100vh',
                backgroundColor: post.bgColor || '#000',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {post.type === 'video' ? (
                    <video
                        src={post.url || null}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <img
                        src={post.url || 'https://images.unsplash.com/photo-1542156822-6924d1a71ace'}
                        alt="Post content"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                )}
            </div>
        );
    };

    const avatarUrl = post.avatar || `https://ui-avatars.com/api/?name=${post.user}&background=random&color=fff`;

    return (
        <div style={{
            position: 'relative',
            height: '100vh',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            overflow: 'hidden'
        }}>
            {/* Media Background */}
            {renderMedia()}

            {/* Right Side Engagement */}
            <div style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{ position: 'relative' }}>
                    <img src={avatarUrl} alt={post.user} style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid white'
                    }} />
                    <AnimatePresence mode="wait">
                        {!isFollowed && (
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    right: '-4px',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: 'var(--accent-primary)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0, rotate: 90 }}
                                onClick={handleFollow}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                            >
                                <PlusIcon size={14} color="white" strokeWidth={4} />
                            </motion.div>
                        )}
                        {isFollowed && (
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    right: '-4px',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                initial={{ scale: 0, opacity: 0, rotate: -90 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={handleFollow}
                            >
                                <Check size={14} color="white" strokeWidth={4} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => handleInteraction('like')}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <Heart size={32} fill={liked ? "#ef4444" : "rgba(255,255,255,0.15)"} color={liked ? "#ef4444" : "white"} />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginTop: '4px' }}>{likeCount}</span>
                </button>

                <button
                    onClick={handleComment}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <MessageCircle size={32} color="white" fill="rgba(255,255,255,0.15)" />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginTop: '4px' }}>{post.comments}</span>
                </button>

                <button
                    onClick={() => handleInteraction('save')}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <Bookmark size={32} fill={bookmarked ? "#fbbf24" : "rgba(255,255,255,0.15)"} color={bookmarked ? "#fbbf24" : "white"} />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginTop: '4px' }}>{saveCount}</span>
                </button>

                <button
                    onClick={handleShare}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                >
                    <Share2 size={32} color="white" fill="rgba(255,255,255,0.15)" />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginTop: '4px' }}>{shareCount}</span>
                </button>

                {/* Report Button */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px'
                        }}
                    >
                        <MoreHorizontal size={24} color="white" />
                    </button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            right: '0',
                            top: '40px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            padding: '8px',
                            minWidth: '150px',
                            zIndex: 1000
                        }}>
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    setShowReportModal(true);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                <Flag size={16} color="#ef4444" />
                                Report Post
                            </button>
                        </div>
                    )}
                </div>

                <div
                    onClick={togglePlay}
                    style={{
                        cursor: 'pointer',
                        position: 'relative',
                        border: audioError ? '8px solid #ef4444' : (isAudioLoading ? '8px solid #fbbf24' : '8px solid #222'),
                        borderRadius: '50%',
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#222'
                    }}
                >
                    <img src={avatarUrl} alt="music" style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                    }} />
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        loop
                        onCanPlay={handleAudioLoaded}
                        onError={handleAudioError}
                    />
                    {(isPlaying || isAudioLoading || audioError) && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '50%'
                        }}>
                            {audioError ? (
                                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>ERR</span>
                            ) : isAudioLoading ? (
                                <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                            ) : (
                                <Music2 size={24} color="var(--accent-primary)" className="animate-pulse" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Info Overlay */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '20px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
            }}>
                {/* Social Proof: Rating */}
                {post.rating && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                    }}>
                        <Star size={12} fill="#fbbf24" color="#fbbf24" />
                        <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '700' }}>{parseFloat(post.rating).toFixed(1)}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>({post.reviewCount})</span>
                        {post.locationName && (
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>• {post.locationName}</span>
                        )}
                    </div>
                )}

                <h3 style={{ margin: '0', fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>@{post.user}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'white', lineHeight: '1.4' }}>{post.caption} <span style={{ color: '#60a5fa', fontSize: '0.9rem' }}>{post.tags}</span></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music2 size={16} color="rgba(255,255,255,0.8)" />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{post.audioName || "Original Audio - AyokeMasjid"}</span>
                </div>
            </div>


            {/* Comment Modal */}
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                postId={post.id}
                commentCount={post.comments}
            />

            {/* Report Modal */}
            {showReportModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <h3 style={{ color: 'white', marginBottom: '16px' }}>Report Post</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                                Reason
                            </label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
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

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                                Additional details (optional)
                            </label>
                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Please provide any additional context..."
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    minHeight: '80px',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={!reportReason || isSubmittingReport}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: reportReason && !isSubmittingReport ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: reportReason && !isSubmittingReport ? 'pointer' : 'not-allowed'
                                }}
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
