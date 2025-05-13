'use client';

import React, { useEffect } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import logger from '@/lib/logger';
import Link from 'next/link';

const PracticeSelectionScreen = () => {
  const { webApp, telegramHeaderPadding, isFullScreenEnabled } = useTelegram();
  const screenLogger = logger.createLogger('PracticeSelectionScreen');

  useEffect(() => {
    screenLogger.info('Экран выбора практики открыт');
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        screenLogger.info('Нажата кнопка Назад на выборе практики');
        // TODO: Навигация назад (на главную, скорее всего)
      });
    }
    return () => {
      if (webApp) {
        webApp.BackButton.offClick();
        webApp.BackButton.hide();
      }
    };
  }, [webApp, screenLogger]);

  return (
    <div 
      className="flex flex-col min-h-screen bg-gray-100 font-['Inter',_sans-serif]"
      style={{ paddingTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
    >
      <header 
        className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between"
        style={{ marginTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
      >
         <Link href="/" className="p-2 rounded-lg hover:bg-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </Link>
        <h1 className="text-lg font-semibold">Выбор Практики</h1>
        <div className="w-10"></div> { /* Spacer */}
      </header>

      <main className="flex-1 p-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Начнем практику?</h2>
        <p className="text-gray-700 mb-8">
          Это начальный экран для выбора практики (квиза).
          Здесь будут кнопки и логика для подбора идеальной медитации или упражнения для тебя.
        </p>
        
        {/* TODO: Добавить компоненты квиза */}
        <div className="p-8 bg-blue-50 rounded-xl shadow-md">
          <p className="text-blue-700">Место для компонентов квиза...</p>
        </div>
      </main>
    </div>
  );
};

export default PracticeSelectionScreen; 