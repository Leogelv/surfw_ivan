// Скрипт для создания тестового пользователя в Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Функция для генерации UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

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

// Данные тестового пользователя
const userData = {
  id: uuidv4(),
  telegram_id: '987654321',
  username: 'test_cli_user',
  first_name: 'CLI',
  last_name: 'Test',
  // Используем реальную ссылку на Telegram фото вместо примера
  photo_url: 'https://t.me/i/userpic/320/default.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  telegram_auth_date: new Date().toISOString(), // Используем стандартный формат ISO для timestamp
};

// Функция для проверки доступности Supabase
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Ошибка при подключении к Supabase:', error);
      return false;
    }
    
    console.log('Успешное подключение к Supabase!');
    return true;
  } catch (e) {
    console.error('Необработанная ошибка при проверке подключения к Supabase:', e);
    return false;
  }
}

// Функция для создания пользователя
async function createTestUser() {
  try {
    // Сначала проверяем подключение
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('Невозможно продолжить без подключения к Supabase');
      process.exit(1);
    }
    
    console.log('Создаем тестового пользователя:', userData);
    
    // Проверяем, существует ли пользователь с таким telegram_id
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, telegram_id, photo_url') // Добавляем photo_url для проверки
      .eq('telegram_id', userData.telegram_id)
      .limit(1);
    
    if (checkError) {
      console.error('Ошибка при проверке существующего пользователя:', checkError);
      process.exit(1);
    }
    
    // Если пользователь с таким telegram_id уже существует, обновляем его
    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('Пользователь с таким telegram_id уже существует, обновляем:', existingUser);
      console.log('Текущее значение photo_url:', existingUser.photo_url);
      
      const updatedData = {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        photo_url: userData.photo_url,
        updated_at: userData.updated_at,
        last_login: userData.last_login,
        telegram_auth_date: userData.telegram_auth_date
      };
      
      console.log('Данные для обновления:', updatedData);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updatedData)
        .eq('telegram_id', userData.telegram_id)
        .select();
      
      if (updateError) {
        console.error('Ошибка при обновлении пользователя:', updateError);
        process.exit(1);
      }
      
      console.log('Пользователь успешно обновлен:', updatedUser);
      return;
    }
    
    // Создаем нового пользователя
    console.log('Создаем нового пользователя с данными:', userData);
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select();
    
    if (insertError) {
      console.error('Ошибка при создании пользователя:', insertError);
      process.exit(1);
    }
    
    console.log('Пользователь успешно создан:', newUser);
    
    // Проверка успешности создания/обновления
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userData.telegram_id)
      .single();
      
    if (verifyError) {
      console.error('Ошибка при проверке созданного пользователя:', verifyError);
    } else {
      console.log('Проверка: пользователь в базе данных:', verifyUser);
      console.log('Проверка photo_url:', verifyUser.photo_url);
    }
    
    // Проверяем наличие таблицы user_settings
    try {
      const { count, error: settingsCountError } = await supabase
        .from('user_settings')
        .select('*', { count: 'exact', head: true });
      
      if (settingsCountError) {
        console.log('Таблица user_settings не найдена или нет доступа к ней, пропускаем создание настроек');
        return;
      }
      
      // Создаем запись в user_settings для этого пользователя
      if (newUser && newUser.length > 0) {
        const settingsData = {
          id: uuidv4(),
          user_id: newUser[0].id,
          notification_enabled: true,
          theme: 'light',
          last_updated: new Date().toISOString()
        };
        
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert(settingsData);
        
        if (settingsError) {
          console.error('Ошибка при создании настроек пользователя:', settingsError);
        } else {
          console.log('Настройки пользователя успешно созданы');
        }
      }
    } catch (settingsError) {
      console.error('Ошибка при работе с таблицей user_settings:', settingsError);
    }
  } catch (e) {
    console.error('Необработанная ошибка:', e);
    process.exit(1);
  }
}

// Запускаем создание пользователя
createTestUser()
  .then(() => {
    console.log('Операция завершена успешно');
    process.exit(0);
  })
  .catch(e => {
    console.error('Необработанная ошибка в промисе:', e);
    process.exit(1);
  }); 