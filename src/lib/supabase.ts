import { createClient, Provider } from '@supabase/supabase-js';
import { Database } from './database.types';
import { createLogger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Создаем логгер для Supabase
const supabaseLogger = createLogger('Supabase');

// Создаем клиент только на клиентской стороне, чтобы избежать проблем при статической сборке
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Функция для получения клиента Supabase
export const getSupabaseClient = () => {
  // Если мы на стороне сервера при статической сборке, возвращаем фиктивный клиент
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    supabaseLogger.warn('Попытка получить Supabase клиент на сервере при статической сборке');
    // Создаем фиктивный клиент для статической сборки
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  // Инициализируем клиент, если он еще не создан
  if (!supabaseClient) {
    try {
      supabaseLogger.info('Инициализация Supabase клиента', { 
        url: supabaseUrl, 
        keyAvailable: !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-key'
      });
      
      if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
        supabaseLogger.error('Не установлен URL для Supabase');
        console.error('NEXT_PUBLIC_SUPABASE_URL не установлен');
        return null;
      }
      
      if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
        supabaseLogger.error('Не установлен анонимный ключ для Supabase');
        console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY не установлен');
        return null;
      }
      
      // Дополнительная проверка, что мы в браузере
      if (typeof window === 'undefined') {
        supabaseLogger.warn('Попытка создать клиент Supabase вне браузера');
        return null;
      }
      
      // Проверяем, что ключи доступны и корректны
      if (supabaseAnonKey.length < 20) {
        supabaseLogger.error('Некорректный ключ Supabase (слишком короткий)');
        console.error('Некорректный ключ Supabase (слишком короткий)');
        return null;
      }
      
      // Создаем клиент с дополнительными параметрами
      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          fetch: (...args) => {
            return fetch(...args);
          }
        }
      });
      
      // Проверяем соединение простым запросом
      supabaseClient.from('users').select('count', { count: 'exact', head: true })
        .then(({ error }) => {
          if (error) {
            supabaseLogger.error('Ошибка при проверке соединения с Supabase', { 
              code: error.code, 
              message: error.message,
              details: error.details 
            });
          } else {
            supabaseLogger.info('Supabase соединение проверено успешно');
          }
        })
        .catch((err: unknown) => {
          supabaseLogger.error('Необработанная ошибка при проверке соединения', err);
        });
      
      supabaseLogger.info('Supabase клиент успешно инициализирован');
    } catch (error) {
      supabaseLogger.error('Ошибка при инициализации Supabase клиента', error);
      console.error('Ошибка инициализации Supabase:', error);
      return null;
    }
  }
  
  return supabaseClient;
};

// Экспортируем supabase для обратной совместимости
export const supabase = getSupabaseClient();

// Функция для авторизации через Telegram
export const handleTelegramAuth = async (telegramUser: any) => {
  // Получаем клиент
  const client = getSupabaseClient();
  
  if (!client) {
    supabaseLogger.error('Невозможно выполнить авторизацию: клиент Supabase не инициализирован');
    return { data: null, error: new Error('Supabase client not initialized') };
  }
  
  try {
    supabaseLogger.info('Попытка OAuth авторизации через Telegram', { 
      userId: telegramUser?.id,
      username: telegramUser?.username 
    });
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'telegram' as Provider,
      options: {
        queryParams: {
          auth_data: JSON.stringify(telegramUser)
        }
      }
    });

    if (error) {
      supabaseLogger.error('Ошибка OAuth авторизации через Telegram', { 
        code: error.code,
        message: error.message
      });
    } else {
      supabaseLogger.info('Успешная OAuth авторизация через Telegram', { 
        session: !!data.session,
        user: !!data.user
      });
    }
    
    return { data, error };
  } catch (err) {
    supabaseLogger.error('Необработанная ошибка Telegram auth', err);
    console.error('Telegram auth error:', err);
    return { data: null, error: err };
  }
};

