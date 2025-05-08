import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useWorkspace, OpenFile } from '../../context/WorkspaceContext';
import { useUIState, OpenTab as UIStateOpenTab, TabContentType as UIStateTabContentType } from '../../context/UIStateContext';
import { CodeViewer } from '../common/CodeViewer';
import { AgentCollaborationPanel } from '../panel/AgentCollaborationPanel';
import { AgentFlowVisualizer } from '../panel/AgentFlowVisualizer';
import { FiLoader, FiCpu } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

export type TabContentType = UIStateTabContentType;

export interface OpenTab {
  id: string;
  title: string;
  type: TabContentType;
  dirty?: boolean;
}

const MainContentArea: React.FC = React.memo(() => {
  const { state: uiState, setActiveTab, closeTab } = useUIState();
  const { openTabs, activeTabId } = uiState.editor;

  const { state: workspaceState, updateFileContent } = useWorkspace();
  const { openFiles: workspaceOpenFiles, isLoading: isWorkspaceLoading } = workspaceState;

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const activeTabIndex = React.useMemo(() => {
    if (!activeTabId) return -1;
    return openTabs.findIndex(tab => tab.id === activeTabId);
  }, [openTabs, activeTabId]);

  const getOpenFileContent = (tabId: string): OpenFile | undefined => {
    return workspaceOpenFiles.find(f => f.id === tabId);
  };
  
  const handleEditorChange = (newContent: string | undefined) => {
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    if (activeTab && activeTab.type === 'file' && newContent !== undefined) {
      updateFileContent(activeTab.id, newContent);
    }
  };

  // --- Início das Modificações de Estilo ---
  const tabListClasses = `
    flex overflow-x-auto flex-shrink-0 custom-scrollbar
    bg-panel/80 dark:bg-panel-dark/80 backdrop-blur-md /* Efeito Vidro na Barra de Abas */
    border-b border-border/70 dark:border-border-dark/70 /* Borda inferior sutil */
    pl-1 /* Pequeno padding inicial para a primeira aba não colar na borda */
  `;

  const tabButtonBaseClasses = `
    flex items-center pl-3 pr-2 py-2.5 /* Ajuste de padding */
    focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark focus:ring-opacity-60 z-10
    whitespace-nowrap text-sm transition-all duration-200 ease-in-out
    border-r border-transparent /* Borda direita transparente por padrão */
    relative group /* Para posicionar pseudo-elementos se necessário */
  `;

  const tabButtonSelectedClasses = `
    bg-card/70 dark:bg-card-dark/70 /* Fundo da aba ativa, mais opaco ou cor diferente */
    text-text-accent dark:text-text-darkAccent font-semibold /* Cor de texto para aba ativa */
    border-r border-border/50 dark:border-border-dark/50 /* Borda sutil para separar abas ativas */
    shadow-sm /* Sombra sutil para destacar */
    rounded-t-md /* Cantos superiores arredondados */
  `;
  // Para aba selecionada, podemos adicionar um indicador inferior também, se quisermos
  // Ex: after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent dark:after:bg-accent-dark

  const tabButtonUnselectedClasses = `
    text-text-muted dark:text-text-darkMuted
    hover:bg-white/10 dark:hover:bg-black/20 /* Hover sutil translúcido */
    hover:text-text dark:hover:text-text-dark /* Cor do texto no hover */
    border-r border-border/30 dark:border-border-dark/30 /* Borda mais sutil para inativas */
    rounded-t-md /* Para manter a forma */
  `;

  const tabDirtyIndicatorClasses = `
    mr-1.5 text-accent dark:text-accent-dark opacity-80
  `; // Usar a cor de accent para o 'dirty'

  const tabCloseButtonClasses = `
    ml-2 rounded-full p-0.5
    text-text-muted/70 dark:text-text-darkMuted/70
    hover:bg-black/10 dark:hover:bg-white/15
    hover:text-text-muted dark:hover:text-text-darkMuted
    opacity-70 group-hover:opacity-100 transition-opacity duration-150
  `; // Ajustes para o botão de fechar

  const tabPanelsContainerClasses = `
    flex-1 overflow-hidden
    bg-transparent /* Deixar o painel de conteúdo totalmente transparente para herdar o fundo do AppLayout */
    /* ou, se quiser um nível de vidro separado para o conteúdo: */
    /* bg-panel/50 dark:bg-panel-dark/50 backdrop-blur-sm */
  `;
  // --- Fim das Modificações de Estilo ---

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent" role="region" aria-label="Main Content Area">
      {openTabs.length > 0 ? (
        <Tab.Group selectedIndex={activeTabIndex} onChange={(index) => setActiveTab(openTabs[index]?.id || null)}>
          <Tab.List className={tabListClasses}>
            {openTabs.map((tab, index) => (
              <Tab key={tab.id} as={Fragment}>
                {({ selected }) => (
                  <button
                    className={`
                      ${tabButtonBaseClasses}
                      ${selected ? tabButtonSelectedClasses : tabButtonUnselectedClasses}
                      ${index === openTabs.length -1 && !selected ? 'border-r-transparent' : ''}
                      ${index === 0 ? 'ml-0' : ''}
                    `}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                  >
                    {tab.dirty && <span className={tabDirtyIndicatorClasses} aria-label="Unsaved changes">●</span>}
                    <span className="truncate max-w-[150px]">{tab.title}</span>
                    <button
                      className={tabCloseButtonClasses}
                      onClick={(e) => handleTabClose(e, tab.id)}
                      aria-label={`Close ${tab.title}`}
                    >
                      <Cross2Icon className="h-3.5 w-3.5" />
                    </button>
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className={tabPanelsContainerClasses}>
            {openTabs.map((tab) => {
              const fileData = tab.type === 'file' ? getOpenFileContent(tab.id) : undefined;
              const isFileLoading = tab.type === 'file' && !fileData && isWorkspaceLoading;
              
              return (
                <Tab.Panel key={tab.id} className="h-full w-full focus:outline-none relative" unmount={false}>
                  <div id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} className="h-full">
                    <AnimatePresence>
                      {isFileLoading && (
                        <motion.div
                          key={`loading-${tab.id}`}
                          className="absolute inset-0 flex items-center justify-center bg-panel/30 dark:bg-panel-dark/30 backdrop-blur-sm z-20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          aria-live="polite"
                          aria-label="Loading file"
                        >
                          <FiLoader className="w-6 h-6 animate-spin text-accent dark:text-accent-dark" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {tab.type === 'chat' && (
                      <AgentCollaborationPanel /> 
                    )}
                    {tab.type === 'flow' && (
                       <AgentFlowVisualizer />
                    )}
                    {tab.type === 'file' && fileData && (
                        <CodeViewer
                            key={tab.id}
                            content={fileData.content}
                            language={fileData.language}
                            filePath={fileData.path}
                            onContentChange={handleEditorChange}
                            readOnly={false}
                        />
                    )}
                     {tab.type === 'file' && !fileData && !isFileLoading && (
                         <div className="p-4 text-red-500">Erro: Arquivo associado à aba não encontrado.</div>
                     )}
                     {!['chat', 'flow', 'file'].includes(tab.type) && (
                         <div className="p-4">Conteúdo para tipo de aba desconhecido: {tab.type}</div>
                     )}
                  </div>
                </Tab.Panel>
              );
            })} 
          </Tab.Panels>
        </Tab.Group>
      ) : (
        <div className="flex h-full items-center justify-center text-text-muted dark:text-text-darkMuted p-4">
          <div className="text-center p-8 rounded-lg bg-panel/60 dark:bg-panel-dark/60 backdrop-blur-md shadow-lg">
            <FiCpu className="mx-auto h-16 w-16 text-accent dark:text-accent-dark mb-4 opacity-80" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-text dark:text-text-dark mb-2">VibeForge</h2>
            <p className="text-sm max-w-xs mx-auto">
              Abra um arquivo no Explorer ou inicie uma nova sessão de chat na Activity Bar para começar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default MainContentArea; 