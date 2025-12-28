import React from 'react';
import { FocusSession } from '../../types';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag } from 'lucide-react';

interface HistoryListProps {
    history: FocusSession[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
    // Show last 20 sessions
    const recentHistory = history.slice(0, 20);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Clock size={20} className="text-[var(--text-accent)]" />
                    History
                </h3>
                <span className="text-xs text-[var(--text-sub)]">{history.length} sessions total</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {recentHistory.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-sub)] italic bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                        No history yet. Start a session!
                    </div>
                ) : (
                    recentHistory.map((session, index) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="history-item-glass p-4 rounded-2xl flex flex-col gap-2 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                                    <Calendar size={14} className="opacity-60" />
                                    {session.date}
                                </div>
                                <div className="text-sm font-bold text-[var(--text-accent)]">
                                    {session.minutes} min
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-xs text-[var(--text-sub)] flex items-center gap-1.5">
                                    <Clock size={14} className="opacity-60" />
                                    {session.range}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-sub)] flex items-center gap-1 border border-[var(--border-color)]">
                                    <Tag size={10} />
                                    {session.category}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
