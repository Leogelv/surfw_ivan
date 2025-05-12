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
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? data : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? data : ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data ? data : ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data ? data : '')
};

// Мок данных пользователя Telegram для тестирования
const createMockTelegramUser = (id = null) => {
  const testId = id || Math.floor(Math.random() * 1000000) + 1000000; // Генерируем случайный ID, если не указан
  return {
    id: testId,
    first_name: 'Test',
    last_name: 'User',
    username: `test_user_${testId}`,
    language_code: 'ru',
    photo_url: 'https://placekitten.com/200/200', // Тестовое фото из placekitten
    auth_date: Math.floor(Date.now() / 1000).toString() // Unix timestamp в секундах
  };
};

// Генерируем случайный пароль
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Создаем пользователя в auth.users через Auth API, а затем в public.users
async function createUser(telegramUser) {
  const email = `test_${telegramUser.id}_${Date.now()}@example.com`;
  const password = generateRandomPassword();
  
  // Пробуем создать через Auth API
  try {
    logger.info('Создание пользователя через Auth API', { email });
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          telegram_id: telegramUser.id.toString(),
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name || '',
          username: telegramUser.username || '',
          photo_url: telegramUser.photo_url || '',
          is_test_user: true  // Маркер в метаданных (не в таблице)
        }
      }
    });
    
    if (signUpError) {
      logger.error('Ошибка при создании пользователя через auth.signUp:', signUpError);
      return null;
    }
    
    if (!signUpData?.user?.id) {
      logger.error('Не удалось получить ID пользователя после регистрации');
      return null;
    }
    
    logger.info('Пользователь успешно создан через auth.signUp:', {
      id: signUpData.user.id,
      email: signUpData.user.email
    });
    
    return signUpData.user.id;
  } catch (authError) {
    logger.error('Необработанная ошибка при создании пользователя через Auth API:', authError);
    return null;
  }
}

// Функция для создания тестового пользователя
async function createTestUser() {
  console.log('\n=== СОЗДАНИЕ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ ===');
  const mockUser = createMockTelegramUser();
  console.log('Используемые данные:', mockUser);
  
  // Создаем пользователя через API
  const userId = await createUser(mockUser);
  
  if (userId) {
    logger.info('Тестовый пользователь создан в auth.users, ID:', userId);
    
    // Теперь создаем запись в публичной таблице users
    const userData = {
      id: userId,
      telegram_id: mockUser.id.toString(),
      username: mockUser.username || '',
      first_name: mockUser.first_name || '',
      last_name: mockUser.last_name || '',
      photo_url: mockUser.photo_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      ...(mockUser.auth_date && { 
        telegram_auth_date: new Date(parseInt(mockUser.auth_date) * 1000).toISOString()
      })
    };
    
    logger.debug('Данные для создания записи в таблице users:', userData);
    
    try {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select();
      
      if (insertError) {
        logger.error('Ошибка при создании записи в таблице users:', insertError);
      } else {
        logger.info('Запись успешно создана в таблице users:', newUser);
        
        // Дополнительно создаем запись в user_settings
        const settingsData = {
          user_id: userId,
          notifications_enabled: true,
          theme: 'light',
          language: 'ru',
          updated_at: new Date().toISOString()
        };
        
        try {
          const { error: settingsError } = await supabase
            .from('user_settings')
            .insert(settingsData);
          
          if (settingsError) {
            logger.error('Ошибка при создании настроек пользователя:', settingsError);
          } else {
            logger.info('Настройки пользователя успешно созданы');
          }
        } catch (settingsError) {
          logger.error('Необработанная ошибка при создании настроек:', settingsError);
        }
        
        return { 
          userId, 
          telegramId: mockUser.id.toString(),
          username: mockUser.username
        };
      }
    } catch (e) {
      logger.error('Необработанная ошибка при создании записи в users:', e);
    }
  } else {
    logger.error('Не удалось создать тестового пользователя');
  }
  
  return null;
}

