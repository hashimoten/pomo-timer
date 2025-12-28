import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';

import { useState } from 'react';

import { Menu, X } from 'lucide-react';

export const Layout = () => {
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] font-sans">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-30 px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        className="p-2 -ml-2 rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                    >
                        {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-bold text-lg">Pomodoro</span>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <Sidebar
                onSignInClick={() => setIsAuthModalOpen(true)}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <main className="flex-1 w-full md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
                <Outlet />
            </main>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};
