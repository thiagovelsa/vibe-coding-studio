import { toast } from 'react-toastify';
import { Logger } from './Logger';
// Removemos a importação direta do hook
// import { useProblems } from '../context/ProblemsContext';

// Definimos a interface que representa o tipo de retorno do hook useProblems
interface ProblemsContextType {
  addProblem: (problem: any) => void;
  removeProblem: (id: string) => void;
  clearProblems: () => void;
  problems: any[];
  resolveProblem: (id: string) => void;
  unresolveProblem: (id: string) => void;
  clearAllProblems: () => void;
  clearResolvedProblems: () => void;
}

// Tipos de erro customizados
export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum ErrorSource {
  API = 'api',
  WEBSOCKET = 'websocket',
  FILE_SYSTEM = 'file-system',
  RENDER = 'render',
  USER_INTERACTION = 'user-interaction',
  AGENT = 'agent',
  DATABASE = 'database',
  SYSTEM = 'system',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}

// Tipo para handlers de erro personalizados
type ErrorHandler = (error: ApplicationError) => void;

// Interface para erro customizado
export interface AppError {
  id?: string;
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp?: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  originalError?: Error;
  retryable?: boolean;
  userFriendlyMessage?: string;
  location?: {
    fileId?: string;
    filePath?: string;
    line?: number;
    column?: number;
  };
}

// Classe para representar erros da aplicação com mensagens amigáveis
export class ApplicationError extends Error {
  public id: string;
  public severity: ErrorSeverity;
  public source: ErrorSource;
  public timestamp: string;
  public code?: string;
  public context?: Record<string, any>;
  public originalError?: Error;
  public retryable: boolean;
  public userFriendlyMessage: string;
  public location?: {
    fileId?: string;
    filePath?: string;
    line?: number;
    column?: number;
  };

