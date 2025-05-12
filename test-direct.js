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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZ2lvcW1jeXR4a3NwYnJiYXd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI1MTM5MSwiZXhwIjoyMDYxODI3MzkxfQ.k4UakRbNX2G-rJv-KhYLG8DnS8PpVgQS1qTGnRnBsDE";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Ошибка: URL или сервисный ключ Supabase не найдены');
  process.exit(1);
}

console.log('URL Supabase:', supabaseUrl);
console.log('Сервисный ключ доступен:', !!supabaseServiceKey);

// Создаем клиент Supabase с сервисным ключом
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Генерируем случайный пароль и хэш для пароля
function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

async function createUserDirect() {
  try {
    // Создаем тестовые данные
    const telegram_id = Math.floor(Math.random() * 1000000) + 1000000;
    const username = `test_direct_${telegram_id}`;
    const password = generateRandomPassword();
    const email = `test_${telegram_id}@example.com`;
    
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Telegram ID:', telegram_id);

    // Шаг 1: Создаем пользователя в auth.users через Admin API
    console.log('Создаем пользователя через Admin API...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegram_id.toString(),
        username,
        first_name: 'Test',
        last_name: 'Direct',
        provider: 'telegram'
      }
    });

    if (authError) {
      console.error('Ошибка при создании пользователя в auth.users:', authError);
      return null;
    }

    if (!authUser || !authUser.user || !authUser.user.id) {
      console.error('Не удалось получить ID созданного пользователя');
      return null;
    }
    
    const newUserId = authUser.user.id;
    console.log('Пользователь создан в auth.users, ID:', newUserId);

    // Проверяем, была ли уже создана запись в public.users автоматически триггером
    console.log('Проверяем, существует ли запись в public.users...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', newUserId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Ошибка при проверке записи в public.users:', checkError);
    }
    
    if (existingUser) {
      console.log('Запись в public.users уже существует, создана автоматически триггером:', existingUser);
      
      // Обновляем данные если нужно
      console.log('Обновляем данные пользователя...');
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          photo_url: 'https://placekitten.com/200/200',
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .eq('id', newUserId)
        .select();
        
      if (updateError) {
        console.error('Ошибка при обновлении данных пользователя:', updateError);
      } else {
        console.log('Данные пользователя обновлены:', updatedUser);
      }
    } else {
      // Создаем запись в public.users вручную
      console.log('Запись в public.users не существует, создаем вручную...');
      const { data: publicUserData, error: publicUserError } = await supabaseAdmin
        .from('users')
        .insert({
          id: newUserId,
          telegram_id: telegram_id.toString(),
          username,
          first_name: 'Test',
          last_name: 'Direct',
          photo_url: 'https://placekitten.com/200/200',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          telegram_auth_date: new Date().toISOString()
        })
        .select();

      if (publicUserError) {
        console.error('Ошибка при создании записи в public.users:', publicUserError);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        console.log('Пользователь удален из auth.users из-за ошибки');
        return null;
      }

      console.log('Запись успешно создана в public.users вручную:', publicUserData);
    }

    // Шаг 3: Проверяем и при необходимости создаем запись в user_settings
    console.log('Проверяем настройки пользователя...');
    const { data: settingsData, error: checkSettingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', newUserId)
      .maybeSingle();
    
    if (checkSettingsError) {
      console.error('Ошибка при проверке настроек пользователя:', checkSettingsError);
    }
    
    if (!settingsData) {
      console.log('Настройки не созданы автоматически, создаем вручную...');
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: newUserId,
          notifications_enabled: true,
          theme: 'light',
          language: 'ru',
          updated_at: new Date().toISOString()
        });

      if (settingsError) {
        console.error('Ошибка при создании настроек пользователя:', settingsError);
      } else {
        console.log('Настройки пользователя успешно созданы вручную');
      }
    } else {
      console.log('Настройки пользователя уже созданы автоматически:', settingsData);
    }

    return {
      id: newUserId,
      telegram_id: telegram_id.toString(),
      username,
      email
    };
  } catch (error) {
    console.error('Необработанная ошибка:', error);
    return null;
  }
}

// Запускаем скрипт
createUserDirect()
  .then(user => {
    if (user) {
      console.log("\n=== ПОЛЬЗОВАТЕЛЬ УСПЕШНО СОЗДАН ===");
      console.log("ID:", user.id);
      console.log("Telegram ID:", user.telegram_id);
      console.log("Username:", user.username);
      console.log("Email:", user.email);
    } else {
      console.error("\n=== ОШИБКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ ===");
    }
  })
  .catch(err => console.error("Ошибка выполнения скрипта:", err))
  .finally(() => process.exit()); 