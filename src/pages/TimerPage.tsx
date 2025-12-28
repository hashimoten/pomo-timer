import React, { useState } from 'react';
import { useTimer } from '../contexts/TimerContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTasks } from '../contexts/TasksContext';
import { TimerDisplay } from '../components/TimerDisplay';
import { Controls } from '../components/Controls';
import { TodoList } from '../components/TodoList';
import { motion } from 'framer-motion';

export const TimerPage = () => {
    const {
        timeLeft,
        timerState,
        mode,
        progress,
        currentTotalTime,
        completedSessions,
        toggleTimer,
        resetTimer,
        finishAndLog,
        switchMode,
        activeTaskId,
        tasks
    } = useTimer();

    const { settings, updateSettings } = useSettings();
    const { addTask, toggleTask, deleteTask, activateTask } = useTasks();
    const [selectedCategory, setSelectedCategory] = useState<string>('General');

    const ringColor = mode === 'work' ? 'var(--ring-work)' : 'var(--ring-break)';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Timer */}
            <div className="neumorph-panel items-center justify-between">
                <div className="w-full flex flex-col items-center gap-6">
                    {/* Header: Title & Switcher */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <h2 className="text-xl font-bold tracking-widest text-[var(--text-main)] uppercase">POMODORO</h2>
                            <p className="text-[10px] tracking-[0.2em] text-[var(--text-accent)] font-semibold uppercase">Focused Sessions</p>
                        </div>

                        <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1 rounded-full shadow-inner">
                            <button
                                onClick={() => switchMode('work')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'work'
                                    ? 'bg-[var(--bg-element)] text-[var(--text-main)] shadow-neumorph-sm'
                                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                                    }`}
                                style={mode === 'work' ? { boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' } : {}}
                            >
                                Focus
                            </button>
                            <button
                                onClick={() => switchMode('break')}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${mode === 'break'
                                    ? 'bg-[var(--bg-element)] text-[var(--text-main)] shadow-neumorph-sm'
                                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                                    }`}
                                style={mode === 'break' ? { boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)' } : {}}
                            >
                                Break
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 justify-center w-full max-w-lg">
                        {settings.categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    if (activeTaskId) activateTask(activeTaskId);
                                }}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${!activeTaskId && selectedCategory === cat
                                    ? 'text-[var(--text-accent)]'
                                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                                    }`}
                                style={!activeTaskId && selectedCategory === cat
                                    ? { background: 'var(--bg-element)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' }
                                    : { background: 'var(--bg-element)', boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)' }
                                }
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Timer Circle Container */}
                    <div className="relative p-4 md:p-10 rounded-full" style={{ boxShadow: 'inset 20px 20px 40px var(--shadow-dark), inset -20px -20px 40px var(--shadow-light)' }}>
                        <div className="w-52 h-52 md:w-[280px] md:h-[280px] md:scale-110">
                            <TimerDisplay
                                mode={mode}
                                timeLeft={timeLeft}
                                timerState={timerState}
                                progress={progress}
                                ringColor={ringColor}
                                sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
                                completedSessions={completedSessions}
                                activeTaskTitle={tasks.find(t => t.id === activeTaskId)?.title}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="w-full max-w-sm mt-auto">
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

            {/* Right Card: Todo List */}
            <div className="neumorph-panel gap-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Tasks</h3>
                        <p className="text-xs text-[var(--text-sub)]">Select a task to focus on</p>
                    </div>
                </div>

                <div className="flex-1 overflow-visible">
                    <TodoList
                        tasks={tasks}
                        onAddTask={addTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        onActivateTask={activateTask}
                        activeTaskId={activeTaskId}
                    />
                </div>
            </div>
        </div>
    );
};
