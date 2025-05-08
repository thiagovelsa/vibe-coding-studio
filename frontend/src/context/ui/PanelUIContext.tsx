import React, { createContext, useReducer, useCallback, ReactNode, useContext, useEffect, useState } from 'react';

// Types
export type BottomPanelId = 'terminal' | 'problems' | 'output' | 'debug' | 'ai-debug';

export interface BottomPanelState {
  id: BottomPanelId;
  visible: boolean;
  active: boolean;
  size?: number;
}

export type PanelPosition = 'left' | 'right' | 'bottom' | 'top';
export type PanelType = 'terminal' | 'problems' | 'output' | 'debug' | 'files' | 'editor';

export interface PanelState {
  id: string;
  type: PanelType;
  title: string;
  isVisible: boolean;
  isActive: boolean;
  position: PanelPosition;
}

export interface DialogsState {
  commandPalette: boolean;
  quickOpen: boolean;
  findInFiles: boolean;
}

export interface ModalState {
  active: string | null;
  props: Record<string, any> | null;
}

export interface PanelUIState {
  bottomPanel: {
    visible: boolean;
    height: number;
    activePanel: BottomPanelId;
    panels: BottomPanelState[];
  };
  statusBar: {
    visible: boolean;
    items: string[];
  };
  modal: ModalState;
  dialogs: DialogsState;
  panels: PanelState[];
  activePanelId: string | null;
  isPanelAreaVisible: boolean;
  bottomPanelHeight: number;
  rightPanelWidth: number;
  leftPanelWidth: number;
}

// Action types
type PanelUIAction =
  | { type: 'TOGGLE_BOTTOM_PANEL'; payload?: boolean }
  | { type: 'SET_BOTTOM_PANEL_HEIGHT'; payload: number }
  | { type: 'SET_ACTIVE_BOTTOM_PANEL'; payload: BottomPanelId }
  | { type: 'TOGGLE_BOTTOM_PANEL_VISIBILITY'; payload: { id: BottomPanelId; visible?: boolean } }
  | { type: 'TOGGLE_STATUS_BAR'; payload?: boolean }
  | { type: 'SHOW_MODAL'; payload: { id: string; props?: Record<string, any> } }
  | { type: 'HIDE_MODAL' }
  | { type: 'TOGGLE_DIALOG'; payload: { id: keyof DialogsState; visible?: boolean } }
  | { type: 'RESET_PANELS' };

// Initial state
const initialPanelUIState: PanelUIState = {
  bottomPanel: {
    visible: false,
    height: 300,
    activePanel: 'terminal',
    panels: [
      { id: 'terminal', visible: true, active: true },
      { id: 'problems', visible: true, active: false },
      { id: 'output', visible: true, active: false },
      { id: 'debug', visible: true, active: false },
      { id: 'ai-debug', visible: true, active: false },
    ],
  },
  statusBar: {
    visible: true,
    items: ['fileInfo', 'gitInfo', 'lineCol', 'encoding', 'eol', 'syntaxInfo'],
  },
  modal: {
    active: null,
    props: null,
  },
  dialogs: {
    commandPalette: false,
    quickOpen: false,
    findInFiles: false,
  },
  panels: [
    { id: 'terminal', type: 'terminal', title: 'Terminal', isVisible: true, isActive: true, position: 'bottom' },
    { id: 'problems', type: 'problems', title: 'Problemas', isVisible: true, isActive: false, position: 'bottom' },
    { id: 'output', type: 'output', title: 'Saída', isVisible: true, isActive: false, position: 'bottom' },
    { id: 'debug', type: 'debug', title: 'Debug', isVisible: true, isActive: false, position: 'bottom' },
  ],
  activePanelId: 'terminal',
  isPanelAreaVisible: true,
  bottomPanelHeight: 250,
  rightPanelWidth: 300,
  leftPanelWidth: 280
};

