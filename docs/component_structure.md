# Структура компонентов квиза и плеера

## Общая структура файлов компонентов

```
src/
├── components/
│   ├── Quiz/
│   │   ├── PracticeSelectionScreen.tsx # Основной экран выбора практики
│   │   ├── HowItWorksScreen.tsx        # Экран с информацией о работе квиза
│   │   │
│   │   ├── ShortPracticeGoalScreen.tsx # Экран выбора цели для "До 7 мин"
│   │   │
│   │   ├── PhysicalTimeScreen.tsx      # Экран выбора длительности телесной практики
│   │   ├── ShortPhysicalGoalScreen.tsx # Экран выбора цели для короткой телесной практики
│   │   ├── LongPhysicalGoalScreen.tsx  # Экран выбора цели для длинной телесной практики
│   │   │
│   │   ├── BreathingGoalScreen.tsx     # Экран выбора цели для дыхательной практики
│   │   │
│   │   ├── MeditationApproachScreen.tsx # Экран выбора подхода к медитации
│   │   ├── SelfGuidedTimePicker.tsx    # Экран выбора времени для самостоятельной медитации
│   │   ├── ConcentrationObjectScreen.tsx # Экран выбора объекта концентрации
│   │   ├── GuidedMeditationThemeScreen.tsx # Экран выбора темы для медитации
│   │   ├── GuidedMeditationGoalScreen.tsx # Экран выбора цели для медитации
│   │   │
│   │   ├── ui/                      # UI компоненты для квиза
│   │   │   ├── OptionCard.tsx       # Карточка с опцией выбора
│   │   │   ├── NavigationButtons.tsx # Кнопки навигации (Назад)
│   │   │   └── TimeSelector.tsx     # Селектор времени практики
│   │   └── hooks/                   # Хуки для квиза
│   │       ├── useQuizNavigation.ts # Хук для навигации по квизу
│   │       └── useQuizOptions.ts    # Хук для загрузки опций квиза
│   │
│   ├── Player/
│   │   ├── Player.tsx               # Универсальный плеер
│   │   ├── MeditationTimerMode.tsx  # Режим медитации с таймером (для самостоятельной)
│   │   ├── MeditationAudioMode.tsx  # Режим медитации с аудио (с сопровождением)
│   │   ├── VideoMode.tsx            # Режим видео (для телесных и дыхательных)
│   │   ├── ui/                      # UI компоненты для плеера
│   │   │   ├── PlayButton.tsx       # Кнопка воспроизведения
│   │   │   ├── Timer.tsx            # Таймер для медитации
│   │   │   ├── VolumeControl.tsx    # Контроль громкости
│   │   │   ├── ProgressBar.tsx      # Прогресс-бар для видео/аудио
│   │   │   └── FullscreenButton.tsx # Кнопка полноэкранного режима
│   │   └── hooks/                   # Хуки для плеера
│   │       ├── usePlayerControls.ts # Хук для управления плеером
│   │       ├── useTimer.ts          # Хук для работы с таймером
│   │       └── useAudioPlayer.ts    # Хук для управления аудио
│   │
│   └── MainPage/
│       └── PracticeButton.tsx        # Кнопка "Выбрать практику" на главной странице
│
├── context/
│   ├── QuizContext.tsx              # Контекст для состояния квиза
│   └── PlayerContext.tsx            # Контекст для управления плеером
└── lib/
    ├── supabase.ts                  # Клиент Supabase
    ├── types.ts                     # Типы данных
    └── utils.ts                     # Вспомогательные функции
```

## Детали компонентов квиза

### PracticeSelectionScreen
Основной экран выбора типа практики с четырьмя опциями.

