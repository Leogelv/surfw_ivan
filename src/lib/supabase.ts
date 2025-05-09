import { createClient, Provider } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Функция для авторизации через Telegram
export const handleTelegramAuth = async (telegramUser: any) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'telegram' as Provider,
    options: {
      queryParams: {
        auth_data: JSON.stringify(telegramUser)
      }
    }
  });

  return { data, error };
};

// Функция для получения данных профиля пользователя
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: 'User not authenticated' };
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { data, error };
};

// Функция для получения статистики пользователя
export const getUserStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { data: null, error: 'User not authenticated' };
  
  // Получаем минуты практики
  const { data: practiceMinutes, error: practiceError } = await supabase
    .from('view_history')
    .select('duration')
    .eq('user_id', user.id);
  
  // Получаем количество дней подряд (streak)
  const { data: streakData, error: streakError } = await supabase
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
}; 