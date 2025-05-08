// Exportação dos módulos de UI Context

// Contexto gerenciador principal
export { 
  UIContextManager, 
  useUIContext, 
  useCombinedUIState,
  useSidebar
} from './UIContextManager';

// Sidebar Context
export {
  SidebarUIProvider,
  useSidebarContext,
  useSidebarUI,
  type SidebarTab,
  type SidebarUIState
} from './SidebarUIContext';

// Editor Context
export {
  EditorUIProvider,
  useEditorUIContext,
  useEditorUI,
  type EditorUIState
} from './EditorUIContext';

// Panel Context
export {
  PanelUIProvider,
  usePanelUIContext,
  usePanelUI,
  type PanelPosition,
  type PanelType,
  type PanelState,
  type PanelUIState
} from './PanelUIContext'; 