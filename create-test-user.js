// Скрипт для создания тестового пользователя в Supabase
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

// Генерируем случайный пароль
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

// Создаем мок данных пользователя Telegram с определенным timestamp для времени
function createMockTelegramUser() {
  const randomId = Math.floor(Math.random() * 1000000) + 1000000; // Случайный ID
  const timestamp = Math.floor(Date.now() / 1000); // Текущее время в секундах

  return {
    id: randomId,
    first_name: 'Test',
    last_name: 'User',
    username: `test_user_${randomId}`,
    language_code: 'ru',
    photo_url: 'https://placekitten.com/200/200',
    auth_date: timestamp.toString()
  };
}

// Правильный подход к созданию пользователя:
// 1. Сначала создать пользователя в auth.users через Auth API
// 2. Затем создать запись в public.users с тем же ID
async function createUserInSupabase() {
  const mockTelegramUser = createMockTelegramUser();
  console.log("Создаем тестового пользователя с данными:", mockTelegramUser);
  
  // Шаг 1: Создаем пользователя в auth.users
  const email = `test_${mockTelegramUser.id}@example.com`;
  const password = generateRandomPassword();
  let userId = null;
  
  // Используем обычный signUp
  try {
    console.log("Используем auth.signUp для создания пользователя");
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          telegram_id: mockTelegramUser.id.toString(),
          first_name: mockTelegramUser.first_name,
          last_name: mockTelegramUser.last_name,
          username: mockTelegramUser.username,
          photo_url: mockTelegramUser.photo_url,
          provider: 'telegram'
        }
      }
    });
    
    if (signUpError) {
      console.error("Ошибка при создании пользователя через auth.signUp:", signUpError);
      return null;
    }
    
    if (!signUpData?.user?.id) {
      console.error("Не удалось получить ID пользователя после регистрации");
      return null;
    }
    
    userId = signUpData.user.id;
    console.log("Пользователь успешно создан в auth.users, ID:", userId);
  } catch (error) {
    console.error("Необработанная ошибка при использовании auth.signUp:", error);
    return null;
  }
  
  if (!userId) {
    console.error("Не удалось получить ID созданного пользователя");
    return null;
  }
  
  // Шаг 2: Создаем запись в public.users с тем же ID
  try {
    const userData = {
      id: userId, // Важно! Используем тот же ID, что и в auth.users
      telegram_id: mockTelegramUser.id.toString(),
      username: mockTelegramUser.username,
      first_name: mockTelegramUser.first_name,
      last_name: mockTelegramUser.last_name || '',
      photo_url: mockTelegramUser.photo_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      telegram_auth_date: new Date(parseInt(mockTelegramUser.auth_date) * 1000).toISOString()
    };
    
    console.log("Создаем запись в public.users с данными:", userData);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select();
    
    if (insertError) {
      console.error("Ошибка при создании записи в public.users:", insertError);
      
      // Если возникла ошибка и доступен сервисный ключ, удаляем пользователя из auth.users
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          console.log("Пользователь удален из auth.users из-за ошибки");
        } catch (deleteError) {
          console.error("Ошибка при удалении пользователя из auth.users:", deleteError);
        }
      }
      
      return null;
    }
    
    console.log("Запись успешно создана в public.users:", newUser);
    
    // Шаг 3: Создаем запись в user_settings
    try {
      const settingsData = {
        user_id: userId,
        notifications_enabled: true,
        theme: 'light',
        language: 'ru',
        updated_at: new Date().toISOString()
      };
      
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert(settingsData);
      
      if (settingsError) {
        console.error("Ошибка при создании настроек пользователя:", settingsError);
      } else {
        console.log("Настройки пользователя успешно созданы");
      }
    } catch (error) {
      console.error("Необработанная ошибка при создании настроек:", error);
    }
    
    return {
      id: userId,
      telegram_id: mockTelegramUser.id.toString(),
      username: mockTelegramUser.username,
      email: email
    };
  } catch (error) {
    console.error("Необработанная ошибка при создании записи в public.users:", error);
    
    // Если возникла ошибка и доступен сервисный ключ, удаляем пользователя из auth.users
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log("Пользователь удален из auth.users из-за ошибки");
      } catch (deleteError) {
        console.error("Ошибка при удалении пользователя из auth.users:", deleteError);
      }
    }
    
    return null;
  }
}

