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
  photo_url: 'https://example.com/test_cli.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString()
};

// Функция для создания пользователя
async function createTestUser() {
  try {
    console.log('Создаем тестового пользователя:', userData);
    
    // Проверяем, существует ли пользователь с таким telegram_id
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, telegram_id')
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
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          updated_at: userData.updated_at,
          last_login: userData.last_login
        })
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select();
    
    if (insertError) {
      console.error('Ошибка при создании пользователя:', insertError);
      process.exit(1);
    }
    
    console.log('Пользователь успешно создан:', newUser);
    
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