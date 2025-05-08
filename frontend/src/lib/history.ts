import { createContext, useContext, useCallback, useReducer } from 'react';

// Tipos para o sistema de histórico
export interface HistoryItem<T = any> {
  id: string;
  timestamp: number;
  data: T;
  description: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface HistoryState<T = any> {
  past: HistoryItem<T>[];
  present: HistoryItem<T> | null;
  future: HistoryItem<T>[];
  maxHistory: number;
}

// Ações do reducer
type HistoryAction<T> =
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem<T> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MAX_HISTORY'; payload: number };

// Estado inicial
const initialState: HistoryState = {
  past: [],
  present: null,
  future: [],
  maxHistory: 50, // Número máximo de itens no histórico
};

// Reducer para gerenciar o estado do histórico
function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'ADD_HISTORY_ITEM': {
      const { past, present, maxHistory } = state;
      const newPresent = action.payload;
      
      // Se já tiver um estado atual, adicione-o ao passado
      const newPast = present 
        ? [...past, present].slice(-maxHistory) // Limita ao tamanho máximo
        : past;
      
      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: [], // Limpa o futuro ao adicionar nova ação
      };
    }

    case 'UNDO': {
      const { past, present, future } = state;
      
      // Nada para desfazer
      if (past.length === 0) return state;
      
      // Pega o último item do passado
      const newPresent = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      // Adiciona o presente atual ao futuro
      const newFuture = present ? [present, ...future] : future;
      
      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    }

    case 'REDO': {
      const { past, present, future } = state;
      
      // Nada para refazer
      if (future.length === 0) return state;
      
      // Pega o primeiro item do futuro
      const newPresent = future[0];
      const newFuture = future.slice(1);
      
      // Adiciona o presente atual ao passado
      const newPast = present ? [...past, present] : past;
      
      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        past: [],
        future: [],
      };
    }

    case 'SET_MAX_HISTORY': {
      const maxHistory = action.payload;
      const { past } = state;
      
      // Ajustar o histórico passado para respeitar o novo limite
      const newPast = past.slice(-maxHistory);
      
      return {
        ...state,
        past: newPast,
        maxHistory,
      };
    }

    default:
      return state;
  }
}

// Hook para usar o sistema de histórico
export function useHistory<T>(initialPresent?: HistoryItem<T>, customMaxHistory?: number) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    ...initialState,
    present: initialPresent || null,
    maxHistory: customMaxHistory || initialState.maxHistory,
  });

  // Adicionar um item ao histórico
  const addHistoryItem = useCallback((item: HistoryItem<T>) => {
    dispatch({ type: 'ADD_HISTORY_ITEM', payload: item });
  }, []);

  // Desfazer a última ação
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  // Refazer a última ação desfeita
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  // Limpar o histórico
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  // Definir o tamanho máximo do histórico
  const setMaxHistory = useCallback((max: number) => {
    dispatch({ type: 'SET_MAX_HISTORY', payload: max });
  }, []);

  // Verificar se pode desfazer/refazer
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    historyState: state,
    addHistoryItem,
    undo,
    redo,
    clearHistory,
    setMaxHistory,
    canUndo,
    canRedo,
  };
}

// Factory para criar itens de histórico
export function createHistoryItem<T>(
  type: string,
  data: T,
  description: string,
  metadata?: Record<string, any>
): HistoryItem<T> {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    data,
    description,
    type,
    metadata,
  };
}

// Tipos de operações comuns para o histórico
export const HistoryOperationTypes = {
  DOCUMENT_EDIT: 'DOCUMENT_EDIT',
  FILE_CREATE: 'FILE_CREATE',
  FILE_DELETE: 'FILE_DELETE',
  FILE_RENAME: 'FILE_RENAME',
  FILE_MOVE: 'FILE_MOVE',
  REFACTOR: 'REFACTOR',
  FORMAT: 'FORMAT',
  SELECTION_CHANGE: 'SELECTION_CHANGE',
};

// Contexto para compartilhar o histórico na aplicação
export const HistoryContext = createContext<ReturnType<typeof useHistory> | null>(null);

// Hook para acessar o contexto do histórico
export function useHistoryContext<T>() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistoryContext deve ser usado dentro de um HistoryProvider');
  }
  return context as ReturnType<typeof useHistory<T>>;
}

// Componente auxiliar para logar alterações no histórico
export function logHistory(operation: string, data: any, description: string) {
  console.log(`[History] ${operation}: ${description}`, data);
} 