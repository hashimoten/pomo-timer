import React, { useRef } from 'react';
import { X, Volume2, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';
import { AVAILABLE_SOUNDS } from '../utils/sounds';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (newSettings: AppSettings) => void;
    onPlaySound: (type: string) => void;
    onExportHistory: () => void;
    onImportHistory: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    onPlaySound,
    onExportHistory,
    onImportHistory,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportHistory(file);
        }
        // Reset input so the same file can be selected again if needed
        if (e.target) {
            e.target.value = '';
        }
    };

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

                        <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Timer Settings Section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-[#7a8ba3] uppercase tracking-wider">Timer</h3>

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

                                {/* Long Break Duration */}
                                <div className="setting-row">
                                    <label className="setting-label">
                                        Long Break Duration: {settings.longBreakDuration} min
                                    </label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="45"
                                        value={settings.longBreakDuration}
                                        onChange={(e) => onUpdateSettings({ ...settings, longBreakDuration: Number(e.target.value) })}
                                        className="w-full accent-purple-500"
                                    />
                                </div>

                                {/* Sessions until Long Break */}
                                <div className="setting-row">
                                    <label className="setting-label">
                                        Long Break after: {settings.sessionsUntilLongBreak} sessions
                                    </label>
                                    <input
                                        type="range"
                                        min="2"
                                        max="8"
                                        value={settings.sessionsUntilLongBreak}
                                        onChange={(e) => onUpdateSettings({ ...settings, sessionsUntilLongBreak: Number(e.target.value) })}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            </div>

                            <hr className="border-[#e0e5ec] dark:border-[#2d3748]" />

                            {/* Behavior Section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-[#7a8ba3] uppercase tracking-wider">Behavior</h3>

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
                                            {AVAILABLE_SOUNDS.map(sound => (
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

                            <hr className="border-[#e0e5ec] dark:border-[#2d3748]" />

                            {/* Appearance Section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-[#7a8ba3] uppercase tracking-wider">Appearance</h3>

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
                            </div>

                            <hr className="border-[#e0e5ec] dark:border-[#2d3748]" />

                            {/* Data Management Section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-[#7a8ba3] uppercase tracking-wider">Data Management</h3>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onExportHistory}
                                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2 py-2"
                                    >
                                        <Download size={16} />
                                        Export CSV
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 btn btn-secondary flex items-center justify-center gap-2 py-2"
                                    >
                                        <Upload size={16} />
                                        Import CSV
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv,.json"
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
