import { useTelegram } from '../context/TelegramContext';

/**
 * Хук для работы с тактильной обратной связью Telegram WebApp
 * Документация: https://core.telegram.org/bots/webapps#hapticfeedback
 */
const useHapticFeedback = () => {
  const { webApp } = useTelegram();

  /**
   * Вызывает тактильную обратную связь при воздействии
   * @param style - 'light', 'medium', 'heavy', 'rigid', or 'soft'
   */
  const impactOccurred = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (webApp?.HapticFeedback?.impactOccurred) {
      webApp.HapticFeedback.impactOccurred(style);
    }
  };

  /**
   * Вызывает тактильную обратную связь для уведомления
   * @param type - 'error', 'success', or 'warning'
   */
  const notificationOccurred = (type: 'error' | 'success' | 'warning') => {
    if (webApp?.HapticFeedback?.notificationOccurred) {
      webApp.HapticFeedback.notificationOccurred(type);
    }
  };

  /**
   * Вызывает тактильную обратную связь при изменении выбора
   */
  const selectionChanged = () => {
    if (webApp?.HapticFeedback?.selectionChanged) {
      webApp.HapticFeedback.selectionChanged();
    }
  };

  /**
   * Вспомогательные функции для стандартных ситуаций
   */
  return {
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    // Вспомогательные функции для типичных сценариев
    buttonClick: () => impactOccurred('medium'),
    success: () => notificationOccurred('success'),
    error: () => notificationOccurred('error'),
    warning: () => notificationOccurred('warning'),
    select: () => selectionChanged(),
    lightTap: () => impactOccurred('light'),
    heavyTap: () => impactOccurred('heavy')
  };
};

export default useHapticFeedback; 