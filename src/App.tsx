import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { AppSettings, FocusSession, TimerMode, TimerState } from './types';

// Constants
const HISTORY_STORAGE_KEY = 'pomodoro_focus_history';
const SETTINGS_STORAGE_KEY = 'pomodoro_settings';

const DEFAULT_SETTINGS: AppSettings = {
  workDuration: 25,
  breakDuration: 5,
  theme: 'light',
  autoStart: false,
  soundType: 'bell',
};

const playNotificationSound = (type: string) => {
  // Web Audio API context creation
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Sound configuration
  if (type === 'bell') {
    // Bell-like sound (sine wave, longer decay)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } else if (type === 'digital') {
    // Digital beep (square wave, short)
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } else {
    // Default / Chirp (triangle wave)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function App() {
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Timer State
  // Initialize timeLeft based on current settings
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [mode, setMode] = useState<TimerMode>('work');
  const [sessionStart, setSessionStart] = useState<Date | null>(null);

  // History State
  const [history, setHistory] = useState<FocusSession[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FocusSession>[];
        return parsed.map(item => {
          const category = item.category ?? 'General';
          let isoDate = item.isoDate;
          if (!isoDate && item.date) {
            const parts = String(item.date).split('/');
            if (parts.length === 3) {
              const [year, month, day] = parts;
              isoDate = `${year}-${month}-${day}`;
            }
          }
          return {
            id: String(item.id ?? Math.random()),
            date: String(item.date ?? ''),
            range: String(item.range ?? ''),
            minutes: Number(item.minutes ?? 0),
            category,
            isoDate: isoDate ?? new Date().toISOString().slice(0, 10),
          } as FocusSession;
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('General');

  // Derived State
  const currentTotalTime = mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60;
  const progress = Math.min((currentTotalTime - timeLeft) / currentTotalTime, 1);
  const totalFocusMinutes = history.reduce((sum, item) => sum + item.minutes, 0);

  // Effects
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Dynamic Title Effect
  useEffect(() => {
    if (timerState === 'running') {
      document.title = `${formatTime(timeLeft)} - ${mode === 'work' ? 'Focus' : 'Break'}`;
    } else if (timerState === 'paused') {
      document.title = `Paused - ${formatTime(timeLeft)}`;
    } else {
      document.title = 'Pomodoro Timer';
    }
  }, [timeLeft, timerState, mode]);

  // Timer Logic
  const resetTimer = useCallback(() => {
    setTimeLeft(mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
    setTimerState('idle');
    setSessionStart(null);
  }, [mode, settings.workDuration, settings.breakDuration]);

  // When settings change, if timer is idle, update the time left immediately
  useEffect(() => {
    if (timerState === 'idle') {
      setTimeLeft(mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
    }
  }, [settings.workDuration, settings.breakDuration, mode, timerState]);

  const saveFocusSession = useCallback((start: Date, end: Date, minutes: number) => {
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
    const isoDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      .toISOString()
      .slice(0, 10);

    setHistory(prevHistory => [
      {
        id: `${end.getTime()}`,
        date: dateLabel,
        range,
        minutes,
        category: selectedCategory,
        isoDate,
      },
      ...prevHistory,
    ]);
  }, [selectedCategory]);

  const finishAndLog = useCallback(() => {
    if (mode !== 'work') {
      resetTimer();
      return;
    }
    const totalSeconds = settings.workDuration * 60;
    const elapsedSeconds = totalSeconds - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 1) {
      resetTimer();
      return;
    }

    const end = new Date();
    const start = sessionStart ?? new Date(end.getTime() - elapsedSeconds * 1000);

    saveFocusSession(start, end, elapsedMinutes);
    setSessionStart(null);
    setTimeLeft(settings.workDuration * 60);
    setTimerState('idle');
  }, [mode, timeLeft, sessionStart, resetTimer, saveFocusSession, settings.workDuration]);

  const toggleTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev === 'running') return 'paused';
      if (prev === 'idle' && timeLeft === currentTotalTime) {
        setSessionStart(new Date());
      }
      return 'running';
    });
  }, [timeLeft, currentTotalTime]);

  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts if user is typing in an input (e.g. settings)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        toggleTimer();
      } else if (e.code === 'KeyR') {
        resetTimer();
      } else if (e.code === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer, isSettingsOpen]);

  const switchMode = useCallback((newMode: TimerMode, startImmediately = false) => {
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
    setTimerState(startImmediately ? 'running' : 'idle');
  }, [settings.workDuration, settings.breakDuration]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (timerState === 'running') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Play notification sound
            playNotificationSound(settings.soundType);

            if (mode === 'work' && sessionStart) {
              const end = new Date();
              const durationMinutes = settings.workDuration;
              saveFocusSession(sessionStart, end, durationMinutes);
              setSessionStart(null);
            }
            const newMode = mode === 'work' ? 'break' : 'work';

            if (settings.autoStart) {
              switchMode(newMode, true);
              // Return the new duration immediately to avoid a flicker or 0 state
              return newMode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60;
            } else {
              switchMode(newMode, false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, mode, switchMode, sessionStart, settings.workDuration, settings.breakDuration, saveFocusSession, settings.autoStart]);

  const ringColor = mode === 'work' ? 'var(--ring-work)' : 'var(--ring-break)';

  const heatmapValues = useMemo(() => {
    const totals = new Map<string, number>();
    history.forEach(item => {
      if (!item.isoDate) return;
      const prev = totals.get(item.isoDate) ?? 0;
      totals.set(item.isoDate, prev + item.minutes);
    });
    return Array.from(totals.entries()).map(([date, minutes]) => ({
      date,
      count: minutes,
    }));
  }, [history]);

  return (
    <div className="layout-main">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onPlaySound={playNotificationSound}
      />

      {/* Left: timer card */}
      <div className="timer-card relative">
        {/* Settings Button (Absolute Position) */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-6 right-6 p-2 rounded-full text-[#7a8ba3] hover:text-[#4A5568] transition-colors z-10"
          style={{ background: 'var(--bg-element)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }}
        >
          <Settings size={20} />
        </button>

        <div className="timer-column-inner">
          <div className="app-header pr-12">
            <div className="flex flex-col gap-1">
              <h1 className="app-title">Pomodoro</h1>
              <span className="app-badge">Focused Sessions</span>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className="mode-toggle"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <button
                  onClick={() => switchMode('work')}
                  className={`mode-pill ${mode === 'work' ? 'mode-pill--active' : ''}`}
                >
                  Work
                </button>
                <button
                  onClick={() => switchMode('break')}
                  className={`mode-pill ${mode === 'break' ? 'mode-pill--active' : ''}`}
                >
                  Break
                </button>
              </motion.div>
            </div>
          </div>

          <div className="mt-4 w-full flex flex-wrap gap-2 category-bar">
            {['General', 'Coding', 'English', 'Reading', 'Work'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${selectedCategory === cat ? 'category-pill--active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <TimerDisplay
            mode={mode}
            timeLeft={timeLeft}
            timerState={timerState}
            progress={progress}
            ringColor={ringColor}
          />

          <Controls
            timerState={timerState}
            timeLeft={timeLeft}
            currentTotalTime={currentTotalTime}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onFinish={finishAndLog}
          />
        </div>
      </div>

      {/* Right: analytics & history card */}
      <HistoryPanel
        history={history}
        totalFocusMinutes={totalFocusMinutes}
        heatmapValues={heatmapValues}
      />
    </div>
  );
}

export default App;
