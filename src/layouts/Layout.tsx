import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';

import { useState } from 'react';

export const Layout = () => {
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <div className="flex bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] font-sans">
            <Sidebar onSignInClick={() => setIsAuthModalOpen(true)} />
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};
