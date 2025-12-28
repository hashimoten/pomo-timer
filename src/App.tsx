import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TimerPage } from './pages/TimerPage';
import { SettingsPage } from './pages/SettingsPage';
import { TimerProvider } from './contexts/TimerContext';
import { useAuth } from './contexts/AuthContext';
import { TasksProvider } from './contexts/TasksContext';
import { SettingsProvider } from './contexts/SettingsContext';

function AppContent() {
  const { user, loading } = useAuth();
  // We could add protected routes logic here

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<TimerPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <TasksProvider>
          <TimerProvider>
            <AppContent />
          </TimerProvider>
        </TasksProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
