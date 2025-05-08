import React, { useState, Fragment, useCallback, useMemo, useRef, useContext } from 'react';
import { FiPlus, FiChevronDown, FiCheck, FiUsers, FiFileText, FiGitBranch, FiCpu, FiDatabase, FiCheckSquare, FiSearch, FiSettings } from 'react-icons/fi';
import { Listbox, Transition } from '@headlessui/react';
import { useTheme } from '../../../context/ThemeProvider';
import { useSidebar, useUIState } from '../../../context/ui/UIContextManager';
import { useAgentContext, AIModel } from '../../../context/AgentContext';
import { useSessionListContext } from '../../../context/SessionListContext';
import { WorkspaceContext } from '../../../context/WorkspaceContext';
import { AnimatedButton } from '../../common/AnimatedButton';
import { AnimatedDiv } from '../../common/AnimatedDiv';
import { FileSystemNode } from '../../common/FileTreeView';
import { AgentType as ApiAgentType, ChatSession as ApiChatSession } from '../../../services/agent-api.service';
import { toast } from 'react-toastify';
import { CollapsibleSection } from '../../common/CollapsibleSection';
import { IconType } from 'react-icons';

// Define agentTypeOptions locally, using correct ApiAgentType.TESTER
export const agentTypeOptions = [
  { id: ApiAgentType.PRODUCT, name: 'Product Owner', icon: FiUsers, description: 'Define requisites e visão do produto.' },
  { id: ApiAgentType.CODER, name: 'Desenvolvedor', icon: FiCpu, description: 'Escreve e implementa o código.' },
  { id: ApiAgentType.TESTER, name: 'Testador', icon: FiCheckSquare, description: 'Cria e executa testes para garantir qualidade.' },
  // { id: ApiAgentType.SECURITY, name: 'Segurança', icon: FiShield, description: 'Analisa e fortalece a segurança.' }, // SECURITY não existe no enum AgentType
];

