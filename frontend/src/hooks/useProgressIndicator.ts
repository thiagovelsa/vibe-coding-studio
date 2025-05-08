import { useState, useCallback, useRef, useEffect } from 'react';

export interface ProgressOptions {
  initialProgress?: number;
  autoIncrement?: boolean;
  autoIncrementOptions?: {
    intervalMs?: number;
    incrementValue?: number;
    maxProgress?: number;
  };
  steps?: number;
}

export interface ProgressState {
  progress: number; // 0-100
  isComplete: boolean;
  isIndeterminate: boolean;
  step: number;
  status: string;
}

/**
 * Hook para gerenciar indicadores de progresso para operações longas
 * @param options Opções de configuração do indicador
 * @returns Estado e funções para controlar o progresso
 */
export const useProgressIndicator = (options: ProgressOptions = {}) => {
  const {
    initialProgress = 0,
    autoIncrement = false,
    autoIncrementOptions = {
      intervalMs: 500,
      incrementValue: 1,
      maxProgress: 90,
    },
    steps = 1,
  } = options;

  const [state, setState] = useState<ProgressState>({
    progress: initialProgress,
    isComplete: false,
    isIndeterminate: false,
    step: 1,
    status: '',
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limpa o intervalo quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Inicia o incremento automático
  useEffect(() => {
    if (autoIncrement && !state.isComplete && !intervalRef.current) {
      startAutoIncrement();
    }
  }, [autoIncrement, state.isComplete]);

  /**
   * Inicia o incremento automático do progresso
   */
  const startAutoIncrement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        // Se já atingiu o máximo ou está completo, para o incremento
        if (prev.progress >= autoIncrementOptions.maxProgress! || prev.isComplete) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }

        return {
          ...prev,
          progress: Math.min(prev.progress + autoIncrementOptions.incrementValue!, autoIncrementOptions.maxProgress!),
        };
      });
    }, autoIncrementOptions.intervalMs);
  }, [autoIncrementOptions]);

  /**
   * Para o incremento automático
   */
  const stopAutoIncrement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Define o progresso para um valor específico
   */
  const setProgress = useCallback((newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    
    setState((prev) => ({
      ...prev,
      progress: clampedProgress,
      isComplete: clampedProgress === 100,
      isIndeterminate: false,
    }));

    // Se o progresso atingir 100%, para o auto incremento
    if (clampedProgress === 100 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Incrementa o progresso por uma quantidade específica
   */
  const incrementProgress = useCallback((amount: number = 5) => {
    setState((prev) => {
      const newProgress = Math.min(100, prev.progress + amount);
      return {
        ...prev,
        progress: newProgress,
        isComplete: newProgress === 100,
        isIndeterminate: false,
      };
    });
  }, []);

  /**
   * Define o progresso como indeterminado (barra de progresso animada)
   */
  const setIndeterminate = useCallback((indeterminate: boolean = true) => {
    setState((prev) => ({
      ...prev,
      isIndeterminate: indeterminate,
    }));

    // Para qualquer auto incremento se o progresso for indeterminado
    if (indeterminate && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (!indeterminate && autoIncrement && !intervalRef.current) {
      startAutoIncrement();
    }
  }, [autoIncrement, startAutoIncrement]);

  /**
   * Completa o progresso (100%)
   */
  const complete = useCallback(() => {
    // Para o auto incremento
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      progress: 100,
      isComplete: true,
      isIndeterminate: false,
    }));
  }, []);

  /**
   * Reseta o progresso para o valor inicial
   */
  const reset = useCallback(() => {
    // Para o auto incremento
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState({
      progress: initialProgress,
      isComplete: false,
      isIndeterminate: false,
      step: 1,
      status: '',
    });

    // Reinicia o auto incremento se necessário
    if (autoIncrement) {
      startAutoIncrement();
    }
  }, [autoIncrement, initialProgress, startAutoIncrement]);

  /**
   * Atualiza o passo atual no processo multi-etapas
   */
  const setStep = useCallback((step: number, status: string = '') => {
    const validStep = Math.max(1, Math.min(steps, step));
    const stepProgress = (validStep - 1) * (100 / steps);
    
    setState((prev) => ({
      ...prev,
      step: validStep,
      status,
      progress: Math.max(prev.progress, stepProgress),
    }));
  }, [steps]);

  /**
   * Define o status do progresso atual
   */
  const setStatus = useCallback((status: string) => {
    setState((prev) => ({
      ...prev,
      status,
    }));
  }, []);

  /**
   * Avança para o próximo passo
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextStepNumber = Math.min(steps, prev.step + 1);
      const stepProgress = (nextStepNumber - 1) * (100 / steps);
      
      return {
        ...prev,
        step: nextStepNumber,
        progress: Math.max(prev.progress, stepProgress),
        isComplete: nextStepNumber === steps,
      };
    });
  }, [steps]);

  return {
    ...state,
    setProgress,
    incrementProgress,
    setIndeterminate,
    complete,
    reset,
    setStep,
    nextStep,
    setStatus,
    startAutoIncrement,
    stopAutoIncrement,
  };
};

export default useProgressIndicator; 