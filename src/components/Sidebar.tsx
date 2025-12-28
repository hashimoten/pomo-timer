import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Timer, ListTodo, Settings, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTimer } from '../contexts/TimerContext';
import { motion } from 'framer-motion';

interface SidebarProps {
    onSignInClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSignInClick }) => {
    const { user, signOut } = useAuth();
    const { timeLeft, mode, timerState, progress } = useTimer();

    // Format time for display
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');

    const navItems = [
        { path: '/', icon: Timer, label: 'Focus' },
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="w-64 h-screen bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
            {/* Logo / Header */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--text-accent)] to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    P
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">Pomodoro</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-[var(--bg-hover)] text-[var(--text-accent)] font-medium shadow-sm'
                                : 'text-[var(--text-sub)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Mini Timer (If running or paused, mostly for visual feedback) */}
            <div className="px-6 py-4 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-[var(--text-sub)] tracking-wider">
                        {mode === 'work' ? 'Focusing' : 'Break'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${timerState === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {timerState === 'running' ? 'Active' : 'Idle'}
                    </span>
                </div>
                <div className="text-2xl font-mono font-bold text-[var(--text-main)] mb-2">
                    {mins}:{secs}
                </div>
                {/* Simple Progres Bar */}
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[var(--text-accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-[var(--border-color)]">
                {user ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-[var(--text-main)] truncate">{user.email?.split('@')[0]}</p>
                            <button onClick={() => signOut()} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                                <LogOut size={10} /> Sign Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onSignInClick}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-[var(--text-sub)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <UserIcon size={20} />
                        <span className="text-sm">Sign In</span>
                    </button>
                )}
            </div>
        </aside>
    );
};
