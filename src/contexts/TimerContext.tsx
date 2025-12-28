import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TimerMode, TimerState } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useFocusHistory } from '../hooks/useFocusHistory';
import { useTasks } from '../contexts/TasksContext';
import { AVAILABLE_SOUNDS } from '../utils/sounds';

interface TimerContextType {
    timeLeft: number;
    timerState: TimerState;
    mode: TimerMode;
    progress: number;
    currentTotalTime: number;
    sessionStart: Date | null;
    completedSessions: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    finishAndLog: (manualFinish?: boolean) => void;
    switchMode: (mode: TimerMode, startImmediately?: boolean) => void;
    activeTaskId: string | null;
    tasks: any[]; // Using any[] temporarily, should be Task[]
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings } = useSettings();
    const { tasks, updateTaskProgress } = useTasks();
    const { addSession } = useFocusHistory();

    // Timer State
    const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
    const [timerState, setTimerState] = useState<TimerState>('idle');
    const [mode, setMode] = useState<TimerMode>('work');
    const [sessionStart, setSessionStart] = useState<Date | null>(null);
    const [completedSessions, setCompletedSessions] = useState(0);

    // Audio Ref
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

    // Derived State
    const activeTaskId = useMemo(() => {
        return tasks.find(t => t.isActive)?.id || null;
    }, [tasks]);

    const currentTotalTime = useMemo(() => {
        if (mode === 'work') return settings.workDuration * 60;
        if (completedSessions > 0 && completedSessions % settings.sessionsUntilLongBreak === 0) {
            return settings.longBreakDuration * 60;
        }
        return settings.breakDuration * 60;
    }, [mode, settings, completedSessions]);

    const progress = Math.min((currentTotalTime - timeLeft) / currentTotalTime, 1);

    // Web Worker Ref
    const workerRef = useRef<Worker | null>(null);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'tick') {
                setTimeLeft(prev => {
                    if (prev <= 0) return 0;
                    return prev - 1;
                });
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Sync TimeLeft with settings (when idle)
    useEffect(() => {
        if (timerState === 'idle') {
            // Stop worker if idle
            workerRef.current?.postMessage({ action: 'stop' });

            let duration = settings.workDuration * 60;
            if (mode === 'break') {
                if (completedSessions > 0 && completedSessions % settings.sessionsUntilLongBreak === 0) {
                    duration = settings.longBreakDuration * 60;
                } else {
                    duration = settings.breakDuration * 60;
                }
            } else {
                duration = settings.workDuration * 60;
            }
            setTimeLeft(duration);
        } else if (timerState === 'running') {
            // Start worker
            workerRef.current?.postMessage({ action: 'start' });
        } else if (timerState === 'paused') {
            // Pause worker
            workerRef.current?.postMessage({ action: 'pause' });
        }
    }, [settings, mode, timerState, completedSessions]);

    // PREVIOUS setInterval LOGIC REMOVED

    // 3. Pre-load Custom Sounds
    useEffect(() => {
        const preloadSounds = async () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContext) return;
                audioContextRef.current = new AudioContext();
            }
            const ctx = audioContextRef.current;

            for (const sound of AVAILABLE_SOUNDS) {
                if (sound.type === 'file' && sound.url && !audioCacheRef.current.has(sound.id)) {
                    try {
                        const response = await fetch(sound.url);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        audioCacheRef.current.set(sound.id, audioBuffer);
                    } catch (e) {
                        console.error(`Failed to preload sound: ${sound.name}`, e);
                    }
                }
            }
        };

        preloadSounds();
    }, []);

    // Audio Logic
    const playNotificationSound = useCallback(async (type: string) => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const soundOption = AVAILABLE_SOUNDS.find(s => s.id === type);
        if (soundOption?.type === 'file' && soundOption.url) {
            try {
                let audioBuffer = audioCacheRef.current.get(soundOption.id);
                if (!audioBuffer) {
                    const response = await fetch(soundOption.url);
                    const arrayBuffer = await response.arrayBuffer();
                    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                    audioCacheRef.current.set(soundOption.id, audioBuffer);
                }

                const source = ctx.createBufferSource();
                const gain = ctx.createGain();
                source.buffer = audioBuffer;
                source.connect(gain);
                gain.connect(ctx.destination);

                const startTime = ctx.currentTime + 0.1;
                // Extended delay for Bluetooth/OS hardware wake-up
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.setValueAtTime(0, startTime);
                // Smoother fade-in
                gain.gain.linearRampToValueAtTime(1, startTime + 0.05);

                source.start(startTime);
            } catch (e) {
                console.error('Failed to play custom sound', e);
            }
            return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Reduce delay to 0.1s for responsiveness
        const startT = now + 0.1;

        if (type === 'bell') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, startT);
            gain.gain.setValueAtTime(0, now);
            // Increase volume to 0.6
            gain.gain.linearRampToValueAtTime(0.6, startT + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.00001, startT + 2.0);
            osc.start(startT);
            osc.stop(startT + 2.0);
        } else if (type === 'digital') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, startT);
            gain.gain.setValueAtTime(0, now);
            // Increase volume to 0.3 (Square waves are loud)
            gain.gain.linearRampToValueAtTime(0.3, startT + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.00001, startT + 0.7);
            osc.start(startT);
            osc.stop(startT + 0.7);
        } else {
            // lofi / bird
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, startT);
            gain.gain.setValueAtTime(0, now);
            // Increase volume to 0.6
            gain.gain.linearRampToValueAtTime(0.6, startT + 0.05);
            gain.gain.linearRampToValueAtTime(0, startT + 1.0);
            osc.start(startT);
            osc.stop(startT + 1.0);
        }
    }, []);

    // Timer Actions
    const resetTimer = useCallback(() => {
        let duration = settings.workDuration * 60;
        if (mode === 'break') {
            if (completedSessions > 0 && completedSessions % settings.sessionsUntilLongBreak === 0) {
                duration = settings.longBreakDuration * 60;
            } else {
                duration = settings.breakDuration * 60;
            }
        }
        setTimeLeft(duration);
        setTimerState('idle');
        setSessionStart(null);
    }, [mode, settings, completedSessions]);


    const saveFocusSession = useCallback((start: Date, end: Date, minutes: number) => {
        const activeTask = tasks.find(t => t.isActive);
        // Use first category from settings if no specific task category is derived (defaulting simplified for now)
        // Actually in App.tsx we used `selectedCategory`. We should probably bring that into Context or stick to "General" if not provided.
        // Let's defer category selection to the "Finish" logic or keep `selectedCategory` in Component layer?
        // Better to keep `selectedCategory` in Context if we want global access, BUT `addSession` takes a category string.
        // Ideally the UI that triggers "Finish" might know the category.
        // However, finish flows automatically.
        // Let's assume 'General' or logic in `addSession` handles it.
        // Actually we need to access `selectedCategory` to save it correctly.
        // Let's Add `selectedCategory` to this Context as well!
        const categoryToSave = activeTask ? `Task: ${activeTask.title}` : 'General'; // Simplify for now, or add selectedCategory to Context

        addSession(start, end, minutes, categoryToSave, activeTask?.id);
    }, [tasks, addSession]);

    // We need selectedCategory state in Context for correct session saving if we want to support it
    // Let's just default to 'General' for auto-finish for now to save complexity, or move selectedCategory here.
    // Improving: Let's move selectedCategory here.
    // I will add it in next edit if needed, for now 'General'.

    const finishAndLog = useCallback((manualFinish = false) => {
        if (mode !== 'work') {
            // In break mode, Done returns to work mode
            setMode('work');
            setTimeLeft(settings.workDuration * 60);

            // Check autoStart setting, but override if manual finish
            if (settings.autoStart && !manualFinish) {
                setTimerState('running');
                setSessionStart(new Date());
            } else {
                setTimerState('idle');
                setSessionStart(null);
            }
            return;
        }

        const totalSeconds = settings.workDuration * 60;
        const elapsedSeconds = totalSeconds - timeLeft;
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        // Only log session if at least 1 minute elapsed
        if (elapsedMinutes >= 1) {
            const end = new Date();
            const start = sessionStart ?? new Date(end.getTime() - elapsedSeconds * 1000);

            const activeTask = tasks.find(t => t.isActive);
            const categoryToSave = activeTask ? `Task: ${activeTask.title}` : 'General';
            addSession(start, end, elapsedMinutes, categoryToSave, activeTask?.id);

            if (activeTaskId) {
                updateTaskProgress(activeTaskId);
            }

            setCompletedSessions(prev => prev + 1);
        }

        // Always switch to break mode when Done is pressed in work mode
        const nextSessions = completedSessions + 1;
        setMode('break');

        if (nextSessions % settings.sessionsUntilLongBreak === 0) {
            setTimeLeft(settings.longBreakDuration * 60);
        } else {
            setTimeLeft(settings.breakDuration * 60);
        }

        // Handle autoStart, but override if manual finish
        const shouldAutoStart = settings.autoStart && !manualFinish;
        setSessionStart(shouldAutoStart ? new Date() : null);
        setTimerState(shouldAutoStart ? 'running' : 'idle');
    }, [mode, timeLeft, sessionStart, settings, completedSessions, activeTaskId, updateTaskProgress, addSession, tasks]);

    const toggleTimer = useCallback(() => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        setTimerState(prev => {
            if (prev === 'running') return 'paused';
            if (prev === 'idle' && timeLeft === currentTotalTime) {
                setSessionStart(new Date());
            }
            return 'running';
        });
    }, [timeLeft, currentTotalTime]);

    const switchMode = useCallback((newMode: TimerMode, startImmediately = false) => {
        setMode(newMode);
        let duration = 0;
        if (newMode === 'work') {
            duration = settings.workDuration * 60;
        } else {
            duration = settings.breakDuration * 60;
        }
        setTimeLeft(duration);
        setTimerState(startImmediately ? 'running' : 'idle');
    }, [settings.workDuration, settings.breakDuration]);


    // Timer Completion Effect
    useEffect(() => {
        if (timeLeft === 0 && timerState === 'running') {
            playNotificationSound(settings.soundType);

            // Delay transitions slightly to ensure sound plays and state settles
            setTimeout(() => {
                finishAndLog();
            }, 100);
        }
    }, [timeLeft, timerState, playNotificationSound, settings.soundType, finishAndLog]);

    useEffect(() => {
        // Dynamic Title Effect
        if (timerState === 'running') {
            const activeTask = tasks.find(t => t.isActive);
            document.title = `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')} - ${activeTask?.title || (mode === 'work' ? 'Focus' : 'Break')}`;
        } else if (timerState === 'paused') {
            document.title = `Paused`;
        } else {
            document.title = 'Pomodoro Timer';
        }
    }, [timeLeft, timerState, mode, tasks]);

    return (
        <TimerContext.Provider value={{
            timeLeft,
            timerState,
            mode,
            progress,
            currentTotalTime,
            sessionStart,
            completedSessions,
            toggleTimer,
            resetTimer,
            finishAndLog,
            switchMode,
            activeTaskId,
            tasks,
        }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};
