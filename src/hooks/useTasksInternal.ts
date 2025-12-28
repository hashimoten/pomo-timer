import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TASKS_STORAGE_KEY = 'pomodoro_tasks';

export const useTasksInternal = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const stored = localStorage.getItem(TASKS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Sync with Supabase
    useEffect(() => {
        if (!user) {
            setHasLoaded(true);
            return;
        }

        const fetchTasks = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const remoteTasks: Task[] = data.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        completed: t.completed,
                        completedPomodoros: t.completed_pomodoros,
                        isActive: t.is_active,
                        estimatedPomodoros: 1,
                        createdAt: new Date(t.created_at).getTime(),
                    }));
                    setTasks(remoteTasks);
                }
                setHasLoaded(true);
            } catch (err) {
                console.error('Error fetching tasks:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user]);

    // Persist local changes
    useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        }
    }, [tasks, hasLoaded]);

    const addTask = useCallback(async (title: string) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            title,
            completed: false,
            estimatedPomodoros: 1,
            completedPomodoros: 0,
            isActive: false,
            createdAt: Date.now(),
        };

        setTasks(prev => [newTask, ...prev]);

        if (user) {
            const { error } = await supabase.from('tasks').insert({
                id: newTask.id,
                user_id: user.id,
                title: newTask.title,
                created_at: new Date(newTask.createdAt).toISOString()
            });
            if (error) console.error('Failed to add task to DB', error);
        }
    }, [user]);

    const toggleTask = useCallback(async (id: string) => {
        setTasks(prev => {
            const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);

            if (user) {
                const task = next.find(t => t.id === id);
                if (task) {
                    supabase.from('tasks').update({ completed: task.completed }).eq('id', id)
                        .then(({ error }) => { if (error) console.error('Failed to toggle task in DB', error); });
                }
            }
            return next;
        });
    }, [user]);

    const deleteTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        if (user) {
            // FK constraint is ON DELETE SET NULL, so sessions will be unlinked automatically
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) console.error('Failed to delete task from DB', error);
        }
    }, [user]);

    const activateTask = useCallback(async (id: string) => {
        setTasks(prev => {
            const next = prev.map(t => ({
                ...t,
                isActive: t.id === id ? !t.isActive : false
            }));

            if (user) {
                const target = next.find(t => t.id === id);
                supabase.from('tasks').update({ is_active: false }).eq('user_id', user.id)
                    .then(({ error: resetError }) => {
                        if (resetError) {
                            console.error('Failed to reset active tasks in DB', resetError);
                            return;
                        }
                        if (target?.isActive) {
                            supabase.from('tasks').update({ is_active: true }).eq('id', id)
                                .then(({ error: activateError }) => {
                                    if (activateError) console.error('Failed to activate task in DB', activateError);
                                });
                        }
                    });
            }

            return next;
        });
    }, [user]);

    const updateTaskProgress = useCallback(async (id: string) => {
        setTasks(prev => {
            const next = prev.map(t =>
                t.id === id ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
            );
            if (user) {
                const task = next.find(t => t.id === id);
                if (task) {
                    supabase.from('tasks').update({ completed_pomodoros: task.completedPomodoros }).eq('id', id).then();
                }
            }
            return next;
        });
    }, [user]);

    return { tasks, addTask, toggleTask, deleteTask, activateTask, updateTaskProgress, loading };
};
