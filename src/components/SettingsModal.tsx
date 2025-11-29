import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    onPlaySound: (type: string) => void;
}

const SOUNDS = [
    { id: 'bell', name: '🔔 Classic Bell' },
    { id: 'digital', name: '🤖 Digital Beep' },
    { id: 'bird', name: '🐦 Chirp (Simple)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    onPlaySound,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
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
                                onClick={onClose}
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
                                    onChange={(e) => onUpdateSettings({ ...settings, workDuration: Number(e.target.value) })}
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
                                    onChange={(e) => onUpdateSettings({ ...settings, breakDuration: Number(e.target.value) })}
                                    className="w-full accent-green-500"
                                />
                            </div>

                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <span className="setting-label">Dark Mode</span>
                                <button
                                    onClick={() => onUpdateSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}
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
                                    onClick={() => onUpdateSettings({ ...settings, autoStart: !settings.autoStart })}
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
                                        onChange={(e) => onUpdateSettings({ ...settings, soundType: e.target.value })}
                                        className="setting-input appearance-none flex-1"
                                    >
                                        {SOUNDS.map(sound => (
                                            <option key={sound.id} value={sound.id}>
                                                {sound.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => onPlaySound(settings.soundType)}
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
    );
};