  constructor(options: {
    message: string;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    code?: string;
    context?: Record<string, any>;
    originalError?: Error;
    retryable?: boolean;
    userFriendlyMessage?: string;
    location?: {
      fileId?: string;
      filePath?: string;
      line?: number;
      column?: number;
    };
  }) {
    super(options.message);
    this.name = 'ApplicationError';
    this.id = `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.source = options.source || ErrorSource.UNKNOWN;
    this.timestamp = new Date().toISOString();
    this.code = options.code;
    this.context = options.context;
    this.originalError = options.originalError;
    this.retryable = options.retryable ?? false;
    this.userFriendlyMessage = options.userFriendlyMessage || options.message;
    this.location = options.location;

    // Captura stack trace se disponível
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  // Converter para problema para o ProblemsContext
  toProblemItem() {
    return {
      id: this.id,
      message: this.userFriendlyMessage || this.message,
      severity: this.mapSeverityToProblemSeverity(),
      source: this.source,
      timestamp: this.timestamp,
      details: {
        originalMessage: this.message,
        code: this.code,
        context: this.context,
        stack: this.stack
      },
      location: this.location
    };
  }

  private mapSeverityToProblemSeverity(): 'error' | 'warning' | 'info' {
    switch (this.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return 'error';
      case ErrorSeverity.WARNING:
        return 'warning';
      case ErrorSeverity.INFO:
      default:
        return 'info';
    }
  }

  // Obter informações de rastreamento para diagnóstico
  public getDebugInfo(): string {
    const debugInfo = [
      `ID: ${this.id}`,
      `Mensagem: ${this.message}`,
      `Severidade: ${this.severity}`,
      `Fonte: ${this.source}`,
      `Timestamp: ${this.timestamp}`,
      this.code ? `Código: ${this.code}` : null,
      this.location ? `Localização: ${JSON.stringify(this.location)}` : null,
      this.context ? `Contexto: ${JSON.stringify(this.context, null, 2)}` : null,
      this.stack ? `Stack: ${this.stack}` : null
    ];

    return debugInfo.filter(Boolean).join('\n');
  }
}

// Gerenciador de erros centralizado
class ErrorManager {
  private static instance: ErrorManager;
  // Alteramos o tipo para a interface que criamos
  private problemsContext: ProblemsContextType | null = null;
  private errorHandlers: ErrorHandler[] = [];
  private errorCount: Record<ErrorSource, number> = Object.values(ErrorSource).reduce(
    (acc, source) => ({ ...acc, [source]: 0 }),
    {} as Record<ErrorSource, number>
  );
  private criticalErrorCount = 0;

  private constructor() {
    // Construtor privado para singleton
  }

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  // Registrar o contexto de problemas para uso (chamado quando o contexto estiver disponível)
  public registerProblemsContext(problemsContext: ProblemsContextType): void {
    this.problemsContext = problemsContext;
  }

  // Registrar um handler para erros
  public registerHandler(handler: ErrorHandler): void {
    if (!this.errorHandlers.includes(handler)) {
      this.errorHandlers.push(handler);
    }
  }

  // Remover um handler de erros
  public unregisterHandler(handler: ErrorHandler): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  // Capturar e processar um erro
  public captureError(
    errorOrOptions: Error | string | AppError | ApplicationError,
    options?: Partial<Omit<AppError, 'message'>> & { 
      showToast?: boolean; 
      addToProblemPanel?: boolean;
      notifyHandlers?: boolean;
    }
  ): ApplicationError {
    let appError: ApplicationError;

    // Converter para ApplicationError padronizado
    if (errorOrOptions instanceof ApplicationError) {
      appError = errorOrOptions;
    } else if (errorOrOptions instanceof Error) {
      appError = new ApplicationError({
        message: errorOrOptions.message,
        originalError: errorOrOptions,
        ...(options || {})
      });
    } else if (typeof errorOrOptions === 'string') {
      appError = new ApplicationError({
        message: errorOrOptions,
        ...(options || {})
      });
    } else {
      // É um AppError ou objeto com formato similar
      appError = new ApplicationError({
        message: errorOrOptions.message,
        severity: errorOrOptions.severity,
        source: errorOrOptions.source,
        code: errorOrOptions.code,
        context: errorOrOptions.context,
        originalError: errorOrOptions.originalError,
        retryable: errorOrOptions.retryable,
        userFriendlyMessage: errorOrOptions.userFriendlyMessage,
        location: errorOrOptions.location
      });
    }

    // Incrementar contadores
    this.errorCount[appError.source] = (this.errorCount[appError.source] || 0) + 1;
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.criticalErrorCount++;
    }

    // Log do erro
    this.logError(appError);

    // Mostrar toast se solicitado (padrão: true para erros e críticos)
    const showToast = options?.showToast ?? 
      (appError.severity === ErrorSeverity.ERROR || appError.severity === ErrorSeverity.CRITICAL);
    
    if (showToast) {
      this.showErrorToast(appError);
    }

    // Adicionar ao painel de problemas se solicitado (padrão: true)
    const addToProblemPanel = options?.addToProblemPanel ?? true;
    if (addToProblemPanel && this.problemsContext) {
      const problemItem = appError.toProblemItem();
      this.problemsContext.addProblem(problemItem);
    }

    // Notificar handlers se solicitado (padrão: true)
    const notifyHandlers = options?.notifyHandlers ?? true;
    if (notifyHandlers && this.errorHandlers.length > 0) {
      this.errorHandlers.forEach(handler => {
        try {
          handler(appError);
        } catch (handlerError) {
          // Evitar loops infinitos se o handler falhar
          console.error('Erro ao executar handler de erro:', handlerError);
        }
      });
    }

    return appError;
  }

  // Log do erro usando o Logger
  private logError(error: ApplicationError): void {
    const logContext = {
      id: error.id,
      severity: error.severity,
      source: error.source,
      code: error.code,
      context: error.context,
      location: error.location,
      timestamp: error.timestamp
    };

    if (error.severity === ErrorSeverity.CRITICAL) {
      Logger.error(`[CRITICAL] ${error.message}`, logContext, error.stack);
    } else if (error.severity === ErrorSeverity.ERROR) {
      Logger.error(error.message, logContext, error.stack);
    } else if (error.severity === ErrorSeverity.WARNING) {
      Logger.warn(error.message, logContext);
    } else {
      Logger.info(error.message, logContext);
    }
  }

  // Mostrar notificação toast
  private showErrorToast(error: ApplicationError): void {
    const message = error.userFriendlyMessage || error.message;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        toast.error(message, {
          autoClose: 6000, // Permanece mais tempo para erros
          toastId: `error-${error.id}`
        });
        break;
      case ErrorSeverity.WARNING:
        toast.warning(message);
        break;
      case ErrorSeverity.INFO:
        toast.info(message);
        break;
    }
  }

  // Obter estatísticas de erros
  public getErrorStats(): {
    bySource: Record<ErrorSource, number>;
    criticalCount: number;
    totalCount: number;
  } {
    const totalCount = Object.values(this.errorCount).reduce((sum, count) => sum + count, 0);
    
    return {
      bySource: { ...this.errorCount },
      criticalCount: this.criticalErrorCount,
      totalCount
    };
  }

  // Utilitário para criar erros de API
  public createApiError(
    error: Error | string,
    context?: Record<string, any>,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || 'Erro na comunicação com o servidor';
    
    const defaultMessage = 'Erro na comunicação com o servidor. Por favor, tente novamente.';
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.API,
      context,
      originalError: typeof error === 'object' ? error : undefined,
      retryable: true,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Utilitário para criar erros de WebSocket
  public createWebSocketError(
    error: Error | string,
    context?: Record<string, any>,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || 'Erro na conexão websocket';
    
    const defaultMessage = 'Erro na conexão com o servidor. A comunicação em tempo real pode estar comprometida.';
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.WARNING,
      source: ErrorSource.WEBSOCKET,
      context,
      originalError: typeof error === 'object' ? error : undefined,
      retryable: true,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Utilitário para criar erros de sistema de arquivos
  public createFileSystemError(
    error: Error | string,
    filePath?: string,
    operation?: string,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || `Erro ao ${operation || 'acessar'} arquivo`;
    
    const defaultMessage = filePath 
      ? `Erro ao ${operation || 'acessar'} o arquivo "${filePath}".` 
      : `Erro de sistema de arquivos.`;
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.FILE_SYSTEM,
      context: { filePath, operation },
      originalError: typeof error === 'object' ? error : undefined,
      retryable: operation !== 'delete', // Geralmente podemos tentar novamente, exceto para delete
      userFriendlyMessage: userFriendlyMessage || defaultMessage,
      location: filePath ? { filePath } : undefined
    });
  }

  // Utilitário para criar erros de renderização
  public createRenderError(
    error: Error | string,
    componentName?: string,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || 'Erro de renderização';
    
    const defaultMessage = componentName 
      ? `Ocorreu um erro ao renderizar "${componentName}". A interface pode estar comprometida.` 
      : `Ocorreu um erro na interface. Alguns elementos podem não estar funcionando corretamente.`;
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.RENDER,
      context: { componentName },
      originalError: typeof error === 'object' ? error : undefined,
      retryable: false,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Utilitário para criar erros de agente
  public createAgentError(
    error: Error | string,
    agentType?: string,
    operation?: string,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || `Erro no agente${agentType ? ` ${agentType}` : ''}`;
    
    const defaultMessage = agentType 
      ? `Erro no agente ${agentType}${operation ? ` ao ${operation}` : ''}.` 
      : `Erro no processamento do agente${operation ? ` ao ${operation}` : ''}.`;
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.AGENT,
      context: { agentType, operation },
      originalError: typeof error === 'object' ? error : undefined,
      retryable: true,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Utilitário para criar erros de autenticação
  public createAuthError(
    error: Error | string,
    operation?: string,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || 'Erro de autenticação';
    
    const defaultMessage = operation 
      ? `Erro de autenticação ao ${operation}.` 
      : 'Erro de autenticação. Verifique suas credenciais ou faça login novamente.';
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.AUTHENTICATION,
      context: { operation },
      originalError: typeof error === 'object' ? error : undefined,
      retryable: true,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Utilitário para criar erros de rede
  public createNetworkError(
    error: Error | string,
    url?: string,
    userFriendlyMessage?: string
  ): ApplicationError {
    const message = typeof error === 'string' 
      ? error 
      : error.message || 'Erro de conexão de rede';
    
    const defaultMessage = 'Erro de conexão. Verifique sua conexão com a internet e tente novamente.';
    
    return new ApplicationError({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.NETWORK,
      context: { url },
      originalError: typeof error === 'object' ? error : undefined,
      retryable: true,
      userFriendlyMessage: userFriendlyMessage || defaultMessage
    });
  }

  // Limpar todas as estatísticas de erro
  public clearErrorStats(): void {
    this.errorCount = Object.values(ErrorSource).reduce(
      (acc, source) => ({ ...acc, [source]: 0 }),
      {} as Record<ErrorSource, number>
    );
    this.criticalErrorCount = 0;
  }
}

// Hook para usar o gerenciador de erros
export function useErrorManager() {
  // Não tenta mais acessar useProblems diretamente
  // O contexto deve ser registrado externamente
  return ErrorManager.getInstance();
}

// Exportar singleton para uso direto em contextos não-React
export const errorManager = ErrorManager.getInstance(); 