```tsx
// PracticeSelectionScreen.tsx
import { useEffect, useState } from 'react';
import { useQuizContext } from '@/context/QuizContext';
import { supabase } from '@/lib/supabase';
import OptionCard from './ui/OptionCard';
import NavigationButtons from './ui/NavigationButtons';
import { useRouter } from 'next/router';

const PracticeSelectionScreen = () => {
  const { quizState, updateQuizState, setCurrentBranch } = useQuizContext();
  const router = useRouter();
  
  // Обработчик выбора типа практики
  const handleSelectType = (type) => {
    updateQuizState({ type });
    
    // Перенаправление на соответствующий экран в зависимости от выбора
    switch (type) {
      case 'short_7_min':
        setCurrentBranch('short');
        router.push('/quiz/short-goal');
        break;
      case 'physical':
        setCurrentBranch('physical');
        router.push('/quiz/physical-time');
        break;
      case 'breathing':
        setCurrentBranch('breathing');
        router.push('/quiz/breathing-goal');
        break;
      case 'meditation':
        setCurrentBranch('meditation');
        router.push('/quiz/meditation-approach');
        break;
    }
  };
  
  // Переход к экрану "Как это работает"
  const handleHowItWorks = () => {
    router.push('/quiz/how-it-works');
  };
  
  // Возврат на главную страницу
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    <div className="practice-selection-screen">
      <h2>Выбор практики</h2>
      
      <div className="options-grid">
        <OptionCard
          title="До 7 мин"
          description="Быстрые практики, которые можно выполнить за несколько минут"
          isSelected={quizState.type === 'short_7_min'}
          onSelect={() => handleSelectType('short_7_min')}
        />
        <OptionCard
          title="Телесная"
          description="Практики для работы с телом и физическим состоянием"
          isSelected={quizState.type === 'physical'}
          onSelect={() => handleSelectType('physical')}
        />
        <OptionCard
          title="Дыхательная"
          description="Практики для контроля дыхания и улучшения состояния"
          isSelected={quizState.type === 'breathing'}
          onSelect={() => handleSelectType('breathing')}
        />
        <OptionCard
          title="Медитация"
          description="Медитативные практики для работы с сознанием"
          isSelected={quizState.type === 'meditation'}
          onSelect={() => handleSelectType('meditation')}
        />
      </div>
      
      <button 
        className="how-it-works-button"
        onClick={handleHowItWorks}
      >
        Как это работает?
      </button>
      
      <NavigationButtons
        onBack={handleBack}
        showNext={false}
      />
    </div>
  );
};

export default PracticeSelectionScreen;
```

### Примеры компонентов различных веток

#### ShortPracticeGoalScreen (Ветка "До 7 мин")

```tsx
// ShortPracticeGoalScreen.tsx
import { useEffect, useState } from 'react';
import { useQuizContext } from '@/context/QuizContext';
import { supabase } from '@/lib/supabase';
import OptionCard from './ui/OptionCard';
import NavigationButtons from './ui/NavigationButtons';
import { useRouter } from 'next/router';

const ShortPracticeGoalScreen = () => {
  const { quizState, updateQuizState } = useQuizContext();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Загрузка доступных целей для короткой практики
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('quizlogic')
          .select('goal')
          .eq('type', 'short_7_min')
          .distinct();
          
        if (error) throw error;
        
        setGoals(data.map(item => item.goal));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setLoading(false);
      }
    };
    
    fetchGoals();
  }, []);
  
  // Обработчик выбора цели
  const handleSelectGoal = async (goal) => {
    updateQuizState({ goal });
    
    // Получение практики на основе выбранных параметров
    try {
      const { data, error } = await supabase
        .from('quizlogic')
        .select('*')
        .eq('type', 'short_7_min')
        .eq('goal', goal);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Выбор случайной практики из доступных
        const randomIndex = Math.floor(Math.random() * data.length);
        updateQuizState({ selectedPractice: data[randomIndex] });
        
        // Перенаправление на страницу плеера
        router.push('/player');
      }
    } catch (error) {
      console.error('Error finding practice:', error);
    }
  };
  
  // Возврат к экрану выбора практики
  const handleBack = () => {
    router.push('/quiz');
  };
  
  return (
    <div className="short-goal-screen">
      <h2>Выберите цель</h2>
      
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="options-grid">
          {goals.map((goal) => (
            <OptionCard
              key={goal}
              title={getGoalTitle(goal)}
              description={getGoalDescription(goal)}
              isSelected={quizState.goal === goal}
              onSelect={() => handleSelectGoal(goal)}
            />
          ))}
        </div>
      )}
      
      <NavigationButtons
        onBack={handleBack}
        showNext={false}
      />
    </div>
  );
};

// Вспомогательные функции для отображения заголовков и описаний
const getGoalTitle = (goal) => {
  switch (goal) {
    case 'energize': return 'Взбодриться';
    case 'relax_sleep': return 'Расслабиться / для сна';
    case 'stretch': return 'Потянуться';
    case 'focus': return 'Сфокусироваться';
    default: return goal;
  }
};

const getGoalDescription = (goal) => {
  switch (goal) {
    case 'energize': return 'Практики для быстрого повышения энергии';
    case 'relax_sleep': return 'Практики для расслабления и подготовки ко сну';
    case 'stretch': return 'Практики для разминки и растяжки мышц';
    case 'focus': return 'Практики для улучшения концентрации внимания';
    default: return '';
  }
};

export default ShortPracticeGoalScreen;
```

