import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initial theme from localStorage or 'system'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('akm-theme') || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const body = window.document.body;

        const applyTheme = (currentTheme) => {
            let actualTheme = currentTheme;

            if (currentTheme === 'system') {
                actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            console.log('🎨 Theme Change:', { currentTheme, actualTheme });

            if (actualTheme === 'light') {
                root.setAttribute('data-theme', 'light');
                console.log('✅ Applied light theme - data-theme attribute set');
            } else {
                root.removeAttribute('data-theme');
                console.log('✅ Applied dark theme - data-theme attribute removed');
            }
        };

        applyTheme(theme);
        localStorage.setItem('akm-theme', theme);

        // Listen for system theme changes if in 'system' mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') applyTheme('system');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
