import React from 'react';
import { FiFileText, FiSearch, FiGitBranch, FiCpu, FiSettings, FiMoon, FiSun, FiMessageSquare, FiShare2, FiPlusSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeProvider';
import { useUIState, PanelId, OpenTab } from '../../context/UIStateContext';
import { useAgentContext } from '../../context/AgentContext';
import { AnimatedButton } from '../common/AnimatedButton';
import { Logger } from '../../lib/Logger';
import { AgentType as ApiAgentType } from '../../services/agent-api.service';

// Interface para os itens da barra (PAINEL OU ABA)
interface ActivityBarItemProps {
  id: string; // Pode ser PanelId ou TabId
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isTabItem?: boolean; // Flag para diferenciar se o indicador deve ter layoutId único por aba
}

// Componente unificado para itens da ActivityBar, usando AnimatedButton
const ActivityItem: React.FC<ActivityBarItemProps> = ({ id, icon: Icon, label, isActive, onClick, isTabItem }) => {
  // --- Estilos Refinados ---
  const baseButtonClasses = `
    relative w-12 h-12 flex items-center justify-center rounded-lg
    text-text-muted dark:text-text-darkMuted /* Cor base do ícone */
    hover:text-accent dark:hover:text-accent-dark /* Cor do ícone no hover */
    transition-all duration-200 ease-in-out
  `;

  const activeButtonStateClasses = isActive
    ? `bg-card/60 dark:bg-card-dark/60 text-accent dark:text-accent-dark shadow-[0_0_15px_2px_var(--color-accent-glow)] dark:shadow-[0_0_15px_3px_var(--color-accent-dark-glow)]`
    // Usando variáveis para o glow se definidas, ou cores diretas como antes
    // --color-accent-glow: rgba(167,139,250,0.5)
    // --color-accent-dark-glow: rgba(192,132,252,0.6)
    : `hover:bg-white/10 dark:hover:bg-black/15`; // Hover sutil para inativos

  // Indicador Ativo
  const activeIndicatorLayoutId = isTabItem ? `activityTabIndicator-${id}` : "activePanelIndicator";
  // --- Fim dos Estilos Refinados ---

  return (
    <AnimatedButton
      key={id}
      onClick={onClick}
      title={label}
      className={`${baseButtonClasses} ${activeButtonStateClasses}`}
    >
      <Icon className="w-6 h-6" />
      {isActive && (
        <motion.div
          layoutId={activeIndicatorLayoutId} // Usa layoutId dinâmico
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent dark:bg-accent-dark rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }} // Animação mais suave
        />
      )}
    </AnimatedButton>
  );
};

