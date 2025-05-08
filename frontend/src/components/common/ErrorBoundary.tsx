import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { AnimatedButton } from './AnimatedButton';
import { errorManager, ErrorSource, ErrorSeverity } from '../../lib/ErrorManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registrar o erro no ErrorManager
    errorManager.captureError(error, {
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.RENDER,
      context: {
        componentName: this.props.componentName,
        componentStack: errorInfo.componentStack
      },
      userFriendlyMessage: `Ocorreu um erro na interface${this.props.componentName ? ` do componente ${this.props.componentName}` : ''}.`
    });

    // Chamar callback onError se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return this.props.fallback(this.state.error, this.resetError);
        }
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="p-4 m-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-200">
          <div className="flex items-center mb-3">
            <FiAlertTriangle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-medium">Erro de Renderização</h3>
          </div>
          
          <p className="mb-3">
            {this.props.componentName 
              ? `Ocorreu um erro ao renderizar "${this.props.componentName}".` 
              : 'Ocorreu um erro inesperado nesta seção da interface.'}
          </p>
          
          {this.state.error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 rounded overflow-auto max-h-32 text-xs font-mono">
              {this.state.error.toString()}
            </div>
          )}
          
          <div className="flex justify-end">
            <AnimatedButton
              onClick={this.resetError}
              variant="subtle"
              className="flex items-center text-sm px-3 py-1.5 rounded bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-700/50"
            >
              <FiRefreshCw className="w-4 h-4 mr-1" />
              Tentar Novamente
            </AnimatedButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para facilitar o uso de ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> = {}
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...options} componentName={options.componentName || displayName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
} 