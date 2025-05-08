import { useContext, useCallback, useMemo } from 'react';
import { NotificationContext, NotificationType } from '../context/NotificationContext';

/**
 * Hook para acessar as funcionalidades de notificações
 * @returns Funções e estado para gerenciar notificações
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  
  return context;
}

/**
 * Hook simplificado para acessar apenas funções de notificação mais utilizadas
 * @returns Funções simplificadas para mostrar notificações
 */
export function useSimpleNotifications() {
  const { success, info, warning, error, removeNotification } = useNotification();
  
  return {
    success: (title: string, message: string) => success(title, message),
    info: (title: string, message: string) => info(title, message),
    warning: (title: string, message: string) => warning(title, message),
    error: (title: string, message: string) => error(title, message),
    dismiss: removeNotification,
  };
}

/**
 * Hook para acessar logs do sistema
 * @param filter Opcional: filtro para limitar os tipos de log
 * @returns Logs filtrados e funções para gerenciá-los
 */
export function useLogs(filter?: NotificationType[]) {
  const { state, clearLogs } = useNotification();
  
  // Memoriza a lista de logs filtrados
  const filteredLogs = useMemo(() => {
    if (!filter || filter.length === 0) {
      return state.logs;
    }
    
    return state.logs.filter(log => filter.includes(log.type));
  }, [state.logs, filter]);
  
  // Função para obter logs de uma fonte específica
  const getLogsBySource = useCallback(
    (source: string) => {
      return filteredLogs.filter(log => log.source === source);
    },
    [filteredLogs]
  );
  
  // Estatísticas de log
  const stats = useMemo(() => {
    return {
      total: filteredLogs.length,
      byType: {
        info: filteredLogs.filter(log => log.type === 'info').length,
        success: filteredLogs.filter(log => log.type === 'success').length,
        warning: filteredLogs.filter(log => log.type === 'warning').length,
        error: filteredLogs.filter(log => log.type === 'error').length,
      },
    };
  }, [filteredLogs]);
  
  return {
    logs: filteredLogs,
    clearLogs,
    getLogsBySource,
    stats,
  };
}

/**
 * Hook para criar um logger específico para um componente ou módulo
 * @param source Nome da fonte do log (componente ou módulo)
 * @returns Funções de log específicas para a fonte
 */
export function useLogger(source: string) {
  const { log } = useNotification();
  
  return {
    info: (message: string, details?: string, data?: any) => {
      log('info', source, message, details, data);
    },
    success: (message: string, details?: string, data?: any) => {
      log('success', source, message, details, data);
    },
    warning: (message: string, details?: string, data?: any) => {
      log('warning', source, message, details, data);
    },
    error: (message: string, details?: string, data?: any) => {
      log('error', source, message, details, data);
    },
  };
} 