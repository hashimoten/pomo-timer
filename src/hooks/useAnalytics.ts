import { useMemo } from 'react';
import { FocusSession } from '../types';
import {
    startOfDay,
    subDays,
    format,
    eachDayOfInterval,
    isSameDay,
    startOfWeek,
    endOfWeek,
    getHours
} from 'date-fns';

export type DailyActivity = {
    date: string;
    minutes: number;
    label: string; // "Mon", "12/01" etc
};

export type CategoryDistribution = {
    name: string;
    value: number;
};

export type HourlyActivity = {
    hour: number;
    minutes: number;
};

export const useAnalytics = (history: FocusSession[]) => {
    // 1. Summary Stats
    const summary = useMemo(() => {
        const totalMinutes = history.reduce((acc, sess) => acc + sess.minutes, 0);
        const totalSessions = history.length;

        // Average Daily (Last 30 days active days?) or just overall average?
        // Let's do average over the unique days present in history for now, or last 7 days.
        // Simple average per session
        const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

        // Get today's date string in local timezone (YYYY-MM-DD format)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const todayMinutes = history
            .filter(h => h.isoDate === todayStr)
            .reduce((acc, sess) => acc + sess.minutes, 0);

        return {
            totalMinutes,
            totalSessions,
            avgSessionMinutes,
            todayMinutes
        };
    }, [history]);

    // 2. Weekly Activity (Last 7 days)
    const weeklyActivity = useMemo<DailyActivity[]>(() => {
        const end = startOfDay(new Date());
        const start = subDays(end, 6);
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const minutes = history
                .filter(h => isSameDay(new Date(h.isoDate || h.date), day))
                .reduce((sum, h) => sum + h.minutes, 0);

            return {
                date: format(day, 'yyyy-MM-dd'),
                minutes,
                label: format(day, 'EEE'), // Mon, Tue...
            };
        });
    }, [history]);

    // 3. Category Distribution
    const categoryStats = useMemo<CategoryDistribution[]>(() => {
        const stats: Record<string, number> = {};
        history.forEach(session => {
            const cat = session.category || 'Uncategorized';
            stats[cat] = (stats[cat] || 0) + session.minutes;
        });

        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [history]);

    // 4. Hourly Distribution (Heatmap-like)
    const hourlyStats = useMemo<HourlyActivity[]>(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, minutes: 0 }));

        history.forEach(session => {
            // Parse start time from range if only range exists, or rely on isoDate?
            // Wait, history items have `date` and `range` strings, and `isoDate`.
            // To accurately get the hour, we ideally need the exact start timestamp.
            // The current `FocusSession` type has `date` (string), `range` (string "HH:MM - HH:MM"), `isoDate` (string "YYYY-MM-DD").
            // We can parse the hour from the `range` string.
            // range format: "HH:mm - HH:mm" (24h format from App.tsx logic)

            try {
                const rangeStart = session.range.split(' - ')[0]; // "14:30"
                const [hStr] = rangeStart.split(':');
                const hour = parseInt(hStr, 10);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    hours[hour].minutes += session.minutes;
                }
            } catch (e) {
                // ignore malformed data
            }
        });

        return hours;
    }, [history]);

    // 5. Heatmap Data (Last 18 weeks - ~4.5 months)
    const heatmapData = useMemo(() => {
        const today = new Date();
        const end = endOfWeek(today);
        const start = startOfWeek(subDays(end, 18 * 7 - 1)); // 18 weeks

        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const minutes = history
                .filter(h => isSameDay(new Date(h.isoDate || h.date), day))
                .reduce((sum, h) => sum + h.minutes, 0);

            // Level 0-4
            let level = 0;
            if (minutes > 0) level = 1;
            if (minutes > 25) level = 2;
            if (minutes > 60) level = 3;
            if (minutes > 120) level = 4;

            return {
                date: dateStr,
                count: minutes,
                level,
                month: format(day, 'MMM'), // Add month for labeling
                dayOfMonth: format(day, 'd')
            };
        });
    }, [history]);

    return {
        summary,
        weeklyActivity,
        categoryStats,
        hourlyStats,
        heatmapData
    };
};
