require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkSupabaseConnection() {
  console.log('--- CLI Supabase Connection Test ---');
  console.log(`Attempting to connect to URL: ${supabaseUrl}`);
  if (supabaseAnonKey) {
    console.log(`Using ANON Key (first 10 chars): ${supabaseAnonKey.substring(0, 10)}`);
  } else {
    console.log('ANON Key is NOT FOUND in .env.local or process.env');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase URL or Anon Key is missing. Make sure they are set in .env.local');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created.');

    console.log('Attempting to fetch a list of tables (as a connection test)...');
    // Вместо запроса к 'users' (который может быть защищен RLS),
    // попробуем получить список таблиц, что обычно доступно с anon ключом, если нет жестких ограничений.
    // Более надежный тест - это запрос к конкретной таблице, которую anon ключ точно может читать (хотя бы count).
    // Но для начала проверим сам факт ответа от API.
    const { data, error } = await supabase
      .from('users') // Замените 'users' на любую публично читаемую таблицу, если 'users' недоступна
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Error during Supabase query:', error);
      console.log('-------------------------------------');
      console.log('Failed to connect or query Supabase with provided ANON key.');
    } else {
      console.log('Supabase query successful:', { count: data ? data.length : 0 , status: error ? error.message : 'OK' /* упрощенный статус */ });
      console.log('-------------------------------------');
      console.log('Successfully connected to Supabase and executed a query with ANON key!');
    }
  } catch (e) {
    console.error('Critical error during Supabase client operation:', e);
    console.log('-------------------------------------');
    console.log('Failed to operate Supabase client. Check URL, Keys, and network.');
  }
}

checkSupabaseConnection(); 