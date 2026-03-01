import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CheckCircle } from 'lucide-react';
import LoadingScreen from '../components/UI/LoadingScreen';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await register(username, email, password);

        if (result.success) {
            navigate('/login'); // Redirect to login
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>Join the Circle</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Become a part of the movement</p>
                </div>

                {error && (
                    <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <User className="input-icon" size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Mail className="input-icon" size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock className="input-icon" size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        style={{
                            background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                            color: 'white',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            marginTop: '8px',
                            boxShadow: '0 4px 12px var(--accent-primary)'
                        }}
                    >
                        Sign Up
                    </motion.button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-tertiary)', fontWeight: 'bold' }}>Sign In</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
