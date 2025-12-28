import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AppSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

const SETTINGS_STORAGE_KEY = 'pomodoro_settings';

const DEFAULT_SETTINGS: AppSettings = {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    theme: 'light',
    autoStart: false,
    soundType: 'bell',
    categories: ['General', 'Coding', 'English', 'Reading', 'Work'],
};

export const useSettingsInternal = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                    categories: parsed.categories || DEFAULT_SETTINGS.categories
                };
            }
            return DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const [loading, setLoading] = useState(false);

    // Sync with Supabase on mount/user change
    useEffect(() => {
        if (!user) return;

        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                    console.error('Error fetching settings:', error);
                    return;
                }

                if (data) {
                    // Remote settings exist, use them
                    setSettings({
                        workDuration: data.work_duration,
                        breakDuration: data.break_duration,
                        longBreakDuration: data.long_break_duration,
                        sessionsUntilLongBreak: data.sessions_until_long_break,
                        theme: data.theme,
                        soundType: data.sound_type,
                        categories: data.categories || DEFAULT_SETTINGS.categories,
                        autoStart: data.auto_start,
                    });
                } else {
                    // No remote settings, upload local settings (Migration)
                    const { error: insertError } = await supabase
                        .from('user_settings')
                        .insert({
                            user_id: user.id,
                            work_duration: settings.workDuration,
                            break_duration: settings.breakDuration,
                            long_break_duration: settings.longBreakDuration,
                            sessions_until_long_break: settings.sessionsUntilLongBreak,
                            theme: settings.theme,
                            sound_type: settings.soundType,
                            categories: settings.categories,
                            auto_start: settings.autoStart,
                        });

                    if (insertError) {
                        console.error('Error migrating settings:', insertError);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    // Apply theme to document
    useEffect(() => {
        const applyTheme = (theme: string) => {
            let effectiveTheme = theme;
            if (theme === 'system') {
                effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', effectiveTheme);
        };

        applyTheme(settings.theme);

        // If system theme, listen for changes
        if (settings.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings.theme]);

    const updateSettings = useCallback(async (newSettings: AppSettings) => {
        // 1. Optimistic update
        setSettings(newSettings);

        // 2. Persist to LocalStorage
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        document.documentElement.setAttribute('data-theme', newSettings.theme);

        // 3. Persist to Supabase if logged in
        if (user) {
            try {
                const { error } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        work_duration: newSettings.workDuration,
                        break_duration: newSettings.breakDuration,
                        long_break_duration: newSettings.longBreakDuration,
                        sessions_until_long_break: newSettings.sessionsUntilLongBreak,
                        theme: newSettings.theme,
                        sound_type: newSettings.soundType,
                        categories: newSettings.categories,
                        auto_start: newSettings.autoStart,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            } catch (err) {
                console.error('Failed to sync settings to Supabase', err);
                // Might want to show a toast here?
            }
        }
    }, [user]);

    return { settings, updateSettings, loading };
};
