import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CommentModal = ({ isOpen, onClose, postId, commentCount }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef(null);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost/AKM.2.0/api/comments.php?post_id=${postId}`);
            const data = await response.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch comments error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/comments.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_id: postId,
                    user_id: user.id,
                    content: newComment.trim()
                }),
            });

            if (response.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (error) {
            console.error("Add comment error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)'
                }}>
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            width: '100%',
                            maxWidth: '480px',
                            height: '70vh',
                            background: 'var(--bg-primary)',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            borderBottom: 'none'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageCircle size={20} color="var(--accent-primary)" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Komentar ({commentCount})</h3>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div
                            ref={scrollRef}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}
                            className="no-scrollbar"
                        >
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat...</div>
                            ) : comments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                                    <p style={{ margin: 0 }}>Belum ada komentar.</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Jadi yang pertama kasih respon! ✨</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                                        <img
                                            src={comment.avatar || `https://ui-avatars.com/api/?name=${comment.username}&background=random&color=fff`}
                                            alt={comment.username}
                                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>@{comment.username}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '20px',
                            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
                            borderTop: '1px solid var(--glass-border)',
                            background: 'var(--card-bg)'
                        }}>
                            {user ? (
                                <form
                                    onSubmit={handleAddComment}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '24px',
                                        padding: '4px 4px 4px 16px',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Tulis komentar kamu..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            padding: '8px 0',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSubmitting}
                                        style={{
                                            background: newComment.trim() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            ) : (
                                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Silakan login untuk berkomentar.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommentModal;
