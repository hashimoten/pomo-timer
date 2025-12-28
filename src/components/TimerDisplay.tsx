import React from 'react';
import { motion } from 'framer-motion';
import { TimerMode, TimerState } from '../types';

interface TimerDisplayProps {
    mode: TimerMode;
    timeLeft: number;
    timerState: TimerState;
    progress: number;
    ringColor: string;
    sessionsUntilLongBreak: number;
    completedSessions: number;
    activeTaskTitle?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    mode,
    timeLeft,
    timerState,
    progress,
    ringColor,
    sessionsUntilLongBreak,
    completedSessions,
    activeTaskTitle,
}) => {
    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="timer-shell">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="timer-ring">
                    <svg
                        className="w-full h-full"
                        viewBox="0 0 280 280"
                    >
                        {/* Background Ring */}
                        <circle
                            cx="140"
                            cy="140"
                            r={radius}
                            stroke="var(--ring-bg)"
                            strokeWidth="8"
                            fill="transparent"
                            className="origin-center -rotate-90"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx="140"
                            cy="140"
                            r={radius}
                            stroke={ringColor}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="origin-center -rotate-90"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                        />
                        {/* Text Content */}
                        <foreignObject x="20" y="30" width="240" height="220">
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                <div className="timer-caption">
                                    {mode === 'work' ? 'Focus window' : 'Break window'}
                                </div>
                                <div className="timer-time">{formatTime(timeLeft)}</div>
                                <div className="timer-subcopy truncate max-w-[180px] px-2">
                                    {timerState === 'idle'
                                        ? (activeTaskTitle ? activeTaskTitle : 'Ready?')
                                        : (activeTaskTitle ? activeTaskTitle : (timerState === 'paused' ? 'Paused' : 'Focus'))}
                                </div>
                                {mode === 'work' ? (
                                    <div className="text-xs text-[#7a8ba3] mt-1 font-medium">
                                        {completedSessions % sessionsUntilLongBreak + 1} / {sessionsUntilLongBreak}
                                    </div>
                                ) : (
                                    <div className="text-xs mt-1 font-medium invisible">
                                        0 / 0
                                    </div>
                                )}
                            </div>
                        </foreignObject>
                    </svg>
                </div>
            </motion.div>
        </div>
    );
};
