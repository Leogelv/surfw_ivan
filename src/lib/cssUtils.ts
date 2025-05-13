/**
 * Утилиты для безопасной работы с CSS переменными
 */

/**
 * Устанавливает CSS переменную в корневой элемент документа
 * @param name Имя CSS переменной (без --)
 * @param value Значение CSS переменной
 */
export const setCssVariable = (name: string, value: string): void => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.setProperty(`--${name}`, value);
  }
};

/**
 * Устанавливает набор CSS переменных в корневой элемент документа
 * @param variables Объект с переменными в формате { имя: значение }
 * @param prefix Опциональный префикс для имен переменных (без --)
 */
export const setCssVariables = (
  variables: Record<string, string | number>,
  prefix: string = ''
): void => {
  if (typeof document !== 'undefined' && document.documentElement) {
    Object.entries(variables).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}-${key}` : key;
      document.documentElement.style.setProperty(
        `--${varName}`,
        typeof value === 'number' ? `${value}px` : value
      );
    });
  }
};

/**
 * Устанавливает параметры темы Telegram
 * @param themeParams Объект с параметрами темы
 */
export const setTelegramThemeVariables = (
  themeParams: Record<string, string> | null | undefined
): void => {
  if (!themeParams || typeof document === 'undefined') return;

  // Устанавливаем оригинальные параметры темы
  Object.entries(themeParams).forEach(([key, value]) => {
    setCssVariable(`tg-theme-${key}`, value);
  });

  // Устанавливаем алиасы для удобства
  const aliases: Record<string, string> = {
    'tg-theme-bg': themeParams.bg_color || '',
    'tg-theme-text': themeParams.text_color || '',
    'tg-theme-hint': themeParams.hint_color || '',
    'tg-theme-link': themeParams.link_color || '',
    'tg-theme-button': themeParams.button_color || '',
    'tg-theme-button-text': themeParams.button_text_color || ''
  };

  Object.entries(aliases).forEach(([name, value]) => {
    if (value) {
      setCssVariable(name, value);
    }
  });
};

/**
 * Устанавливает параметры безопасной области контента Telegram
 * @param contentSafeArea Объект с параметрами безопасной области
 */
export const setContentSafeAreaVariables = (
  contentSafeArea: { top: number; right: number; bottom: number; left: number }
): void => {
  setCssVariables({
    'safe-area-top': contentSafeArea.top,
    'safe-area-right': contentSafeArea.right,
    'safe-area-bottom': contentSafeArea.bottom,
    'safe-area-left': contentSafeArea.left,
    'tg-content-safe-area-top': contentSafeArea.top,
    'tg-content-safe-area-right': contentSafeArea.right,
    'tg-content-safe-area-bottom': contentSafeArea.bottom,
    'tg-content-safe-area-left': contentSafeArea.left
  });
};

/**
 * Устанавливает или сбрасывает параметры отображения заголовка Telegram
 * @param isFullScreenEnabled Флаг полноэкранного режима
 * @param telegramHeaderPadding Отступ заголовка
 */
export const setTelegramHeaderVariables = (
  isFullScreenEnabled: boolean,
  telegramHeaderPadding: number
): void => {
  if (isFullScreenEnabled) {
    setCssVariable('telegram-header-padding', `${telegramHeaderPadding}px`);
    setCssVariable('telegram-header-gradient', 'linear-gradient(to bottom, #FFFFFF 90%, #FFFFFF 95%)');
  } else {
    setCssVariable('telegram-header-padding', '0px');
    setCssVariable('telegram-header-gradient', 'none');
  }
};

/**
 * Сбрасывает все CSS переменные безопасной области
 */
export const resetSafeAreaVariables = (): void => {
  setCssVariables({
    'safe-area-top': 0,
    'safe-area-right': 0,
    'safe-area-bottom': 0,
    'safe-area-left': 0,
    'tg-content-safe-area-top': 0,
    'tg-content-safe-area-right': 0,
    'tg-content-safe-area-bottom': 0,
    'tg-content-safe-area-left': 0
  });
}; 