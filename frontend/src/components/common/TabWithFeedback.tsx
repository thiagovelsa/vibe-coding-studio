import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { OpenTab } from '../../context/UIStateContext';

interface TabWithFeedbackProps {
  tab: OpenTab;
  children: React.ReactNode;
  className?: string;
}

export const TabWithFeedback: React.FC<TabWithFeedbackProps> = ({
  tab,
  children,
  className = ''
}) => {
  const { showFeedback } = tab;
  
  // Se não há feedback para mostrar, apenas renderiza as crianças normalmente
  if (!showFeedback) {
    return <>{children}</>;
  }
  
  // Função para obter o ícone baseado no tipo de feedback
  const getFeedbackIcon = () => {
    switch (showFeedback.type) {
      case 'success':
        return <FiCheck className="text-green-500 animate-fadeIn" />;
      case 'error':
        return <FiX className="text-red-500 animate-fadeIn" />;
      case 'loading':
      default:
        return <FiLoader className="text-blue-500 animate-spin" />;
    }
  };
  
  // Função para obter as cores baseadas no tipo de feedback
  const getFeedbackColor = () => {
    switch (showFeedback.type) {
      case 'success':
        return 'text-green-500 dark:text-green-400';
      case 'error':
        return 'text-red-500 dark:text-red-400';
      case 'loading':
      default:
        return 'text-blue-500 dark:text-blue-400';
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Conteúdo normal da aba */}
      <div className={showFeedback ? 'opacity-70' : 'opacity-100'}>
        {children}
      </div>
      
      {/* Overlay de feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-opacity-10 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 shadow-sm ${getFeedbackColor()}`}>
              <span className="text-lg">{getFeedbackIcon()}</span>
              {showFeedback.message && (
                <span className="text-xs font-medium">{showFeedback.message}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Exemplo de uso:
// <TabWithFeedback 
//   tab={{ 
//     id: 'tab1', 
//     title: 'Example.js', 
//     type: 'file',
//     showFeedback: { 
//       type: 'success', 
//       message: 'Salvo com sucesso!',
//       autoDismiss: true
//     }
//   }}
// >
//   <div>Conteúdo normal da aba</div>
// </TabWithFeedback> 