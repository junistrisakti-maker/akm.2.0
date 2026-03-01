import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, MessageCircle, Sparkles } from 'lucide-react';

const MasjidAI = ({ onClose }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Assalamu\'alaikum! Saya Sohib Masjid, asisten digital resmi AyoKeMasjid. Ada yang bisa saya bantu seputar ibadah, Al-Quran, atau layanan masjid hari ini? ✨' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost/AKM.2.0/api/ai_assistant.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(-5) // Send last 5 messages for context
                })
            });
            const data = await res.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else if (data.error) {
                const errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
                setMessages(prev => [...prev, { role: 'ai', content: `Waduh, ada error nih: ${errorMsg}` }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Koneksi lagi bermasalah, coba lagi nanti ya!' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            key="masjid-buddy-window"
            initial={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: '-50%' }}
            className="glass-panel"
            style={{
                position: 'fixed',
                top: '10vh',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '448px',
                height: '75vh',
                background: 'var(--bg-secondary)',
                borderRadius: '28px',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}
        >
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="neon-glow" style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot color="white" size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Sohib Masjid</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Active & Ready</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'var(--subtle-bg)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                    <X size={18} />
                </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="no-scrollbar">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--card-bg)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            border: msg.role === 'ai' ? '1px solid var(--glass-border)' : 'none'
                        }}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', background: 'var(--card-bg)', padding: '12px 20px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Buddy is typing...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Apa yang ingin kamu ketahui?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        style={{
                            width: '100%',
                            padding: '14px 54px 14px 20px',
                            borderRadius: '16px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        style={{
                            position: 'absolute',
                            right: '6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default MasjidAI;
