import React from 'react';
import styles from '../DebugPanel.module.css';

interface TelegramInitDataTabProps {
  initData: any; // Тип initData может быть сложным, используем any для простоты
  onCopy: () => void;
}

const TelegramInitDataTab: React.FC<TelegramInitDataTabProps> = ({ initData, onCopy }) => {
  return (
    <div className={styles.initDataTab}>
      <div className={styles.sectionHeader}>
        <h4>Telegram InitData (SDK & Context)</h4>
        <button onClick={onCopy} className={styles.actionButton}>Копировать</button>
      </div>
      <pre className={styles.jsonData}>{JSON.stringify(initData, null, 2)}</pre>
    </div>
  );
};

export default TelegramInitDataTab; 