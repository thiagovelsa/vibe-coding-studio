import React, { useState } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiRefreshCw, FiChevronDown, FiChevronUp, FiXCircle } from 'react-icons/fi';
import { AnimatedButton } from './AnimatedButton';
import { ApplicationError, ErrorSeverity } from '../../lib/ErrorManager';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorFeedbackProps {
  error: ApplicationError | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Normaliza error para ApplicationError
  const appError = error instanceof ApplicationError 
    ? error 
    : new ApplicationError({ 
        message: error.message || 'Erro desconhecido',
        severity: ErrorSeverity.ERROR,
        originalError: error,
        userFriendlyMessage: 'Ocorreu um erro inesperado.'
      });

  const severity = appError.severity || ErrorSeverity.ERROR;
  
  // Define cores e ícones baseados na severidade
  const getSeverityStyles = () => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return {
          icon: FiAlertTriangle,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800/40',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-700/50'
        };
      case ErrorSeverity.WARNING:
        return {
          icon: FiAlertCircle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800/40',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-100 dark:bg-yellow-800/50 hover:bg-yellow-200 dark:hover:bg-yellow-700/50'
        };
      case ErrorSeverity.INFO:
      default:
        return {
          icon: FiInfo,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800/40',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-700/50'
        };
    }
  };
  
  const styles = getSeverityStyles();
  const Icon = styles.icon;
  
  // Versão compacta para erros menos críticos ou espaços pequenos
  if (compact) {
    return (
      <div className={`p-2 rounded-md ${styles.bgColor} ${styles.borderColor} border ${styles.textColor} text-xs flex items-center justify-between ${className}`}>
        <div className="flex items-center">
          <Icon className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${styles.iconColor}`} />
          <span className="mr-2">{appError.userFriendlyMessage || appError.message}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {onRetry && appError.retryable && (
            <AnimatedButton
              onClick={onRetry}
              variant="ghost"
              title="Tentar novamente"
              className={`p-1 rounded-full ${styles.iconColor}`}
            >
              <FiRefreshCw className="w-3 h-3" />
            </AnimatedButton>
          )}
          
          {onDismiss && (
            <AnimatedButton
              onClick={onDismiss}
              variant="ghost"
              title="Dispensar"
              className={`p-1 rounded-full ${styles.iconColor}`}
            >
              <FiXCircle className="w-3 h-3" />
            </AnimatedButton>
          )}
        </div>
      </div>
    );
  }

  // Versão completa com detalhes expandíveis
  return (
    <div className={`p-3 rounded-lg ${styles.bgColor} ${styles.borderColor} border ${styles.textColor} ${className}`}>
      <div className="flex items-center mb-2">
        <Icon className={`w-5 h-5 mr-2 ${styles.iconColor}`} />
        <h3 className="text-base font-medium flex-1">{appError.userFriendlyMessage || 'Erro'}</h3>
        
        {onDismiss && (
          <AnimatedButton
            onClick={onDismiss}
            variant="ghost"
            title="Dispensar"
            className={`p-1 rounded-full ${styles.iconColor}`}
          >
            <FiXCircle className="w-4 h-4" />
          </AnimatedButton>
        )}
      </div>
      
      {/* Mostrar mensagem técnica ou detalhes adicionais */}
      {appError.message !== appError.userFriendlyMessage && (
        <p className="text-sm mb-3 opacity-80">{appError.message}</p>
      )}
      
      {/* Botões de ações */}
      <div className="flex items-center justify-between">
        <AnimatedButton
          onClick={() => setShowDetails(!showDetails)}
          variant="ghost"
          className="flex items-center text-xs"
        >
          {showDetails ? (
            <>
              <FiChevronUp className="w-3.5 h-3.5 mr-1" />
              Ocultar Detalhes
            </>
          ) : (
            <>
              <FiChevronDown className="w-3.5 h-3.5 mr-1" />
              Mostrar Detalhes
            </>
          )}
        </AnimatedButton>
        
        <div className="flex items-center space-x-2">
          {onRetry && appError.retryable && (
            <AnimatedButton
              onClick={onRetry}
              variant="subtle"
              className={`flex items-center text-sm px-3 py-1 rounded ${styles.buttonBg}`}
            >
              <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Tentar Novamente
            </AnimatedButton>
          )}
        </div>
      </div>
      
      {/* Detalhes técnicos expansíveis */}
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-opacity-20 text-xs">
              {appError.context && (
                <div className="mb-2">
                  <strong>Contexto:</strong>
                  <pre className="mt-1 p-1.5 bg-black/10 dark:bg-white/10 rounded overflow-auto max-h-32">
                    {JSON.stringify(appError.context, null, 2)}
                  </pre>
                </div>
              )}
              
              {appError.stack && (
                <div className="mb-2">
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 p-1.5 bg-black/10 dark:bg-white/10 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                    {appError.stack}
                  </pre>
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                <div>Origem: {appError.source}</div>
                <div>Timestamp: {appError.timestamp}</div>
                {appError.code && <div>Código: {appError.code}</div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 