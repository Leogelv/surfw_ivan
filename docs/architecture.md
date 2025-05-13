# Архитектура проекта "Йога-практики"

**Последняя верификация:** 13.05.2024

## 1. Введение

Этот документ описывает архитектуру веб-приложения "Йога-практики", созданного как Telegram Mini App. Цель приложения — предоставить пользователям доступ к различным медитативным, телесным и дыхательным практикам для повышения осознанности и улучшения общего состояния.

Приложение построено на стеке:
*   **Фронтенд:** Next.js (React), TypeScript, Tailwind CSS
*   **Бекенд и База Данных:** Supabase
*   **Интеграция с Telegram:** `@telegram-apps/sdk`
*   **Деплой:** Vercel

## 2. Структура Проекта

Проект имеет следующую основную структуру директорий:

```
w_ivan/
├── .next/               # Сборочные артефакты Next.js (кэш, статика и т.д.)
├── .vercel/             # Конфигурация и артефакты Vercel
├── docs/                # Документация проекта
│   ├── migrations/      # SQL миграции для базы данных (пример)
│   ├── lib_docs/        # Документация по используемым библиотекам (потенциально)
│   ├── architecture.md  # Этот файл
│   ├── TASK.md          # Канбан-доска задач
│   └── SHORT_PLANNING.md # Краткосрочные планы по задачам
├── public/              # Статические ассеты (изображения, шрифты и т.д.)
│   └── yoga-app/        # Изображения, специфичные для приложения
├── src/                 # Основной исходный код приложения
│   ├── app/             # Маршруты и страницы приложения (Next.js App Router)
│   │   ├── (auth)/      # Группа маршрутов для аутентификации (layout specific)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── library/     # Страница "Библиотека"
│   │   ├── practice/    # Страница "Практики"
│   │   ├── profile/     # Страница "Профиль" (вероятно, устаревшая, см. ProfileScreen)
│   │   ├── schedule/    # Страница "Расписание"
│   │   ├── layout.tsx   # Корневой layout приложения
│   │   ├── page.tsx     # Главная страница приложения (/)
│   │   └── globals.css  # Глобальные стили
│   ├── components/      # Переиспользуемые UI компоненты
│   │   ├── Auth/        # Компоненты, связанные с аутентификацией
│   │   ├── Debug/       # Компоненты для отладочной панели
│   │   │   └── tabs/    # Вкладки для отладочной панели
│   │   ├── screens/     # Компоненты-экраны (полноэкранные представления)
│   │   │   └── ProfileScreen.tsx # Компонент экрана профиля
│   │   └── TelegramViewportStyle.tsx # Компонент для управления стилями и поведением Telegram Viewport
│   ├── context/         # React Context API для управления состоянием
│   │   ├── AuthContext.tsx     # Контекст для аутентификации пользователя
│   │   └── TelegramContext.tsx # Контекст для данных Telegram Mini App
│   ├── hooks/           # Кастомные React хуки
│   │   └── useUserStats.ts   # Хук для получения статистики пользователя
│   ├── lib/             # Вспомогательные модули и утилиты
│   │   ├── database.types.ts # Сгенерированные типы для схемы Supabase
│   │   ├── logger.ts         # Утилита для логирования
│   │   └── supabase.ts       # Инициализация клиента Supabase и функции для работы с API
├── .env                 # Основной файл переменных окружения (не должен быть в гите в реальном проекте)
├── .env.local           # Локальные переменные окружения (переопределяют .env)
├── .gitignore           # Файлы и папки, игнорируемые Git
├── next.config.js       # Конфигурация Next.js (или .ts)
├── package.json         # Зависимости проекта и скрипты npm
├── tailwind.config.ts   # Конфигурация Tailwind CSS
├── tsconfig.json        # Конфигурация TypeScript
├── vercel.json          # Конфигурация Vercel для деплоя
└── ...                  # Прочие файлы конфигурации и скрипты
```

### Верификация структуры файлов
*Последняя проверка: 13.05.2024*

(Эта секция будет обновляться при значительных изменениях в структуре)

## 3. База Данных (Supabase)

В качестве бекенда и базы данных используется Supabase. Схема базы данных разработана для хранения информации о пользователях, их настройках, логах приложения и истории практик.

