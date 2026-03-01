import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
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

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Server response was not JSON:", text);
                return { success: false, error: `Server error: ${text.substring(0, 100)}...` };
            }

            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, error: data.error || "Login failed" };
            }
        } catch (error) {
            console.error("Login fetch error:", error);
            return { success: false, error: "Network error: Connection refused" };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await fetch('http://localhost/AKM.2.0/api/auth.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: "Network error" };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser) => {
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateUser,
        loading,
        isSuperadmin: () => user?.role === 'superadmin',
        isAdmin: () => user?.role === 'admin' || user?.role === 'superadmin',
        managedMosqueId: user?.managed_mosque_id,
        canManageMosque: (mosqueId) => user?.role === 'superadmin' || (user?.role === 'admin' && parseInt(user?.managed_mosque_id) === parseInt(mosqueId))
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
