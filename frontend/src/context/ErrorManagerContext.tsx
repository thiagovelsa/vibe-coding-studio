import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { ApplicationError, ErrorSeverity, ErrorSource, errorManager } from '../lib/ErrorManager';
import { useProblems } from './ProblemsContext';

// Tipos para o estado do gerenciador de erros
export interface ErrorState {
  activeErrors: ApplicationError[];
  errorHistory: ApplicationError[];
  isProcessing: boolean;
}

// Ações para o reducer
type ErrorAction = 
  | { type: 'ADD_ERROR'; payload: ApplicationError }
  | { type: 'DISMISS_ERROR'; payload: string }  // por id
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'ARCHIVE_ERROR'; payload: string };  // mover para histórico

// Estado inicial
const initialState: ErrorState = {
  activeErrors: [],
  errorHistory: [],
  isProcessing: false
};

// Reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        activeErrors: [...state.activeErrors, action.payload]
      };
    
    case 'DISMISS_ERROR':
      return {
        ...state,
        activeErrors: state.activeErrors.filter(error => error.id !== action.payload)
      };
    
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        activeErrors: []
      };
    
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
    
    case 'ARCHIVE_ERROR':
      const errorToArchive = state.activeErrors.find(error => error.id === action.payload);
      if (!errorToArchive) return state;
      
      return {
        ...state,
        activeErrors: state.activeErrors.filter(error => error.id !== action.payload),
        errorHistory: [...state.errorHistory, errorToArchive]
      };
    
    default:
      return state;
  }
}

// Interface do contexto
interface ErrorManagerContextType {
  state: ErrorState;
  addError: (error: Error | ApplicationError, options?: any) => void;
  dismissError: (errorId: string) => void;
  dismissAllErrors: () => void;
  archiveError: (errorId: string) => void;
  getErrorById: (errorId: string) => ApplicationError | undefined;
  getErrorsBySource: (source: ErrorSource) => ApplicationError[];
  getErrorsBySeverity: (severity: ErrorSeverity) => ApplicationError[];
  clearErrorHistory: () => void;
}

// Contexto para gerenciar erros na aplicação
const ErrorManagerContext = createContext<ErrorManagerContextType | undefined>(undefined);

// Props para o provider
interface ErrorManagerProviderProps {
  children: ReactNode;
}

// Provider que disponibiliza o ErrorManager para a aplicação
export const ErrorManagerProvider: React.FC<ErrorManagerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);
  
  // Obtém o contexto de problemas
  const problemsContext = useProblems();
  
  // Adicionar um erro ao estado
  const addError = useCallback((error: Error | ApplicationError, options?: any) => {
    // Se já é um ApplicationError, use-o diretamente
    if (error instanceof ApplicationError) {
      dispatch({ type: 'ADD_ERROR', payload: error });
      
      // Exibir toast para erros críticos ou comuns
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.ERROR) {
        toast.error(error.userFriendlyMessage || error.message);
      } else if (error.severity === ErrorSeverity.WARNING) {
        toast.warning(error.userFriendlyMessage || error.message);
      }
      
      return;
    }
    
    // Caso contrário, converta para ApplicationError
    const appError = errorManager.captureError(error, options);
    dispatch({ type: 'ADD_ERROR', payload: appError });
    
    // Exibir toast com base na severidade
    if (appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.ERROR) {
      toast.error(appError.userFriendlyMessage || appError.message);
    } else if (appError.severity === ErrorSeverity.WARNING) {
      toast.warning(appError.userFriendlyMessage || appError.message);
    }
  }, []);

  // Descartar um erro específico
  const dismissError = useCallback((errorId: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: errorId });
  }, []);

  // Descartar todos os erros
  const dismissAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  // Arquivar um erro (move-o do estado ativo para o histórico)
  const archiveError = useCallback((errorId: string) => {
    dispatch({ type: 'ARCHIVE_ERROR', payload: errorId });
  }, []);

  // Obter um erro pelo ID
  const getErrorById = useCallback((errorId: string) => {
    return [...state.activeErrors, ...state.errorHistory].find(error => error.id === errorId);
  }, [state.activeErrors, state.errorHistory]);

  // Obter erros por fonte
  const getErrorsBySource = useCallback((source: ErrorSource) => {
    return state.activeErrors.filter(error => error.source === source);
  }, [state.activeErrors]);

  // Obter erros por severidade
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return state.activeErrors.filter(error => error.severity === severity);
  }, [state.activeErrors]);

  // Limpar histórico de erros
  const clearErrorHistory = useCallback(() => {
    // Mantém os erros ativos, mas limpa o histórico
    dispatch({ type: 'SET_PROCESSING', payload: true });
    
    // Simular operação assíncrona (por exemplo, limpar erros no servidor)
    setTimeout(() => {
      const newState = {
        ...state,
        errorHistory: []
      };
      
      // Atualizar estado diretamente ou use uma nova ação no reducer
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }, 500);
  }, [state]);

  // Inscrever-se para capturar erros globais
  useEffect(() => {
    // Configurar o ErrorManager para enviar erros para este contexto
    const handleGlobalError = (error: ApplicationError) => {
      addError(error);
    };

    // Se o ErrorManager tiver um método de registro de handler
    errorManager.registerHandler(handleGlobalError);

    // Ouvir erros não tratados de promise 
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Se já é um ApplicationError, adicione-o diretamente
      if (error instanceof ApplicationError) {
        addError(error);
        return;
      }
      
      // Caso contrário, crie um novo ApplicationError
      const appError = errorManager.captureError(error, {
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.UNKNOWN,
        userFriendlyMessage: 'Erro não tratado na aplicação.',
        retryable: false
      });
      
      addError(appError);
    };

    // Ouvir erros não tratados em geral
    const handleGlobalUnhandledError = (
      event: ErrorEvent
    ) => {
      // Prevenir comportamento padrão do navegador
      event.preventDefault();
      
      // Criar um ApplicationError
      const appError = errorManager.captureError(event.error || new Error(event.message), {
        severity: ErrorSeverity.CRITICAL,
        source: ErrorSource.UNKNOWN,
        context: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        userFriendlyMessage: 'Erro crítico não tratado. Por favor, recarregue a aplicação.',
        retryable: false
      });
      
      addError(appError);
    };

    // Adicionar event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalUnhandledError);

    // Limpar event listeners
    return () => {
      errorManager.unregisterHandler(handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalUnhandledError);
    };
  }, [addError]);

  // Registra o ProblemsContext no ErrorManager quando o componente montar
  useEffect(() => {
    if (problemsContext) {
      errorManager.registerProblemsContext(problemsContext);
    }
    
    return () => {
      // Não há necessidade de "desregistrar" porque o ErrorManager é um singleton
      // e deve permanecer durante toda a vida da aplicação
    };
  }, [problemsContext, errorManager]);

  // Valor do contexto
  const contextValue: ErrorManagerContextType = {
    state,
    addError,
    dismissError,
    dismissAllErrors,
    archiveError,
    getErrorById,
    getErrorsBySource,
    getErrorsBySeverity,
    clearErrorHistory
  };

  return (
    <ErrorManagerContext.Provider value={contextValue}>
      {children}
    </ErrorManagerContext.Provider>
  );
};

// Hook para usar o ErrorManager
export const useErrorManagerContext = () => {
  const context = useContext(ErrorManagerContext);
  if (context === undefined) {
    throw new Error('useErrorManagerContext deve ser usado dentro de um ErrorManagerProvider');
  }
  return context;
};

// Exportação para compatibilidade com código existente
export const useErrorManager = useErrorManagerContext; 