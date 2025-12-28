import React, { useState } from 'react';
import { Check, Trash2, Plus, Play, Circle, CheckCircle } from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoListProps {
    tasks: Task[];
    onAddTask: (title: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onActivateTask: (id: string) => void;
    activeTaskId: string | null;
}

export const TodoList: React.FC<TodoListProps> = ({
    tasks,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onActivateTask,
    activeTaskId,
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onAddTask(newTaskTitle);
        setNewTaskTitle('');
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        // Active task first
        if (a.id === activeTaskId) return -1;
        if (b.id === activeTaskId) return 1;
        // Then incomplete first
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Then newer first
        return b.createdAt - a.createdAt;
    });

    return (
        <div className="flex flex-col h-full">
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 px-2 py-2 outline-none focus:border-[var(--text-accent)] transition-colors placeholder-gray-400"
                    />
                    <button
                        type="submit"
                        className="p-2 bg-[var(--text-accent)] text-white rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                        disabled={!newTaskTitle.trim()}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
                <AnimatePresence mode="wait" initial={false}>
                    {tasks.length > 0 ? (
                        sortedTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className={`group flex items-center p-3 rounded-2xl transition-all ${task.id === activeTaskId
                                    ? 'bg-blue-50 dark:bg-blue-900/20 shadow-neumorph-inset ring-2 ring-[var(--text-accent)] transform scale-[1.02]'
                                    : 'bg-[var(--bg-element)] shadow-neumorph-sm hover:shadow-neumorph-md'
                                    } ${task.completed ? 'opacity-60' : ''}`}
                            >
                                <button
                                    onClick={() => onToggleTask(task.id)}
                                    className="mr-3 text-gray-400 hover:text-[var(--text-accent)] transition-colors"
                                >
                                    {task.completed ? <CheckCircle size={22} className="text-green-500" /> : <Circle size={22} />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`font-semibold truncate ${task.completed ? 'line-through text-[var(--text-sub)]' : 'text-[var(--text-main)]'
                                            }`}
                                    >
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-sub)]">
                                        <span className="font-semibold text-[var(--text-accent)]">
                                            {task.completedPomodoros}
                                        </span>
                                        <span>pomodoros</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!task.completed && (
                                        <button
                                            onClick={() => onActivateTask(task.id)}
                                            className={`p-2 rounded-xl transition-all ${task.id === activeTaskId
                                                ? 'text-[var(--text-accent)] bg-blue-100 dark:bg-blue-800/30'
                                                : 'text-gray-400 hover:text-[var(--text-accent)] hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            title={task.id === activeTaskId ? 'Active Task' : 'Focus on this task'}
                                        >
                                            <Play size={task.id === activeTaskId ? 20 : 18} fill={task.id === activeTaskId ? 'currentColor' : 'none'} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDeleteTask(task.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-center text-gray-400 mt-10"
                        >
                            <p>No tasks yet.</p>
                            <p className="text-sm">Add one to get started!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
