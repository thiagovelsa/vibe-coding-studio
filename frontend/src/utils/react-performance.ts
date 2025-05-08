/**
 * Utilitários para otimização de performance em componentes React
 * Fornece funções auxiliares para trabalhar com memoização e comparações profundas
 */

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { isEqual } from 'lodash-es'; // Assumindo que lodash ou lodash-es está instalado

/**
 * Hook para armazenar o valor anterior de uma variável
 * @param value O valor atual
 * @returns O valor anterior
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Hook que evita atualizações de estado desnecessárias
 * comparando profundamente os valores antes de atualizar
 * @param initialState Valor inicial do estado
 * @returns [state, setState] similar ao useState padrão
 */
export function useDeepState<T>(initialState: T | (() => T)): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  
  const deepSetState = useCallback((value: T | ((prevState: T) => T)) => {
    setState(prevState => {
      const nextValue = typeof value === 'function' 
        ? (value as (prevState: T) => T)(prevState) 
        : value;
      
      return isEqual(prevState, nextValue) ? prevState : nextValue;
    });
  }, []);
  
  return [state, deepSetState];
}

/**
 * Hook similar ao useMemo, mas com comparação profunda de dependências
 * Útil quando as dependências são objetos complexos que podem mudar
 * mas mantêm os mesmos valores semânticos
 * @param factory Função que calcula o valor
 * @param deps Array de dependências
 * @returns Valor memoizado que só é recalculado quando as deps mudam semanticamente
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();
  
  return useMemo(() => {
    // Primeira execução ou deps mudaram profundamente
    if (!ref.current || !isEqual(deps, ref.current.deps)) {
      const value = factory();
      ref.current = { deps, value };
      return value;
    }
    
    return ref.current.value;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook similar ao useCallback, mas com comparação profunda de dependências
 * @param callback Função de callback a ser memoizada
 * @param deps Array de dependências
 * @returns Callback memoizado
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T, 
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useDeepMemo(() => callback, deps);
}

/**
 * Hook que executa uma função apenas uma vez ao carregar o componente,
 * mesmo em Strict Mode / React 18+
 * @param fn Função a ser executada
 */
export function useEffectOnce(fn: () => void | (() => void)) {
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return fn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Hook que força uma re-renderização do componente quando chamado
 * @returns Função para forçar a re-renderização
 */
export function useForceUpdate(): () => void {
  const [, setState] = useState<number>(0);
  return useCallback(() => setState(prev => prev + 1), []);
}

/**
 * Hook para agrupar atualizações de estado e executá-las em batch
 * @returns [state, setState, flushChanges] onde flushChanges aplica todas as mudanças pendentes
 */
export function useBatchState<T>(initialState: T): [
  T, 
  (updates: Partial<T>) => void, 
  () => void
] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  
  const updateState = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
  }, []);
  
  const flushChanges = useCallback(() => {
    if (Object.keys(pendingUpdates.current).length > 0) {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }
  }, []);
  
  return [state, updateState, flushChanges];
} 