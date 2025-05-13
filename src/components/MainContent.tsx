'use client';

import React from 'react';
import StatisticsCard from './StatisticsCard';
import RecommendedPractices from './RecommendedPractices';

interface MainContentProps {
  isFullScreenEnabled: boolean;
  telegramHeaderPadding: number;
  contentSafeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  statsLoading: boolean;
  stats: any;
}

/**
 * Компонент для основного контента приложения
 */
const MainContent: React.FC<MainContentProps> = ({
  isFullScreenEnabled,
  telegramHeaderPadding,
  contentSafeArea,
  statsLoading,
  stats
}) => {
  return (
    <div className="flex-grow">
      <div className="h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
        {/* Градиентный оверлей для верхней части Telegram WebApp */}
        {isFullScreenEnabled && (
          <div 
            className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
            style={{
              height: `${telegramHeaderPadding > 0 ? telegramHeaderPadding : contentSafeArea.top}px`,
              background: 'var(--telegram-header-gradient)'
            }}
          ></div>
        )}
        
        {/* Основной контент с учетом отступа */}
        <div 
          className="flex-1 flex flex-col"
          style={{ 
            paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding > 0 ? telegramHeaderPadding : contentSafeArea.top}px` : '0',
            paddingRight: isFullScreenEnabled ? `var(--safe-area-right, 0px)` : '0',
            paddingBottom: isFullScreenEnabled ? `var(--safe-area-bottom, 0px)` : '0',
            paddingLeft: isFullScreenEnabled ? `var(--safe-area-left, 0px)` : '0',
            transition: 'padding 0.3s ease'
          }}
        >
          {/* Добавляем силуэт человека над UI карточками */}
          <div className="relative">
            <div className="absolute inset-0 flex justify-center">
              <div className="w-64 h-64 -mt-12">
                <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.1" d="M100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200Z" fill="#6366F1"/>
                  <path d="M86 75C86 83.2843 79.2843 90 71 90C62.7157 90 56 83.2843 56 75C56 66.7157 62.7157 60 71 60C79.2843 60 86 66.7157 86 75Z" fill="#6366F1" fillOpacity="0.2"/>
                  <path d="M144 75C144 83.2843 137.284 90 129 90C120.716 90 114 83.2843 114 75C114 66.7157 120.716 60 129 60C137.284 60 144 66.7157 144 75Z" fill="#6366F1" fillOpacity="0.2"/>
                  <path d="M71 120H129C139.493 120 148 128.507 148 139V160H52V139C52 128.507 60.5066 120 71 120Z" fill="#6366F1" fillOpacity="0.2"/>
                </svg>
              </div>
            </div>

            {/* UI карточки, обернутые в контейнер для управления отступами и позиционированием */}
            <div className="relative pt-56 px-4">
              <div className="bg-white rounded-t-3xl shadow-lg border border-indigo-100 pt-6 px-4 pb-2">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-indigo-800">Йога-практика</h1>
                  <p className="text-gray-600 mt-1">Для здоровья тела и разума</p>
                </div>
                
                {/* Статистика пользователя */}
                <StatisticsCard statsLoading={statsLoading} stats={stats} />
                
                {/* Рекомендуемые практики */}
                <RecommendedPractices />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent; 