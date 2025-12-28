import React, { createContext, useContext } from 'react';
import { useSettingsInternal } from '../hooks/useSettingsInternal';
import { AppSettings } from '../types';

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const settingsData = useSettingsInternal();

    return (
        <SettingsContext.Provider value={settingsData}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
