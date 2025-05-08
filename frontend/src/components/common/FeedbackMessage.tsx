import React, { useState, useEffect } from 'react';
import { 
  FiAlertCircle, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiInfo,
  FiX
} from 'react-icons/fi';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackMessageProps {
  type: FeedbackType;
  message: string;
  detail?: string;
  duration?: number; // em milissegundos, 0 para não desaparecer
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  type,
  message,
  detail,
  duration = 5000,
  onClose,
  position = 'bottom-right',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (duration > 0) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    
    // Aguarda a animação terminar antes de remover
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <FiInfo className="h-5 w-5 text-blue-500" />;
      default:
        return <FiInfo className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={`
        fixed z-50 max-w-md shadow-lg rounded-lg border 
        ${positionClasses[position]} 
        ${getBgColor()}
        ${isExiting ? 'opacity-0 transform translate-y-2' : 'opacity-100'}
        transition-all duration-300 ease-in-out
      `}
      role="alert"
    >
      <div className="flex p-4">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {message}
          </h3>
          {detail && (
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {detail}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 focus:outline-none"
              aria-label="Fechar"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackMessage; 