import React from 'react';
import { LogEntry } from '../types'; // Исправленный путь к типам
import styles from '../DebugPanel.module.css';

interface ConsoleLogsTabProps {
  logs: LogEntry[];
  error: string | null;
  loading: boolean;
  onFetchLogs: () => void;
  onCopyLogs: () => void;
  formatTime: (dateString: string) => string;
}

const ConsoleLogsTab: React.FC<ConsoleLogsTabProps> = ({ 
  logs, error, loading, onFetchLogs, onCopyLogs, formatTime 
}) => {
  return (
    <div className={styles.consoleTab}>
      <div className={styles.sectionHeader}>
        <h4>Логи ({logs.length})</h4>
        <div>
          <button onClick={onFetchLogs} disabled={loading || logs.some(log => log.id.startsWith('external-'))} className={styles.actionButton}>
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
          <button onClick={onCopyLogs} className={styles.actionButton}>Копировать</button>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.logs}>
        {logs.map((log) => (
          <div key={log.id} className={`${styles.logEntry} ${styles[log.level.toLowerCase()] || styles.debug}`}>
            <span className={styles.timestamp}>{formatTime(log.created_at)}</span>
            <span className={styles.level}>[{log.level.toUpperCase()}]</span>
            <span className={styles.message}>{log.message}</span>
            {log.context && (
              <pre className={styles.context}>
                {JSON.stringify(log.context, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && !loading && <p>Нет доступных логов для отображения.</p>}
      </div>
    </div>
  );
};

export default ConsoleLogsTab; 