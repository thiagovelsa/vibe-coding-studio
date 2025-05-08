import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import { notificationAppear } from '../../lib/animations';

// Definição dos tipos
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // em milissegundos
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToasterContextProps {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Criação do contexto
const ToasterContext = createContext<ToasterContextProps | undefined>(undefined);

// Provider component
interface ToasterProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultDuration?: number;
}

export const ToasterProvider: React.FC<ToasterProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Adicionar novo toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration ?? defaultDuration,
      dismissible: toast.dismissible ?? true
    };

    setToasts(prevToasts => {
      // Limitar número máximo de toasts exibidos simultaneamente
      const updatedToasts = [newToast, ...prevToasts].slice(0, maxToasts);
      return updatedToasts;
    });

    return id;
  }, [defaultDuration, maxToasts]);

  // Remover toast
  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Limpar todos os toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Valor do contexto
  const contextValue: ToasterContextProps = {
    toasts,
    addToast,
    removeToast,
    clearToasts
  };

  return (
    <ToasterContext.Provider value={contextValue}>
      {children}
      <ToastContainer position={position} />
    </ToasterContext.Provider>
  );
};

// Hook para uso do contexto
export const useToaster = (): ToasterContextProps => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider');
  }
  return context;
};

// Helpers para criar toasts específicos
export const useToasts = () => {
  const { addToast, removeToast, clearToasts } = useToaster();

  const showToast = (
    message: string,
    type: ToastType,
    options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>
  ) => {
    return addToast({
      type,
      message,
      ...options
    });
  };

  const showSuccess = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => 
    showToast(message, 'success', options);
    
  const showError = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => 
    showToast(message, 'error', options);
    
  const showWarning = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => 
    showToast(message, 'warning', options);
    
  const showInfo = (message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => 
    showToast(message, 'info', options);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearToasts
  };
};

// Componente de cada notificação individual
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { id, type, title, message, duration, dismissible, action } = toast;

  // Auto-dismiss timer
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  // Definir ícone baseado no tipo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info':
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  // Definir estilos baseados no tipo
  const getStyles = () => {
    const baseClasses = 'flex items-start p-3 rounded-lg shadow-md border';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50`;
      case 'error':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50`;
      case 'warning':
        return `${baseClasses} bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50`;
    }
  };

  return (
    <motion.div
      layout
      className={`${getStyles()} w-full max-w-sm min-w-[300px]`}
      variants={notificationAppear}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex-shrink-0 mr-3 pt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 mr-2">
        {title && (
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        
        {action && (
          <button 
            className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
      
      {dismissible && (
        <button 
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none" 
          onClick={() => onRemove(id)}
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// Container que exibe a pilha de toasts
interface ToastContainerProps {
  position: ToastPosition;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ position }) => {
  const { toasts, removeToast } = useToaster();

  // Classes para posicionamento
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0 pt-4 pl-4 items-start';
      case 'top-right':
        return 'top-0 right-0 pt-4 pr-4 items-start';
      case 'bottom-left':
        return 'bottom-0 left-0 pb-4 pl-4 items-end';
      case 'bottom-right':
        return 'bottom-0 right-0 pb-4 pr-4 items-end';
      default:
        return 'top-0 right-0 pt-4 pr-4 items-start';
    }
  };

  const positionClasses = getPositionClasses();

  return (
    <div className={`fixed z-50 flex flex-col gap-3 ${positionClasses}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}; 