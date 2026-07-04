import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Page } from './types';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const CropManager = lazy(() => import('./components/CropManager').then(module => ({ default: module.CropManager })));
const AnimalManager = lazy(() => import('./components/AnimalManager').then(module => ({ default: module.AnimalManager })));
const FarmhandManager = lazy(() => import('./components/FarmhandManager').then(module => ({ default: module.FarmhandManager })));
const FieldScout = lazy(() => import('./components/FieldScout').then(module => ({ default: module.FieldScout })));
const AIGuide = lazy(() => import('./components/AIGuide').then(module => ({ default: module.AIGuide })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const AuthScreen = lazy(() => import('./components/AuthScreen').then(module => ({ default: module.AuthScreen })));
const ChatWidget = lazy(() => import('./components/ChatWidget').then(module => ({ default: module.ChatWidget })));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <div className="animate-spin h-10 w-10 border-4 border-green-600 rounded-full border-t-transparent"></div>
  </div>
);

// The Main Layout for authenticated users. 
const AuthenticatedLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [location, setLocation] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        return <Dashboard location={location || 'Sequim, WA'} onNavigate={setCurrentPage} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />;
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
        return <Dashboard location={location || 'Sequim, WA'} onNavigate={setCurrentPage} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-green-50/50 dark:bg-gray-900 transition-colors duration-300 relative">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 shrink-0">
         <div className="flex items-center gap-2">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-green-100 dark:border-gray-700 shrink-0 flex items-center justify-center">
               <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <text y="85" fontSize="90">🧑‍🌾</text>
               </svg>
            </div>
            <h1 className="text-lg font-black text-green-800 dark:text-green-400 tracking-tight">
              FarmKeeper Free
            </h1>
         </div>
         <button onClick={() => setCurrentPage(Page.SETTINGS)} className="p-1 rounded-full border border-transparent focus:outline-none">
           <svg className={`w-6 h-6 ${currentPage === Page.SETTINGS ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
         </button>
      </div>

      <Navigation 
        currentPage={currentPage} 
        setPage={setCurrentPage} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
          {/* Added pb-20 for mobile nav clearance */}
          <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0 md:p-6">
            <div className="max-w-7xl mx-auto h-full">
               <Suspense fallback={<LoadingSpinner />}>
                 {renderPage()}
               </Suspense>
            </div>
          </main>
          <Suspense fallback={null}>
            <ChatWidget isHidden={currentPage === Page.ADVISOR} />
          </Suspense>
        </div>
      );
    };

// Wrapper to handle Auth state
const AppContent: React.FC = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
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