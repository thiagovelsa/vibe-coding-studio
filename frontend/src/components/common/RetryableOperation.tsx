import React, { useState, useEffect, useCallback } from 'react';
import { ErrorFeedback } from './ErrorFeedback';
import { FiLoader } from 'react-icons/fi';
import { ApplicationError, errorManager, ErrorSeverity, ErrorSource } from '../../lib/ErrorManager';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryOnlyFor?: ErrorSeverity[];
  onRetryAttempt?: (attempt: number, error: Error) => void;
}

interface RetryableOperationProps<T> {
  operation: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  retryOptions?: RetryOptions;
  loadingComponent?: React.ReactNode;
  autoRetry?: boolean;
  showError?: boolean;
  errorComponent?: React.ReactNode;
  children?: (props: {
    isLoading: boolean;
    error: Error | null;
    data: T | null;
    retry: () => Promise<void>;
    resetError: () => void;
  }) => React.ReactNode;
}

export function RetryableOperation<T>({
  operation,
  onSuccess,
  onError,
  onComplete,
  retryOptions = {},
  loadingComponent,
  autoRetry = true,
  showError = true,
  errorComponent,
  children
}: RetryableOperationProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeoutId, setRetryTimeoutId] = useState<number | null>(null);

  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    retryOnlyFor = [ErrorSeverity.ERROR, ErrorSeverity.WARNING],
    onRetryAttempt
  } = retryOptions;

  // Calcular o atraso baseado em exponential backoff
  const calculateDelay = useCallback(
    (attempt: number) => {
      const delay = initialDelayMs * Math.pow(backoffFactor, attempt);
      return Math.min(delay, maxDelayMs);
    },
    [initialDelayMs, backoffFactor, maxDelayMs]
  );

  // Verificar se um erro deve ser retentado
  const shouldRetryForError = useCallback(
    (err: Error) => {
      if (retryCount >= maxRetries) return false;
      
      // Se for um ApplicationError, verifica a severidade
      if (err instanceof ApplicationError) {
        if (!err.retryable) return false;
        return retryOnlyFor.includes(err.severity);
      }
      
      // Para erros normais, sempre tenta
      return true;
    },
    [retryCount, maxRetries, retryOnlyFor]
  );

  // Função para limpar qualquer timeout de retry
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutId !== null) {
      window.clearTimeout(retryTimeoutId);
      setRetryTimeoutId(null);
    }
  }, [retryTimeoutId]);

  // Resetar o estado de erro
  const resetError = useCallback(() => {
    setError(null);
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  // Executar a operação
  const executeOperation = useCallback(async () => {
    setIsLoading(true);
    clearRetryTimeout();

    try {
      const result = await operation();
      setData(result);
      setError(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Se não for um ApplicationError, converte para um
      const appError = error instanceof ApplicationError
        ? error
        : errorManager.captureError(error, {
            severity: ErrorSeverity.ERROR,
            source: ErrorSource.USER_INTERACTION,
            retryable: true,
            userFriendlyMessage: 'A operação falhou. Tente novamente.'
          });
      
      setError(appError);
      
      if (onError) {
        onError(appError);
      }
      
      // Configura retry automático se necessário
      if (autoRetry && shouldRetryForError(appError)) {
        const nextRetryCount = retryCount + 1;
        const delay = calculateDelay(retryCount);
        
        if (onRetryAttempt) {
          onRetryAttempt(nextRetryCount, appError);
        }
        
        const timeoutId = window.setTimeout(() => {
          setRetryCount(nextRetryCount);
          executeOperation();
        }, delay);
        
        setRetryTimeoutId(timeoutId);
      }
      
      throw appError;
    } finally {
      setIsLoading(false);
      
      if (onComplete) {
        onComplete();
      }
    }
  }, [
    operation,
    onSuccess,
    onError,
    onComplete,
    autoRetry,
    shouldRetryForError,
    retryCount,
    calculateDelay,
    onRetryAttempt,
    clearRetryTimeout
  ]);

  // Função de retry manual
  const retry = useCallback(async () => {
    setRetryCount(retryCount + 1);
    return executeOperation();
  }, [retryCount, executeOperation]);

  // Executa a operação na montagem
  useEffect(() => {
    executeOperation();
    
    // Limpa timeout no desmonte
    return () => {
      clearRetryTimeout();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem

  // Renderização com render props
  if (children) {
    return <>{children({ isLoading, error, data, retry, resetError })}</>;
  }

  // Renderização padrão
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center py-4">
        <FiLoader className="w-5 h-5 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Carregando...</span>
      </div>
    );
  }

  if (error && showError) {
    return errorComponent || (
      <ErrorFeedback
        error={error}
        onRetry={shouldRetryForError(error) ? retry : undefined}
        onDismiss={resetError}
      />
    );
  }

  return null;
} 