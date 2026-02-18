import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CropManager } from './components/CropManager';
import { AnimalManager } from './components/AnimalManager';
import { FarmhandManager } from './components/FarmhandManager';
import { FieldScout } from './components/FieldScout';
import { AIGuide } from './components/AIGuide';
import { Settings } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { ChatWidget } from './components/ChatWidget';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Page } from './types';

// The Main Layout for authenticated users. 
const AuthenticatedLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [location, setLocation] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    // Basic Geolocation for Dashboard
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
        },
        (error) => {
          // Silently fall back to default location
          setLocation('Sequim, WA');
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setLocation('Sequim, WA');
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard location={location || 'Sequim, WA'} onNavigate={setCurrentPage} />;
      case Page.CROPS:
        return <CropManager />;
      case Page.ANIMALS:
        return <AnimalManager />;
      case Page.FARMHANDS:
        return <FarmhandManager />;
      case Page.SCOUT:
        return <FieldScout />;
      case Page.ADVISOR:
        return <AIGuide />;
      case Page.SETTINGS:
        return <Settings toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />;
      default:
        return <Dashboard location={location || 'Sequim, WA'} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-green-50/50 dark:bg-gray-900 transition-colors duration-300 relative">
      <Navigation currentPage={currentPage} setPage={setCurrentPage} />
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar md:p-6 relative">
        {/* Persistent Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 md:top-6 md:right-8 z-50 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-md border border-gray-100 dark:border-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        <div className="max-w-7xl mx-auto h-full">
           {renderPage()}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
};

// Wrapper to handle Auth state
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-4 border-green-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <AuthenticatedLayout />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;