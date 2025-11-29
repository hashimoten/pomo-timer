import React from 'react';
import { motion } from 'framer-motion';
import { TimerMode, TimerState } from '../types';

interface TimerDisplayProps {
    mode: TimerMode;
    timeLeft: number;
    timerState: TimerState;
    progress: number;
    ringColor: string;
}

const RING_RADIUS = 120;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    mode,
    timeLeft,
    timerState,
    progress,
    ringColor,
}) => {
    return (
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
        </div>
    );
};