Основные таблицы:

*   **`users`**: Хранит основную информацию о пользователях, синхронизированную с их Telegram-аккаунтами и Supabase Auth.
    *   `id` (UUID, Primary Key): Уникальный идентификатор пользователя (из `auth.users`).
    *   `telegram_id` (TEXT, Unique): ID пользователя в Telegram.
    *   `username` (TEXT): Username пользователя в Telegram.
    *   `first_name` (TEXT): Имя пользователя.
    *   `last_name` (TEXT): Фамилия пользователя.
    *   `photo_url` (TEXT): URL аватара пользователя.
    *   `auth_date` (BIGINT): Дата аутентификации из Telegram.
    *   `created_at` (TIMESTAMPTZ): Дата создания записи.
    *   `updated_at` (TIMESTAMPTZ): Дата последнего обновления записи.
    *   `last_login` (TIMESTAMPTZ): Дата последнего входа.
    *   `preferences` (JSONB, Nullable): Дополнительные настройки пользователя (пока не используется активно).

*   **`user_settings`**: Хранит индивидуальные настройки пользователя.
    *   `id` (UUID, Primary Key): Уникальный идентификатор настройки.
    *   `user_id` (UUID, Foreign Key -> `users.id`): Идентификатор пользователя.
    *   `notifications_enabled` (BOOLEAN, Default: `true`): Включены ли уведомления.
    *   `theme` (TEXT, Default: `'light'`): Выбранная тема оформления (пока не используется).
    *   `language` (TEXT, Default: `'ru'`): Выбранный язык (из `telegramUser.language_code`).
    *   `updated_at` (TIMESTAMPTZ): Дата последнего обновления настроек (переименовано из `last_updated`).

*   **`logs`**: Таблица для сбора логов приложения.
    *   `id` (UUID, Primary Key): Уникальный идентификатор лога.
    *   `level` (TEXT): Уровень лога (`info`, `warn`, `error`, `debug`).
    *   `message` (TEXT): Сообщение лога.
    *   `module` (TEXT): Модуль, из которого был отправлен лог.
    *   `data` (JSONB, Nullable): Дополнительные данные лога.
    *   `user_id` (UUID, Nullable, Foreign Key -> `users.id`): Идентификатор пользователя, если лог связан с ним.
    *   `created_at` (TIMESTAMPTZ, Default: `now()`): Время создания лога.
    *   `metadata` (JSONB, Nullable): Метаданные, такие как User-Agent, timestamp.

*   **`view_history`** (Предполагается на основе `getUserStats`): Таблица для хранения истории просмотров/выполнения практик.
    *   `id` (UUID, Primary Key): Уникальный идентификатор записи.
    *   `user_id` (UUID, Foreign Key -> `users.id`): Идентификатор пользователя.
    *   `practice_id` (TEXT или UUID): Идентификатор практики.
    *   `started_at` (TIMESTAMPTZ): Время начала практики.
    *   `duration` (INTEGER): Длительность практики в минутах/секундах.
    *   `completed` (BOOLEAN): Завершена ли практика.

### Триггеры и Функции БД

*   **`handle_new_user` (Триггер)**: Срабатывает после создания нового пользователя в `auth.users`.
    *   **Действие:** Автоматически создает соответствующую запись в таблице `public.users`, перенося метаданные пользователя (telegram_id, first_name, last_name, username, photo_url, auth_date) из `raw_user_meta_data` создаваемого auth-пользователя.
    *   Также автоматически создает запись в `public.user_settings` для нового пользователя.
*   **RLS (Row Level Security)**: Политики безопасности настроены для таблиц, чтобы ограничить доступ к данным на основе прав пользователя. Например, пользователи могут читать и изменять только свои собственные данные в `users` и `user_settings`. Анонимные пользователи могут иметь ограниченный доступ или не иметь его вовсе к определенным таблицам.

*(Примечание: Точная схема и определения триггеров/функций могут быть уточнены при непосредственном доступе к Supabase Studio или файлам миграций.)*

## 4. Логика Авторизации

Процесс аутентификации пользователя в приложении происходит следующим образом:

