import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const UGCButton = ({ onClick }) => {
    return (
        <motion.button
            initial={{ x: "-50%", y: 0 }}
            whileHover={{
                scale: 1.1,
                x: "-50%",
                y: -12,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.9, x: "-50%" }}
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: '80px', // Above bottom nav
                left: '50%',
                width: '64px', // Slightly larger for better "jump" visibility
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                border: '4px solid var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 60,
                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                cursor: 'pointer'
            }}
        >
            <Plus size={32} color="var(--bg-primary)" strokeWidth={4} />
        </motion.button>
    );
};

export default UGCButton;
