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
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'actions'>('users');

  const debugLogger = logger.createLogger('DebugPanel');

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
        
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex">
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
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    Пользователь Telegram
                  </div>
                  <pre className="p-3 text-xs overflow-auto max-h-60 bg-gray-900 text-green-400">
                    {telegramUser ? formatJson(telegramUser) : 'Нет данных'}
                  </pre>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b font-medium">
                    Пользователь Supabase
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
              <h3 className="text-lg font-semibold mb-4">Логи приложения</h3>
              <div className="border rounded-lg overflow-hidden">
                <pre className="p-3 text-xs overflow-auto max-h-96 bg-gray-900 text-green-400">
                  {logs.length > 0 
                    ? logs.map((log, index) => (
                        <div key={index} className="mb-2 pb-2 border-b border-gray-700">
                          {formatJson(log)}
                        </div>
                      ))
                    : 'Нет доступных логов'}
                </pre>
              </div>
            </div>
          )}
          
          {activeTab === 'actions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Последние действия</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уровень</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Модуль</th>
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
                      </tr>
                    ))}
                    {lastActions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Нет данных о действиях
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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