1.  **Инициализация Telegram SDK**:
    *   При загрузке приложения (`src/app/layout.tsx` -> `TelegramViewportStyle.tsx` и `TelegramContext.tsx`) инициализируется Telegram Mini Apps SDK (`@telegram-apps/sdk`).
    *   `TelegramContext` пытается получить данные о пользователе Telegram (`telegramUser`) и `initData` через `retrieveLaunchParams()`.

2.  **Получение данных пользователя Telegram**:
    *   Если данные пользователя Telegram (`telegramUser`) успешно получены, они сохраняются в `TelegramContext`.
    *   Компонент `src/app/page.tsx` при монтировании и при наличии `telegramUser` вызывает функцию `saveTelegramUserToSupabase`.

3.  **`saveTelegramUserToSupabase` (в `src/app/page.tsx`)**:
    *   Эта функция отвечает за первоначальную попытку регистрации/обновления пользователя в Supabase на основе данных из Telegram.
    *   **Проверка существующего пользователя в `public.users`**: Делается запрос к таблице `users` по `telegram_id`.
        *   Если пользователь найден: обновляются его данные (имя, фамилия, фото, дата последнего входа).
        *   Если пользователь не найден: предпринимается попытка создать нового пользователя.
    *   **Создание нового пользователя (Sign Up)**:
        *   Формируется уникальный email на основе `telegram_id` (например, `telegram_<id>@telegram.user`).
        *   Генерируется случайный пароль.
        *   Вызывается `supabase.auth.signUp()` с сформированным email, паролем и метаданными пользователя Telegram (first_name, last_name, username, photo_url, telegram_id, auth_date). Эти метаданные (`options.data`) будут доступны триггеру `handle_new_user`.
    *   **Триггер `handle_new_user`**: После успешного `signUp` в `auth.users`, этот триггер в базе данных Supabase автоматически создает запись в `public.users` и `public.user_settings`.
    *   **Обработка ошибки "User already registered"**: Если `signUp` возвращает ошибку, что пользователь уже зарегистрирован (например, если ранее он был создан, но запись в `public.users` по какой-то причине отсутствует или была удалена), предпринимается попытка входа `supabase.auth.signInWithPassword()` с тем же email и сгенерированным паролем.

4.  **`AuthContext`**:
    *   Отслеживает состояние аутентификации Supabase (`onAuthStateChange`).
    *   При изменении состояния аутентификации (вход/выход), загружает данные пользователя из `public.users` (`fetchUserData`) и сохраняет их в `userData`.
    *   Предоставляет `supabaseUser` (из `auth.user()`) и `userData` (из `public.users`), а также статусы `isLoading`, `isAuthenticated`, `error`.
    *   Логика в `useEffect` внутри `AuthContext` также пытается выполнить `createOrUpdateTelegramUser` (похоже на дублирование логики с `saveTelegramUserToSupabase`, требует внимания).

5.  **Supabase Клиент (`src/lib/supabase.ts`)**:
    *   `getSupabaseClient()`: Инициализирует и предоставляет синглтон экземпляра клиента Supabase. Важно, что URL для Supabase корректируется, убирая суффикс `/rest/v1`, так как клиент добавляет его самостоятельно для REST-подобных запросов, а для других (например, real-time) он не нужен.
    *   Содержит также функции `handleTelegramAuth` (OAuth, пока не используется), `getUserProfile`, `getUserStats`, `testSupabaseConnection`, `createTestServiceClient`, `diagnoseClientIssues`, `testCreateUserWithServiceKey`.

**Ключевые моменты и потенциальные проблемы:**
*   **Двойная логика создания/обновления пользователя**: Функциональность создания/обновления пользователя присутствует и в `page.tsx` (`saveTelegramUserToSupabase`), и в `AuthContext.tsx` (`createOrUpdateTelegramUser`). Это может приводить к конфликтам или избыточным операциям. Рекомендуется централизовать эту логику.
*   **Надежность триггера**: Успешное создание пользователя в `public.users` и `public.user_settings` полностью зависит от корректной работы триггера `handle_new_user`.
*   **Случайные пароли**: Генерация случайных паролей при signUp означает, что пользователь не сможет войти стандартным способом (email/пароль), если не будет реализован механизм восстановления/смены пароля, не привязанный к Telegram. Однако, для Mini App, основной метод входа - через Telegram.

