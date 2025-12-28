import React from 'react';
import { useFocusHistory } from '../hooks/useFocusHistory';
import { useTasks } from '../contexts/TasksContext';
import { AnalyticsPanel } from '../components/analytics/AnalyticsPanel';
import { TodoList } from '../components/TodoList';
import { useSettings } from '../contexts/SettingsContext'; // Currently unused but just in case
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

import { HistoryList } from '../components/analytics/HistoryList';

export const DashboardPage = () => {
    const { history } = useFocusHistory();
    const { tasks, addTask, toggleTask, deleteTask, activateTask } = useTasks();
    const { settings } = useSettings();

    const activeTaskId = tasks.find(t => t.isActive)?.id || null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Left Col: Analytics & History */}
            <div className="lg:col-span-2 flex flex-col gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1 text-[var(--text-main)]">Dashboard</h2>
                    <p className="text-[var(--text-sub)]">Welcome back, get ready to focus.</p>
                </div>

                <div className="space-y-8">
                    <section>
                        <AnalyticsPanel history={history} />
                    </section>

                    <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                        <HistoryList history={history} />
                    </section>
                </div>
            </div>

            {/* Right Col: Tasks & Quick Actions */}
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-lg font-bold mb-1 text-[var(--text-main)]">Today's Tasks</h3>
                    <p className="text-[var(--text-sub)] text-sm">Prioritize your work.</p>
                </div>
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 min-h-[400px]">
                    <TodoList
                        tasks={tasks}
                        onAddTask={addTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        onActivateTask={activateTask}
                        activeTaskId={activeTaskId}
                    />
                </div>
            </div>
        </div>
    );
};
