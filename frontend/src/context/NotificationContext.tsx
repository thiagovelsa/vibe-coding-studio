import React, { createContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  timestamp: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: NotificationType;
  source: string;
  message: string;
  details?: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  logs: LogEntry[];
  settings: {
    position: NotificationPosition;
    maxVisible: number;
    defaultDuration: number;
    defaultAutoClose: boolean;
    logEnabled: boolean;
    keepLogs: number; // Número de logs a manter na memória
  };
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'CLEAR_LOGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationState['settings']> };

// Estado inicial
const initialNotificationState: NotificationState = {
  notifications: [],
  logs: [],
  settings: {
    position: 'bottom-right',
    maxVisible: 5,
    defaultDuration: 5000, // milissegundos
    defaultAutoClose: true,
    logEnabled: true,
    keepLogs: 500, // Manter os últimos 500 logs
  },
};

// Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        ...action.payload,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        autoClose: action.payload.autoClose ?? state.settings.defaultAutoClose,
        duration: action.payload.duration ?? state.settings.defaultDuration,
      };
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications].slice(0, state.settings.maxVisible * 2),
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    
    case 'ADD_LOG':
      const newLog: LogEntry = {
        ...action.payload,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      
      return {
        ...state,
        logs: [newLog, ...state.logs].slice(0, state.settings.keepLogs),
      };
    
    case 'CLEAR_LOGS':
      return {
        ...state,
        logs: [],
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    
    default:
      return state;
  }
};

// Context
interface NotificationContextType {
  state: NotificationState;
  notify: (
    type: NotificationType, 
    title: string, 
    message: string, 
    options?: {
      autoClose?: boolean;
      duration?: number;
      actions?: Array<{
        label: string;
        onClick: () => void;
      }>;
    }
  ) => string;
  success: (title: string, message: string, options?: any) => string;
  info: (title: string, message: string, options?: any) => string;
  warning: (title: string, message: string, options?: any) => string;
  error: (title: string, message: string, options?: any) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  log: (type: NotificationType, source: string, message: string, details?: string, data?: any) => void;
  clearLogs: () => void;
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState, (initial) => {
    // Tenta carregar configurações do localStorage
    try {
      const savedSettings = localStorage.getItem('vf-notification-settings');
      if (savedSettings) {
        return {
          ...initial,
          settings: {
            ...initial.settings,
            ...JSON.parse(savedSettings),
          },
        };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
    }
    return initial;
  });

  // Salvar configurações no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem('vf-notification-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Auto-fechar notificações após um tempo
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    state.notifications.forEach(notif => {
      if (notif.autoClose) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notif.id });
        }, notif.duration);
        
        timers.push(timer);
      }
    });
    
    // Limpar timers ao desmontar o componente
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [state.notifications]);

  // Função para adicionar notificação
  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        autoClose?: boolean;
        duration?: number;
        actions?: Array<{
          label: string;
          onClick: () => void;
        }>;
      }
    ) => {
      const id = uuidv4();
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type,
          title,
          message,
          ...options,
        },
      });
      
      // Adicionar ao log
      if (state.settings.logEnabled) {
        dispatch({
          type: 'ADD_LOG',
          payload: {
            type,
            source: 'notification',
            message: title,
            details: message,
          },
        });
      }
      
      return id;
    },
    [state.settings.logEnabled]
  );

  // Funções de conveniência para tipos específicos de notificações
  const success = useCallback(
    (title: string, message: string, options?: any) => notify('success', title, message, options),
    [notify]
  );
  
  const info = useCallback(
    (title: string, message: string, options?: any) => notify('info', title, message, options),
    [notify]
  );
  
  const warning = useCallback(
    (title: string, message: string, options?: any) => notify('warning', title, message, options),
    [notify]
  );
  
  const error = useCallback(
    (title: string, message: string, options?: any) => notify('error', title, message, options),
    [notify]
  );

  // Função para remover notificação
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  // Função para limpar todas as notificações
  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // Função para adicionar entrada de log
  const log = useCallback(
    (type: NotificationType, source: string, message: string, details?: string, data?: any) => {
      if (state.settings.logEnabled) {
        dispatch({
          type: 'ADD_LOG',
          payload: {
            type,
            source,
            message,
            details,
            data,
          },
        });
      }
    },
    [state.settings.logEnabled]
  );

  // Função para limpar logs
  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);

  // Função para atualizar configurações
  const updateSettings = useCallback((settings: Partial<NotificationState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        state,
        notify,
        success,
        info,
        warning,
        error,
        removeNotification,
        clearNotifications,
        log,
        clearLogs,
        updateSettings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 