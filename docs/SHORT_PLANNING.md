# КРАТКОСРОЧНОЕ ПЛАНИРОВАНИЕ

## Текущая задача
- Настроить корректную авторизацию пользователей с записью в таблицу users
- Исправить проблемы с дебаг-панелью (лаги, ошибки в консоли)
- Добавить в дебаг-панель кнопки быстрого копирования
- Исправить отступы content safe area на главной странице
- Настроить корректное отображение Telegram Mini App в fullscreen режиме
- Использовать web_app_request_fullscreen вместо устаревшего метода expand()
- Обеспечить сохранение данных пользователя в таблице users
- Улучшить функцию createUserInSupabase в TelegramContext.tsx
- Обеспечить надежное создание пользователей в Supabase с учетом ограничений внешних ключей
- Привести код к единому паттерну, используемому в тестовых скриптах
- Улучшить обработку ошибок и логирование процесса создания/обновления пользователя
- Исправить интеграцию с Telegram Mini Apps SDK
- Обеспечить корректное получение данных пользователя из Telegram
- Упростить панель отладки с фокусом на логи и initData
- Реализовать функциональность полноэкранного режима

## Чеклисты проверок
- [x] Проверить создание пользователя в таблице users при открытии приложения
- [x] Исправить дебаг-панель (добавить кнопки копирования, устранить ошибки)
- [x] Настроить корректные отступы для контента (safeAreaInsets и contentSafeAreaInsets)
- [x] Проверить интеграцию с Telegram Mini Apps SDK (init, саф-ареа и др.)
- [x] Проверить работу логирования в таблицу logs и вывод логов в дебаг-панель
- [x] Протестировать создание пользователя через CLI (прямой запрос к Supabase)
- [x] Интегрировать логику создания пользователя из CLI-скрипта в код приложения
- [x] Реализовать переключение в fullscreen режим через web_app_request_fullscreen
- [x] Обеспечить корректное сохранение данных пользователя в таблице users независимо от RLS
- [x] Создание пользователя в auth.users перед созданием в public.users
- [x] Проверка работы триггеров для автоматического создания записей
- [x] Корректная обработка поля auth_date и других преобразований данных
- [x] Создание/обновление настроек пользователя в таблице user_settings
- [x] Удаление устаревшего кода обхода ограничений внешних ключей
- [x] Проверка работы с новыми и существующими пользователями
- [x] Корректная инициализация SDK Telegram Mini Apps через init()
- [x] Использование retrieveLaunchParams для получения данных пользователя
- [x] Надежное создание пользователя в Supabase (в auth.users и public.users)
- [x] Функциональность postEvent('web_app_request_fullscreen') для полноэкранного режима
- [x] Упрощенная панель отладки с табами для логов и initData
- [x] Проверка обработки различных ошибок SDK и Telegram WebApp
- [x] Кнопки копирования данных в буфер обмена в панели отладки

## Навигация по проекту
- Авторизация: интеграция Telegram auth с Supabase
- Отладка: компонент DebugPanel для просмотра состояния приложения
- Telegram интеграция: TelegramContext для взаимодействия с Telegram WebApp
- Supabase: таблицы users, logs для хранения данных пользователей и логирования

## Консистентность флоу
- Инициализация Telegram WebApp при загрузке страницы
- Получение данных пользователя из Telegram
- Создание/обновление пользователя в таблице users
- Логирование событий в консоль и в таблицу logs
- Отображение информации в дебаг-панели

## Что сделано
- Создана утилита логирования с записью в Supabase
- Реализован TelegramContext для работы с Telegram WebApp
- Настроен AuthContext для управления авторизацией
- Создан компонент дебаг-панели для отладки
- Настроены отступы для корректного отображения в Telegram Mini App
- Добавлена вкладка Viewport и Safe Area в дебаг-панели
- Добавлены кнопки копирования во все блоки дебаг-панели
- Улучшена интеграция с Telegram SDK, корректно обрабатываются safeAreaInsets
- Исправлена интеграция Telegram и Supabase для корректного создания пользователей
- Добавлены CSS-переменные для работы с темами Telegram
- Разработаны компоненты для рефакторинга page.tsx
- Исправлены ошибки "window is not defined" для работы с SSR
- Добавлены компоненты для работы со стилями и темой Telegram
- Добавлен механизм принудительного создания пользователя и отладочный интерфейс для этого
- Исправлена проблема с отображением дебаг-панели
- Реализован метод forceCreateUser для безотказного создания пользователей в Supabase
- Улучшен AuthDetailsTab с возможностью ручного создания пользователя для отладки
- Добавлено расширенное логирование в компоненты FloatingDebugButton и DebugPanel
- Улучшена обработка событий для повышения надежности отображения дебаг-панели

