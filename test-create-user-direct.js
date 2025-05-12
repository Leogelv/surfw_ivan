require('dotenv').config();
// Подключаем еще и сервисный файл с ключом
try {
  require('dotenv').config({ path: '.env.service' });
} catch (e) {
  console.log('Файл .env.service не найден, используем только .env');
}

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: URL или ключ Supabase не найдены в переменных окружения');
  process.exit(1);
}

console.log('URL Supabase:', supabaseUrl);
console.log('Анонимный ключ Supabase:', supabaseKey.substring(0, 10) + '...');
console.log('Service ключ доступен:', !!supabaseServiceKey);

// Создаем клиенты Supabase - анонимный и сервисный (если доступен)
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Простой логгер для имитации нашего логгера в приложении
const telegramLogger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? data : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? data : ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data ? data : ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data ? data : '')
};

// Мок данных пользователя Telegram (используем данные Ивана @sapientweb)
const mockTelegramUser = {
  id: 375634162, 
  first_name: 'Ivan',
  last_name: '',
  username: 'sapientweb',
  language_code: 'ru',
  photo_url: 'https://t.me/i/userpic/320/ivan_sapientweb.jpg',
  auth_date: Math.floor(Date.now() / 1000).toString() // Unix timestamp в секундах
};

// Генерируем случайный пароль
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Создаем пользователя в auth.users через Admin API, а затем в public.users
async function createUser(telegramUser) {
  const now = new Date().toISOString();
  const userId = uuidv4();
  const email = `telegram_${telegramUser.id}@example.com`;
  const password = generateRandomPassword();
  
  // Если нет админского ключа, пытаемся создать через обычный Auth API
  if (!supabaseAdmin) {
    telegramLogger.warn('Сервисный ключ не найден, пытаемся создать пользователя через обычный Auth API');
    
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            telegram_id: telegramUser.id.toString(),
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photo_url: telegramUser.photo_url || ''
          }
        }
      });
      
      if (signUpError) {
        telegramLogger.error('Ошибка при создании пользователя через auth.signUp:', signUpError);
        return null;
      }
      
      telegramLogger.info('Пользователь успешно создан через auth.signUp:', {
        id: signUpData?.user?.id,
        email: signUpData?.user?.email
      });
      
      return signUpData?.user?.id;
    } catch (authError) {
      telegramLogger.error('Ошибка при создании пользователя через Auth API:', authError);
      return null;
    }
  }
  
  // Если у нас есть сервисный ключ, используем Admin API для создания пользователя напрямую
  try {
    // Сначала создаем запись в auth.users через Admin API
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        telegram_id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photo_url: telegramUser.photo_url || '',
        provider: 'telegram'
      },
      email_confirm: true // Подтверждаем email автоматически
    });
    
    if (adminError) {
      telegramLogger.error('Ошибка при создании пользователя через Admin API:', adminError);
      return null;
    }
    
    telegramLogger.info('Пользователь успешно создан через Admin API:', {
      id: adminUser?.user?.id,
      email: adminUser?.user?.email
    });
    
    // Возвращаем ID созданного пользователя
    return adminUser?.user?.id;
  } catch (adminError) {
    telegramLogger.error('Необработанная ошибка при создании пользователя через Admin API:', adminError);
    return null;
  }
}

