import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { ApplicationError, ErrorSeverity } from '../../lib/ErrorManager';
import { cn } from '../../lib/utils';

interface ErrorNotificationProps {
  error: ApplicationError;
  onDismiss?: () => void;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  compact = false,
  className = '',
  showDetails: initialShowDetails = false
}) => {
  const [showDetails, setShowDetails] = useState(initialShowDetails);

  // Determinar cor com base na severidade
  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-500 dark:bg-red-600 border-red-700';
      case ErrorSeverity.ERROR:
        return 'bg-red-400 dark:bg-red-500 border-red-600';
      case ErrorSeverity.WARNING:
        return 'bg-amber-400 dark:bg-amber-500 border-amber-600';
      case ErrorSeverity.INFO:
        return 'bg-blue-400 dark:bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-400 dark:bg-gray-500 border-gray-600';
    }
  };

  // Estilo base
  const baseClasses = 'rounded-lg shadow-md border overflow-hidden';
  
  // Estilo baseado na severidade
  const severityClasses = getSeverityColor(error.severity);
  
  // Estilo para modo compacto vs. expandido
  const sizeClasses = compact 
    ? 'p-2 text-sm' 
    : 'p-3 text-base';

  return (
    <motion.div
      className={cn(
        baseClasses,
        severityClasses,
        sizeClasses,
        'text-white',
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-white flex-shrink-0" size={compact ? 16 : 20} />
          <div>
            <p className="font-medium">
              {error.userFriendlyMessage || error.message}
            </p>
            {!compact && error.context && error.context.help && (
              <p className="text-sm opacity-90 mt-1">{error.context.help}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              title="Tentar novamente"
            >
              <FiRefreshCw size={compact ? 14 : 16} />
            </button>
          )}
          
          {!compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              title={showDetails ? "Esconder detalhes" : "Mostrar detalhes"}
            >
              {showDetails ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
              title="Fechar"
            >
              <FiX size={compact ? 14 : 16} />
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {showDetails && !compact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 pt-2 border-t border-white/30 text-sm overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              <p><strong>Tipo:</strong> {ErrorSeverity[error.severity]}</p>
              <p><strong>Fonte:</strong> {error.source}</p>
              
              {error.timestamp && (
                <p><strong>Ocorrido em:</strong> {new Date(error.timestamp).toLocaleString()}</p>
              )}
              
              {error.code && (
                <p><strong>Código:</strong> {error.code}</p>
              )}
              
              {error.context && Object.keys(error.context).length > 0 && (
                <div>
                  <strong>Contexto:</strong>
                  <pre className="mt-1 p-1 bg-black/30 rounded text-xs overflow-auto max-h-20">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              )}
              
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 p-1 bg-black/30 rounded text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 