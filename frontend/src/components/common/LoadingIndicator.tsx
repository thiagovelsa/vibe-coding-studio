import React from 'react';
import { motion } from 'framer-motion';
import { 
  loadingRotate, 
  loadingBounce, 
  loadingDots, 
  loadingBar 
} from '../../lib/animations';
import { FiLoader, FiRefreshCw, FiClock } from 'react-icons/fi';

export type LoadingType = 'spinner' | 'dots' | 'bar' | 'bounce' | 'pulse';

interface LoadingIndicatorProps {
  type?: LoadingType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'gray';
  message?: string;
  inline?: boolean;
  fullScreen?: boolean;
  translucent?: boolean;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  message,
  inline = false,
  fullScreen = false,
  translucent = false,
  className = '',
}) => {
  // Mapeia tamanhos para classes CSS
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-sm',
    md: 'w-6 h-6 text-base',
    lg: 'w-8 h-8 text-lg',
    xl: 'w-12 h-12 text-xl',
  };

  // Mapeia cores para classes CSS
  const colorClasses = {
    primary: 'text-blue-500 dark:text-blue-400',
    secondary: 'text-purple-500 dark:text-purple-400',
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-amber-500 dark:text-amber-400',
    info: 'text-cyan-500 dark:text-cyan-400',
    gray: 'text-gray-500 dark:text-gray-400',
  };

  // Animação de dots com staggerChildren para delay sequencial
  const dotsContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -8, 0], 
      transition: { 
        repeat: Infinity, 
        repeatType: "loop", 
        duration: 0.8,
      } 
    },
  };

  // Escolhe a animação baseada no tipo
  const renderLoadingIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <motion.div 
            animate={loadingRotate}
            className={`${sizeClasses[size]} ${colorClasses[color]}`}
          >
            <FiLoader className="w-full h-full" />
          </motion.div>
        );
        
      case 'dots':
        return (
          <motion.div 
            className="flex justify-center items-center space-x-1.5"
            variants={dotsContainerVariants}
            animate="animate"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={dotVariants}
                className={`${sizeClasses[size].split(' ')[0]} rounded-full ${colorClasses[color]} bg-current`}
                style={{ width: `${parseInt(sizeClasses[size].split(' ')[0].replace('w-', '')) / 2}rem`, height: `${parseInt(sizeClasses[size].split(' ')[0].replace('w-', '')) / 2}rem` }}
              />
            ))}
          </motion.div>
        );
        
      case 'bar':
        return (
          <div className={`w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
            <motion.div
              className={`h-full ${colorClasses[color].replace('text-', 'bg-')}`}
              animate={loadingBar}
            />
          </div>
        );
        
      case 'bounce':
        return (
          <motion.div 
            animate={loadingBounce}
            className={`${sizeClasses[size]} ${colorClasses[color]}`}
          >
            <FiRefreshCw className="w-full h-full" />
          </motion.div>
        );
        
      case 'pulse':
        return (
          <div className={`relative ${sizeClasses[size]} ${colorClasses[color]}`}>
            <FiClock className="w-full h-full" />
            <motion.div
              className={`absolute inset-0 ${colorClasses[color].replace('text-', 'bg-')} rounded-full`}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              style={{ zIndex: -1 }}
            />
          </div>
        );
        
      default:
        return (
          <motion.div 
            animate={loadingRotate}
            className={`${sizeClasses[size]} ${colorClasses[color]}`}
          >
            <FiLoader className="w-full h-full" />
          </motion.div>
        );
    }
  };

  // Conteúdo principal do indicador de carregamento
  const loadingContent = (
    <div className={`flex ${inline ? 'inline-flex' : 'flex'} items-center justify-center ${className}`}>
      {renderLoadingIndicator()}
      {message && (
        <span className={`ml-3 ${sizeClasses[size].split(' ').pop()} ${colorClasses[color]} font-medium`}>
          {message}
        </span>
      )}
    </div>
  );

  // Se for fullScreen, cobre toda a tela
  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${translucent ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm' : 'bg-white dark:bg-gray-900'}`}>
        {loadingContent}
      </div>
    );
  }

  return loadingContent;
};

// Componente de carregamento de página cheia com mensagem
export const FullPageLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
  return (
    <LoadingIndicator
      type="spinner"
      size="lg"
      color="primary"
      message={message}
      fullScreen
      translucent
    />
  );
};

// Componente de botão com carregamento
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline' | 'ghost';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  // Mapeia variantes para classes CSS
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    error: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    outline: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30',
    ghost: 'bg-transparent text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30',
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center justify-center space-x-2
                ${variantClasses[variant]} 
                ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''} 
                ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingIndicator 
          type="spinner" 
          size="sm" 
          color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'gray'} 
          inline 
        />
      )}
      <span>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
}; 