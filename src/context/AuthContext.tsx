'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useTelegram } from './TelegramContext';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Типы данных
interface User {
  id: string;
  telegram_id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: number;
  updated_at?: string;
  created_at?: string;
}

interface AuthContextType {
  user: any;
  userData: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { telegramUser, initData } = useTelegram();
  const supabase = getSupabaseClient();
  const authLogger = logger.createLogger('AuthContext');

  // Функция для создания/обновления пользователя Telegram в Supabase
  const createOrUpdateTelegramUser = async (telegramData: any) => {
    if (!telegramData || !telegramData.id) {
      authLogger.warn('Попытка создания пользователя без данных Telegram');
      return null;
    }

    try {
      authLogger.info('Создание/обновление пользователя Telegram в Supabase', { telegramId: telegramData.id });
      
      // Проверяем существует ли пользователь
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramData.id.toString())
        .maybeSingle();
      
      if (fetchError) {
        authLogger.error('Ошибка при проверке существования пользователя', fetchError);
        throw fetchError;
      }

      // Данные для создания/обновления
      const userData = {
        telegram_id: telegramData.id.toString(),
        username: telegramData.username || '',
        first_name: telegramData.first_name || '',
        last_name: telegramData.last_name || '',
        photo_url: telegramData.photo_url || '',
        auth_date: telegramData.auth_date ? parseInt(telegramData.auth_date.toString()) : Math.floor(Date.now() / 1000),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      let result;
      
      // Если пользователь существует - обновляем, иначе создаем
      if (existingUser) {
        authLogger.info('Обновление существующего пользователя', { userId: existingUser.id });
        const { data, error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('telegram_id', telegramData.id.toString())
          .select()
          .single();
        
        if (updateError) {
          authLogger.error('Ошибка при обновлении пользователя', updateError);
          throw updateError;
        }
        
        result = data;
        authLogger.info('Пользователь успешно обновлен', { userId: result.id });
      } else {
        authLogger.info('Создание нового пользователя');
        // Генерируем UUID для нового пользователя
        const newUserId = uuidv4();
        
        const { data, error: insertError } = await supabase
          .from('users')
          .insert({ 
            id: newUserId,
            ...userData, 
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          authLogger.error('Ошибка при создании пользователя', insertError);
          
          // Если ошибка связана с constraint, попробуем еще раз получить пользователя
          // Он мог быть создан, но возникла ошибка при возврате данных
          if (insertError.code === '23505') { // duplicate key value violates unique constraint
            authLogger.info('Пользователь, возможно, уже существует. Пробуем получить его данные');
            const { data: retryUser, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_id', telegramData.id.toString())
              .single();
            
            if (retryError) {
              authLogger.error('Не удалось получить данные после повторной попытки', retryError);
              throw retryError;
            }
            
            authLogger.info('Пользователь найден после повторной попытки', { userId: retryUser.id });
            result = retryUser;
          } else {
            throw insertError;
          }
        } else {
          result = data;
          authLogger.info('Пользователь успешно создан', { userId: result.id });
          
          // Создадим настройки пользователя, если есть такая таблица
          try {
            const { count, error: settingsCountError } = await supabase
              .from('user_settings')
              .select('*', { count: 'exact', head: true });
            
            if (!settingsCountError) {
              // Таблица существует, создаем запись настроек
              const settingsData = {
                id: uuidv4(),
                user_id: result.id,
                notification_enabled: true,
                theme: 'light',
                last_updated: new Date().toISOString()
              };
              
              const { error: settingsError } = await supabase
                .from('user_settings')
                .insert(settingsData);
              
              if (settingsError) {
                authLogger.error('Ошибка при создании настроек пользователя', settingsError);
              } else {
                authLogger.info('Настройки пользователя успешно созданы');
              }
            }
          } catch (settingsError) {
            authLogger.error('Ошибка при работе с таблицей user_settings', settingsError);
          }
        }
      }
      
      return result;
    } catch (error) {
      authLogger.error('Ошибка при создании/обновлении пользователя', error);
      setError('Ошибка при создании/обновлении пользователя');
      return null;
    }
  };

  // Эффект для авторизации через Telegram
  useEffect(() => {
    async function handleTelegramAuth() {
      if (!telegramUser) {
        authLogger.info('Пользователь Telegram не найден, ожидание авторизации');
        setIsLoading(false);
        return;
      }

      try {
        authLogger.info('Данные пользователя Telegram получены, инициируем авторизацию', { 
          telegramId: telegramUser.id,
          username: telegramUser.username
        });
        
        // Проверяем клиент Supabase
        if (!supabase) {
          authLogger.error('Клиент Supabase не инициализирован, авторизация невозможна', {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Установлен' : 'Не установлен',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Установлен' : 'Не установлен'
          });
          setIsLoading(false);
          return;
        }
        
        // Проверяем соединение с Supabase
        try {
          authLogger.debug('Проверка соединения с Supabase...');
          const { error: pingError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true })
            .limit(1);
          
          if (pingError) {
            authLogger.error('Ошибка соединения с Supabase', {
              code: pingError.code,
              message: pingError.message,
              details: pingError.details
            });
            setIsLoading(false);
            return;
          }
          
          authLogger.info('Соединение с Supabase установлено успешно');
        } catch (pingError) {
          authLogger.error('Необработанная ошибка при проверке соединения с Supabase', pingError);
          setIsLoading(false);
          return;
        }
        
        // Получаем пользователя из Supabase или создаем нового
        const userRecord = await createOrUpdateTelegramUser(telegramUser);
        
        if (userRecord) {
          setUserData(userRecord);
          authLogger.info('Авторизация через Telegram успешна', { userId: userRecord.id });
          
          // Попытка войти через auth API для синхронизации сессии
          try {
            const email = `telegram_${telegramUser.id}@example.com`;
            const password = generateStrongPassword();
            
            const { data: signInResult, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              // Если не удалось войти, пробуем создать пользователя
              authLogger.info('Не удалось войти, пробуем создать пользователя в auth', { 
                error: signInError.message 
              });
              
              const { data: signUpResult, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    telegram_id: telegramUser.id.toString(),
                    username: telegramUser.username || '',
                    first_name: telegramUser.first_name || '',
                    last_name: telegramUser.last_name || '',
                    provider: 'telegram'
                  }
                }
              });
              
              if (signUpError) {
                authLogger.error('Не удалось создать пользователя в auth', { 
                  error: signUpError.message 
                });
              } else {
                authLogger.info('Пользователь создан в auth', { 
                  userId: signUpResult.user?.id 
                });
                setUser(signUpResult.user);
              }
            } else {
              authLogger.info('Успешный вход через auth API', { 
                userId: signInResult.user?.id 
              });
              setUser(signInResult.user);
            }
          } catch (authError) {
            authLogger.error('Ошибка при работе с auth API', authError);
          }
        } else {
          authLogger.warn('Не удалось получить данные пользователя после создания/обновления');
        }
      } catch (error) {
        authLogger.error('Ошибка при авторизации через Telegram', error);
        setError('Ошибка при авторизации через Telegram');
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    handleTelegramAuth();
  }, [telegramUser, authLogger]);

  // Функция для генерации сложного пароля
  function generateStrongPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Функция для входа по email/password
  const signIn = async (email: string, password: string) => {
    try {
      authLogger.info('Попытка входа по email/password', { email });
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        authLogger.error('Ошибка при входе', error);
        setError(error.message);
        return;
      }
      
      setUser(data.user);
      authLogger.info('Вход успешен', { userId: data.user?.id });
    } catch (error) {
      authLogger.error('Исключение при входе', error);
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода
  const signOut = async () => {
    try {
      authLogger.info('Попытка выхода');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        authLogger.error('Ошибка при выходе', error);
        setError(error.message);
        return;
      }
      
      setUser(null);
      setUserData(null);
      authLogger.info('Выход успешен');
    } catch (error) {
      authLogger.error('Исключение при выходе', error);
      setError('Произошла ошибка при выходе');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userData,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user || !!userData,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 