// Reducer function
const panelUIReducer = (state: PanelUIState, action: PanelUIAction): PanelUIState => {
  switch (action.type) {
    case 'TOGGLE_BOTTOM_PANEL':
      return {
        ...state,
        bottomPanel: {
          ...state.bottomPanel,
          visible: action.payload !== undefined ? action.payload : !state.bottomPanel.visible,
        },
      };

    case 'SET_BOTTOM_PANEL_HEIGHT':
      return {
        ...state,
        bottomPanel: {
          ...state.bottomPanel,
          height: action.payload,
        },
      };

    case 'SET_ACTIVE_BOTTOM_PANEL':
      return {
        ...state,
        bottomPanel: {
          ...state.bottomPanel,
          activePanel: action.payload,
          panels: state.bottomPanel.panels.map(panel => ({
            ...panel,
            active: panel.id === action.payload,
          })),
        },
      };

    case 'TOGGLE_BOTTOM_PANEL_VISIBILITY':
      return {
        ...state,
        bottomPanel: {
          ...state.bottomPanel,
          panels: state.bottomPanel.panels.map(panel =>
            panel.id === action.payload.id
              ? {
                  ...panel,
                  visible: action.payload.visible !== undefined ? action.payload.visible : !panel.visible,
                  active: action.payload.visible !== false && (panel.active || state.bottomPanel.panels.filter(p => p.visible).length === 1),
                }
              : panel
          ),
        },
      };

    case 'TOGGLE_STATUS_BAR':
      return {
        ...state,
        statusBar: {
          ...state.statusBar,
          visible: action.payload !== undefined ? action.payload : !state.statusBar.visible,
        },
      };

    case 'SHOW_MODAL':
      return {
        ...state,
        modal: {
          active: action.payload.id,
          props: action.payload.props || null,
        },
      };

    case 'HIDE_MODAL':
      return {
        ...state,
        modal: {
          active: null,
          props: null,
        },
      };

    case 'TOGGLE_DIALOG': {
      const { id, visible } = action.payload;
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          [id]: visible !== undefined ? visible : !state.dialogs[id],
        },
      };
    }

    case 'RESET_PANELS':
      return initialPanelUIState;

    default:
      return state;
  }
};

// Context interface
interface PanelUIContextProps {
  state: PanelUIState;
  toggleBottomPanel: (visible?: boolean) => void;
  setBottomPanelHeight: (height: number) => void;
  setActiveBottomPanel: (panelId: BottomPanelId) => void;
  toggleBottomPanelVisibility: (panelId: BottomPanelId, visible?: boolean) => void;
  toggleStatusBar: (visible?: boolean) => void;
  showModal: (id: string, props?: Record<string, any>) => void;
  hideModal: () => void;
  toggleDialog: (id: keyof DialogsState, visible?: boolean) => void;
  resetPanels: () => void;
  togglePanelVisibility: (id: string) => void;
  togglePanelAreaVisibility: () => void;
  setActivePanel: (id: string) => void;
  resizeBottomPanel: (height: number) => void;
  resizeRightPanel: (width: number) => void;
  resizeLeftPanel: (width: number) => void;
}

// Create context
const PanelUIContext = createContext<PanelUIContextProps | undefined>(undefined);

// Persistência local
const STORAGE_KEY = 'panel_ui_state';

const loadState = (): Partial<PanelUIState> => {
  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      return JSON.parse(storedState);
    }
  } catch (error) {
    console.error('Error loading panel UI state:', error);
  }
  return {};
};

const persistState = (state: PanelUIState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bottomPanel: {
        height: state.bottomPanel.height,
        visible: state.bottomPanel.visible,
        // Não salvamos o painel ativo ou visibilidade específica dos painéis
      },
      statusBar: state.statusBar,
      // Não salvamos modal ou dialogs (são transitórios)
    }));
  } catch (error) {
    console.error('Error persisting panel UI state:', error);
  }
};