// Componente principal da ActivityBar
export const ActivityBar: React.FC = React.memo(() => {
  const { theme, toggleTheme } = useTheme();
  const { state: uiState, setActiveSidebarPanel, toggleSidebar, openTab, setActiveTab: setEditorActiveTab } = useUIState(); // Renomeado setActiveTab para evitar conflito
  const { createSession, setActiveChatSession, state: agentState } = useAgentContext(); // Adicionado setActiveChatSession e agentState
  const activePanelId = uiState.sidebar.activePanel;
  const isSidebarVisible = uiState.sidebar.visible;

  const activityPanelItems: { id: PanelId; icon: React.ElementType; label: string }[] = [
    { id: 'explorer', icon: FiFileText, label: 'Explorador' },
    { id: 'search', icon: FiSearch, label: 'Pesquisar' },
    { id: 'git', icon: FiGitBranch, label: 'Controle de Versão' },
    // O painel 'ai' pode ser removido se a lógica de chat agora é direta via botão '+'
    // ou mantido se tiver outras funcionalidades de IA além de chat.
    // { id: 'ai', icon: FiCpu, label: 'Agentes IA' },
  ];

  const handlePanelItemClick = (id: PanelId) => {
    if (id === activePanelId && isSidebarVisible) {
      toggleSidebar(false);
    } else {
      setActiveSidebarPanel(id);
      if (!isSidebarVisible) {
        toggleSidebar(true);
      }
    }
  };

  const handleNewChatClick = async () => {
    Logger.info("[ActivityBar] Attempting to create new chat session...");
    try {
      const newSession = await createSession(ApiAgentType.CUSTOM, agentState.selectedModelId);
      if (newSession && newSession.id) {
        Logger.info("[ActivityBar] New session created:", newSession.id);
        setActiveChatSession(newSession.id); // Define a sessão como ativa no AgentContext

        const newChatTab: OpenTab = {
          id: newSession.id,
          title: newSession.title || `Chat ${newSession.id.substring(0, 4)}`, // Usa título da sessão ou um fallback
          type: 'chat',
          // isDirty: false, // Opcional, já que é uma nova aba
          // icon: FiMessageSquare, // Opcional: ícone para a aba de chat
        };
        openTab(newChatTab); // Abre e ativa a nova aba no EditorUIContext
        // setEditorActiveTab(newChatTab.id); // openTab já deveria ativar, mas para garantir
      } else {
        Logger.error("[ActivityBar] Failed to create new session: createSession returned null or no ID");
        // TODO: Mostrar erro para o usuário (Toast?)
      }
    } catch (error) {
      Logger.error("[ActivityBar] Error creating new chat session:", error);
      // TODO: Mostrar erro para o usuário (Toast?)
    }
  };
  
  // --- Estilo da Barra ---
  const activityBarContainerClasses = `
    h-full w-[60px] p-2 flex flex-col items-center justify-between
    bg-panel/60 dark:bg-panel-dark/60 /* Usando cores de painel para consistência */
    border-r border-border/70 dark:border-border-dark/70 /* Borda sutil e translúcida */
    shadow-md /* Sombra um pouco mais pronunciada para destacar da sidebar */
    backdrop-blur-lg /* Blur mais intenso para a ActivityBar */
  `;
  // --- Fim do Estilo da Barra ---

  return (
    // APLICADO activityBarContainerClasses
    <div className={activityBarContainerClasses}>
      {/* Ícones Principais (Painéis e Ações) */}
      <div className="flex flex-col items-center space-y-2.5 mt-1"> {/* Ajustado espaçamento e margem */}
        {activityPanelItems.map((item) => (
          <ActivityItem
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePanelId === item.id && isSidebarVisible}
            onClick={() => handlePanelItemClick(item.id)}
          />
        ))}

        {/* Separador Visual */}
        <hr className="w-8 border-t border-border/50 dark:border-border-dark/50 my-2 opacity-50" /> {/* Mais sutil */}

        {/* Botão para Novo Chat */}
        <ActivityItem // Usando o componente ActivityItem
            key="new-chat"
            id="new-chat-action" // ID único para a ação, não para um painel ou aba
            icon={FiPlusSquare}
            label="Novo Chat"
            isActive={false} // Este botão não fica "ativo" da mesma forma que um painel
            onClick={handleNewChatClick}
        />
      </div>

      {/* Ícones Inferiores (Configurações, Tema) */}
      <div className="flex flex-col items-center space-y-2.5 mb-1"> {/* Ajustado espaçamento e margem */}
        <ActivityItem // Usando o componente ActivityItem para Configurações
          id="settings"
          icon={FiSettings}
          label="Configurações"
          isActive={activePanelId === 'settings' && isSidebarVisible}
          onClick={() => handlePanelItemClick('settings')}
        />

        {/* Botão de Tema com ActivityItem para consistência, mas sem indicador lateral */}
        <AnimatedButton // Ou manter AnimatedButton direto se o indicador não fizer sentido
          onClick={toggleTheme}
          title={`Mudar para tema ${theme === 'light' ? 'Escuro' : 'Claro'}`}
          className="w-12 h-12 flex items-center justify-center rounded-lg text-text-muted dark:text-text-darkMuted hover:bg-white/10 dark:hover:bg-black/15 hover:text-accent dark:hover:text-accent-dark transition-all duration-200 ease-in-out"
        >
          {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </AnimatedButton>
      </div>
    </div>
  );
});

// Ensure default export if this is the main export of the file
// export default ActivityBar;