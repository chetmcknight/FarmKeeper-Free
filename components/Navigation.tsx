import React, { useState } from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, setPage, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();

  const getMobileClasses = (isActive: boolean) => 
    `flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 ${
      isActive 
        ? 'text-green-700' 
        : 'text-gray-400 hover:text-gray-600'
    }`;

  const navItems = [
    { id: Page.DASHBOARD, label: 'Home', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { id: Page.CROPS, label: 'Crops', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    )},
    { id: Page.ANIMALS, label: 'Herd', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    )},
    { id: Page.FARMHANDS, label: 'Team', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    )},
    { id: Page.SCOUT, label: 'Scout', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { id: Page.ADVISOR, label: 'AI', icon: (
      <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    )},
  ];

  return (
    <>
      <nav 
        className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe-bottom
        md:relative md:border-t-0 md:border-r md:h-screen md:flex md:flex-col md:justify-between transition-all duration-300 ease-in-out md:pb-0
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        <div>
          <div className="hidden md:flex items-center justify-between p-4 mb-2">
             <div 
                className={`cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}
                onClick={() => setPage(Page.DASHBOARD)}
              >
                <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-green-100 dark:border-gray-700 shrink-0 flex items-center justify-center">
                   <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <text y="85" fontSize="90">🧑‍🌾</text>
                   </svg>
                </div>
                {!isCollapsed && (
                  <h1 className="text-xl font-black text-green-800 dark:text-green-400 tracking-tight whitespace-nowrap">
                    FarmKeeper Free
                  </h1>
                )}
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={toggleCollapse} 
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 transition-colors"
                title="Collapse Sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            )}
          </div>
          
          {isCollapsed && (
             <div className="hidden md:flex justify-center mb-6">
                <button 
                  onClick={toggleCollapse} 
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-600 transition-colors"
                  title="Expand Sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
             </div>
          )}

          <div className="flex md:hidden justify-around items-center px-2 h-[60px] pb-1">
            {navItems.filter(item => item.id !== Page.ADVISOR).map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={getMobileClasses(currentPage === item.id)}
              >
                <div className={`mb-0.5 ${currentPage === item.id ? 'transform scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-medium leading-none text-center ${currentPage === item.id ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex flex-col space-y-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl justify-start w-full transition-all duration-200 group
                  ${currentPage === item.id 
                    ? 'text-green-700 bg-green-100/70 dark:bg-green-900/40 dark:text-green-400 shadow-sm' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
                  ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`transition-transform duration-200 flex-shrink-0 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className={`text-sm font-medium mt-0 whitespace-nowrap overflow-hidden transition-all duration-300 ${currentPage === item.id ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={`hidden md:block p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div 
             onClick={() => setPage(Page.SETTINGS)}
             className={`flex items-center gap-3 mb-4 p-2 rounded-xl transition-colors cursor-pointer border hover:shadow-sm
             ${currentPage === Page.SETTINGS 
                ? 'bg-white dark:bg-gray-700 border-green-200 dark:border-green-800 shadow-sm' 
                : 'border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-gray-100 dark:hover:border-gray-600'}
             ${isCollapsed ? 'justify-center' : ''}`}
             title={isCollapsed ? 'Settings & Profile' : ''}
           >
            {user?.imageUrl ? (
                 <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                     <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                 </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
            )}
            
            {!isCollapsed && (
              <>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </>
            )}
          </div>

          {!isCollapsed && (
            <button 
              onClick={logout}
              className="w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
