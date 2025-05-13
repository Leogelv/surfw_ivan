import { createClient, Provider } from '@supabase/supabase-js';
import { Database } from './database.types';
import { createLogger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Получаем сервисный ключ из окружения (только для тестирования)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

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
  
  // Отладочная информация о ключах
  console.log('DEBUG: Supabase URL:', supabaseUrl);
  console.log('DEBUG: Supabase Key Length:', supabaseAnonKey?.length);
  console.log('DEBUG: Supabase Key First 10 chars:', supabaseAnonKey?.substring(0, 10));
  console.log('DEBUG: Supabase Key Last 10 chars:', supabaseAnonKey?.substring(supabaseAnonKey.length - 10));
  
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

// Функция для прямой проверки соединения с Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('Прямая проверка соединения с Supabase');
    
    // 1. Тест через обычный fetch
    const url = `${supabaseUrl}/rest/v1/users?select=count`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    const status = response.status;
    console.log('Статус ответа от Supabase через fetch:', status);
    
    if (status >= 200 && status < 300) {
      console.log('Соединение с Supabase успешно установлено через fetch');
    } else {
      console.log('Ошибка соединения с Supabase через fetch, статус:', status);
      const text = await response.text();
      console.log('Ответ:', text);
    }

    // 2. Тест через стандартный клиент
    try {
      if (supabaseClient) {
        const { data, error, status } = await supabaseClient
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        console.log('Статус ответа от Supabase через клиент:', status);
        
        if (error) {
          console.log('Ошибка соединения через клиент:', error);
        } else {
          console.log('Соединение с Supabase успешно установлено через клиент');
        }
      } else {
        console.log('Клиент Supabase не инициализирован для тестирования');
      }
    } catch (clientError) {
      console.error('Ошибка при проверке соединения через клиент:', clientError);
    }
    
    // 3. Тест через сервисный клиент (только для разработки)
    if (process.env.NODE_ENV === 'development') {
      try {
        const serviceClient = createTestServiceClient();
        
        if (serviceClient) {
          const { data, error, status } = await serviceClient
            .from('users')
            .select('count', { count: 'exact', head: true });
          
          console.log('Статус ответа от Supabase через сервисный клиент:', status);
          
          if (error) {
            console.log('Ошибка соединения через сервисный клиент:', error);
          } else {
            console.log('Соединение с Supabase успешно установлено через сервисный клиент');
            return true;
          }
        } else {
          console.log('Сервисный клиент не инициализирован');
        }
      } catch (serviceError) {
        console.error('Ошибка при проверке соединения через сервисный клиент:', serviceError);
      }
    }
    
    return status >= 200 && status < 300;
  } catch (error) {
    console.error('Необработанная ошибка при прямой проверке соединения с Supabase:', error);
    return false;
  }
};

// ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ - создает клиент с сервисным ключом
// ВНИМАНИЕ: Не использовать в production-коде на клиенте!
export const createTestServiceClient = () => {
  // Проверка, что мы в режиме разработки
  if (process.env.NODE_ENV !== 'development') {
    console.error('Попытка создать сервисный клиент в production! Использование отклонено.');
    return null;
  }
  
  console.log('Создаю тестовый клиент с сервисным ключом для отладки');
  
  if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
    console.error('Не установлен URL для Supabase');
    return null;
  }
  
  if (!supabaseServiceKey) {
    console.error('Не установлен сервисный ключ для Supabase');
    return null;
  }
  
  try {
    // Создаем клиент с сервисным ключом (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ)
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    console.error('Ошибка при создании тестового клиента', error);
    return null;
  }
};

// Функция для диагностики проблем инициализации клиента
export const diagnoseClientIssues = () => {
  try {
    console.log('----------------------');
    console.log('ДИАГНОСТИКА КЛИЕНТА SUPABASE');
    console.log('----------------------');
    
    // Проверяем окружение
    console.log('Окружение:', process.env.NODE_ENV);
    console.log('URL Supabase:', supabaseUrl);
    console.log('Длина ключа Supabase:', supabaseAnonKey?.length);
    
    // Основные проблемы
    if (!supabaseUrl || supabaseUrl === 'https://placeholder-url.supabase.co') {
      console.log('❌ URL Supabase не установлен или имеет значение по умолчанию');
    } else {
      console.log('✅ URL Supabase установлен');
    }
    
    if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
      console.log('❌ Ключ Supabase не установлен или имеет значение по умолчанию');
    } else if (supabaseAnonKey.length < 20) {
      console.log('❌ Ключ Supabase слишком короткий, вероятно неверный');
    } else {
      console.log('✅ Ключ Supabase установлен и имеет корректную длину');
    }
    
    // Проверяем тип окружения
    if (typeof window === 'undefined') {
      console.log('⚠️ Код выполняется на сервере');
    } else {
      console.log('✅ Код выполняется в браузере');
    }
    
    // Проверяем наличие клиента
    if (supabaseClient) {
      console.log('✅ Клиент Supabase инициализирован');
    } else {
      console.log('❌ Клиент Supabase не инициализирован');
    }
    
    console.log('----------------------');
    return {
      url: supabaseUrl,
      keyLength: supabaseAnonKey?.length,
      isClientInitialized: !!supabaseClient,
      runningInBrowser: typeof window !== 'undefined',
      environment: process.env.NODE_ENV
    };
  } catch (error) {
    console.error('Ошибка при диагностике клиента Supabase:', error);
    return { error };
  }
};