## 5. Маршрутизация (Next.js App Router)

Приложение использует Next.js App Router, где маршруты определяются структурой папок в директории `src/app`.

*   **`src/app/layout.tsx`**: Корневой layout, оборачивающий все страницы. Здесь подключаются глобальные стили, шрифты, Telegram Web App SDK, и провайдеры контекста (`AuthProvider`, `TelegramProvider`). Также здесь используется `TelegramViewportStyle` для управления стилями viewport.
*   **`src/app/page.tsx`**: Главная страница приложения (маршрут `/`). Отображает основную информацию, статистику пользователя (`useUserStats`), навигационные элементы.
*   **`src/app/practice/page.tsx`**: Страница для выбора практик (предполагается, контент не предоставлен).
*   **`src/app/library/page.tsx`**: Страница "Библиотека" (предполагается, контент не предоставлен).
*   **`src/app/schedule/page.tsx`**: Страница "Расписание" (предполагается, контент не предоставлен).
*   **`src/app/(auth)/...`**: Группа маршрутов для аутентификации. Файлы в этих папках (`login`, `register`, `reset-password`) не были предоставлены, но структура указывает на их наличие. Они, вероятно, используют свой собственный layout `src/app/(auth)/layout.tsx` (если он есть).
*   **`src/app/profile/page.tsx`**: Страница профиля. Судя по коду `page.tsx`, отображение профиля теперь управляется компонентом `ProfileScreen` и состоянием `showProfile`, а не отдельным маршрутом, так что эта страница может быть устаревшей или не использоваться.

Навигация между страницами осуществляется с помощью компонента `<Link>` из `next/link`.

## 6. Управление Состоянием

Состояние приложения управляется с помощью React Context API и кастомных хуков.

*   **`TelegramContext` (`src/context/TelegramContext.tsx`)**:
    *   **Назначение:** Хранит и предоставляет данные, полученные от Telegram Mini App SDK.
    *   **Состояние:**
        *   `user` (или `telegramUser`): Объект с данными пользователя Telegram.
        *   `webApp`: Экземпляр объекта `window.Telegram.WebApp`.
        *   `initData`: Строка `initData` из Telegram.
        *   `isFullScreenEnabled`: Флаг, включен ли полноэкранный режим.
        *   `telegramHeaderPadding`: Отступ для хедера Telegram.
    *   **Функции:**
        *   `initializeTelegramApp()`: Инициализирует SDK, запрашивает полноэкранный режим.
        *   `enableFullScreen()`: Принудительно включает полноэкранный режим.
        *   `setTelegramUser()`, `setIsFullScreenEnabled()`: Сеттеры для состояния.
    *   **Потребление:** Используется через хук `useTelegram()`.

*   **`AuthContext` (`src/context/AuthContext.tsx`)**:
    *   **Назначение:** Управляет состоянием аутентификации пользователя через Supabase.
    *   **Состояние:**
        *   `user` (или `supabaseUser`): Объект пользователя из `supabase.auth.user()`.
        *   `userData`: Данные пользователя из таблицы `public.users` в Supabase.
        *   `isLoading`: Флаг загрузки состояния аутентификации.
        *   `isAuthenticated`: Флаг, аутентифицирован ли пользователь.
        *   `error`: Сообщение об ошибке аутентификации.
    *   **Логика:**
        *   Подписывается на изменения состояния аутентификации Supabase (`onAuthStateChange`).
        *   При аутентификации пользователя загружает его данные из `public.users`.
        *   Содержит логику `createOrUpdateTelegramUser` для синхронизации данных Telegram-пользователя с Supabase (потенциальное дублирование с `page.tsx`).
    *   **Потребление:** Используется через хук `useAuth()`.

