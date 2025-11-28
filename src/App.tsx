import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';

// Types
type TimerState = 'idle' | 'running' | 'paused';
type TimerMode = 'work' | 'break';

type FocusSession = {
  id: string;
  date: string;
  range: string;
  minutes: number;
  category: string;
  isoDate: string;
};

type AppSettings = {
  workDuration: number; // minutes
  breakDuration: number; // minutes
  theme: 'light' | 'dark';
  autoStart: boolean;
  soundType: string;
};

// Constants
const RING_RADIUS = 120;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const HISTORY_STORAGE_KEY = 'pomodoro_focus_history';
const SETTINGS_STORAGE_KEY = 'pomodoro_settings';

const SOUNDS = [
  { id: 'bell', name: '🔔 Classic Bell' },
  { id: 'digital', name: '🤖 Digital Beep' },
  { id: 'bird', name: '🐦 Chirp (Simple)' },
];

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

  const toggleTimer = () => {
    setTimerState(prev => {
      if (prev === 'running') return 'paused';
      if (prev === 'idle' && timeLeft === currentTotalTime) {
        setSessionStart(new Date());
      }
      return 'running';
    });
  };

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
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="modal-overlay">
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <h2 className="modal-title">Settings</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {/* Work Duration */}
                <div className="setting-row">
                  <label className="setting-label">
                    Focus Duration: {settings.workDuration} min
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.workDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, workDuration: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Break Duration */}
                <div className="setting-row">
                  <label className="setting-label">
                    Break Duration: {settings.breakDuration} min
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={settings.breakDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, breakDuration: Number(e.target.value) }))}
                    className="w-full accent-green-500"
                  />
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="setting-label">Dark Mode</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
                    className="toggle-switch"
                    data-checked={settings.theme === 'dark'}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                {/* Auto-start Toggle */}
                <div className="flex items-center justify-between">
                  <span className="setting-label">Auto-start Sessions</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                    className="toggle-switch"
                    data-checked={settings.autoStart}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                {/* Sound Selection */}
                <div className="setting-row">
                  <label className="setting-label">Notification Sound</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={settings.soundType}
                      onChange={(e) => setSettings(prev => ({ ...prev, soundType: e.target.value }))}
                      className="setting-input appearance-none flex-1"
                    >
                      {SOUNDS.map(sound => (
                        <option key={sound.id} value={sound.id}>
                          {sound.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => playNotificationSound(settings.soundType)}
                      className="p-2 rounded-xl text-[#7a8ba3] hover:text-[#4A5568] transition-colors"
                      style={{ background: 'var(--bg-element)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' }}
                      title="Preview Sound"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

          <div className="timer-shell">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="timer-ring">
                <svg
                  width={RING_RADIUS * 2 + RING_STROKE * 2}
                  height={RING_RADIUS * 2 + RING_STROKE * 2}
                  viewBox={`0 0 ${RING_RADIUS * 2 + RING_STROKE * 2} ${RING_RADIUS * 2 + RING_STROKE * 2}`}
                >
                  <defs>
                    <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={mode === 'work' ? '#1d4ed8' : '#16a34a'} />
                      <stop offset="100%" stopColor={mode === 'work' ? '#38bdf8' : '#22c55e'} />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="50%"
                    cy="50%"
                    r={RING_RADIUS}
                    stroke="var(--ring-track)"
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeLinecap="round"
                  />

                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r={RING_RADIUS}
                    stroke={ringColor}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE}
                    style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
                    animate={{
                      strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress),
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />

                  <foreignObject
                    x="8%"
                    y="24%"
                    width="84%"
                    height="54%"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="timer-caption">{mode === 'work' ? 'Focus window' : 'Break window'}</div>
                      <div className="timer-time">{formatTime(timeLeft)}</div>
                      <div className="timer-subcopy">
                        {timerState === 'running'
                          ? 'You are in the zone.'
                          : mode === 'work'
                            ? 'Press start and claim a deep work block.'
                            : 'Step away. Let your mind breathe.'}
                      </div>
                    </div>
                  </foreignObject>
                </svg>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-3 mt-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              {timerState === 'running' ? (
                <button onClick={toggleTimer} className="btn btn-secondary">
                  <Pause size={18} />
                  Pause
                </button>
              ) : (
                <button onClick={toggleTimer} className="btn btn-primary">
                  <Play size={18} />
                  {timerState === 'idle' ? 'Start session' : 'Resume'}
                </button>
              )}

              <button
                onClick={resetTimer}
                className="btn btn-secondary"
                disabled={timerState === 'idle' && timeLeft === currentTotalTime}
              >
                <RotateCcw size={18} />
                Reset
              </button>

              {timerState !== 'idle' && (
                <button
                  onClick={finishAndLog}
                  className="btn btn-secondary text-emerald-600"
                >
                  Done
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right: analytics & history card */}
      <div className="history-card">
        <div className="analytics-shell">
          <div className="flex items-center justify-between text-xs text-[#7a8ba3]">
            <span>Total Focus Time</span>
            <span>{totalFocusMinutes} min</span>
          </div>

          <div className="history-panel mt-4">
            {/* Heatmap: always visible */}
            <div className="mb-4">
              <CalendarHeatmap
                startDate={new Date(new Date().setMonth(new Date().getMonth() - 3))}
                endDate={new Date()}
                values={heatmapValues}
                classForValue={(value: { date?: string | Date; count?: number } | undefined) => {
                  if (!value || !value.count) return 'heatmap-empty';
                  if (value.count <= 25) return 'heatmap-level-1';
                  if (value.count <= 50) return 'heatmap-level-2';
                  return 'heatmap-level-3';
                }}
                tooltipDataAttrs={(value: { date?: string | Date; count?: number } | undefined) => {
                  if (!value || !value.date) return {};
                  const label = `${value.date}: ${value.count ?? 0} min`;
                  return { title: label };
                }}
              />
            </div>

            {history.length === 0 ? (
              <div className="history-empty">No completed focus sessions yet.</div>
            ) : (
              <ul className="history-list">
                {history.map(item => (
                  <li key={item.id} className="history-item">
                    <div className="history-row">
                      <span className="history-date">{item.date}</span>
                      <span className="history-minutes">{item.minutes} min</span>
                    </div>
                    <div className="flex items-center justify-between history-range">
                      <span>{item.range}</span>
                      <span className="text-[10px] text-[#94a3b8]">{item.category}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
