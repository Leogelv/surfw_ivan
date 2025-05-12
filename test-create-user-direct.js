require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: URL или ключ Supabase не найдены в переменных окружения');
  process.exit(1);
}

console.log('URL Supabase:', supabaseUrl);
console.log('Ключ Supabase:', supabaseKey.substring(0, 10) + '...');

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Простой логгер для имитации нашего логгера в приложении
const telegramLogger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? data : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? data : ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data ? data : ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data ? data : '')
};

// Мок данных пользователя Telegram (похоже на то, что мы получаем от SDK)
const mockTelegramUser = {
  id: 12345678, // Числовой ID, как в Telegram
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'ru',
  photo_url: 'https://t.me/i/userpic/320/test_user.jpg',
  auth_date: Math.floor(Date.now() / 1000).toString() // Unix timestamp в секундах
};

// Функция из TelegramContext для создания пользователя в Supabase
// Модифицирована для прямого создания записи в auth.users, если необходимо
const createUserInSupabase = async (telegramUser) => {
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
      .select('*') // Получаем все поля для лучшей информативности
      .eq('telegram_id', telegramUser.id.toString())
      .maybeSingle();
    
    if (findError) {
      telegramLogger.error('Ошибка при поиске существующего пользователя', 
        { error: findError.message, details: findError.details }
      );
    }
    
    // Преобразование Unix timestamp в ISO формат
    const convertAuthDateToISO = (authDate) => {
      // authDate приходит как Unix timestamp в секундах, преобразуем в миллисекунды для Date
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
      telegramLogger.info('Обновление существующего пользователя', { existingUser });
      
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
      // Для тестирования вместо создания нового пользователя, используем
      // уже существующий тестовый пользователь, если он есть
      const { data: testUsers } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (testUsers && testUsers.length > 0) {
        const testUser = testUsers[0];
        telegramLogger.info('Используем существующего пользователя для теста', { testUser });
        
        // Обновляем существующего пользователя с telegram_id
        const { data: updatedTest, error: updateTestError } = await supabase
          .from('users')
          .update({
            ...userData,
            telegram_id: telegramUser.id.toString() // Устанавливаем наш тестовый telegram_id
          })
          .eq('id', testUser.id)
          .select();
        
        if (updateTestError) {
          telegramLogger.error('Ошибка при обновлении тестового пользователя', 
            { error: updateTestError.message, details: updateTestError.details }
          );
        } else {
          telegramLogger.info('Тестовый пользователь успешно обновлен с новым telegram_id', { updatedTest });
        }
      } else {
        telegramLogger.warn('Не найдено существующих пользователей для теста, пропускаем создание');
      }
    }
  } catch (e) {
    telegramLogger.error('Необработанная ошибка при создании/обновлении пользователя', e);
  }
};

// Запускаем тест
async function runTest() {
  console.log('=== ТЕСТИРОВАНИЕ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ TELEGRAM В SUPABASE ===');
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
  await createUserInSupabase(mockTelegramUser);
  
  // Проверка результата после теста
  const { data: afterTest, error: afterError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', mockTelegramUser.id.toString())
    .maybeSingle();
  
  if (afterError) {
    console.error('Ошибка при проверке пользователя после теста:', afterError);
  } else {
    console.log('=== РЕЗУЛЬТАТ ТЕСТА ===');
    console.log('Пользователь после теста:', afterTest || 'не найден');
    if (afterTest) {
      console.log('Проверка photo_url:', afterTest.photo_url);
      console.log('Первоначальный ID пользователя:', afterTest.id);
      console.log('Тест выполнен успешно!');
    } else {
      console.log('Тест не удался: пользователь не создан');
    }
  }
}

runTest()
  .then(() => console.log('Тест завершен'))
  .catch(e => console.error('Ошибка выполнения теста:', e))
  .finally(() => process.exit()); 