*   **`useUserStats` (`src/hooks/useUserStats.ts`)**:
    *   **Назначение:** Кастомный хук для получения и управления статистикой практик пользователя.
    *   **Состояние:**
        *   `stats`: Объект со статистикой (`power`, `practiceMinutes`, `streak`, `totalMinutes`, `sessionsCompleted`, `level`).
        *   `isLoading`: Флаг загрузки статистики.
        *   `error`: Сообщение об ошибке при загрузке статистики.
    *   **Логика:**
        *   Использует `useAuth()` для получения текущего пользователя Supabase.
        *   Если пользователь авторизован, вызывает функцию `getUserStats()` из `src/lib/supabase.ts` для загрузки данных.
        *   Предоставляет дефолтные значения, если пользователь не авторизован или произошла ошибка.
    *   **Потребление:** Используется в `src/app/page.tsx` для отображения статистики.

Локальное состояние компонентов управляется с помощью `useState` и `useMemo`.

## 7. Интеграция с Telegram Mini App

Интеграция с Telegram обеспечивается через библиотеку `@telegram-apps/sdk` и нативный объект `window.Telegram.WebApp`.

*   **Подключение SDK**: Скрипт `telegram-web-app.js` подключается в `src/app/layout.tsx` с помощью `<Script strategy="beforeInteractive">`.
*   **Инициализация SDK**:
    *   Вызов `init()` из `@telegram-apps/sdk` происходит в `TelegramViewportStyle.tsx` и `TelegramContext.tsx`. Рекомендуется оставить один централизованный вызов.
*   **Получение данных запуска**:
    *   `retrieveLaunchParams()` используется для получения `initData` и данных пользователя Telegram.
*   **Взаимодействие с API Telegram**:
    *   Используется `postEvent(eventType, eventData)` для отправки команд в Telegram клиент (например, `web_app_request_fullscreen`, `web_app_setup_swipe_behavior`, `web_app_setup_closing_behavior`, `web_app_request_content_safe_area`, `web_app_ready`).
    *   Эти вызовы в основном сосредоточены в `TelegramViewportStyle.tsx` и частично в `src/app/page.tsx`.
*   **Стилизация и Viewport**:
    *   Компонент `TelegramViewportStyle.tsx` отвечает за:
        *   Запрос полноэкранного режима.
        *   Установку CSS-переменных для высоты viewport и безопасных зон (`safeAreaInset`, `contentSafeAreaInset`), которые затем используются в стилях приложения для корректного отображения на разных устройствах в клиенте Telegram.
        *   Отключение вертикальных свайпов для закрытия приложения.
        *   Включение подтверждения при закрытии приложения.
    *   CSS-переменные, такие как `--telegram-header-padding`, `--safe-area-top`, `--tg-theme-bg` и т.д., используются для адаптации UI под окружение Telegram.
*   **Обработка событий от Telegram**:
    *   `TelegramViewportStyle.tsx` и `src/app/page.tsx` устанавливают слушатели на событие `message` от `window` для обработки событий `content_safe_area_changed` и `theme_changed`, приходящих от Telegram Web App в веб-версии.

**Потенциальные улучшения и точки внимания:**
*   **Централизация SDK взаимодействия**: Вызовы `init()` и `postEvent()` для одинаковых действий разбросаны по разным компонентам (`TelegramViewportStyle`, `TelegramContext`, `page.tsx`). Это стоит унифицировать, чтобы избежать конфликтов и упростить поддержку. `TelegramContext` или выделенный сервис/хук был бы хорошим местом для этого.
*   **Обработка отсутствия `window.Telegram.WebApp`**: Код корректно обрабатывает ситуации, когда приложение запускается вне окружения Telegram, предоставляя фолбэки или стандартное поведение.

## 8. Ключевые Компоненты

*   **`src/app/page.tsx` (YogaApp, Home)**:
    *   Основной компонент главной страницы.
    *   Отображает приветствие, статистику пользователя (`useUserStats`), навигационные элементы.
    *   Управляет отображением `ProfileScreen`.
    *   Управляет отображением `DebugPanel`.
    *   Содержит логику `saveTelegramUserToSupabase` для регистрации/обновления пользователя при первом входе.
    *   Использует `useAuth` и `useTelegram` для доступа к данным пользователя и состоянию Telegram.
    *   Частично дублирует вызовы Telegram SDK (`postEvent`) для настройки приложения.