## Последнее обновление
- Дата: 13.11.2024
- Время: 22:30 

# Краткосрочный план разработки

## Текущие задачи (14.11.2024)
1. Внедрение улучшений на основе тестирования приложения в боевом режиме:
   - Тестирование обновленной Debug-панели в реальных условиях
   - Проверка работы принудительного создания пользователя в реальных условиях
   - Возможное добавление интеграционных тестов для Telegram/Supabase

2. Запланированные улучшения:
   - Доработка UX потока авторизации пользователя
   - Улучшение стилей и анимаций приложения
   - Добавление доп. функциональности для работы с йога-практиками

## Что сделано
- Создана утилита логирования с записью в Supabase
- Реализован TelegramContext для работы с Telegram WebApp
- Настроен AuthContext для управления авторизацией
- Создан компонент дебаг-панели для отладки
- Настроены отступы для корректного отображения в Telegram Mini App
- Добавлена вкладка Viewport и Safe Area в дебаг-панели
- Добавлены кнопки копирования во все блоки дебаг-панели
- Улучшена интеграция с Telegram SDK, корректно обрабатываются safeAreaInsets
- Исправлена интеграция Telegram и Supabase для корректного создания пользователей
- Добавлены CSS-переменные для работы с темами Telegram
- Разработаны компоненты для рефакторинга page.tsx
- Исправлены ошибки "window is not defined" для работы с SSR
- Добавлены компоненты для работы со стилями и темой Telegram
- Добавлен механизм принудительного создания пользователя и отладочный интерфейс для этого
- Исправлена проблема с отображением дебаг-панели
- Реализован метод forceCreateUser для безотказного создания пользователей в Supabase
- Улучшен AuthDetailsTab с возможностью ручного создания пользователя для отладки
- Добавлено расширенное логирование в компоненты FloatingDebugButton и DebugPanel
- Улучшена обработка событий для повышения надежности отображения дебаг-панели

## Известные проблемы и решения

### 1. Проблема с window is not defined в продакшене
**Причина:** Обращение к window выполняется при SSR, когда window недоступен.
**Решение:** 
- ✅ Добавлены проверки typeof window !== 'undefined' перед обращением к window
- ✅ Использованы хуки useEffect для кода, работающего с window
- ✅ Внедрены компоненты с директивой 'use client' для клиентского рендеринга

### 2. Проблема с созданием пользователя в Supabase
**Причина:** Ошибка в процессе создания пользователя из-за constraint в базе данных.
**Решение:**
- ✅ Добавлен метод forceCreateUser в AuthContext
- ✅ Создан интерфейс в дебаг-панели для принудительного создания
- ✅ Добавлена автоматическая попытка форсированного создания при обычной ошибке

### 3. Проблема с отображением Debug панели
**Причина:** Проблемы в логике обработки событий для переключения видимости панели.
**Решение:**
- ✅ Добавлено подробное логирование событий
- ✅ Улучшена обработка событий при клике на FloatingDebugButton
- ✅ Добавлено двойное событие для повышения надежности

### 4. Производительность и размер страницы
**Причина:** Большой размер основного файла page.tsx и CSS стилей.
**Решение:**
- ✅ Разделение page.tsx на отдельные компоненты (MainContent, AppNavigation и др.)
- ✅ Создание утилиты для работы с CSS переменными
- ✅ Вынесение логики в отдельные хуки и контексты

## Ссылки для разработки
- [Документация Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/start)
- [NextJS App Router](https://nextjs.org/docs/app)