import { useContext } from 'react';
import { 
  UIStateContext, 
  PanelId, 
  BottomPanelId, 
  ViewMode, 
  LayoutDirection 
} from '../context/UIStateContext';

/**
 * Hook para acessar as funcionalidades de gerenciamento de estado da UI
 * @returns Funções e estado para controlar a interface do usuário
 */
export function useUIState() {
  const context = useContext(UIStateContext);
  
  if (context === undefined) {
    throw new Error('useUIState deve ser usado dentro de um UIStateProvider');
  }
  
  return context;
}

/**
 * Hook para gerenciar a barra lateral e seus painéis
 * @returns Funções e estado para controlar a barra lateral
 */
export function useSidebar() {
  const { 
    state, 
    toggleSidebar, 
    setSidebarWidth, 
    setActiveSidebarPanel, 
    togglePanelVisibility 
  } = useUIState();
  
  const { sidebar } = state;
  
  return {
    visible: sidebar.visible,
    width: sidebar.width,
    activePanel: sidebar.activePanel,
    panels: sidebar.panels,
    
    toggleSidebar,
    setSidebarWidth,
    setActivePanel: setActiveSidebarPanel,
    togglePanelVisibility,
    
    isPanelActive: (panelId: PanelId) => sidebar.activePanel === panelId,
    isPanelVisible: (panelId: PanelId) => {
      const panel = sidebar.panels.find(p => p.id === panelId);
      return panel ? panel.visible : false;
    },
    
    showPanel: (panelId: PanelId) => {
      togglePanelVisibility(panelId, true);
      setActiveSidebarPanel(panelId);
      if (!sidebar.visible) {
        toggleSidebar(true);
      }
    },
    
    hidePanel: (panelId: PanelId) => {
      togglePanelVisibility(panelId, false);
    },
  };
}

/**
 * Hook para gerenciar o painel inferior
 * @returns Funções e estado para controlar o painel inferior
 */
export function useBottomPanel() {
  const { 
    state, 
    toggleBottomPanel, 
    setBottomPanelHeight, 
    setActiveBottomPanel, 
    toggleBottomPanelVisibility 
  } = useUIState();
  
  const { bottomPanel } = state;
  
  return {
    visible: bottomPanel.visible,
    height: bottomPanel.height,
    activePanel: bottomPanel.activePanel,
    panels: bottomPanel.panels,
    
    togglePanel: toggleBottomPanel,
    setHeight: setBottomPanelHeight,
    setActivePanel: setActiveBottomPanel,
    togglePanelVisibility: toggleBottomPanelVisibility,
    
    isPanelActive: (panelId: BottomPanelId) => bottomPanel.activePanel === panelId,
    isPanelVisible: (panelId: BottomPanelId) => {
      const panel = bottomPanel.panels.find(p => p.id === panelId);
      return panel ? panel.visible : false;
    },
    
    showPanel: (panelId: BottomPanelId) => {
      toggleBottomPanelVisibility(panelId, true);
      setActiveBottomPanel(panelId);
      if (!bottomPanel.visible) {
        toggleBottomPanel(true);
      }
    },
    
    hidePanel: (panelId: BottomPanelId) => {
      toggleBottomPanelVisibility(panelId, false);
    },
  };
}

/**
 * Hook para gerenciar o layout do editor
 * @returns Funções e estado para controlar o editor
 */
export function useEditor() {
  const { 
    state, 
    setEditorLayoutDirection, 
    setEditorSplitSizes, 
    setEditorViewMode, 
    toggleMinimap, 
    toggleBreadcrumbs, 
    setEditorZoom 
  } = useUIState();
  
  const { editor } = state;
  
  return {
    layout: editor.layout,
    viewMode: editor.viewMode,
    showMinimap: editor.showMinimap,
    showBreadcrumbs: editor.showBreadcrumbs,
    zoom: editor.zoom,
    
    setLayoutDirection: setEditorLayoutDirection,
    setSplitSizes: setEditorSplitSizes,
    setViewMode: setEditorViewMode,
    toggleMinimap,
    toggleBreadcrumbs,
    setZoom: setEditorZoom,
    
    // Funções de conveniência
    toggleLayoutDirection: () => {
      const newDirection: LayoutDirection = 
        editor.layout.direction === 'horizontal' ? 'vertical' : 'horizontal';
      setEditorLayoutDirection(newDirection);
    },
    
    toggleZenMode: () => {
      const newMode: ViewMode = 
        editor.viewMode === 'zen' ? 'default' : 'zen';
      setEditorViewMode(newMode);
    },
    
    isZenMode: () => editor.viewMode === 'zen',
    isDefaultMode: () => editor.viewMode === 'default',
    isPresentationMode: () => editor.viewMode === 'presentation',
  };
}

/**
 * Hook para gerenciar modais e diálogos
 * @returns Funções e estado para controlar modais e diálogos
 */
export function useModals() {
  const { state, showModal, hideModal, toggleDialog } = useUIState();
  
  const { modal, dialogs } = state;
  
  return {
    activeModal: modal.active,
    modalProps: modal.props,
    dialogs,
    
    showModal,
    hideModal,
    toggleDialog,
    
    isModalActive: (id: string) => modal.active === id,
    isDialogOpen: (id: keyof typeof dialogs) => dialogs[id],
    
    openDialog: (id: keyof typeof dialogs) => toggleDialog(id, true),
    closeDialog: (id: keyof typeof dialogs) => toggleDialog(id, false),
  };
} 