## Детали компонентов плеера

### Универсальный плеер
Основной компонент плеера, который отображает нужный режим в зависимости от типа контента.

```tsx
// Player.tsx
import { useEffect } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import { useQuizContext } from '@/context/QuizContext';
import MeditationTimerMode from './MeditationTimerMode';
import MeditationAudioMode from './MeditationAudioMode';
import VideoMode from './VideoMode';
import PlayButton from './ui/PlayButton';
import VolumeControl from './ui/VolumeControl';
import { useRouter } from 'next/router';

const Player = () => {
  const { selectedPractice, currentBranch } = useQuizContext();
  const { 
    isPlaying, 
    setIsPlaying, 
    volume, 
    setVolume,
    contentLoaded,
    setContentLoaded
  } = usePlayerContext();
  const router = useRouter();
  
  useEffect(() => {
    if (selectedPractice) {
      // Инициализация плеера с выбранной практикой
      setContentLoaded(true);
    }
  }, [selectedPractice, setContentLoaded]);
  
  if (!selectedPractice || !contentLoaded) {
    return <div>Загрузка практики...</div>;
  }
  
  // Определяем режим отображения в зависимости от типа контента
  const renderPlayerMode = () => {
    switch (selectedPractice.content_type) {
      case 'video':
        return <VideoMode url={selectedPractice.content_url} />;
      case 'audio':
        return <MeditationAudioMode url={selectedPractice.content_url} />;
      case 'timer':
        return <MeditationTimerMode duration={selectedPractice.duration} />;
      default:
        return <MeditationTimerMode duration="10 минут" />;
    }
  };
  
  // Возврат к выбору практики (разные пути в зависимости от ветки)
  const handleChooseAnotherPractice = () => {
    switch (currentBranch) {
      case 'short':
        router.push('/quiz/short-goal');
        break;
      case 'physical':
        // Возврат к экрану цели для телесной практики
        if (selectedPractice.duration === 'до 20 минут') {
          router.push('/quiz/short-physical-goal');
        } else {
          router.push('/quiz/long-physical-goal');
        }
        break;
      case 'breathing':
        router.push('/quiz/breathing-goal');
        break;
      case 'meditation':
        if (selectedPractice.approach === 'self-guided') {
          router.push('/quiz/concentration-object');
        } else {
          router.push('/quiz/guided-meditation-goal');
        }
        break;
      default:
        router.push('/quiz');
    }
  };
  
  return (
    <div className="player-container">
      <h2>{selectedPractice.title}</h2>
      <p>{selectedPractice.description}</p>
      
      <div className="player-content">
        {renderPlayerMode()}
      </div>
      
      <div className="controls">
        <PlayButton isPlaying={isPlaying} onClick={() => setIsPlaying(!isPlaying)} />
        <VolumeControl volume={volume} onChange={setVolume} />
      </div>
      
      <button 
        className="another-practice-button"
        onClick={handleChooseAnotherPractice}
      >
        {selectedPractice.type === 'meditation' && selectedPractice.approach === 'guided' 
          ? 'Другая медитация' 
          : 'Другая практика'}
      </button>
    </div>
  );
};

export default Player;
```

### Режим медитации с таймером
Компонент для отображения таймера и управления самостоятельной медитативной практикой.