*   **`src/components/Debug/DebugPanel.tsx`**:
    *   Плавающая панель отладки, отображаемая по кнопке или хоткею.
    *   Содержит вкладки: "Обзор Здоровья", "Консоль" (логи приложения), "Telegram InitData", "Авторизация Детали".
    *   Отображает состояние подключения к Supabase, данные пользователя Telegram и Supabase, логи.
    *   Предоставляет функции для копирования отладочной информации.

*   **`src/components/screens/ProfileScreen.tsx`**:
    *   Компонент для отображения экрана профиля пользователя.
    *   (Детальная реализация не предоставлена, но предполагается отображение данных пользователя и настроек).

*   **`src/context/TelegramContext.tsx` (TelegramProvider, useTelegram)**:
    *   Провайдер и хук для управления данными и состоянием, связанными с Telegram Mini App.
    *   Инициализирует SDK, получает данные пользователя, управляет состоянием полноэкранного режима и отступом хедера.
    *   Содержит функцию `createUserInSupabase` (потенциальное дублирование логики).

*   **`src/context/AuthContext.tsx` (AuthProvider, useAuth)**:
    *   Провайдер и хук для управления аутентификацией пользователя через Supabase.
    *   Обрабатывает вход/выход, загружает данные пользователя из `public.users`.

*   **`src/components/TelegramViewportStyle.tsx`**:
    *   Компонент, отвечающий за инициализацию Telegram SDK и применение стилей и настроек для корректного отображения в Telegram.
    *   Запрашивает полноэкранный режим, безопасные зоны, управляет поведением свайпов и закрытия.
    *   Устанавливает CSS-переменные для адаптации UI.

*   **`src/lib/supabase.ts`**:
    *   Модуль для инициализации клиента Supabase (`getSupabaseClient`).
    *   Содержит исправленную логику обработки URL Supabase (удаление `/rest/v1`).
    *   Включает вспомогательные функции для работы с API Supabase: `handleTelegramAuth`, `getUserProfile`, `getUserStats` и тестовые функции.

*   **`src/lib/logger.ts`**:
    *   Утилита для логирования событий приложения.
    *   Поддерживает разные уровни логов и может отправлять логи в таблицу `logs` в Supabase (на клиенте).

## 9. Переменные Окружения

Проект использует переменные окружения для конфигурации подключения к Supabase и других настроек. Они хранятся в файлах `.env` и `.env.local`.

*   **`NEXT_PUBLIC_SUPABASE_URL`**: URL проекта Supabase. **Важно:** Должен быть указан без суффикса `/rest/v1`. Код в `src/lib/supabase.ts` автоматически корректирует его, если суффикс присутствует.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Публичный (anon) ключ для Supabase.
*   **`SUPABASE_SERVICE_KEY`**: Сервисный ключ для Supabase. Используется в скриптах для административных операций (например, `test-supabase-connection.js`, `testCreateUserWithServiceKey`). **Не должен быть доступен на клиенте в production!**
*   **`SUPABASE_PROJECT_ID`**: ID проекта Supabase (может использоваться некоторыми CLI или утилитами).
*   **`NEXT_PUBLIC_IGNORE_BUILD_ERROR=true`**: Флаг для Next.js, позволяющий игнорировать ошибки сборки TypeScript (обычно используется временно для упрощения разработки или при проблемах с типами).

**Порядок загрузки:** Переменные из `.env.local` переопределяют переменные из `.env`.

## 10. Деплой (Vercel)

Проект настроен для деплоя на Vercel.

*   **`vercel.json`**: Файл конфигурации для Vercel.
    ```json
    {
      "version": 2,
      "builds": [
        {
          "src": "package.json",
          "use": "@vercel/next"
        }
      ],
      "routes": [
        {
          "src": "/(.*)",
          "dest": "/"
        }
      ],
      "env": {
        "NEXT_PUBLIC_IGNORE_BUILD_ERROR": "true"
      }
    }
    ```
    *   Указывает, что используется `@vercel/next` для сборки проекта Next.js.
    *   Все запросы перенаправляются на корневой путь (стандартно для SPA/Next.js).
    *   Устанавливает переменную окружения `NEXT_PUBLIC_IGNORE_BUILD_ERROR` на `true` при деплое.
