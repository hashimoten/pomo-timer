import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { TimerState } from '../types';

interface ControlsProps {
    timerState: TimerState;
    timeLeft: number;
    currentTotalTime: number;
    onToggle: () => void;
    onReset: () => void;
    onFinish: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
    timerState,
    timeLeft,
    currentTotalTime,
    onToggle,
    onReset,
    onFinish,
}) => {
    return (
        <motion.div
            className="flex flex-wrap justify-center gap-3 mt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
        >
            {timerState === 'running' ? (
                <button onClick={onToggle} className="btn btn-secondary">
                    <Pause size={18} />
                    Pause
                </button>
            ) : (
                <button onClick={onToggle} className="btn btn-primary">
                    <Play size={18} />
                    {timerState === 'idle' ? 'Start session' : 'Resume'}
                </button>
            )}

            <button
                onClick={onReset}
                className="btn btn-secondary"
                disabled={timerState === 'idle' && timeLeft === currentTotalTime}
            >
                <RotateCcw size={18} />
                Reset
            </button>

            {timerState !== 'idle' && (
                <button
                    onClick={onFinish}
                    className="btn btn-secondary text-emerald-600"
                >
                    Done
                </button>
            )}
        </motion.div>
    );
};
