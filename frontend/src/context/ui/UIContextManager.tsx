import React, { ReactNode, createContext, useContext } from 'react';
import { SidebarUIProvider, useSidebarContext } from './SidebarUIContext';
import { EditorUIProvider, useEditorUIContext } from './EditorUIContext';
import { PanelUIProvider, usePanelUIContext } from './PanelUIContext';
import { useContext as useReactContext } from 'react';
import { useUIState as useUIStateFromContext } from '../UIStateContext';

/**
 * Contexto centralizador para estados de UI
 * Permite agregar estado de múltiplos contextos de UI de forma conveniente
 */

// Tipo para o contexto UI principal
interface UIContextType {
  // Placeholder para futuras propriedades comuns a toda UI
  initialized: boolean;
}

// Contexto UI principal
const UIContext = createContext<UIContextType | undefined>(undefined);

// Props para o provider
interface UIContextManagerProps {
  children: ReactNode;
}

/**
 * Provider principal para todos os contextos de UI
 * Agrupa SidebarUIProvider, EditorUIProvider e PanelUIProvider
 */
export const UIContextManager: React.FC<UIContextManagerProps> = ({ children }) => {
  return (
    <UIContext.Provider value={{ initialized: true }}>
      <SidebarUIProvider>
        <EditorUIProvider>
          <PanelUIProvider>
            {children}
          </PanelUIProvider>
        </EditorUIProvider>
      </SidebarUIProvider>
    </UIContext.Provider>
  );
};

/**
 * Hook para acessar o contexto UIContext
 */
export const useUIContext = () => {
  const context = useReactContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext deve ser usado dentro de um UIContextManager');
  }
  return context;
};

/**
 * Alias para useSidebarContext para manter compatibilidade com código existente
 */
export const useSidebar = useSidebarContext;

/**
 * Hooks combinados para acesso conveniente a todos os estados de UI
 * Reúne contextos de sidebar, editor e painéis
 */
export const useCombinedUIState = () => {
  // Contexto principal de UI
  const uiContext = useUIContext();
  
  // Contextos específicos
  const sidebarState = useSidebarContext();
  const editorState = useEditorUIContext();
  const panelState = usePanelUIContext();
  
  return {
    ...uiContext,
    sidebar: sidebarState,
    editor: editorState,
    panel: panelState,
  };
}; 