*   **Процесс деплоя**: Vercel автоматически собирает и деплоит проект при пуше в основную ветку Git-репозитория (если настроена интеграция). Vercel также автоматически подхватывает переменные окружения, настроенные в UI Vercel.

## 11. Важные Скрипты и Файлы

*   **`package.json`**:
    *   `dev`: Запуск локального сервера разработки Next.js.
    *   `build`: Сборка приложения для production.
    *   `start`: Запуск production сервера Next.js.
    *   `lint`: Запуск ESLint для проверки кода.
    *   `supabase:test:connection`: Запуск скрипта `test-supabase-connection.js`.
    *   `supabase:test:direct`: Запуск скрипта `test-direct.js`.
    *   `supabase:test:create-user`: Запуск скрипта `create-test-user.js`.

*   **`test-supabase-connection.js`**:
    *   Node.js скрипт для комплексного тестирования соединения с Supabase.
    *   Проверяет соединение с использованием анонимного ключа, сервисного ключа, а также прямые fetch-запросы к REST API.
    *   Содержит исправленную логику для работы с URL Supabase (отдельно для клиента и для REST).

*   **`cli_supabase_test.js`**: Еще один скрипт для тестирования подключения к Supabase, вероятно, более ранняя версия.

*   **`create-test-user.js`, `test-create-user-direct.js`, `test-user-operations.js`, `test-direct.js`**:
    *   Набор Node.js скриптов для тестирования различных аспектов взаимодействия с Supabase, в частности, создания и управления пользователями. Эти скрипты используют сервисный ключ для выполнения административных операций.

*   **`users-schema-migration.sql`**:
    *   Содержит SQL-код для создания таблицы `users` и связанных объектов (например, функции `handle_new_user` и триггера). Это основной источник правды для схемы таблицы `users`.

*   **`src/lib/database.types.ts`**:
    *   Автоматически сгенерированный (или должен генерироваться) файл с TypeScript типами для базы данных Supabase. Обеспечивает типобезопасность при работе с данными.

## 12. Общий Поток Данных (Пример: Отображение главной страницы)

1.  **Загрузка приложения**: Пользователь открывает Telegram Mini App.
2.  **`RootLayout` (`layout.tsx`)**:
    *   Загружает скрипт Telegram Web App.
    *   Инициализирует `AuthProvider` и `TelegramProvider`.
3.  **`TelegramProvider`**:
    *   Инициализирует Telegram SDK (`init()`).
    *   Пытается получить `telegramUser` и `initData` через `retrieveLaunchParams()`.
    *   Сохраняет полученные данные в своем состоянии.
4.  **`TelegramViewportStyle`**:
    *   Также вызывает `init()` (потенциальное дублирование).
    *   Отправляет команды (`postEvent`) в Telegram для настройки UI (fullscreen, swipe behavior, etc.).
    *   Устанавливает CSS-переменные.
5.  **`AuthProvider`**:
    *   Подписывается на `onAuthStateChange` от Supabase.
    *   Если `telegramUser` доступен из `TelegramContext`, пытается выполнить `createOrUpdateTelegramUser` для регистрации/обновления пользователя в Supabase (потенциальное дублирование).
6.  **`HomePage` (`page.tsx`)**:
    *   Получает `telegramUser` из `useTelegram()`.
    *   Получает `userData` (из `public.users`) и `supabaseUser` (из `auth.users`) из `useAuth()`.
    *   Если `telegramUser` есть и `authLoading` завершено, вызывает `saveTelegramUserToSupabase(telegramUser)`:
        *   Проверяет, есть ли пользователь в `public.users` по `telegram_id`.
        *   Если нет, вызывает `supabase.auth.signUp()` (что инициирует триггер `handle_new_user` для создания записи в `public.users` и `user_settings`).
        *   Если есть, обновляет запись в `public.users`.
    *   Получает статистику пользователя через `useUserStats()`.
    *   Отображает UI, используя данные из `telegramUser`, `userData` (Supabase public.users) и `stats`.

Этот поток показывает, как данные из Telegram проходят через контексты и используются для аутентификации в Supabase и отображения информации пользователю.

---
*Документ будет дополняться и обновляться по мере развития проекта.*