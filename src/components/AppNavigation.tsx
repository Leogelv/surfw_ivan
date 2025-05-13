'use client';

import React from 'react';
import Link from 'next/link';

interface AppNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onProfileClick: () => void;
  logger: any;
  telegramUserId?: string;
}

/**
 * Компонент навигации приложения
 */
const AppNavigation: React.FC<AppNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  onProfileClick, 
  logger, 
  telegramUserId 
}) => {
  return (
    <div className="border-t border-gray-200 grid grid-cols-4 px-4 bg-white sticky bottom-0 mt-auto shadow-md">
      <Link href="/" passHref legacyBehavior>
        <a className={`flex flex-col items-center py-3 ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}
          onClick={() => {
            onTabChange('home');
            logger.info('Переход на вкладку Главная', null, telegramUserId);
          }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 10.25V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V10.25M3 10.25L12 3L21 10.25M3 10.25L4.5 11.5M21 10.25L19.5 11.5" 
              stroke={activeTab === 'home' ? '#4F46E5' : 'currentColor'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1">Главная</span>
        </a>
      </Link>
      
      <Link href="/library" passHref legacyBehavior>
        <a className={`flex flex-col items-center py-3 ${activeTab === 'library' ? 'text-indigo-600' : 'text-gray-400'}`}
          onClick={() => {
            onTabChange('library');
            logger.info('Переход на вкладку Библиотека');
          }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={activeTab === 'library' ? '#4F46E5' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={activeTab === 'library' ? '#4F46E5' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs mt-1">Библиотека</span>
        </a>
      </Link>
      
      <Link href="/schedule" passHref legacyBehavior>
        <a className={`flex flex-col items-center py-3 ${activeTab === 'schedule' ? 'text-indigo-600' : 'text-gray-400'}`}
          onClick={() => {
            onTabChange('schedule');
            logger.info('Переход на вкладку Расписание');
          }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
              stroke={activeTab === 'schedule' ? '#4F46E5' : 'currentColor'} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs mt-1">Расписание</span>
        </a>
      </Link>
      
      <button 
        className={`flex flex-col items-center py-3 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}
        onClick={() => {
          onTabChange('profile');
          onProfileClick();
          logger.info('Переход в профиль', null, telegramUserId);
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" 
            fill={activeTab === 'profile' ? '#4F46E5' : 'currentColor'} />
        </svg>
        <span className="text-xs mt-1">Профиль</span>
      </button>
    </div>
  );
};

export default AppNavigation; 