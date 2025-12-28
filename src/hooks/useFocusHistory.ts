import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FocusSession } from '../types';
import { useAuth } from '../contexts/AuthContext';

const HISTORY_STORAGE_KEY = 'pomodoro_focus_history';

export const useFocusHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<FocusSession[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Migration/Fix: If the date label corresponds to today but isoDate is wrong (timezone bug), fix it.
        const today = new Date();
        const todayLabel = today.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const hasWrongTodayData = history.some(h => h.date === todayLabel && h.isoDate !== todayStr);
        if (hasWrongTodayData) {
            setHistory(prev => prev.map(h =>
                (h.date === todayLabel && h.isoDate !== todayStr)
                    ? { ...h, isoDate: todayStr }
                    : h
            ));
        }

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('focus_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('start_time', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    const remoteHistory: FocusSession[] = data.map((s: any) => ({
                        id: s.id,
                        date: new Date(s.start_time).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                        range: `${new Date(s.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.end_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
                        minutes: s.duration_minutes,
                        category: s.category || 'General',
                        isoDate: s.iso_date || s.start_time.slice(0, 10),
                    }));
                    setHistory(remoteHistory);
                } else {
                    // Migration
                    if (history.length > 0) {
                        // Warning: Batch inserting massive history might fail. Chunking is better but keeping simple.
                        // Also local history doesn't have start/end times perfectly preserved for old entries if not in that format?
                        // The old history format is: id (string), date (string label), range (string label), minutes, category, isoDate.
                        // We need to approximate timestamps from labels if possible, or just default to now?
                        // Actually the `saveFocusSession` creates good data. But old data?
                        // Let's try to parse.

                        const historyToInsert = history.map(h => {
                            // Try to reconstruct timestamps. If impossible, skip or use current?
                            // Ideally we just keep them in local or basic display. 
                            // For Supabase, we need valid timestamps.
                            // Let's skip migration of old messy data for now to avoid errors, 
                            // OR insert with "now" (bad idea).

                            // If we have ISO date, we can set start time to noon that day.
                            const start = new Date(h.isoDate);
                            start.setHours(9, 0, 0); // Default 9 AM
                            const end = new Date(start.getTime() + h.minutes * 60000);

                            return {
                                user_id: user.id,
                                start_time: start.toISOString(),
                                end_time: end.toISOString(),
                                duration_minutes: h.minutes,
                                category: h.category,
                                iso_date: h.isoDate
                            };
                        });

                        const { error: insertError } = await supabase
                            .from('focus_sessions')
                            .insert(historyToInsert);

                        if (insertError) console.error("History migration failed", insertError);
                    }
                }
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    // Persist local
    useEffect(() => {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    const addSession = useCallback(async (
        start: Date,
        end: Date,
        minutes: number,
        category: string,
        connectedTaskId?: string
    ) => {
        const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const dateLabel = dateFormatter.format(start);
        const range = `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
        // Use local date formatting to avoid timezone issues (toISOString converts to UTC)
        const isoDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

        const newSession: FocusSession = {
            id: crypto.randomUUID(),
            date: dateLabel,
            range,
            minutes,
            category,
            isoDate,
        };

        setHistory(prev => [newSession, ...prev]);

        if (user) {
            await supabase.from('focus_sessions').insert({
                id: newSession.id,
                user_id: user.id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                duration_minutes: minutes,
                category: category,
                iso_date: isoDate,
                connected_task_id: connectedTaskId || null
            });
        }
    }, [user]);

    // For importing CSV (manual set)
    const setHistoryManual = useCallback((newHistory: FocusSession[]) => {
        setHistory(newHistory);
        // We don't auto-sync import to DB yet, too risky/complex.
        alert("Note: Imported history is saved locally only for now.");
    }, []);

    return { history, addSession, setHistoryManual, loading };
};
