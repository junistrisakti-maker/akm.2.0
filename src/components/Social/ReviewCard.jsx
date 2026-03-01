import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ReviewCard = ({ review }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                marginBottom: '12px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                        src={review.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + review.username}
                        alt={review.username}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>{review.username}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={12}
                            color={i < review.rating ? "#fbbf24" : "rgba(255,255,255,0.1)"}
                            fill={i < review.rating ? "#fbbf24" : "none"}
                        />
                    ))}
                </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {review.comment}
            </p>
        </motion.div>
    );
};

export default ReviewCard;
