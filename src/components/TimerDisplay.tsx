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
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    mode,
    timeLeft,
    timerState,
    progress,
    ringColor,
    sessionsUntilLongBreak,
    completedSessions,
}) => {
    const radius = 120;
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
                        width="300"
                        height="300"
                        viewBox="0 0 300 300"
                        className="transform -rotate-90"
                    >
                        {/* Background Ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            stroke="var(--ring-bg)"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            stroke={ringColor}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                        />
                        {/* Text Content */}
                        <foreignObject x="40" y="40" width="220" height="220">
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                <div className="timer-caption">
                                    {mode === 'work' ? 'Focus window' : 'Break window'}
                                </div>
                                <div className="timer-time">{formatTime(timeLeft)}</div>
                                <div className="timer-subcopy">
                                    {timerState === 'idle'
                                        ? 'Ready to start?'
                                        : timerState === 'paused'
                                            ? 'Timer paused'
                                            : 'Stay focused'}
                                </div>
                                {mode === 'work' && (
                                    <div className="text-xs text-[#7a8ba3] mt-1 font-medium">
                                        Session {(completedSessions % sessionsUntilLongBreak) + 1} / {sessionsUntilLongBreak}
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