// Provider component
export const PanelUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializar com estado salvo localmente combinado com o inicial
  const savedState = loadState();
  const mergedInitialState = {
    ...initialPanelUIState,
    bottomPanel: {
      ...initialPanelUIState.bottomPanel,
      ...(savedState.bottomPanel || {}),
    },
    statusBar: {
      ...initialPanelUIState.statusBar,
      ...(savedState.statusBar || {}),
    },
  };
  
  const [state, dispatch] = useReducer(panelUIReducer, mergedInitialState);

  // Persistir mudanças de estado
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Action dispatchers
  const toggleBottomPanel = useCallback((visible?: boolean) => {
    dispatch({ type: 'TOGGLE_BOTTOM_PANEL', payload: visible });
  }, []);

  const setBottomPanelHeight = useCallback((height: number) => {
    dispatch({ type: 'SET_BOTTOM_PANEL_HEIGHT', payload: height });
  }, []);

  const setActiveBottomPanel = useCallback((panelId: BottomPanelId) => {
    dispatch({ type: 'SET_ACTIVE_BOTTOM_PANEL', payload: panelId });
  }, []);

  const toggleBottomPanelVisibility = useCallback((panelId: BottomPanelId, visible?: boolean) => {
    dispatch({ type: 'TOGGLE_BOTTOM_PANEL_VISIBILITY', payload: { id: panelId, visible } });
  }, []);

  const toggleStatusBar = useCallback((visible?: boolean) => {
    dispatch({ type: 'TOGGLE_STATUS_BAR', payload: visible });
  }, []);

  const showModal = useCallback((id: string, props?: Record<string, any>) => {
    dispatch({ type: 'SHOW_MODAL', payload: { id, props } });
  }, []);

  const hideModal = useCallback(() => {
    dispatch({ type: 'HIDE_MODAL' });
  }, []);

  const toggleDialog = useCallback((id: keyof DialogsState, visible?: boolean) => {
    dispatch({ type: 'TOGGLE_DIALOG', payload: { id, visible } });
  }, []);

  const resetPanels = useCallback(() => {
    dispatch({ type: 'RESET_PANELS' });
  }, []);

  // Toggle visibilidade de um painel específico
  const togglePanelVisibility = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_BOTTOM_PANEL_VISIBILITY', payload: { id, visible: !state.panels.find(p => p.id === id)?.isVisible } });
  }, [state.panels]);

  // Toggle visibilidade de todos os painéis
  const togglePanelAreaVisibility = useCallback(() => {
    dispatch({ type: 'TOGGLE_BOTTOM_PANEL', payload: !state.bottomPanel.visible });
  }, [state.bottomPanel.visible]);

  // Define o painel ativo
  const setActivePanel = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_BOTTOM_PANEL', payload: id as BottomPanelId });
  }, []);

  // Redimensionar o painel inferior
  const resizeBottomPanel = useCallback((height: number) => {
    dispatch({ type: 'SET_BOTTOM_PANEL_HEIGHT', payload: Math.max(100, Math.min(500, height)) });
  }, []);

  // Redimensionar o painel direito
  const resizeRightPanel = useCallback((width: number) => {
    dispatch({ type: 'SET_BOTTOM_PANEL_HEIGHT', payload: Math.max(200, Math.min(800, width)) });
  }, []);

  // Redimensionar o painel esquerdo
  const resizeLeftPanel = useCallback((width: number) => {
    dispatch({ type: 'SET_BOTTOM_PANEL_HEIGHT', payload: Math.max(200, Math.min(600, width)) });
  }, []);

  // Context value
  const contextValue: PanelUIContextProps = {
    state,
    toggleBottomPanel,
    setBottomPanelHeight,
    setActiveBottomPanel,
    toggleBottomPanelVisibility,
    toggleStatusBar,
    showModal,
    hideModal,
    toggleDialog,
    resetPanels,
    togglePanelVisibility,
    togglePanelAreaVisibility,
    setActivePanel,
    resizeBottomPanel,
    resizeRightPanel,
    resizeLeftPanel,
  };

  return <PanelUIContext.Provider value={contextValue}>{children}</PanelUIContext.Provider>;
};

// Custom hook
export const usePanelUI = (): PanelUIContextProps => {
  const context = useContext(PanelUIContext);
  if (!context) {
    throw new Error('usePanelUI must be used within a PanelUIProvider');
  }
  return context;
};

// Export the same hook as usePanelUIContext for consistency with naming conventions
export const usePanelUIContext = usePanelUI; 