// Функция для удаления тестовых пользователей по тестовому username
async function deleteTestUsers() {
  console.log('\n=== УДАЛЕНИЕ ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ ===');
  
  try {
    // Ищем пользователей по шаблону имени пользователя (username начинается с 'test_user_')
    const { data: testUsers, error: findError } = await supabase
      .from('users')
      .select('id, telegram_id, username')
      .like('username', 'test_user_%');
    
    if (findError) {
      logger.error('Ошибка при поиске тестовых пользователей:', findError);
      return;
    }
    
    if (!testUsers || testUsers.length === 0) {
      logger.info('Тестовые пользователи не найдены');
      return;
    }
    
    logger.info(`Найдено ${testUsers.length} тестовых пользователей:`, 
      testUsers.map(u => ({ id: u.id, username: u.username }))
    );
    
    // Удаляем настройки тестовых пользователей
    for (const user of testUsers) {
      try {
        const { error: settingsDeleteError } = await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id);
        
        if (settingsDeleteError) {
          logger.error(`Ошибка при удалении настроек пользователя ${user.id}:`, settingsDeleteError);
        } else {
          logger.info(`Настройки пользователя ${user.id} удалены`);
        }
      } catch (e) {
        logger.error(`Ошибка при удалении настроек пользователя ${user.id}:`, e);
      }
    }
    
    // Удаляем записи из таблицы users
    for (const user of testUsers) {
      try {
        const { error: userDeleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (userDeleteError) {
          logger.error(`Ошибка при удалении пользователя ${user.id} из таблицы users:`, userDeleteError);
        } else {
          logger.info(`Пользователь ${user.username} (${user.id}) удален из таблицы users`);
        }
      } catch (e) {
        logger.error(`Ошибка при удалении пользователя ${user.id} из таблицы users:`, e);
      }
    }
    
    // Удаляем пользователей из auth.users (если доступен сервисный ключ)
    if (supabaseAdmin) {
      for (const user of testUsers) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          
          if (authDeleteError) {
            logger.error(`Ошибка при удалении пользователя ${user.id} из auth.users:`, authDeleteError);
          } else {
            logger.info(`Пользователь ${user.username} (${user.id}) удален из auth.users`);
          }
        } catch (e) {
          logger.error(`Ошибка при удалении пользователя ${user.id} из auth.users:`, e);
        }
      }
    } else {
      logger.warn('Сервисный ключ не доступен, невозможно удалить пользователей из auth.users');
    }
    
    logger.info('Процесс удаления тестовых пользователей завершен');
  } catch (e) {
    logger.error('Необработанная ошибка при удалении тестовых пользователей:', e);
  }
}

// Функция для удаления указанного пользователя
async function deleteSpecificUser(telegramId) {
  console.log(`\n=== УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ С TELEGRAM ID ${telegramId} ===`);
  
  try {
    // Находим пользователя по telegram_id
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username')
      .eq('telegram_id', telegramId.toString())
      .maybeSingle();
    
    if (findError) {
      logger.error('Ошибка при поиске пользователя:', findError);
      return false;
    }
    
    if (!user) {
      logger.info(`Пользователь с Telegram ID ${telegramId} не найден`);
      return false;
    }
    
    logger.info(`Найден пользователь:`, user);
    
    // Удаляем настройки пользователя
    try {
      const { error: settingsDeleteError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
      
      if (settingsDeleteError) {
        logger.error(`Ошибка при удалении настроек пользователя ${user.id}:`, settingsDeleteError);
      } else {
        logger.info(`Настройки пользователя ${user.id} удалены`);
      }
    } catch (e) {
      logger.error(`Ошибка при удалении настроек пользователя ${user.id}:`, e);
    }
    
    // Удаляем запись из таблицы users
    try {
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (userDeleteError) {
        logger.error(`Ошибка при удалении пользователя ${user.id} из таблицы users:`, userDeleteError);
      } else {
        logger.info(`Пользователь ${user.username} (${user.id}) удален из таблицы users`);
      }
    } catch (e) {
      logger.error(`Ошибка при удалении пользователя ${user.id} из таблицы users:`, e);
    }
    
    // Удаляем пользователя из auth.users (если доступен сервисный ключ)
    if (supabaseAdmin) {
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (authDeleteError) {
          logger.error(`Ошибка при удалении пользователя ${user.id} из auth.users:`, authDeleteError);
        } else {
          logger.info(`Пользователь ${user.username} (${user.id}) удален из auth.users`);
        }
      } catch (e) {
        logger.error(`Ошибка при удалении пользователя ${user.id} из auth.users:`, e);
      }
    } else {
      logger.warn('Сервисный ключ не доступен, невозможно удалить пользователя из auth.users');
    }
    
    return true;
  } catch (e) {
    logger.error(`Необработанная ошибка при удалении пользователя ${telegramId}:`, e);
    return false;
  }
}

// Функция для вывода справки
function showHelp() {
  console.log('\n=== УПРАВЛЕНИЕ ТЕСТОВЫМИ ПОЛЬЗОВАТЕЛЯМИ ===');
  console.log('Использование:');
  console.log('  node test-user-operations.js create            - создать тестового пользователя');
  console.log('  node test-user-operations.js delete            - удалить всех тестовых пользователей');
  console.log('  node test-user-operations.js delete <id>       - удалить пользователя с указанным Telegram ID');
  console.log('  node test-user-operations.js delete-ivan       - удалить тестового пользователя Ивана (@sapientweb)');
  console.log('  node test-user-operations.js help              - показать эту справку');
}

// Основная функция
async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command.toLowerCase()) {
    case 'create':
      await createTestUser();
      break;
      
    case 'delete':
      const telegramId = process.argv[3];
      if (telegramId) {
        await deleteSpecificUser(telegramId);
      } else {
        await deleteTestUsers();
      }
      break;
      
    case 'delete-ivan':
      await deleteSpecificUser('375634162'); // ID Ивана (@sapientweb)
      break;
      
    default:
      console.log(`Неизвестная команда: ${command}`);
      showHelp();
  }
}

// Запускаем скрипт
main()
  .then(() => console.log('\nОперация завершена'))
  .catch(e => console.error('Ошибка выполнения:', e))
  .finally(() => process.exit()); 