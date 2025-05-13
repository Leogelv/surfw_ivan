'use client';

import React, { useEffect } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import logger from '@/lib/logger';
import Link from 'next/link';

const LibraryScreen = () => {
  const { webApp, telegramHeaderPadding, isFullScreenEnabled } = useTelegram();
  const screenLogger = logger.createLogger('LibraryScreen');

  useEffect(() => {
    screenLogger.info('Библиотека открыта');
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        screenLogger.info('Нажата кнопка Назад в Библиотеке');
        // Тут нужна навигация назад, например, router.back() или на главную
        // Для примера, сделаем переход на главную, если есть Link
        // window.history.back(); // Это может быть не всегда надежно
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
      {/* Шапка (если нужна отдельная) */}
      <header className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10"
        style={{ marginTop: isFullScreenEnabled ? `${telegramHeaderPadding}px` : '0px' }}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">Библиотека</h1>
          <div className="w-10"></div> { /* Spacer */}
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Раздел "Библиотека"</h2>
        <p className="text-gray-600">
          Здесь будет каталог практик, статей и других полезных материалов.
        </p>
        {/* Сюда будут добавляться компоненты фильтров, списков и т.д. */}
      </main>
      
      {/* Нижняя навигация (если будет отличаться от глобальной) */}
      {/* <footer className="p-4 border-t border-gray-200 bg-white">
        <p className="text-center text-sm text-gray-500">© MyApp 2024</p>
      </footer> */}
    </div>
  );
};

export default LibraryScreen; 