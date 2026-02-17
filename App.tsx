import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CropManager } from './components/CropManager';
import { AnimalManager } from './components/AnimalManager';
import { FieldScout } from './components/FieldScout';
import { AIGuide } from './components/AIGuide';
import { Settings } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { ChatWidget } from './components/ChatWidget';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Page } from './types';

// Separate authenticated content to use the auth hook
const AuthenticatedApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [location, setLocation] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
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
    // We handle errors gracefully to avoid console warnings if permission is denied
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

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard location={location || 'Sequim, WA'} />;
      case Page.CROPS:
        return <CropManager />;
      case Page.ANIMALS:
        return <AnimalManager />;
      case Page.SCOUT:
        return <FieldScout />;
      case Page.ADVISOR:
        return <AIGuide />;
      case Page.SETTINGS:
        return <Settings toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />;
      default:
        return <Dashboard location={location || 'Sequim, WA'} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-green-50/50 dark:bg-gray-900 transition-colors duration-300 relative">
      <Navigation currentPage={currentPage} setPage={setCurrentPage} />
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar md:p-6">
        <div className="max-w-7xl mx-auto h-full">
           {renderPage()}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;