// Функция для удаления тестового пользователя
async function deleteUserFromSupabase(userId) {
  if (!userId) {
    console.error("ID пользователя не указан");
    return false;
  }
  
  console.log("Удаляем пользователя с ID:", userId);
  
  // Шаг 1: Удаляем настройки пользователя
  try {
    const { error: settingsDeleteError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);
    
    if (settingsDeleteError) {
      console.error("Ошибка при удалении настроек пользователя:", settingsDeleteError);
    } else {
      console.log("Настройки пользователя успешно удалены");
    }
  } catch (error) {
    console.error("Необработанная ошибка при удалении настроек:", error);
  }
  
  // Шаг 2: Удаляем пользователя из public.users
  try {
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userDeleteError) {
      console.error("Ошибка при удалении пользователя из public.users:", userDeleteError);
    } else {
      console.log("Пользователь успешно удален из public.users");
    }
  } catch (error) {
    console.error("Необработанная ошибка при удалении пользователя из public.users:", error);
  }
  
  // Шаг 3: Удаляем пользователя из auth.users
  if (supabaseAdmin) {
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error("Ошибка при удалении пользователя из auth.users:", authDeleteError);
        return false;
      } else {
        console.log("Пользователь успешно удален из auth.users");
        return true;
      }
    } catch (error) {
      console.error("Необработанная ошибка при удалении пользователя из auth.users:", error);
      return false;
    }
  } else {
    console.warn("Сервисный ключ не доступен, не удалось удалить пользователя из auth.users");
    return false;
  }
}

// Функция для отображения списка тестовых пользователей
async function listTestUsers() {
  console.log("\n=== СПИСОК ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ ===");
  
  try {
    // Ищем пользователей по шаблону имени пользователя (username начинается с 'test_user_')
    const { data: testUsers, error: findError } = await supabase
      .from('users')
      .select('id, telegram_id, username, first_name, last_name, photo_url')
      .like('username', 'test_user_%');
    
    if (findError) {
      console.error('Ошибка при поиске тестовых пользователей:', findError);
      return;
    }
    
    if (!testUsers || testUsers.length === 0) {
      console.log('Тестовые пользователи не найдены');
      return;
    }
    
    console.log(`Найдено ${testUsers.length} тестовых пользователей:`);
    testUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Telegram ID: ${user.telegram_id}, Username: ${user.username}`);
    });
    
    console.log("\nДля удаления используйте: node create-test-user.js delete USER_ID");
  } catch (error) {
    console.error('Необработанная ошибка при поиске тестовых пользователей:', error);
  }
}

// Основная функция
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'create':
      console.log("\n=== СОЗДАНИЕ ТЕСТОВОГО ПОЛЬЗОВАТЕЛЯ ===");
      const user = await createUserInSupabase();
      
      if (user) {
        console.log("\n=== ПОЛЬЗОВАТЕЛЬ УСПЕШНО СОЗДАН ===");
        console.log("ID:", user.id);
        console.log("Telegram ID:", user.telegram_id);
        console.log("Username:", user.username);
        console.log("Email:", user.email);
        console.log("\nДля удаления используйте: node create-test-user.js delete", user.id);
      } else {
        console.error("\n=== ОШИБКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ===");
      }
      break;
      
    case 'delete':
      const userId = process.argv[3];
      
      if (!userId) {
        console.error("Не указан ID пользователя для удаления");
        console.log("Использование: node create-test-user.js delete USER_ID");
        return;
      }
      
      console.log("\n=== УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ===");
      const result = await deleteUserFromSupabase(userId);
      
      if (result) {
        console.log("\n=== ПОЛЬЗОВАТЕЛЬ УСПЕШНО УДАЛЕН ===");
      } else {
        console.error("\n=== ОШИБКА УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ ===");
      }
      break;
      
    case 'list':
      await listTestUsers();
      break;
      
    case 'help':
    default:
      console.log("\n=== СПРАВКА ПО ИСПОЛЬЗОВАНИЮ ===");
      console.log("Создание пользователя: node create-test-user.js create");
      console.log("Список тестовых пользователей: node create-test-user.js list");
      console.log("Удаление пользователя: node create-test-user.js delete USER_ID");
      break;
  }
}

// Запускаем скрипт
main()
  .catch(err => console.error("Ошибка выполнения скрипта:", err))
  .finally(() => process.exit()); 