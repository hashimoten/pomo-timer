import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  theme: 'light',
  autoStart: false,
  soundType: 'bell',
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
  const [completedSessions, setCompletedSessions] = useState(0);

  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(async (type: string) => {
    // Web Audio API context creation
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

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
  }, []);

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
  const currentTotalTime = useMemo(() => {
    if (mode === 'work') return settings.workDuration * 60;
    if (completedSessions > 0 && completedSessions % settings.sessionsUntilLongBreak === 0) {
      return settings.longBreakDuration * 60;
    }
    return settings.breakDuration * 60;
  }, [mode, settings.workDuration, settings.breakDuration, settings.longBreakDuration, settings.sessionsUntilLongBreak, completedSessions]);

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
    // Determine duration based on current mode and session count
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

  // When settings change, if timer is idle, update the time left immediately
  useEffect(() => {
    if (timerState === 'idle') {
      resetTimer();
    }
  }, [settings.workDuration, settings.breakDuration, settings.longBreakDuration, mode, timerState, resetTimer]);

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
      // Finished break
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      setTimerState('idle');
      return;
    }

    // Finished Work
    const totalSeconds = settings.workDuration * 60;
    const elapsedSeconds = totalSeconds - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes >= 1) {
      const end = new Date();
      const start = sessionStart ?? new Date(end.getTime() - elapsedSeconds * 1000);
      saveFocusSession(start, end, elapsedMinutes);

      // Increment completed sessions
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);

      // Determine next mode and duration
      setMode('break');
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimeLeft(settings.breakDuration * 60);
      }
    } else {
      // Too short, just reset
      setTimeLeft(settings.workDuration * 60);
    }

    setSessionStart(null);
    setTimerState('idle');
  }, [mode, timeLeft, sessionStart, saveFocusSession, settings, completedSessions]);

  const toggleTimer = useCallback(() => {
    // Initialize/Resume AudioContext on user interaction
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
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

  // Keyboard Shortcuts Effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
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
    let duration = 0;
    if (newMode === 'work') {
      duration = settings.workDuration * 60;
    } else {
      // If manually switching to break, assume short break unless we want to be smart.
      // Let's stick to short break for manual switch for simplicity, or check session count.
      // If we manually switch, maybe we shouldn't increment session count?
      // Let's just use breakDuration for manual switch.
      duration = settings.breakDuration * 60;
    }
    setTimeLeft(duration);
    setTimerState(startImmediately ? 'running' : 'idle');
  }, [settings.workDuration, settings.breakDuration]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (timerState === 'running') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer Finished
            playNotificationSound(settings.soundType);

            if (mode === 'work') {
              // Work Session Finished
              if (sessionStart) {
                const end = new Date();
                const durationMinutes = settings.workDuration;
                saveFocusSession(sessionStart, end, durationMinutes);
                setSessionStart(null);
              }

              const newCompletedSessions = completedSessions + 1;
              setCompletedSessions(newCompletedSessions);

              const newMode = 'break';
              setMode(newMode);

              let nextDuration = settings.breakDuration * 60;
              if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                nextDuration = settings.longBreakDuration * 60;
              }

              if (settings.autoStart) {
                setTimerState('running');
                // We need to return the new duration here
                return nextDuration;
              } else {
                setTimerState('idle');
                return nextDuration; // Display the next duration
              }
            } else {
              // Break Finished
              setMode('work');
              const nextDuration = settings.workDuration * 60;

              if (settings.autoStart) {
                setTimerState('running');
                setSessionStart(new Date()); // Start new session tracking
                return nextDuration;
              } else {
                setTimerState('idle');
                return nextDuration;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, mode, sessionStart, settings, saveFocusSession, completedSessions, playNotificationSound]);

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

  // Data Backup Handlers
  const handleExportHistory = () => {
    const headers = ['Date', 'Range', 'Minutes', 'Category', 'ISO Date'];
    const rows = history.map(item => [
      item.date,
      item.range,
      item.minutes,
      item.category,
      item.isoDate
    ].map(val => `"${val}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pomodoro_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportHistory = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        // Simple CSV parser
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 2) return; // Header + 1 row

        const newHistory: FocusSession[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Handle quotes if strictly needed, but simple split for now
          // A robust CSV parser is better, but this is a simple implementation
          const parts = line.split(',').map(p => p.replace(/^"|"$/g, ''));

          if (parts.length >= 5) {
            newHistory.push({
              id: Math.random().toString(36).substr(2, 9),
              date: parts[0],
              range: parts[1],
              minutes: Number(parts[2]),
              category: parts[3],
              isoDate: parts[4],
            });
          }
        }

        // Merge with existing history (avoid duplicates based on some criteria if needed, but here we just append or replace?)
        // User asked to "integrate or overwrite". Let's append for safety, or maybe replace?
        // "内容を解析して現在の history に統合（または上書き）" -> Let's merge.
        setHistory(prev => [...newHistory, ...prev]);
        alert(`Successfully imported ${newHistory.length} sessions.`);
      } catch (err) {
        console.error('Failed to parse CSV', err);
        alert('Failed to parse the file. Please ensure it is a valid CSV.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="layout-main">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onPlaySound={playNotificationSound}
        onExportHistory={handleExportHistory}
        onImportHistory={handleImportHistory}
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
                  Focus
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
            sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
            completedSessions={completedSessions}
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
