import React, { createContext, useContext, ReactNode } from 'react';
import { useHistory, HistoryItem, HistoryContext as HistoryContextType } from '../lib/history';

interface HistoryProviderProps {
  children: ReactNode;
  maxHistory?: number;
  initialPresent?: HistoryItem;
}

/**
 * Provider para compartilhar o sistema de histórico na aplicação
 */
export const HistoryProvider: React.FC<HistoryProviderProps> = ({
  children,
  maxHistory,
  initialPresent
}) => {
  // Inicializar o hook de histórico
  const historyManager = useHistory(initialPresent, maxHistory);
  
  return (
    <HistoryContextType.Provider value={historyManager}>
      {children}
    </HistoryContextType.Provider>
  );
};

/**
 * Hook simplificado para ações comuns do histórico
 */
export function useHistoryActions() {
  const {
    historyState,
    addHistoryItem,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  } = useContext(HistoryContextType);
  
  // Verificar se o histórico está vazio
  const isEmpty = historyState.past.length === 0 && !historyState.present;
  
  // Obter o item atual do histórico
  const currentItem = historyState.present;
  
  // Quantidade total de itens no histórico
  const totalItems = historyState.past.length + (historyState.present ? 1 : 0) + historyState.future.length;
  
  return {
    // Estado
    isEmpty,
    currentItem,
    totalItems,
    canUndo,
    canRedo,
    
    // Ações
    undo,
    redo,
    clearHistory,
    addHistoryItem
  };
} 