export type TimerState = 'idle' | 'running' | 'paused';
export type TimerMode = 'work' | 'break';

export type FocusSession = {
    id: string;
    date: string;
    range: string;
    minutes: number;
    category: string;
    isoDate: string;
};

export type AppSettings = {
    workDuration: number; // minutes
    breakDuration: number; // minutes
    longBreakDuration: number; // minutes
    sessionsUntilLongBreak: number;
    theme: 'light' | 'dark' | 'system';
    autoStart: boolean;
    soundType: 'bell' | 'digital' | 'bird' | 'custom'; // Added 'custom'
    customSoundUrl?: string; // Optional URL for custom sound
    categories: string[];
};

export interface Task {
    id: string;
    title: string;
    completed: boolean;
    estimatedPomodoros: number;
    completedPomodoros: number;
    isActive: boolean;
    createdAt: number;
}