// Функция создания пользователя с сервисным ключом (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ)
export const testCreateUserWithServiceKey = async (tgUserData: any) => {
  try {
    supabaseLogger.info('testCreateUserWithServiceKey: Запуск тестового создания пользователя', { tgUserData });
    
    if (process.env.NODE_ENV !== 'development') {
      supabaseLogger.error('testCreateUserWithServiceKey: Эта функция должна использоваться только в режиме разработки!');
      return { success: false, error: 'Not in development mode' };
    }

    const serviceClient = createTestServiceClient();
    if (!serviceClient) {
      supabaseLogger.error('testCreateUserWithServiceKey: Не удалось создать сервисный клиент Supabase.');
      return { success: false, error: 'Failed to create service client' };
    }
    
    const uniqueEmail = `test_${tgUserData.id}_${Date.now()}@example.com`;
    const randomPassword = `P@ssword${Date.now()}`;

    // Данные, которые будут переданы в raw_user_meta_data и использованы триггером
    const userMetadataForAuth = {
        first_name: tgUserData.first_name || 'ТестИмя',
        last_name: tgUserData.last_name || 'ТестФамилия',
        username: tgUserData.username || `testuser_${tgUserData.id}`,
        photo_url: tgUserData.photo_url || null,
        telegram_id: tgUserData.id.toString(),
        auth_date: tgUserData.auth_date || Math.floor(Date.now() / 1000).toString()
        // Добавьте любые другие поля, которые ваш триггер ожидает из raw_user_meta_data
    };
    supabaseLogger.debug('testCreateUserWithServiceKey: userMetadataForAuth', userMetadataForAuth);

    // 1. Создаем пользователя в auth.users через Admin API
    const { data: authResponse, error: authError } = await serviceClient.auth.admin.createUser({
      email: uniqueEmail,
      password: randomPassword,
      email_confirm: true, // Для тестовых созданий можно ставить true, чтобы не слать писем
      user_metadata: userMetadataForAuth 
    });
    
    if (authError) {
      supabaseLogger.error('testCreateUserWithServiceKey: Ошибка при создании пользователя в auth.users через Admin API', { error: authError });
      return { success: false, error: authError.message, details: authError };
    }
    
    if (!authResponse.user) {
      supabaseLogger.error('testCreateUserWithServiceKey: Admin API не вернул пользователя после создания.');
      return { success: false, error: 'Admin API did not return a user object' };
    }
    
    supabaseLogger.info('testCreateUserWithServiceKey: Пользователь успешно создан в auth.users', { userId: authResponse.user.id });

    // 2. Проверяем, создалась ли запись в public.users (триггером handle_new_user)
    // Даем триггеру немного времени
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    supabaseLogger.debug('testCreateUserWithServiceKey: Проверка записи в public.users', { userId: authResponse.user.id });
    const { data: publicUser, error: publicUserError } = await serviceClient
      .from('users') // Наша таблица public.users
      .select('*')
      .eq('id', authResponse.user.id)
      .maybeSingle();

    if (publicUserError) {
      supabaseLogger.error('testCreateUserWithServiceKey: Ошибка при проверке пользователя в public.users', { error: publicUserError });
      // Не считаем это полной неудачей, если auth.user создался
      return { success: true, authUser: authResponse.user, errorPublicUser: publicUserError.message, warning: "Auth user created, but failed to verify public.users record." };
    }

    if (publicUser) {
      supabaseLogger.info('testCreateUserWithServiceKey: Запись в public.users успешно найдена (создана триггером)!', { publicUser });
      return { success: true, authUser: authResponse.user, dbUser: publicUser };
    } else {
      supabaseLogger.warn('testCreateUserWithServiceKey: Запись в public.users НЕ найдена. Триггер handle_new_user мог не сработать или работает с ошибкой.', { authUserId: authResponse.user.id });
      return { success: true, authUser: authResponse.user, warning: "Auth user created, but public.users record was not found. Check trigger.", errorPublicUser: "Record in public.users not found" };
    }

  } catch (error: any) {
    supabaseLogger.error('testCreateUserWithServiceKey: Необработанная ошибка', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}; 