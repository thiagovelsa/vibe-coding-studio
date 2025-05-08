import React, { useEffect, useState, useCallback } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { useTheme } from '../../context/ThemeProvider'; // Ajuste o caminho
import { ActivityBar } from './ActivityBar'; // Importe o componente real
import { Sidebar } from './sidebar/Sidebar'; // Corrigido o caminho
import MainContentArea from './MainContentArea'; // <<< Importar MainContentArea
import { BottomPanel } from './BottomPanel'; // <<< Importar BottomPanel
import { StatusBar } from './StatusBar'; // <<< Importar StatusBar
import { AnimatedDiv } from '../common/AnimatedDiv'; // Importar AnimatedDiv
import { variants } from '../../lib/animations'; // Importar variantes
import { useWorkspace } from '../../context/WorkspaceContext'; // <<< Importar
import { useUIState, usePanel } from '../../context/UIStateContext'; // Changed usePanelUI to usePanel
import { toast } from 'react-toastify'; // <<< Import toast
import { CommandPalette } from '../common/CommandPalette'; // <<< Import CommandPalette
import { Logger } from '../../lib/Logger'; // Import Logger
// import { Toaster } from 'react-hot-toast'; // Removed react-hot-toast
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CustomTitleBar } from '../shell/CustomTitleBar'; // Import the new component
import { ErrorBoundary } from '../common/ErrorBoundary';
import { errorManager, ErrorSource, ErrorSeverity } from '../../lib/ErrorManager';
import { FileFeedback, useFileFeedback, FileOperation } from '../common/FileFeedback'; // Changed FileOperationInfo to FileOperation

// --- Placeholder Components ---
// Replace these with your actual components for each panel
const ActivityBarContent: React.FC = () => (
  <div className="p-4 h-full">Activity Bar Content</div>
);
const MainAreaContent: React.FC = () => (
  <div className="p-4 h-full">Main Area Content</div>
);
const CodePanelContent: React.FC = () => (
  <div className="p-4 h-full">Code Panel Content</div>
);
// --- End Placeholder Components ---

interface AppLayoutProps {
  // Adicione props se necessário
}

// Wrapper para painéis com ErrorBoundary
const SafePanel: React.FC<{
  children: React.ReactNode;
  name: string;
  className?: string;
}> = ({ children, name, className }) => (
  <ErrorBoundary componentName={name}>
    <div className={className || ''}>
      {children}
    </div>
  </ErrorBoundary>
);