// Функция для получения данных профиля пользователя
export const getUserProfile = async () => {
  try {
    const client = getSupabaseClient();
    
    if (!client) {
      supabaseLogger.error('Невозможно получить профиль: клиент Supabase не инициализирован');
      return { data: null, error: 'Supabase client not initialized' };
    }
    
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      supabaseLogger.warn('Попытка получить профиль неавторизованного пользователя');
      return { data: null, error: 'User not authenticated' };
    }
    
    supabaseLogger.info('Запрос профиля пользователя', { userId: user.id });
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      supabaseLogger.error('Ошибка при получении профиля пользователя', { 
        code: error.code,
        message: error.message,
        details: error.details
      });
    } else if (data) {
      supabaseLogger.info('Успешно получен профиль пользователя', { 
        userId: data.id,
        username: data.username
      });
    } else {
      supabaseLogger.warn('Профиль пользователя не найден', { userId: user.id });
    }
    
    return { data, error };
  } catch (err) {
    supabaseLogger.error('Необработанная ошибка при получении профиля', err);
    console.error('Get user profile error:', err);
    return { data: null, error: err };
  }
};

// Функция для получения статистики пользователя
export const getUserStats = async () => {
  try {
    const client = getSupabaseClient();
    
    if (!client) {
      supabaseLogger.error('Невозможно получить статистику: клиент Supabase не инициализирован');
      return { 
        data: { power: 3, practiceMinutes: 100, streak: 7 }, // Дефолтные данные
        error: 'Supabase client not initialized' 
      };
    }
    
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      supabaseLogger.warn('Попытка получить статистику неавторизованного пользователя');
      return { 
        data: { power: 3, practiceMinutes: 100, streak: 7 }, // Дефолтные данные 
        error: 'User not authenticated' 
      };
    }
    
    supabaseLogger.info('Запрос статистики пользователя', { userId: user.id });
    
    // Получаем минуты практики
    const { data: practiceMinutes, error: practiceError } = await client
      .from('view_history')
      .select('duration')
      .eq('user_id', user.id);
    
    if (practiceError) {
      supabaseLogger.error('Ошибка при получении минут практики', { 
        code: practiceError.code,
        message: practiceError.message,
        details: practiceError.details
      });
    }
    
    // Получаем количество дней подряд (streak)
    const { data: streakData, error: streakError } = await client
      .from('view_history')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });
    
    if (streakError) {
      supabaseLogger.error('Ошибка при получении streak данных', { 
        code: streakError.code,
        message: streakError.message,
        details: streakError.details
      });
    }
    
    // Простой расчет силы (условно)
    const totalMinutes = practiceMinutes?.reduce((sum, record) => sum + (record.duration || 0), 0) || 0;
    const totalMinutesInHours = Math.floor(totalMinutes / 60);
    
    // Примитивный расчет дней в потоке (streak)
    let streak = 0;
    
    if (streakData && streakData.length > 0) {
      const uniqueDays = new Set();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Проверяем последние 30 дней
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        
        const hasActivityOnDay = streakData.some(item => {
          if (!item.started_at) return false;
          const itemDate = new Date(item.started_at);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === checkDate.getTime();
        });
        
        if (hasActivityOnDay) {
          uniqueDays.add(checkDate.toDateString());
        } else if (i > 0) {
          // Если нет активности за день и это не сегодняшний день - прерываем подсчет
          break;
        }
      }
      
      streak = uniqueDays.size;
    }
    
    // Расчет силы (мок)
    const power = Math.min(Math.floor(totalMinutesInHours / 20) + streak, 99);
    
    const result = { 
      data: { 
        power: power || 3, // Мок-данные, если нет реальных
        practiceMinutes: Math.floor(totalMinutes) || 100, // Мок-данные, если нет реальных 
        streak: streak || 7 // Мок-данные, если нет реальных
      }, 
      error: practiceError || streakError 
    };
    
    supabaseLogger.info('Успешно получена статистика пользователя', result.data);
    
    return result;
  } catch (err) {
    supabaseLogger.error('Необработанная ошибка при получении статистики', err);
    console.error('Get user stats error:', err);
    return { 
      data: { 
        power: 3, // Дефолтные данные в случае ошибки
        practiceMinutes: 100, 
        streak: 7 
      }, 
      error: err 
    };
  }
}; 