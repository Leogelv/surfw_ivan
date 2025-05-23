# Задачи на разработку квиза и плеера

## 1. Настройка Supabase и создание БД
- **1.1.** Создать проект в Supabase
  - Настроить аутентификацию (при необходимости)
  - Получить API ключи
- **1.2.** Создать таблицу quizlogic
  - Выполнить SQL скрипт из docs/supabase_schema.md
  - Заполнить таблицу тестовыми данными для четырех веток
- **1.3.** Настроить Row Level Security (RLS)
  - Создать политики доступа для чтения/записи

## 2. Настройка проекта и интеграция с Supabase
- **2.1.** Установить необходимые зависимости
  - Добавить клиент Supabase (`@supabase/supabase-js`)
  - Установить библиотеки для аудио/видео плеера
- **2.2.** Настроить клиент Supabase
  - Создать файл `src/lib/supabase.ts`
  - Настроить подключение к Supabase
- **2.3.** Создать типы данных для квиза
  - Определить интерфейсы для таблицы quizlogic
  - Определить типы для состояния квиза и плеера

## 3. Разработка контекстов для хранения состояния
- **3.1.** Создать QuizContext
  - Реализовать хранение выбранных опций
  - Добавить функции для обновления состояния
  - Реализовать отслеживание текущей ветки (short, physical, breathing, meditation)
  - Реализовать сохранение в localStorage
- **3.2.** Создать PlayerContext
  - Добавить состояние для плеера
  - Реализовать управление воспроизведением
  - Добавить настройки для трех режимов (видео, аудио-медитация, таймер-медитация)

## 4. Разработка компонентов квиза
- **4.1.** Разработка главной страницы
  - Создать компонент PracticeButton для кнопки "Выбрать практику"
  - Интегрировать кнопку на главную страницу
- **4.2.** Разработка основного экрана выбора практики
  - Создать PracticeSelectionScreen с четырьмя опциями
  - Разработать HowItWorksScreen для объяснения работы квиза
  - Реализовать навигацию между экранами
- **4.3.** Разработка ветки "До 7 мин"
  - Создать ShortPracticeGoalScreen для выбора цели
  - Реализовать прямой переход в плеер после выбора цели
- **4.4.** Разработка ветки "Телесная практика"
  - Создать PhysicalTimeScreen для выбора длительности
  - Разработать ShortPhysicalGoalScreen для целей короткой практики
  - Разработать LongPhysicalGoalScreen для целей длинной практики
- **4.5.** Разработка ветки "Дыхательная практика"
  - Создать BreathingGoalScreen для выбора цели
  - Реализовать прямой переход в плеер после выбора цели
- **4.6.** Разработка ветки "Медитация"
  - Создать MeditationApproachScreen для выбора подхода
  - Разработать ветку самостоятельной медитации:
    - SelfGuidedTimePicker для выбора времени
    - ConcentrationObjectScreen для выбора объекта концентрации
  - Разработать ветку медитации с сопровождением:
    - GuidedMeditationThemeScreen для выбора темы
    - GuidedMeditationGoalScreen для выбора цели

## 5. Разработка компонентов плеера
- **5.1.** Создать базовый компонент Player
  - Реализовать общий интерфейс плеера
  - Добавить контроллеры (пауза, громкость)
  - Реализовать кнопку "Другая практика" с навигацией по веткам
- **5.2.** Разработать MeditationTimerMode
  - Создать таймер для самостоятельной медитации
  - Реализовать обратный отсчет
  - Добавить инструкции и уведомление об окончании практики
- **5.3.** Разработать MeditationAudioMode
  - Интегрировать аудиоплеер для медитации с сопровождением
  - Добавить контроллеры аудио и прогресс-бар
  - Реализовать визуализацию аудио
- **5.4.** Разработать VideoMode
  - Интегрировать видеоплеер для телесных и дыхательных практик
  - Добавить контроллеры видео
  - Реализовать полноэкранный режим

## 6. Интеграция с Supabase и загрузка данных
- **6.1.** Создать сервисные функции для работы с Supabase
  - Реализовать функции для запроса опций для каждой ветки квиза
  - Добавить функции для получения практик по различным параметрам
- **6.2.** Интегрировать запросы в компоненты квиза
  - Загружать доступные опции для каждой ветки
  - Реализовать фильтрацию данных в зависимости от выбора пользователя
- **6.3.** Реализовать загрузку контента для плеера
  - Получать URL контента из Supabase
  - Загружать соответствующий контент для выбранного режима плеера

## 7. Тестирование и отладка
- **7.1.** Протестировать все ветки квиза
  - Проверить корректность навигации по каждой ветке
  - Убедиться в правильной работе кнопки "Назад"
  - Проверить сохранение выбранных опций
- **7.2.** Протестировать фильтрацию данных
  - Проверить корректность загрузки опций для каждой ветки
  - Тестировать выбор практики на основе параметров
- **7.3.** Протестировать режимы плеера
  - Проверить работу MeditationTimerMode (самостоятельная медитация)
  - Протестировать MeditationAudioMode (медитация с сопровождением)
  - Проверить VideoMode (телесные и дыхательные практики)
  - Убедиться в корректной работе кнопки "Другая практика"

## 8. Оптимизация и доработка
- **8.1.** Оптимизировать производительность
  - Добавить мемоизацию для компонентов
  - Оптимизировать запросы к Supabase
- **8.2.** Добавить обработку ошибок
  - Реализовать обработку ошибок загрузки данных
  - Добавить фолбэки для отсутствующего контента
- **8.3.** Реализовать адаптивный дизайн
  - Адаптировать интерфейс для мобильных устройств
  - Оптимизировать интерфейс плеера для разных размеров экрана

## 9. Документация и развертывание
- **9.1.** Обновить документацию проекта
  - Дополнить architecture.md
  - Актуализировать TASK.md
- **9.2.** Подготовить к деплою
  - Настроить переменные окружения
  - Тестовое развертывание на Vercel 