```tsx
// MeditationTimerMode.tsx
import { useEffect, useState } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import Timer from './ui/Timer';

const MeditationTimerMode = ({ duration }) => {
  const { isPlaying } = usePlayerContext();
  const [timeRemaining, setTimeRemaining] = useState(convertDurationToSeconds(duration));
  
  // Управление таймером
  useEffect(() => {
    let interval;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Практика завершена
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);
  
  // Форматирование времени
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <div className="meditation-timer-mode">
      <div className="meditation-instruction">
        <p>Закройте глаза и сфокусируйтесь на себе</p>
      </div>
      
      <Timer 
        timeRemaining={timeRemaining} 
        totalTime={convertDurationToSeconds(duration)} 
        formattedTime={formatTime(timeRemaining)} 
      />
      
      <div className="meditation-message">
        {timeRemaining > 0 ? (
          <p>Сосредоточьтесь на выбранном объекте концентрации...</p>
        ) : (
          <p>Практика завершена</p>
        )}
      </div>
    </div>
  );
};

// Вспомогательная функция для конвертации строки с длительностью в секунды
const convertDurationToSeconds = (duration) => {
  if (typeof duration === 'number') return duration * 60;
  
  const match = duration.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10) * 60;
  }
  
  return 10 * 60; // По умолчанию 10 минут
};

export default MeditationTimerMode;
```

### Режим медитации с аудио
Компонент для отображения аудио-плеера для медитаций с сопровождением.

```tsx
// MeditationAudioMode.tsx
import { useEffect, useRef, useState } from 'react';
import { usePlayerContext } from '@/context/PlayerContext';
import ProgressBar from './ui/ProgressBar';

const MeditationAudioMode = ({ url }) => {
  const { isPlaying, volume, setCurrentTime, setDuration } = usePlayerContext();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  
  // Синхронизация состояния плеера с аудио
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error('Error playing audio:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  // Обновление громкости
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Обработчики событий аудио
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setCurrentTime(currentTime);
      setProgress((currentTime / duration) * 100);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Функция для перемотки аудио
  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    if (audioRef.current) {
      const newTime = pos * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(pos * 100);
    }
  };
  
  return (
    <div className="meditation-audio-mode">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        hidden
      />
      
      <div className="meditation-visual">
        <div className="meditation-icon">
          {/* Иконка или визуализация для аудио-медитации */}
          <div className="meditation-waves"></div>
        </div>
      </div>
      
      <div className="progress-container" onClick={handleSeek}>
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default MeditationAudioMode;
```

## Контексты приложения

### QuizContext
Контекст для хранения состояния квиза и управления процессом выбора практики.

```tsx
// QuizContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

// Начальное состояние квиза
const initialQuizState = {
  type: '',
  duration: '',
  goal: '',
  approach: '',
  selectedPractice: null
};

const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  const [quizState, setQuizState] = useState(() => {
    // Попытка восстановить состояние из localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('quizState');
      return savedState ? JSON.parse(savedState) : initialQuizState;
    }
    return initialQuizState;
  });
  
  const [currentBranch, setCurrentBranch] = useState(''); // 'short', 'physical', 'breathing', 'meditation'
  
  // Сохранение состояния в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizState', JSON.stringify(quizState));
    }
  }, [quizState]);
  
  // Обновление состояния квиза
  const updateQuizState = (newState) => {
    setQuizState(prev => ({ ...prev, ...newState }));
  };
  
  // Сброс квиза
  const resetQuiz = () => {
    setQuizState(initialQuizState);
    setCurrentBranch('');
  };
  
  const value = {
    quizState,
    updateQuizState,
    resetQuiz,
    currentBranch,
    setCurrentBranch,
    selectedPractice: quizState.selectedPractice
  };
  
  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
};
```

### PlayerContext
Контекст для управления плеером в различных режимах.

```tsx
// PlayerContext.tsx
import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Переключение воспроизведения
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };
  
  // Перемотка к определенному времени
  const seekTo = (time) => {
    setCurrentTime(time);
  };
  
  // Форматирование времени для отображения
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const value = {
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    togglePlay,
    seekTo,
    formatTime,
    contentLoaded,
    setContentLoaded
  };
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
``` 