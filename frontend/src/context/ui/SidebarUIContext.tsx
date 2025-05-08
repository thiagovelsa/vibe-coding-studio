import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Tipos para o estado da Sidebar
export type SidebarTab = 'explorer' | 'agents' | 'settings' | 'search';

export interface SidebarUIState {
  isOpen: boolean;
  activeTab: SidebarTab;
  width: number;
  isResizing: boolean;
  isExpanded: boolean;
}

// Contexto para o estado da Sidebar
const SidebarUIContext = createContext<{
  state: SidebarUIState;
  toggleSidebar: () => void;
  setActiveTab: (tab: SidebarTab) => void;
  setWidth: (width: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  resetSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
} | undefined>(undefined);

// Propriedades do Provider
interface SidebarUIProviderProps {
  children: ReactNode;
  initialState?: Partial<SidebarUIState>;
}

// Estado inicial
const defaultState: SidebarUIState = {
  isOpen: true,
  activeTab: 'explorer',
  width: 280,
  isResizing: false,
  isExpanded: false
};

// Provider para o estado da Sidebar
export const SidebarUIProvider: React.FC<SidebarUIProviderProps> = ({ 
  children, 
  initialState = {} 
}) => {
  // Merge do estado inicial com o padrão
  const [state, setState] = useState<SidebarUIState>({
    ...defaultState,
    ...initialState
  });

  // Toggle para abrir/fechar sidebar
  const toggleSidebar = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isOpen: !prevState.isOpen
    }));
  }, []);

  // Define a aba ativa
  const setActiveTab = useCallback((tab: SidebarTab) => {
    setState(prevState => ({
      ...prevState,
      activeTab: tab,
      isOpen: true // Sempre abre quando muda de aba
    }));
  }, []);

  // Define a largura
  const setWidth = useCallback((width: number) => {
    setState(prevState => ({
      ...prevState,
      width: Math.max(200, Math.min(500, width)) // Limita entre 200 e 500px
    }));
  }, []);

  // Define o estado de redimensionamento
  const setIsResizing = useCallback((isResizing: boolean) => {
    setState(prevState => ({
      ...prevState,
      isResizing
    }));
  }, []);

  // Expande a sidebar
  const expandSidebar = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isExpanded: true,
      width: 400 // Valor expandido padrão
    }));
  }, []);

  // Colapsa a sidebar
  const collapseSidebar = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isExpanded: false,
      width: 280 // Largura padrão
    }));
  }, []);

  // Reset para o estado inicial
  const resetSidebar = useCallback(() => {
    setState(defaultState);
  }, []);

  // Valor do contexto
  const contextValue = {
    state,
    toggleSidebar,
    setActiveTab,
    setWidth,
    setIsResizing,
    resetSidebar,
    expandSidebar,
    collapseSidebar
  };

  return (
    <SidebarUIContext.Provider value={contextValue}>
      {children}
    </SidebarUIContext.Provider>
  );
};

// Hook para usar o contexto
export const useSidebarContext = () => {
  const context = useContext(SidebarUIContext);
  if (context === undefined) {
    throw new Error('useSidebarContext deve ser usado dentro de um SidebarUIProvider');
  }
  return context;
};

// Para manter compatibilidade com código existente
export { useSidebarContext as useSidebarUI }; 