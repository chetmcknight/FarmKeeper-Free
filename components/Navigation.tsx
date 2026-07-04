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
    { id: Page.DASHBOARD, label: 'Dashboard', icon: (
      <span className="text-lg">🏠</span>
    )},
    { id: Page.ANIMALS, label: 'Animals', icon: (
      <span className="text-lg">🐐</span>
    )},
    { id: Page.CROPS, label: 'Crops', icon: (
      <span className="text-lg">🌽</span>
    )},
    { id: Page.FARMHANDS, label: 'Farmhands', icon: (
      <span className="text-lg">🧑‍🌾</span>
    )},
    { id: Page.SCOUT, label: 'AI Scout', icon: (
      <span className="text-lg">🔍</span>
    )},
    { id: Page.ADVISOR, label: 'AI Guide', icon: (
      <span className="text-lg">🤖</span>
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
                   <svg className="w-8 h-8 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" transform="translate(0, 2)"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
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
