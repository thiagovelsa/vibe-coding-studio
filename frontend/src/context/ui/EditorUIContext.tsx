import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Tipo básico para o Editor
export interface EditorUIState {
  activeFileId: string | null;
  isFullScreen: boolean;
  fontSize: number;
  wordWrap: boolean;
}

// Interface para o contexto
interface EditorUIContextType {
  state: EditorUIState;
  setActiveFileId: (id: string | null) => void;
  toggleFullScreen: () => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  resetEditor: () => void;
}

// Criar o contexto
const EditorUIContext = createContext<EditorUIContextType | undefined>(undefined);

// Estado inicial
const initialState: EditorUIState = {
  activeFileId: null,
  isFullScreen: false,
  fontSize: 14,
  wordWrap: true
};

// Provider component
export const EditorUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EditorUIState>(initialState);

  // Funções para manipular o estado
  const setActiveFileId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeFileId: id }));
  }, []);

  const toggleFullScreen = useCallback(() => {
    setState(prev => ({ ...prev, isFullScreen: !prev.isFullScreen }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, fontSize: Math.max(8, Math.min(32, size)) }));
  }, []);

  const toggleWordWrap = useCallback(() => {
    setState(prev => ({ ...prev, wordWrap: !prev.wordWrap }));
  }, []);

  const resetEditor = useCallback(() => {
    setState(initialState);
  }, []);

  // Valor do contexto
  const value = {
    state,
    setActiveFileId,
    toggleFullScreen,
    setFontSize,
    toggleWordWrap,
    resetEditor
  };

  return (
    <EditorUIContext.Provider value={value}>
      {children}
    </EditorUIContext.Provider>
  );
};

// Hook para usar o contexto
export const useEditorUIContext = () => {
  const context = useContext(EditorUIContext);
  if (context === undefined) {
    throw new Error('useEditorUIContext deve ser usado dentro de um EditorUIProvider');
  }
  return context;
};

// Alias para compatibilidade com código existente
export { useEditorUIContext as useEditorUI }; 