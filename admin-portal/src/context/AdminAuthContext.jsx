import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedAdmin = localStorage.getItem('admin_user');
        if (storedAdmin) {
            const parsed = JSON.parse(storedAdmin);
            if (parsed.role === 'superadmin' || parsed.role === 'admin') {
                setAdmin(parsed);
            } else {
                localStorage.removeItem('admin_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();

            if (response.ok && (data.user.role === 'superadmin' || data.user.role === 'admin')) {
                setAdmin(data.user);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.user && data.user.role !== 'admin'
                        ? "Access Denied: Admin privileges required."
                        : (data.error || "Login failed")
                };
            }
        } catch (error) {
            return { success: false, error: "Network error" };
        }
    };

    const logout = () => {
        setAdmin(null);
        localStorage.removeItem('admin_user');
    };

    return (
        <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};
