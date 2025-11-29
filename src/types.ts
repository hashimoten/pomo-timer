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
    theme: 'light' | 'dark';
    autoStart: boolean;
    soundType: string;
};
