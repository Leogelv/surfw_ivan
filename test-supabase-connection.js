// Скрипт для тестирования соединения с Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Получаем URL и ключи из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Тестирование соединения с Supabase');
console.log('-----------------------------------');
console.log('URL:', supabaseUrl);
console.log('Anon Key доступен:', !!supabaseAnonKey);
console.log('Service Key доступен:', !!supabaseServiceKey);
console.log('');

// Функция для тестирования соединения с анонимным ключом
async function testAnonConnection() {
  console.log('Тестирование с анонимным ключом...');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ URL или анонимный ключ отсутствуют');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Пробуем сделать простой запрос
    const { data, error, status } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Ошибка при запросе с анонимным ключом:', {
        code: error.code,
        message: error.message,
        details: error.details,
        statusCode: status
      });
    } else {
      console.log('✅ Запрос с анонимным ключом выполнен успешно. Код статуса:', status);
    }
  } catch (error) {
    console.error('❌ Необработанное исключение с анонимным ключом:', error);
  }
}

// Функция для тестирования соединения с сервисным ключом
async function testServiceConnection() {
  console.log('Тестирование с сервисным ключом...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ URL или сервисный ключ отсутствуют');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Пробуем сделать простой запрос
    const { data, error, status } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Ошибка при запросе с сервисным ключом:', {
        code: error.code,
        message: error.message,
        details: error.details,
        statusCode: status
      });
    } else {
      console.log('✅ Запрос с сервисным ключом выполнен успешно. Код статуса:', status);
      
      // Пробуем получить список пользователей
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      if (usersError) {
        console.error('❌ Ошибка при получении пользователей:', usersError);
      } else {
        console.log(`✅ Получен список пользователей. Количество: ${users.length}`);
        console.log('Пример пользователя:', users[0] ? {
          id: users[0].id,
          telegram_id: users[0].telegram_id,
          username: users[0].username
        } : 'Нет пользователей');
      }
    }
  } catch (error) {
    console.error('❌ Необработанное исключение с сервисным ключом:', error);
  }
}

// Функция для тестирования HTTP запроса напрямую
async function testFetchRequest() {
  console.log('Тестирование через прямой fetch запрос...');
  
  try {
    // Тестируем с анонимным ключом
    const anonResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    console.log('Статус ответа с анонимным ключом:', anonResponse.status);
    
    if (anonResponse.ok) {
      console.log('✅ Запрос через fetch с анонимным ключом успешен');
    } else {
      console.error('❌ Ошибка запроса через fetch с анонимным ключом:', anonResponse.statusText);
    }
    
    // Тестируем с сервисным ключом
    const serviceResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('Статус ответа с сервисным ключом:', serviceResponse.status);
    
    if (serviceResponse.ok) {
      console.log('✅ Запрос через fetch с сервисным ключом успешен');
    } else {
      console.error('❌ Ошибка запроса через fetch с сервисным ключом:', serviceResponse.statusText);
    }
  } catch (error) {
    console.error('❌ Необработанное исключение при fetch запросе:', error);
  }
}

// Запускаем тесты последовательно
async function runTests() {
  try {
    await testAnonConnection();
    console.log('');
    
    await testServiceConnection();
    console.log('');
    
    await testFetchRequest();
    console.log('');
    
    console.log('Все тесты завершены');
  } catch (error) {
    console.error('Ошибка при выполнении тестов:', error);
  }
}

runTests(); 