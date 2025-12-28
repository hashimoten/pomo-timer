import React, { useRef, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { SettingsModal } from '../components/SettingsModal';
// We should refactor SettingsModal to be a page content or re-use it.
// The SettingsModal is designed as a Modal.
// Let's create a SettingsContent wrapper or just render the content of SettingsModal here.
// For now, to save time, I will Render the SettingsModal content if I can extract it, 
// OR I'll just keep the modal pattern for global settings and this page can be "Process/Account" settings.
// Actually, a nice "Settings Page" is better than a modal for a dashboard app.
// I should probably extract the form from SettingsModal into `SettingsForm`.
// But for this step, I will just Re-implement the UI or Wrap the modal's internal logic.
// Let's look at SettingsModal... it has a lot of UI.
// Strategy: I'll make this page a placeholder for now that opens the modal, OR better:
// I will render the SettingsModal *without* the overlay/portal if possible, or just copy the inputs for now.
// Refactoring SettingsModal to `SettingsForm` is the clean way.

// Let's create a simplified Settings Page reusing the hooks.
import { Volume2, Moon, Sun, Monitor, Timer as TimerIcon, List, Plus, X, User as UserIcon, LogOut } from 'lucide-react';
import { AVAILABLE_SOUNDS } from '../utils/sounds';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage = () => {
    const { user, signOut } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [newCategory, setNewCategory] = React.useState('');
    const audioContextRef = useRef<AudioContext | null>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const addCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !settings.categories.includes(trimmed)) {
            updateSettings({ ...settings, categories: [...settings.categories, trimmed] });
            setNewCategory('');
        }
    };

    const removeCategory = (cat: string) => {
        updateSettings({ ...settings, categories: settings.categories.filter(c => c !== cat) });
    };

    // Copied logic from simplified SettingsModal thought process
    const handleChange = (key: keyof typeof settings, value: any) => {
        updateSettings({ ...settings, [key]: value });
    };

    // Sound preview function
    const playPreviewSound = useCallback(async (type: string) => {
        // Clear any existing preview
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }

        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        // Check if it's a file-based sound (MP3)
        const soundOption = AVAILABLE_SOUNDS.find(s => s.id === type);
        if (soundOption?.type === 'file' && soundOption.url) {
            try {
                const response = await fetch(soundOption.url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

                const source = ctx.createBufferSource();
                const gain = ctx.createGain();
                source.buffer = audioBuffer;
                source.connect(gain);
                gain.connect(ctx.destination);

                const startTime = ctx.currentTime + 0.5;
                // Extended delay for Bluetooth/OS hardware wake-up
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.setValueAtTime(0, startTime);
                // Smoother fade-in
                gain.gain.linearRampToValueAtTime(1, startTime + 0.05);

                source.start(startTime);
                // Stop after 3 seconds
                setTimeout(() => source.stop(), 3000);
            } catch (e) {
                console.error('Failed to play custom sound', e);
            }
            return;
        }

        // Oscillator-based sounds
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Play for 3 seconds
        const duration = 3;

        if (type === 'bell') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now + 0.5);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.55);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
            osc.start(now + 0.5);
            osc.stop(now + duration);
        } else if (type === 'digital') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now + 0.5);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.55);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
            osc.start(now + 0.5);
            osc.stop(now + duration);
        } else {
            // lofi / bird
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now + 0.5);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.55);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            osc.start(now + 0.5);
            osc.stop(now + duration);
        }
    }, []);

    const handleSoundChange = (value: string) => {
        handleChange('soundType', value);
        playPreviewSound(value);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Settings</h2>
                <p className="text-[var(--text-sub)]">Customize your focus environment.</p>
            </div>

            <div className="space-y-6">
                {/* Timer Settings */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-accent)]">
                        <TimerIcon size={20} />
                        <h3 className="font-semibold">Timer Durations (minutes)</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-sub)] mb-1">Focus</label>
                            <input
                                type="number"
                                value={settings.workDuration}
                                onChange={(e) => handleChange('workDuration', Number(e.target.value))}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-main)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-sub)] mb-1">Short Break</label>
                            <input
                                type="number"
                                value={settings.breakDuration}
                                onChange={(e) => handleChange('breakDuration', Number(e.target.value))}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-main)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-sub)] mb-1">Long Break</label>
                            <input
                                type="number"
                                value={settings.longBreakDuration}
                                onChange={(e) => handleChange('longBreakDuration', Number(e.target.value))}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-main)]"
                            />
                        </div>
                    </div>
                </section>

                {/* Appearance & Sound */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-accent)]">
                        <Monitor size={20} />
                        <h3 className="font-semibold">Appearance & Sound</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-[var(--text-main)]">Auto Start Sessions</label>
                                <p className="text-xs text-[var(--text-sub)]">Automatically start break after focus, and focus after break.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${settings.autoStart ? 'text-[var(--text-accent)]' : 'text-[var(--text-sub)]'}`}>
                                    {settings.autoStart ? 'ON' : 'OFF'}
                                </span>
                                <button
                                    onClick={() => handleChange('autoStart', !settings.autoStart)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.autoStart ? 'bg-[var(--text-accent)]' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoStart ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-main)]">Theme</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => handleChange('theme', e.target.value)}
                                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-main)]"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-main)]">Sound</label>
                            <select
                                value={settings.soundType}
                                onChange={(e) => handleSoundChange(e.target.value)}
                                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-main)]"
                            >
                                {AVAILABLE_SOUNDS.map(sound => (
                                    <option key={sound.id} value={sound.id}>{sound.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-accent)]">
                        <List size={20} />
                        <h3 className="font-semibold">Categories</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                placeholder="Add new category..."
                                className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)]"
                            />
                            <button
                                onClick={addCategory}
                                className="p-2 bg-[var(--text-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {settings.categories.map((cat) => (
                                <div
                                    key={cat}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-main)] group"
                                >
                                    <span>{cat}</span>
                                    <button
                                        onClick={() => removeCategory(cat)}
                                        className="p-0.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {settings.categories.length === 0 && (
                            <p className="text-sm text-[var(--text-sub)] italic text-center py-4">
                                No categories yet. Add one to start tracking!
                            </p>
                        )}
                    </div>
                </section>
                {/* Account Section */}
                <section className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[var(--text-accent)]">
                        <UserIcon size={20} />
                        <h3 className="font-semibold">Account</h3>
                    </div>
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--text-main)]">{user.email}</p>
                                <p className="text-xs text-[var(--text-sub)]">You are currently signed in.</p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-[var(--text-sub)] mb-4">Sign in to sync your tasks and settings across devices.</p>
                            <p className="text-sm italic text-[var(--text-muted)]">Please use the "Sign In" button in the sidebar to log in.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
