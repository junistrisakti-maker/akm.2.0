import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'var(--bg-primary)',
            zIndex: 100,
        }}>
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    borderRadius: ["20%", "50%", "20%"]
                }}
                transition={{
                    duration: 2,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                    repeat: Infinity,
                }}
                style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px var(--accent-primary)'
                }}
            >
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '50%', // Inner circle
                }} />
            </motion.div>

            <motion.h3
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gradient"
                style={{ marginTop: '24px', letterSpacing: '2px' }}
            >
                LOADING
            </motion.h3>
        </div>
    );
};

export default LoadingScreen;