export const AppLayout: React.FC<AppLayoutProps> = React.memo(() => {
  const { theme } = useTheme();
  const { state: uiState, setBottomPanelHeight } = useUIState(); 
  // const { toggleBottomPanel } = usePanel(); // Example if toggleBottomPanel comes from usePanel

  const { state: workspaceState, saveFile, registerFeedbackHandlers } = useWorkspace();
  
  const fileFeedback = useFileFeedback();
  const { 
    operations, // Assuming 'operations' is the correct name from useFileFeedback hook
    addOperation, 
    updateOperation,
    removeOperation 
  } = fileFeedback;

  useEffect(() => {
    if (registerFeedbackHandlers) {
      registerFeedbackHandlers({
        addOperation,
        updateOperation,
        removeOperation
      });
    }
  }, [registerFeedbackHandlers, addOperation, updateOperation, removeOperation]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); 
        const { activeTabId, openTabs } = uiState.editor;
        if (!activeTabId) return;
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        const activeOpenFile = workspaceState.openFiles.find(f => f.id === activeTabId);
        if (activeTab && activeTab.type === 'file' && activeOpenFile && activeOpenFile.isDirty) {
          try {
            Logger.info(`Saving file: ${activeOpenFile.name} (ID: ${activeTabId})`);
            if (typeof activeOpenFile.content === 'string') {
              await saveFile(activeTabId, activeOpenFile.content);
              Logger.info(`File ${activeOpenFile.name} saved successfully.`);
            } else {
              Logger.warn(`Content for file ${activeOpenFile.name} is not a string, cannot save.`);
              toast.error(`Conteúdo do arquivo ${activeOpenFile.name} inválido para salvar.`);
            }
          } catch (error) {
            Logger.error(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast.error(`Erro ao salvar ${activeOpenFile.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [uiState.editor, workspaceState.openFiles, saveFile]);

  // Usa as cores/tokens definidos no Tailwind/CSS
  // O gradiente é aplicado no body via globals.css

  // Estilos base para os *painéis* que contêm os componentes
  // Usando cores/tokens mapeados no tailwind.config.js
  const panelWrapperClasses = `
    rounded-lg shadow-subtle dark:shadow-darkSubtle 
    bg-panel dark:bg-panel-dark 
    border border-border dark:border-border-dark 
    backdrop-blur-md 
    transition-colors duration-300 ease-in-out
    overflow-hidden 
    h-full // Garante que o painel preencha a altura 
  `;

  // Estilos para os resize handles (podem usar tokens também)
  const resizeHandleClasses = `
    w-1.5 mx-1 rounded-full 
    flex items-center justify-center
    bg-panel-secondary dark:bg-panel-darkSecondary 
    hover:bg-accent/30 dark:hover:bg-accent-dark/30
    data-[resize-handle-state=drag]:bg-accent/50 dark:data-[resize-handle-state=drag]:bg-accent-dark/50
    transition-colors duration-200 ease-in-out
  `;
  
  const resizeHandleVerticalClasses = `h-1.5 my-1 rounded-full flex items-center justify-center bg-panel-secondary dark:bg-panel-darkSecondary hover:bg-accent/30 dark:hover:bg-accent-dark/30 data-[resize-handle-state=drag]:bg-accent/50 dark:data-[resize-handle-state=drag]:bg-accent-dark/50 transition-colors duration-200 ease-in-out`; // <<< Estilo para handle vertical

  const handleDotClasses = `
    w-1 h-8 rounded-full 
    bg-border dark:bg-border-dark opacity-50
  `;

  const handleDotVerticalClasses = `h-1 w-8 rounded-full bg-border dark:bg-border-dark opacity-50`; // <<< Estilo para ponto vertical

  // Tratamento de erro global para AppLayout
  const handleAppError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    errorManager.captureError(error, {
      severity: ErrorSeverity.CRITICAL,
      source: ErrorSource.RENDER,
      context: { 
        componentStack: errorInfo.componentStack,
        component: 'AppLayout'
      },
      userFriendlyMessage: 'Erro crítico na interface principal. Tente recarregar a aplicação.'
    });
  }, []);

  return (
    <ErrorBoundary componentName="AppLayout" onError={handleAppError}>
      <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`} role="application">
        {/* Render Custom Title Bar only if in Electron context */}
        <CustomTitleBar />

        {/* Main content area - Adjust top padding if using CustomTitleBar */}
        <div className="flex flex-1 overflow-hidden pt-8" role="main" aria-label="IDE Main Content"> {/* Add pt-8 (or adjust based on title bar height) */}
          {/* Activity Bar */}
          <SafePanel name="ActivityBar">
            <ActivityBar />
          </SafePanel>

          {/* Sidebar (conditionally rendered) */}
          <PanelGroup
              direction="horizontal"
              className="flex-grow w-full" // <<< Ocupar espaço restante
          >
              {/* ActivityBar */}
              <Panel /* defaultSizePercentage={5} minSizePercentage={3} maxSizePercentage={10} */ className="pr-1.5 h-full">
                <SafePanel name="ActivityBar">
                  <ActivityBar />
                </SafePanel>
              </Panel>
              <PanelResizeHandle className={resizeHandleClasses} aria-label="Resize Activity Bar"><div className={handleDotClasses} /></PanelResizeHandle>
              
              {/* Área Central Vertical (Sidebar + Conteúdo + Painel Inferior) */}
              <Panel /* minSizePercentage={40} */ className="px-1.5 h-full flex flex-col">
                  {/* Grupo Horizontal (Sidebar + Conteúdo Principal) */}
                  <PanelGroup direction="horizontal" className="flex-grow"> 
                      <Panel /* defaultSizePercentage={25} minSizePercentage={15} maxSizePercentage={40} */ className="pr-1.5 h-full">
                        <SafePanel name="Sidebar">
                          <Sidebar />
                        </SafePanel>
                      </Panel>
                      <PanelResizeHandle className={resizeHandleClasses} aria-label="Resize Sidebar"><div className={handleDotClasses} /></PanelResizeHandle>
                      <Panel /* minSizePercentage={40} */ className="pl-1.5 h-full flex flex-col">
                          <div className={`${panelWrapperClasses} flex-grow`}> 
                            <SafePanel name="MainContentArea">
                              <MainContentArea />
                            </SafePanel>
                          </div>
                          {uiState.bottomPanel.visible && (
                            <>
                              <PanelResizeHandle className={resizeHandleVerticalClasses} aria-label="Resize Bottom Panel"><div className={handleDotVerticalClasses} /></PanelResizeHandle>
                              <Panel 
                                onResize={(size: number) => setBottomPanelHeight(size)}
                                className={`${panelWrapperClasses} flex-shrink-0`}
                              >
                                <SafePanel name="BottomPanel">
                                  <BottomPanel />
                                </SafePanel>
                              </Panel>
                            </>
                          )}
                      </Panel>
                  </PanelGroup>
              </Panel>
          </PanelGroup>

          {/* <<< Barra de Status (Fixa em baixo) >>> */}
          <StatusBar />
          
          <CommandPalette /> {/* <<< Render CommandPalette */}
        </div>

        {/* Toast Notifications */}
        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false} 
          newestOnTop={false} 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
        />

        {/* Feedback de Operações em Arquivos */}
        {/* Renderiza um FileFeedback para cada operação ativa */}
        {operations.map((op) => (
          <FileFeedback 
            key={`${op.filePath}-${op.type}-${op.status}`} // Adiciona status à chave para re-render em mudança de status
            operation={op} 
            onComplete={() => removeOperation(op.filePath, op.type)} // Opcional: remover ao completar
          />
        ))}
      </div>
    </ErrorBoundary>
  );
});

// export default AppLayout;
