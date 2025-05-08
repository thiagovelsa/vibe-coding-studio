import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';

export type CommandStatus = 'success' | 'error' | 'loading' | 'warning' | null;

interface CommandFeedbackProps {
  status: CommandStatus;
  message: string;
  duration?: number;
  onComplete?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export const CommandFeedback: React.FC<CommandFeedbackProps> = ({
  status,
  message,
  duration = 2000,
  onComplete,
  position = 'bottom-right'
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Não esconde automaticamente se estiver carregando
    
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [status, duration]);

  useEffect(() => {
    // Reset visibility when status changes
    setVisible(true);
  }, [status, message]);

  const handleAnimationComplete = () => {
    if (!visible && onComplete) {
      onComplete();
    }
  };

  // Posicionamento baseado na prop position
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Cores e ícones baseados no status
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return {
          icon: <FiCheck />,
          bgColor: 'bg-green-100 dark:bg-green-800/30',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-700'
        };
      case 'error':
        return {
          icon: <FiX />,
          bgColor: 'bg-red-100 dark:bg-red-800/30',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-200 dark:border-red-700'
        };
      case 'warning':
        return {
          icon: <FiAlertCircle />,
          bgColor: 'bg-amber-100 dark:bg-amber-800/30',
          textColor: 'text-amber-800 dark:text-amber-200',
          borderColor: 'border-amber-200 dark:border-amber-700'
        };
      case 'loading':
      default:
        return {
          icon: <FiLoader className="animate-spin" />,
          bgColor: 'bg-blue-100 dark:bg-blue-800/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} shadow-md rounded-lg px-4 py-3 border ${styles.bgColor} ${styles.textColor} ${styles.borderColor}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onAnimationComplete={handleAnimationComplete}
        >
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para facilitar o uso do CommandFeedback
export const useCommandFeedback = (initialDuration = 2000) => {
  const [feedbackState, setFeedbackState] = useState<{
    status: CommandStatus;
    message: string;
    visible: boolean;
    duration: number;
  }>({
    status: null,
    message: '',
    visible: false,
    duration: initialDuration
  });

  const showFeedback = (status: CommandStatus, message: string, duration?: number) => {
    setFeedbackState({
      status,
      message,
      visible: true,
      duration: duration || initialDuration
    });
  };

  const hideFeedback = () => {
    setFeedbackState(prev => ({ ...prev, visible: false }));
  };

  const clearFeedback = () => {
    setFeedbackState({
      status: null,
      message: '',
      visible: false,
      duration: initialDuration
    });
  };

  // Helpers
  const showSuccess = (message: string, duration?: number) => 
    showFeedback('success', message, duration);
  
  const showError = (message: string, duration?: number) => 
    showFeedback('error', message, duration);
  
  const showWarning = (message: string, duration?: number) => 
    showFeedback('warning', message, duration);
  
  const showLoading = (message: string = 'Carregando...') => 
    showFeedback('loading', message, 0); // Duração 0 para não esconder

  return {
    feedbackState,
    showFeedback,
    hideFeedback,
    clearFeedback,
    showSuccess,
    showError,
    showWarning,
    showLoading
  };
}; 