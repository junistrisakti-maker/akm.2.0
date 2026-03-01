import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './components/Navigation/BottomNav';

const Layout = () => {
    return (
        <div style={{ paddingBottom: '70px', minHeight: '100vh', position: 'relative' }}>
            <main>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