// Функция для обновления существующего пользователя или создания нового
const createOrUpdateUserInSupabase = async (telegramUser) => {
  if (!telegramUser || !telegramUser.id) {
    telegramLogger.error('Невозможно создать пользователя: отсутствуют данные пользователя Telegram');
    return;
  }

  try {
    telegramLogger.info('Создание/обновление пользователя Telegram в Supabase', { 
      telegramId: telegramUser.id,
      username: telegramUser.username,
      hasPhotoUrl: !!telegramUser.photo_url 
    });
    
    // Проверка наличия пользователя с таким telegram_id
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id.toString())
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      telegramLogger.error('Ошибка при поиске существующего пользователя', 
        { error: findError.message, details: findError.details }
      );
    }
    
    // Преобразование Unix timestamp в ISO формат
    const convertAuthDateToISO = (authDate) => {
      return new Date(authDate * 1000).toISOString();
    };
    
    // Получаем текущую дату в ISO формате
    const now = new Date().toISOString();
    
    // Общие данные пользователя для создания или обновления
    const userData = {
      telegram_id: telegramUser.id.toString(),
      username: telegramUser.username || '',
      first_name: telegramUser.first_name || '',
      last_name: telegramUser.last_name || '',
      photo_url: telegramUser.photo_url || '',
      updated_at: now,
      last_login: now,
      ...(telegramUser.auth_date && { 
        telegram_auth_date: convertAuthDateToISO(parseInt(telegramUser.auth_date)) 
      })
    };
    
    telegramLogger.debug('Подготовленные данные пользователя для сохранения', userData);
    
    // Если пользователь существует, обновляем его
    if (existingUser) {
      telegramLogger.info('Обновление существующего пользователя', { 
        id: existingUser.id,
        telegram_id: existingUser.telegram_id 
      });
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('telegram_id', telegramUser.id.toString())
        .select();
      
      if (updateError) {
        telegramLogger.error('Ошибка при обновлении пользователя', 
          { error: updateError.message, details: updateError.details }
        );
      } else {
        telegramLogger.info('Пользователь успешно обновлен', { updatedUser });
      }
    } else {
      telegramLogger.info('Пользователь не найден, создаем нового пользователя');
      
      // Создаем пользователя через Admin API
      const userId = await createUser(telegramUser);
      
      if (userId) {
        telegramLogger.info('Пользователь создан, ID:', userId);
        
        // Теперь создаем запись в публичной таблице users
        const newUserData = {
          ...userData,
          id: userId,
          created_at: now
        };
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select();
        
        if (insertError) {
          telegramLogger.error('Ошибка при создании записи в таблице users:', insertError);
        } else {
          telegramLogger.info('Запись успешно создана в таблице users:', newUser);
          
          // Дополнительно создаем запись в user_settings
          const settingsData = {
            user_id: userId,
            notifications_enabled: true,
            theme: 'light',
            language: 'ru',
            updated_at: now
          };
          
          try {
            const { error: settingsError } = await supabase
              .from('user_settings')
              .insert(settingsData);
            
            if (settingsError) {
              telegramLogger.error('Ошибка при создании настроек пользователя:', settingsError);
            } else {
              telegramLogger.info('Настройки пользователя успешно созданы');
            }
          } catch (settingsError) {
            telegramLogger.error('Необработанная ошибка при создании настроек:', settingsError);
          }
        }
      } else {
        telegramLogger.error('Не удалось создать пользователя');
        
        // Если мы не смогли создать пользователя через Auth, попробуем сделать прямую вставку
        // только для тестирования, в ситуации когда RLS отключен.
        if (process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === 'true') {
          telegramLogger.warn('Пытаемся сделать прямую вставку (не рекомендуется для продакшн)');
          
          const newUserId = uuidv4();
          const newUserData = {
            ...userData,
            id: newUserId,
            created_at: now
          };
          
          const { data: forcedUser, error: forcedError } = await supabase
            .from('users')
            .insert(newUserData)
            .select();
          
          if (forcedError) {
            telegramLogger.error('Ошибка при принудительной вставке:', forcedError);
          } else {
            telegramLogger.info('Пользователь успешно создан принудительно:', forcedUser);
          }
        }
      }
    }
  } catch (e) {
    telegramLogger.error('Необработанная ошибка при создании/обновлении пользователя', e);
  }
};

// Запускаем тест
async function runTest() {
  console.log('\n=== ТЕСТИРОВАНИЕ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ TELEGRAM В SUPABASE ===');
  console.log('Используемый мок пользователя Telegram:', mockTelegramUser);
  
  // Первый шаг - проверим наличие таблицы users
  const { count, error: tableError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  if (tableError) {
    console.error('Ошибка при проверке таблицы users:', tableError);
    process.exit(1);
  }
  
  console.log(`Таблица users доступна, содержит ${count} записей`);
  
  // Проверяем наличие пользователя с telegram_id до теста
  const { data: beforeTest, error: beforeError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', mockTelegramUser.id.toString())
    .maybeSingle();
  
  if (beforeError && beforeError.code !== 'PGRST116') {
    console.error('Ошибка при проверке пользователя до теста:', beforeError);
  } else {
    console.log('Пользователь до теста:', beforeTest || 'не найден');
  }
  
  // Запускаем основную функцию создания/обновления пользователя
  await createOrUpdateUserInSupabase(mockTelegramUser);
  
  // Проверка результата после теста
  const { data: afterTest, error: afterError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', mockTelegramUser.id.toString())
    .maybeSingle();
  
  if (afterError) {
    console.error('Ошибка при проверке пользователя после теста:', afterError);
  } else {
    console.log('\n=== РЕЗУЛЬТАТ ТЕСТА ===');
    console.log('Пользователь после теста:', afterTest || 'не найден');
    if (afterTest) {
      console.log('Проверка photo_url:', afterTest.photo_url);
      console.log('ID пользователя:', afterTest.id);
      console.log('\nТест выполнен успешно!');
    } else {
      console.log('\nТест не удался: пользователь не создан');
    }
  }
}

runTest()
  .then(() => console.log('\nТест завершен'))
  .catch(e => console.error('Ошибка выполнения теста:', e))
  .finally(() => process.exit()); 