/**
 * @deprecated Este arquivo é mantido apenas para compatibilidade.
 * Novos componentes devem importar diretamente dos subcontextos em context/ui/
 */

import React, { ReactNode } from 'react';
import { 
  useUIContext, 
  useUIState as useUIStateBase, 
  useSidebar, 
  useEditor, 
  usePanel,
  UIContextState,
  SidebarUIState,
  EditorUIState,
  PanelUIState,
  PanelId,
  BottomPanelId,
  ViewMode,
  LayoutDirection,
  OpenTab
} from './ui';

// Tipos exportados para compatibilidade com o código existente
export type { 
  PanelId, 
  BottomPanelId, 
  ViewMode, 
  LayoutDirection, 
  OpenTab,
  TabContentType 
} from './ui/EditorUIContext';

// Interface que combina todas as propriedades originais do UIState
export interface UIState {
  sidebar: SidebarUIState;
  bottomPanel: PanelUIState['bottomPanel'];
  editor: EditorUIState;
  statusBar: PanelUIState['statusBar'];
  modal: PanelUIState['modal'];
  dialogs: PanelUIState['dialogs'];
}

// Extrair estado atual dos subcontextos
const extractFullUIState = (state: UIContextState): UIState => {
  return {
    sidebar: state.sidebar,
    bottomPanel: state.panel.bottomPanel,
    editor: state.editor,
    statusBar: state.panel.statusBar,
    modal: state.panel.modal,
    dialogs: state.panel.dialogs
  };
};

// Interface para compatibilidade com código que usa o UIContextType antigo
export interface UIContextType {
  state: UIState;
  
  // Métodos do Sidebar
  toggleSidebar: (visible?: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setActiveSidebarPanel: (panelId: PanelId) => void;
  togglePanelVisibility: (panelId: PanelId, visible?: boolean) => void;
  
  // Métodos do BottomPanel
  toggleBottomPanel: (visible?: boolean) => void;
  setBottomPanelHeight: (height: number) => void;
  setActiveBottomPanel: (panelId: BottomPanelId) => void;
  toggleBottomPanelVisibility: (panelId: BottomPanelId, visible?: boolean) => void;
  
  // Métodos do Editor
  setEditorLayoutDirection: (direction: LayoutDirection) => void;
  setEditorSplitSizes: (sizes: number[]) => void;
  setEditorViewMode: (mode: ViewMode) => void;
  toggleMinimap: (visible?: boolean) => void;
  toggleBreadcrumbs: (visible?: boolean) => void;
  setEditorZoom: (zoom: number) => void;
  openTab: (tab: OpenTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  updateTab: (tabUpdate: Partial<OpenTab> & { id: string }) => void;
  
  // Métodos dos Panels
  toggleStatusBar: (visible?: boolean) => void;
  showModal: (id: string, props?: Record<string, any>) => void;
  hideModal: () => void;
  toggleDialog: (id: keyof PanelUIState['dialogs'], visible?: boolean) => void;
  
  // Método para resetar todo o layout
  resetLayout: () => void;
}

/**
 * @deprecated Use os hooks específicos de cada contexto UI (useSidebar, useEditor, usePanel)
 * Hook de compatibilidade que expõe a mesma interface do useUIState original
 */
export const useUIState = (): UIContextType => {
  const { sidebarUI, editorUI, panelUI } = useUIContext();
  const fullState = useUIStateBase();
  const uiState = extractFullUIState(fullState);
  
  return {
    state: uiState,
    
    // Métodos do Sidebar
    toggleSidebar: sidebarUI.toggleSidebar,
    setSidebarWidth: sidebarUI.setSidebarWidth,
    setActiveSidebarPanel: sidebarUI.setActivePanel,
    togglePanelVisibility: sidebarUI.togglePanelVisibility,
    
    // Métodos do BottomPanel
    toggleBottomPanel: panelUI.toggleBottomPanel,
    setBottomPanelHeight: panelUI.setBottomPanelHeight,
    setActiveBottomPanel: panelUI.setActiveBottomPanel,
    toggleBottomPanelVisibility: panelUI.toggleBottomPanelVisibility,
    
    // Métodos do Editor
    setEditorLayoutDirection: editorUI.setLayoutDirection,
    setEditorSplitSizes: editorUI.setSplitSizes,
    setEditorViewMode: editorUI.setViewMode,
    toggleMinimap: editorUI.toggleMinimap,
    toggleBreadcrumbs: editorUI.toggleBreadcrumbs,
    setEditorZoom: editorUI.setZoom,
    openTab: editorUI.openTab,
    closeTab: editorUI.closeTab,
    setActiveTab: editorUI.setActiveTab,
    updateTab: editorUI.updateTab,
    
    // Métodos dos Panels
    toggleStatusBar: panelUI.toggleStatusBar,
    showModal: panelUI.showModal,
    hideModal: panelUI.hideModal,
    toggleDialog: panelUI.toggleDialog,
    
    // Método para resetar todo o layout
    resetLayout: () => {
      sidebarUI.resetSidebar();
      editorUI.resetEditor();
      panelUI.resetPanels();
    }
  };
};

/**
 * @deprecated Use o UIContextManager ao invés deste provider
 * Provider de compatibilidade que apenas repassa para o UIContextManager
 */
export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Este provider é apenas um wrapper para manter compatibilidade
  // Na verdade, o UIContextManager é que deve ser usado
  return <>{children}</>;
};

// Re-export dos hooks especializados para facilitar migração gradual
export { useSidebar, useEditor, usePanel, useUIStateBase as useUIStateRaw }; 