// --- ModelSelector ---
interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: AIModel | null;
  onChange: (model: AIModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = React.memo(({ models, selectedModel, onChange }) => {
  const buttonClasses = `
    relative w-full cursor-default rounded-lg 
    bg-white/5 dark:bg-black/10 
    hover:bg-white/10 dark:hover:bg-black/15 
    py-2 pl-3 pr-10 text-left shadow-sm 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-opacity-75
    sm:text-sm transition-colors text-text dark:text-text-dark
  `;
  const optionsContainerClasses = `
    absolute mt-1 max-h-60 w-full overflow-auto rounded-md 
    bg-panel/80 dark:bg-panel-dark/80 backdrop-blur-md 
    py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 
    focus:outline-none sm:text-sm z-50
  `;
  const optionItemBaseClasses = `
    relative cursor-default select-none py-2 pl-10 pr-4
    text-text dark:text-text-dark
  `;
  const optionItemActiveClasses = `
    bg-accent/10 dark:bg-accent-dark/15 text-accent dark:text-accent-dark
  `; 

  const buttonDisabledClasses = (!models || models.length === 0) ? 'opacity-50 cursor-not-allowed' : '';

  const handleModelChange = useCallback((model: AIModel) => {
    onChange(model);
  }, [onChange]);

  return (
    <Listbox as="div" className="relative mt-1" value={selectedModel} onChange={handleModelChange} disabled={!models || models.length === 0}>
      <Listbox.Button className={`${buttonClasses} ${buttonDisabledClasses}`}>
        <span className={`block truncate text-sm ${selectedModel ? 'font-medium' : ''}`}>
          {selectedModel ? selectedModel.name : (models && models.length > 0 ? 'Selecione um Modelo' : 'Nenhum modelo')}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FiChevronDown className="h-4 w-4 text-text-muted dark:text-text-darkMuted" aria-hidden="true" />
        </span>
      </Listbox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Listbox.Options className={optionsContainerClasses}>
          {models.map((model) => (
            <Listbox.Option
              key={model.id}
              value={model}
              className={({ active }) =>
                `${optionItemBaseClasses} ${active ? optionItemActiveClasses : ''}`
              }
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate text-sm ${selected ? 'font-semibold text-accent dark:text-accent-dark' : 'font-normal'}`}>
                    {model.name}
                  </span>
                  {selected ? (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent dark:text-accent-dark">
                      <FiCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  {model.icon && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted dark:text-text-darkMuted">
                      {React.createElement(model.icon, { className: "h-4 w-4", 'aria-hidden': true })}
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
});

// --- AgentTypeSelector ---
interface AgentTypeSelectorProps {
  agentTypes: typeof agentTypeOptions; 
  selectedAgentType: typeof agentTypeOptions[number] | null;
  onChange: (agentTypeOption: typeof agentTypeOptions[number]) => void;
}

const AgentTypeSelector: React.FC<AgentTypeSelectorProps> = React.memo(({ agentTypes, selectedAgentType, onChange }) => {
  const buttonClasses = `
    relative w-full cursor-default rounded-lg 
    bg-white/5 dark:bg-black/10 
    hover:bg-white/10 dark:hover:bg-black/15
    py-2 pl-3 pr-10 text-left shadow-sm 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent-dark focus-visible:ring-opacity-75
    sm:text-sm transition-colors text-text dark:text-text-dark
  `;
  const optionsContainerClasses = `
    absolute mt-1 max-h-60 w-full overflow-auto rounded-md 
    bg-panel/80 dark:bg-panel-dark/80 backdrop-blur-md
    py-1 text-base shadow-lg ring-1 ring-black/5 dark:ring-white/10 
    focus:outline-none sm:text-sm z-50
  `;
  const optionItemBaseClasses = `
    relative cursor-default select-none py-2 pl-10 pr-4
    text-text dark:text-text-dark
  `;
  const optionItemActiveClasses = `
    bg-accent/10 dark:bg-accent-dark/15 text-accent dark:text-accent-dark
  `;

  const buttonDisabledClasses = (!agentTypes || agentTypes.length === 0) ? 'opacity-50 cursor-not-allowed' : '';

  const handleAgentTypeChange = useCallback((agentType: typeof agentTypeOptions[number]) => {
    onChange(agentType);
  }, [onChange]);

  return (
    <Listbox as="div" className="relative mt-2" value={selectedAgentType} onChange={handleAgentTypeChange} disabled={!agentTypes || agentTypes.length === 0}>
      <Listbox.Button className={`${buttonClasses} ${buttonDisabledClasses}`}>
        <span className={`block truncate text-sm ${selectedAgentType ? 'font-medium' : ''}`}>
          {selectedAgentType ? selectedAgentType.name : 'Selecione o Tipo de Agente'}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FiChevronDown className="h-4 w-4 text-text-muted dark:text-text-darkMuted" aria-hidden="true" />
        </span>
      </Listbox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Listbox.Options className={optionsContainerClasses}>
          {agentTypes.map((agentType) => (
            <Listbox.Option
              key={agentType.id}
              value={agentType}
              className={({ active }) =>
                `${optionItemBaseClasses} ${active ? optionItemActiveClasses : ''}`
              }
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate text-sm ${selected ? 'font-semibold text-accent dark:text-accent-dark' : 'font-normal'}`}>
                    {agentType.name}
                  </span>
                  {selected ? (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent dark:text-accent-dark">
                      <FiCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  {agentType.icon && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted dark:text-text-darkMuted">
                      {React.createElement(agentType.icon, { className: "h-4 w-4", 'aria-hidden': true })}
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
});

// Mock/Placeholder para subcomponentes da Sidebar (para evitar erros de importação agora)
const PlaceholderPanelContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-4 border-t border-border/30 dark:border-border-dark/30">
    <h3 className="font-semibold text-text dark:text-text-dark mb-2">{title}</h3>
    <p className="text-sm text-text-muted dark:text-text-darkMuted">
      Conteúdo para {title} virá aqui.
    </p>
  </div>
);
const FileTreePanel: React.FC<{onFileClick: (node: FileSystemNode) => void}> = ({onFileClick}) => <PlaceholderPanelContent title="Explorador de Arquivos (FileTreePanel)" />;
const AgentSelectionPanelReact: React.FC<any> = (props) => <PlaceholderPanelContent title="Seleção de Agente (AgentSelectionPanel)" />;
const SettingsPanel: React.FC = () => <PlaceholderPanelContent title="Configurações (SettingsPanel)" />;
const SessionSetupSection: React.FC<any> = (props) => <PlaceholderPanelContent title="Configuração de Sessão (SessionSetupSection)" />;
const SessionListPanel: React.FC<any> = (props) => <PlaceholderPanelContent title="Lista de Sessões (SessionListPanel)" />;


interface SidebarProps {}

export const Sidebar: React.FC<SidebarProps> = React.memo(() => {
  const { state: agentState, setSelectedModel: setAgentSelectedModel, createSession } = useAgentContext();
  
  const sidebarHookReturn = useSidebar(); 
  const sidebarState = sidebarHookReturn.state; 
  const setActivePanel = sidebarHookReturn.setActivePanel;

  const [selectedAgentTypeOption, setSelectedAgentTypeOption] = useState<typeof agentTypeOptions[number] | null>(null);

  const workspaceContext = useContext(WorkspaceContext);
  const openWorkspaceFile = workspaceContext?.openFile; 
  
  const { availableModels, selectedModelId, activeChatSessionId, sessions: agentSessions } = agentState;

  const activeSession: ApiChatSession | null = useMemo(() => 
    activeChatSessionId ? agentSessions[activeChatSessionId] : null
  , [agentSessions, activeChatSessionId]);

  const selectedModel = useMemo(() => 
      availableModels.find(m => m.id === selectedModelId) || (availableModels.length > 0 ? availableModels[0] : null)
  , [availableModels, selectedModelId]);

  const handleFileClick = useCallback((node: FileSystemNode) => {
    if (node && typeof node.isDirectory === 'boolean' && !node.isDirectory && openWorkspaceFile) {
        openWorkspaceFile(node.id); 
    } else if (node && node.isDirectory) {
        // Lógica para expandir/colapsar diretório no FileTreeView (se aplicável)
    } else {
        console.warn("handleFileClick: node is not a file or openWorkspaceFile is not available", node);
    }
  }, [openWorkspaceFile]);

  const handleSelectModel = useCallback((model: AIModel | null) => {
    setAgentSelectedModel(model?.id ?? null);
  }, [setAgentSelectedModel]);

  const handleAgentTypeSelect = useCallback((agentTypeOption: typeof agentTypeOptions[number]) => {
    setSelectedAgentTypeOption(agentTypeOption);
    // Example: Automatically switch to 'ai' panel when an agent type is selected
    if (agentTypeOption) {
      setActivePanel('ai');
    }
  }, [setSelectedAgentTypeOption, setActivePanel]);

  const handleCreateSession = useCallback(async () => {
    if (selectedModel && selectedAgentTypeOption) {
        const newSession = await createSession(selectedAgentTypeOption.id, selectedModel.id);
        if (newSession) {
            setActivePanel('ai'); // Switch to AI panel or chat view after creation
            toast.success(`Sessão com ${selectedAgentTypeOption.name} iniciada!`);
        } else {
            toast.error("Falha ao criar a sessão. Verifique o console.");
        }
    } else {
        toast.warn("Por favor, selecione um modelo e um tipo de agente antes de criar uma sessão.");
    }
  }, [createSession, selectedModel, selectedAgentTypeOption, setActivePanel]);

  const sidebarContainerClasses = `
    h-full flex flex-col w-full 
    border-r border-border/70 dark:border-border-dark/70 
    bg-panel/70 dark:bg-panel-dark/70 
    backdrop-blur-md 
    shadow-lg 
    overflow-hidden 
  `;

  const renderActivePanelContent = () => {
    switch (sidebarState.activePanel) { 
      case 'explorer':
        return <FileTreePanel onFileClick={handleFileClick} />;
      case 'ai': 
        return (
          <AgentSelectionPanelReact
            models={availableModels}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            agentTypes={agentTypeOptions} 
            selectedAgentType={selectedAgentTypeOption} 
            onSelectAgentType={handleAgentTypeSelect}
            onCreateSession={handleCreateSession}
            activeSessionId={activeChatSessionId}
          />
        );
      case 'settings':
        return <SettingsPanel />;
      default:
        // Attempt to make 'ai' panel default if no other is explicitly active or if current active is not visible
        // This logic might need refinement based on actual panel visibility state if available in sidebarState.panels
        const currentActivePanelState = sidebarState.panels.find(p => p.id === sidebarState.activePanel);
        if (!currentActivePanelState || !currentActivePanelState.visible) {
            const firstVisiblePanel = sidebarState.panels.find(p => p.visible);
            if (firstVisiblePanel) setActivePanel(firstVisiblePanel.id);
            // Fallback to a known default if none are visible (though unlikely)
            else setActivePanel('ai'); 
            return null; // Will re-render with the new active panel
        }
        return (
          <div className="p-4 text-sm text-text-muted dark:text-text-darkMuted">
            Painel Ativo: {sidebarState.activePanel}. Conteúdo não definido ou painel não visível.
          </div>
        );
    }
  };

  return (
    <AnimatedDiv 
      className={sidebarContainerClasses}
      initial={{ x: -30, opacity: 0.8 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "circOut" }} 
      role="complementary"
      aria-label="Sidebar"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-3">
        {renderActivePanelContent()}
      </div>
    </AnimatedDiv>
  );
}); 