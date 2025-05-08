import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAppear } from '../../lib/animations';

interface KeyCombination {
  keys: string[];
  description: string;
}

interface KeyboardFeedbackProps {
  shortcut: KeyCombination;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  onComplete?: () => void;
  variant?: 'subtle' | 'solid' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

export const KeyboardFeedback: React.FC<KeyboardFeedbackProps> = ({
  shortcut,
  duration = 2000,
  position = 'bottom-right',
  onComplete,
  variant = 'subtle',
  size = 'md',
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);

  // Reset visibility when shortcut changes
  useEffect(() => {
    setVisible(true);
  }, [shortcut]);

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

  // Classes para variantes visuais
  const variantClasses = {
    subtle: 'bg-gray-800/90 dark:bg-gray-900/90 text-white backdrop-blur-sm',
    solid: 'bg-gray-800 dark:bg-gray-900 text-white shadow-lg',
    minimal: 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 backdrop-blur-sm'
  };

  // Classes para tamanhos
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-4'
  };

  // Renderizar tecla individual
  const renderKey = (key: string) => {
    return (
      <span 
        key={key}
        className="inline-flex items-center justify-center min-w-[1.8em] h-7 px-1.5 bg-gray-700/50 dark:bg-gray-600/50 
                 text-white rounded-md mx-0.5 border border-gray-600/50 dark:border-gray-500/50 font-mono"
      >
        {key}
      </span>
    );
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {visible && (
        <motion.div
          className={`fixed z-50 ${positionClasses[position]} rounded-lg 
                    ${variantClasses[variant]} ${sizeClasses[size]} shadow-md 
                    border border-gray-700/20 dark:border-gray-500/20`}
          variants={notificationAppear}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              {shortcut.keys.map((key, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="mx-1 text-gray-400">+</span>}
                  {renderKey(key)}
                </React.Fragment>
              ))}
            </div>
            <span className="text-gray-300 dark:text-gray-300 font-medium">
              {shortcut.description}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para facilitar o uso do KeyboardFeedback
export const useKeyboardFeedback = (initialDuration = 2000) => {
  const [feedbackState, setFeedbackState] = useState<{
    shortcut: KeyCombination | null;
    visible: boolean;
    duration: number;
  }>({
    shortcut: null,
    visible: false,
    duration: initialDuration
  });

  const showShortcut = (keys: string[], description: string, duration?: number) => {
    setFeedbackState({
      shortcut: { keys, description },
      visible: true,
      duration: duration || initialDuration
    });
  };

  const hideShortcut = () => {
    setFeedbackState(prev => ({ ...prev, visible: false }));
  };

  return {
    feedbackState,
    showShortcut,
    hideShortcut
  };
};

// Componente de lista de atalhos
interface KeyboardShortcutsListProps {
  shortcuts: KeyCombination[];
  title?: string;
  className?: string;
}

export const KeyboardShortcutsList: React.FC<KeyboardShortcutsListProps> = ({
  shortcuts,
  title = "Atalhos de Teclado",
  className = ""
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium">
          {title}
        </div>
      )}
      <div className="p-2">
        {shortcuts.map((shortcut, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {shortcut.description}
            </span>
            <div className="flex items-center">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  {keyIndex > 0 && <span className="mx-1 text-gray-400">+</span>}
                  <span className="inline-flex items-center justify-center h-6 min-w-[1.5em] px-1.5 
                                 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                 rounded-md text-xs font-mono border border-gray-300 dark:border-gray-600">
                    {key}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 