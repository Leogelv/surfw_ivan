import { createClient, Provider } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Создаем клиент только на клиентской стороне, чтобы избежать проблем при статической сборке
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Функция для получения клиента Supabase
export const getSupabaseClient = () => {
  // Если мы на стороне сервера при статической сборке или клиент уже создан, возвращаем его
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    // Создаем фиктивный клиент для статической сборки
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  // Инициализируем клиент, если он еще не создан
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseClient;
};

// Экспортируем supabase для обратной совместимости
export const supabase = getSupabaseClient();

// Функция для авторизации через Telegram
export const handleTelegramAuth = async (telegramUser: any) => {
  // Получаем клиент
  const client = getSupabaseClient();
  
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'telegram' as Provider,
      options: {
        queryParams: {
          auth_data: JSON.stringify(telegramUser)
        }
      }
    });

    return { data, error };
  } catch (err) {
    console.error('Telegram auth error:', err);
    return { data: null, error: err };
  }
};

// Функция для получения данных профиля пользователя
export const getUserProfile = async () => {
  try {
    const client = getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return { data: null, error: 'User not authenticated' };
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Get user profile error:', err);
    return { data: null, error: err };
  }
};

// Функция для получения статистики пользователя
export const getUserStats = async () => {
  try {
    const client = getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) return { data: null, error: 'User not authenticated' };
    
    // Получаем минуты практики
    const { data: practiceMinutes, error: practiceError } = await client
      .from('view_history')
      .select('duration')
      .eq('user_id', user.id);
    
    // Получаем количество дней подряд (streak)
    const { data: streakData, error: streakError } = await client
      .from('view_history')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });
    
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
    
    return { 
      data: { 
        power: power || 3, // Мок-данные, если нет реальных
        practiceMinutes: Math.floor(totalMinutes) || 100, // Мок-данные, если нет реальных 
        streak: streak || 7 // Мок-данные, если нет реальных
      }, 
      error: practiceError || streakError 
    };
  } catch (err) {
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