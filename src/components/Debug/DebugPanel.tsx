'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

interface DebugPanelProps {
  telegramUser: any;
  supabaseUser: any;
  logs: any[];
}

const DebugPanel = ({ telegramUser, supabaseUser, logs = [] }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastActions, setLastActions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'actions' | 'viewport'>('users');
  const [viewportInfo, setViewportInfo] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const debugLogger = logger.createLogger('DebugPanel');

  // Получение информации о viewport и safe area
  useEffect(() => {
    if (isExpanded && typeof window !== 'undefined') {
      const telegramWebApp = window.Telegram?.WebApp;
      const viewportData = {
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
        },
        telegramWebApp: telegramWebApp ? {
          viewportHeight: telegramWebApp.viewportHeight,
          viewportStableHeight: telegramWebApp.viewportStableHeight,
          isExpanded: telegramWebApp.isExpanded,
          safeAreaInset: telegramWebApp.safeAreaInset,
          contentSafeAreaInset: telegramWebApp.contentSafeAreaInset,
        } : null,
        cssVariables: {
          safeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-top'),
          safeAreaRight: getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-right'),
          safeAreaBottom: getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-bottom'),
          safeAreaLeft: getComputedStyle(document.documentElement).getPropertyValue('--tg-safe-area-left'),
          contentSafeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('--tg-content-safe-area-top'),
          contentSafeAreaRight: getComputedStyle(document.documentElement).getPropertyValue('--tg-content-safe-area-right'),
          contentSafeAreaBottom: getComputedStyle(document.documentElement).getPropertyValue('--tg-content-safe-area-bottom'),
          contentSafeAreaLeft: getComputedStyle(document.documentElement).getPropertyValue('--tg-content-safe-area-left'),
        }
      };
      setViewportInfo(viewportData);
    }
  }, [isExpanded, activeTab]);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        setIsLoading(true);
        const supabase = getSupabaseClient();
        
        // Получаем количество пользователей
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          debugLogger.error('Ошибка при получении количества пользователей', error);
          setError(error.message);
        } else {
          setUserCount(count);
          debugLogger.info(`Количество пользователей в базе: ${count}`);
        }
        
        // Получаем последние действия из логов
        const { data: logData, error: logError } = await supabase
          .from('logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (logError) {
          debugLogger.error('Ошибка при получении логов', logError);
        } else if (logData) {
          setLastActions(logData);
          debugLogger.info(`Получено ${logData.length} последних логов`);
        }
      } catch (err) {
        debugLogger.error('Исключение при получении данных для отладки', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    if (isExpanded) {
      fetchUserCount();
    }
  }, [isExpanded, debugLogger]);

  // Функция для копирования текста в буфер обмена
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(`Скопировано: ${label}`);
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => {
        debugLogger.error('Ошибка копирования в буфер обмена', err);
        setCopySuccess('Ошибка копирования');
        setTimeout(() => setCopySuccess(null), 2000);
      });
  };

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return 'Не удалось преобразовать объект в JSON';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
          <h2 className="text-xl font-bold">Отладочная панель</h2>
          <button 
            onClick={() => setIsExpanded(false)}
            className="rounded-full bg-white/20 p-1 hover:bg-white/40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {copySuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity">
            {copySuccess}
          </div>
        )}

        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'bg-white border-t-2 border-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveTab('users')}
            >
              Пользователи
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'bg-white border-t-2 border-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveTab('logs')}
            >
              Логи
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'actions' ? 'bg-white border-t-2 border-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveTab('actions')}
            >
              Последние действия
            </button>
            <button 
              className={`px-4 py-2 font-medium ${activeTab === 'viewport' ? 'bg-white border-t-2 border-blue-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveTab('viewport')}
            >
              Viewport и Safe Area
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {activeTab === 'users' && (
            <div>
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-semibold">Информация о пользователях</h3>
                <div className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {isLoading ? 'Загрузка...' : `Всего: ${userCount ?? '?'}`}
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium flex justify-between items-center">
                    <span>Пользователь Telegram</span>
                    <button 
                      onClick={() => copyToClipboard(formatJson(telegramUser), 'Telegram User')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                  <pre className="p-3 text-xs overflow-auto max-h-60 bg-gray-900 text-green-400">
                    {telegramUser ? formatJson(telegramUser) : 'Нет данных'}
                  </pre>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium flex justify-between items-center">
                    <span>Пользователь Supabase</span>
                    <button 
                      onClick={() => copyToClipboard(formatJson(supabaseUser), 'Supabase User')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                  <pre className="p-3 text-xs overflow-auto max-h-60 bg-gray-900 text-green-400">
                    {supabaseUser ? formatJson(supabaseUser) : 'Нет данных'}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Логи приложения</h3>
                <button 
                  onClick={() => copyToClipboard(formatJson(logs), 'Все логи')}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Копировать все
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <pre className="p-3 text-xs overflow-auto max-h-96 bg-gray-900 text-green-400">
                  {logs.length > 0 
                    ? logs.map((log, index) => (
                        <div key={index} className="mb-2 pb-2 border-b border-gray-700 flex justify-between">
                          <div>{formatJson(log)}</div>
                          <button 
                            onClick={() => copyToClipboard(formatJson(log), `Лог #${index+1}`)}
                            className="text-blue-400 hover:text-blue-300 ml-2 self-start"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      ))
                    : 'Нет доступных логов'}
                </pre>
              </div>
            </div>
          )}
          
          {activeTab === 'actions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Последние действия</h3>
                <button 
                  onClick={() => copyToClipboard(formatJson(lastActions), 'Все действия')}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Копировать все
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уровень</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Модуль</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Копировать</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lastActions.map((action) => (
                      <tr key={action.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(action.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${action.level === 'error' ? 'bg-red-100 text-red-800' : 
                            action.level === 'warn' ? 'bg-yellow-100 text-yellow-800' : 
                            action.level === 'info' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'}`}>
                            {action.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {action.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {action.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => copyToClipboard(formatJson(action), `Действие ${action.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lastActions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Нет данных о действиях
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'viewport' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Информация о Viewport и Safe Area</h3>
                <button 
                  onClick={() => copyToClipboard(formatJson(viewportInfo), 'Viewport Info')}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Копировать все
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    Размеры окна
                  </div>
                  <div className="p-3">
                    {viewportInfo?.window && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">innerWidth:</span>
                          <span className="font-mono">{viewportInfo.window.innerWidth}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">innerHeight:</span>
                          <span className="font-mono">{viewportInfo.window.innerHeight}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">outerWidth:</span>
                          <span className="font-mono">{viewportInfo.window.outerWidth}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">outerHeight:</span>
                          <span className="font-mono">{viewportInfo.window.outerHeight}px</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    Telegram WebApp Viewport
                  </div>
                  <div className="p-3">
                    {viewportInfo?.telegramWebApp ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">viewportHeight:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.viewportHeight}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">viewportStableHeight:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.viewportStableHeight}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">isExpanded:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.isExpanded ? 'true' : 'false'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Telegram WebApp недоступен</div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    safeAreaInset
                  </div>
                  <div className="p-3">
                    {viewportInfo?.telegramWebApp?.safeAreaInset ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">top:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.safeAreaInset.top}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">right:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.safeAreaInset.right}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">bottom:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.safeAreaInset.bottom}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">left:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.safeAreaInset.left}px</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">safeAreaInset недоступен</div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    contentSafeAreaInset
                  </div>
                  <div className="p-3">
                    {viewportInfo?.telegramWebApp?.contentSafeAreaInset ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">top:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.contentSafeAreaInset.top}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">right:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.contentSafeAreaInset.right}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">bottom:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.contentSafeAreaInset.bottom}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">left:</span>
                          <span className="font-mono">{viewportInfo.telegramWebApp.contentSafeAreaInset.left}px</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">contentSafeAreaInset недоступен</div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden md:col-span-2">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    CSS переменные
                  </div>
                  <div className="p-3">
                    {viewportInfo?.cssVariables ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">safeArea:</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-safe-area-top:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.safeAreaTop}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-safe-area-right:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.safeAreaRight}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-safe-area-bottom:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.safeAreaBottom}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-safe-area-left:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.safeAreaLeft}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">contentSafeArea:</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-content-safe-area-top:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.contentSafeAreaTop}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-content-safe-area-right:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.contentSafeAreaRight}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-content-safe-area-bottom:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.contentSafeAreaBottom}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">--tg-content-safe-area-left:</span>
                              <span className="font-mono">{viewportInfo.cssVariables.contentSafeAreaLeft}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">CSS переменные недоступны</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between">
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
          >
            Обновить страницу
          </button>
          
          <button 
            onClick={() => setIsExpanded(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel; 