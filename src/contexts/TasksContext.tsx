import React, { createContext, useContext } from 'react';
import { useTasksInternal } from '../hooks/useTasksInternal';
import { Task } from '../types';

interface TasksContextType {
    tasks: Task[];
    addTask: (title: string) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    activateTask: (id: string) => void;
    updateTaskProgress: (id: string) => void;
    loading: boolean;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const tasksData = useTasksInternal();

    return (
        <TasksContext.Provider value={tasksData}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TasksContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};
