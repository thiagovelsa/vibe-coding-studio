import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { loadingRotate, success, error, transitionStates } from '../../lib/animations';

export type FeedbackStatus = 'idle' | 'loading' | 'success' | 'error' | 'warning';

interface AnimatedFeedbackProps {
  status: FeedbackStatus;
  message?: string;
  successMessage?: string;
  errorMessage?: string;
  warningMessage?: string;
  loadingMessage?: string;
  showIcon?: boolean;
  className?: string;
  duration?: number;
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid' | 'outline';
}

export const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  status,
  message,
  successMessage = 'Operação concluída',
  errorMessage = 'Ocorreu um erro',
  warningMessage = 'Atenção',
  loadingMessage = 'Carregando...',
  showIcon = true,
  className = '',
  duration = 3000,
  onAnimationComplete,
  size = 'md',
  variant = 'subtle'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [innerStatus, setInnerStatus] = useState<FeedbackStatus>(status);
  const [shouldExitAfterSuccess, setShouldExitAfterSuccess] = useState(false);

  // Reset state when status changes
  useEffect(() => {
    setInnerStatus(status);
    setIsVisible(true);
    
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setShouldExitAfterSuccess(true);
        setIsVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setShouldExitAfterSuccess(false);
    }
  }, [status, duration]);

  const handleAnimationComplete = () => {
    if (!isVisible && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const getDisplayMessage = () => {
    if (message) return message;
    
    switch (innerStatus) {
      case 'success': return successMessage;
      case 'error': return errorMessage;
      case 'warning': return warningMessage;
      case 'loading': return loadingMessage;
      default: return '';
    }
  };

  const getIcon = () => {
    switch (innerStatus) {
      case 'success':
        return (
          <motion.div 
            initial={{ scale: 0 }}
            animate="visible"
            variants={transitionStates}
            custom="success"
            className="text-green-500"
          >
            <FiCheckCircle />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div 
            animate={error}
            className="text-red-500"
          >
            <FiXCircle />
          </motion.div>
        );
      case 'warning':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-amber-500"
          >
            <FiAlertCircle />
          </motion.div>
        );
      case 'loading':
        return (
          <motion.div 
            animate={loadingRotate}
            className="text-blue-500"
          >
            <FiLoader />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs py-1 px-2';
      case 'lg': return 'text-base py-3 px-4';
      case 'md':
      default:    return 'text-sm py-2 px-3';
    }
  };

  const getVariantClasses = () => {
    const baseClasses = {
      subtle: {
        success: 'bg-green-50 dark:bg-green-800/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50',
        error: 'bg-red-50 dark:bg-red-800/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50',
        warning: 'bg-amber-50 dark:bg-amber-800/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
        loading: 'bg-blue-50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        idle: 'bg-gray-50 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/50',
      },
      solid: {
        success: 'bg-green-500 text-white border-transparent',
        error: 'bg-red-500 text-white border-transparent',
        warning: 'bg-amber-500 text-white border-transparent',
        loading: 'bg-blue-500 text-white border-transparent',
        idle: 'bg-gray-500 text-white border-transparent',
      },
      outline: {
        success: 'bg-transparent text-green-700 dark:text-green-300 border-green-500',
        error: 'bg-transparent text-red-700 dark:text-red-300 border-red-500',
        warning: 'bg-transparent text-amber-700 dark:text-amber-300 border-amber-500',
        loading: 'bg-transparent text-blue-700 dark:text-blue-300 border-blue-500',
        idle: 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-500',
      }
    };

    return baseClasses[variant][innerStatus];
  };

  const variantAnimations = {
    idle: {
      opacity: 1,
      y: 0
    },
    loading: {
      opacity: 1,
      y: 0
    },
    success: {
      opacity: 1,
      y: 0
    },
    error: {
      opacity: 1,
      y: 0,
      x: [0, -3, 3, -3, 3, 0],
      transition: { duration: 0.4 }
    },
    warning: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          key={innerStatus}
          className={`inline-flex items-center rounded-md border ${getSizeClasses()} ${getVariantClasses()} ${className}`}
          initial={{ opacity: 0, y: 10 }}
          animate={innerStatus}
          variants={variantAnimations}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
        >
          {showIcon && (
            <span className="mr-2 text-[1.1em]">
              {getIcon()}
            </span>
          )}
          <span className="font-medium whitespace-nowrap">
            {getDisplayMessage()}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para facilitar o uso do AnimatedFeedback
export const useAnimatedFeedback = (initialStatus: FeedbackStatus = 'idle') => {
  const [feedbackState, setFeedbackState] = useState<{
    status: FeedbackStatus;
    message: string;
    visible: boolean;
  }>({
    status: initialStatus,
    message: '',
    visible: false
  });

  const showFeedback = (status: FeedbackStatus, message: string = '') => {
    setFeedbackState({
      status,
      message,
      visible: true
    });
  };

  const hideFeedback = () => {
    setFeedbackState(prev => ({ ...prev, visible: false }));
  };

  const resetFeedback = () => {
    setFeedbackState({
      status: 'idle',
      message: '',
      visible: false
    });
  };

  // Métodos de conveniência
  const showLoading = (message: string = 'Carregando...') => showFeedback('loading', message);
  const showSuccess = (message: string = 'Operação concluída') => showFeedback('success', message);
  const showError = (message: string = 'Ocorreu um erro') => showFeedback('error', message);
  const showWarning = (message: string = 'Atenção') => showFeedback('warning', message);

  return {
    feedbackState,
    showFeedback,
    hideFeedback,
    resetFeedback,
    showLoading,
    showSuccess,
    showError,
    showWarning
  };
}; 