import React, { useState, useEffect, Fragment } from 'react';
import { Command } from 'cmdk';
import { FiCommand, FiSearch, FiSun, FiMoon, FiSave, FiTerminal, FiAlertCircle, FiSettings, FiFilePlus, FiMessageSquare, FiEyeOff, FiMaximize2, FiMinimize2, FiLayout, FiPlusSquare } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeProvider';
import { useAgentContext } from '../../context/AgentContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useUIState } from '../../context/UIStateContext';
import { Logger } from '../../lib/Logger';
import { toast } from 'react-toastify';
import { CommandFeedback, useCommandFeedback } from './CommandFeedback';
import { errorManager, ErrorSeverity, ErrorSource } from '../../lib/ErrorManager';
// Import other contexts/hooks as needed

// Interface to define the API exposed by preload.ts
// Make sure this matches what preload.ts actually exposes
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  // Add other methods if needed
}

// Extend the Window interface
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export const CommandPalette: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { createNewSession, activeChatSessionId } = useAgentContext();
  const { saveActiveFile, state: workspaceState } = useWorkspace();
  const { toggleBottomPanel, isBottomPanelOpen, toggleSettingsPanel, isSettingsPanelOpen } = useUIState();

  // Usar nosso novo hook para feedback visual
  const { 
    feedbackState, 
    showSuccess, 
    showError, 
    showLoading,
    clearFeedback
  } = useCommandFeedback();

  // Get current workspace path
  const currentWorkspacePath = workspaceState.rootPath;

  // Check if running in Electron
  const isElectron = !!window.electron;

  // --- Register key listener to open/close palette --- 
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = async (command: () => Promise<void> | void, commandName: string) => {
    setIsOpen(false);
    
    try {
      // Mostrar estado de carregamento
      showLoading(`Executando: ${commandName}...`);
      
      // Executar o comando
      await command();
      
      // Mostrar sucesso quando concluído
      showSuccess(`${commandName} concluído`);
    } catch (error) {
      // Registrar erro e mostrar feedback visual
      errorManager.captureError(error, {
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.USER_INTERACTION,
        context: { command: commandName },
        userFriendlyMessage: `Erro ao executar: ${commandName}`
      });
      
      showError(`Falha ao executar: ${commandName}`);
    }
  };

  // Comando para alternar o tema
  const handleToggleTheme = async () => {
    toggleTheme();
    return Promise.resolve();
  };

  // Comando para criar nova sessão
  const handleCreateNewSession = async () => {
    try {
      await createNewSession();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Comando para salvar arquivo ativo
  const handleSaveActiveFile = async () => {
    try {
      const activeFile = workspaceState.openFiles.find(
        file => file.id === workspaceState.activeFileId
      );
      
      // Verificar se há um arquivo ativo para salvar
      if (!activeFile) {
        return Promise.reject(new Error('Nenhum arquivo ativo para salvar'));
      }
      
      await saveActiveFile();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Comando para criar nova janela (Electron-específico)
  const handleCreateNewWindow = async () => {
    if (!window.electron) {
      return Promise.reject(new Error('Electron não disponível'));
    }
    
    try {
      const context = currentWorkspacePath ? { workspacePath: currentWorkspacePath } : undefined;
      Logger.info('Requesting new window with context:', context);
      
      const result = await window.electron.invoke('app:create-window', context);
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar nova janela');
      }
      
      Logger.info(`New window created with ID: ${result.windowId}`);
      return Promise.resolve();
    } catch (error) {
      Logger.error('Error creating new window:', error);
      return Promise.reject(error);
    }
  };

  // --- Define Commands --- 
  // TODO: Add more commands (e.g., Search Chat, Maximize/Minimize Editor, etc.)
  const commands = [
    {
      group: 'General',
      items: [
        { 
          name: 'Toggle Theme', 
          icon: theme === 'dark' ? <FiSun /> : <FiMoon />, 
          action: () => runCommand(handleToggleTheme, 'Alternar Tema') 
        },
      ],
    },
    {
      group: 'Session',
      items: [
        { 
          name: 'New Chat Session', 
          icon: <FiFilePlus />, 
          action: () => runCommand(handleCreateNewSession, 'Nova Sessão de Chat') 
        },
        // TODO: Add 'Search in Chat' command (needs logic from AgentCollaborationPanel)
        {
           name: 'Search in Active Chat', 
           icon: <FiSearch />, 
           action: () => {
             // Implementação futura
             runCommand(
               async () => Promise.reject(new Error('Funcionalidade ainda não implementada')),
               'Buscar no Chat Ativo'
             );
           },
           disabled: !activeChatSessionId // Disable if no active chat
       },
      ],
    },
     {
      group: 'Editor & Files',
      items: [
        { 
          name: 'Save Active File', 
          icon: <FiSave />, 
          action: () => runCommand(handleSaveActiveFile, 'Salvar Arquivo Ativo'),
          disabled: !workspaceState.activeFileId || !workspaceState.openFiles.some(
            file => file.id === workspaceState.activeFileId && file.isDirty
          )
        },
         // TODO: Add Maximize/Minimize Editor commands (need access to CodeViewer state/functions)
      ],
    },
    {
       group: 'UI & Panels',
       items: [
         { 
           name: isBottomPanelOpen ? 'Hide Bottom Panel' : 'Show Bottom Panel', 
           icon: <FiTerminal />, // Or FiEyeOff?
           action: () => runCommand(
             async () => { toggleBottomPanel(); return Promise.resolve(); },
             isBottomPanelOpen ? 'Ocultar Painel Inferior' : 'Mostrar Painel Inferior'
           )
         },
         { 
           name: isSettingsPanelOpen ? 'Hide Settings Panel' : 'Show Settings Panel',
           icon: <FiSettings />, 
           action: () => runCommand(
             async () => { toggleSettingsPanel(); return Promise.resolve(); },
             isSettingsPanelOpen ? 'Ocultar Painel de Configurações' : 'Mostrar Painel de Configurações'
           )
         },
         // TODO: Add 'Toggle Problems Panel' (needs access to BottomPanel active tab state)
       ],
     },
    {
      group: 'Application',
      items: [
        {
          name: 'New Window',
          icon: <FiPlusSquare />,
          action: () => runCommand(handleCreateNewWindow, 'Nova Janela'),
          disabled: !isElectron
        },
      ],
    },
  ];

  const paletteBg = theme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95';
  const inputBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100/50';
  const itemHoverBg = theme === 'dark' ? 'bg-blue-600/30' : 'bg-blue-100';
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const secondaryTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const borderColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';

  return (
    <>
      <Command.Dialog 
          open={isOpen} 
          onOpenChange={setIsOpen} 
          label="Command Palette" 
          // Custom styling via className prop on Dialog
          className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm ${isOpen ? '' : 'hidden'}`}
      >
        <div className={`relative w-full max-w-xl rounded-lg shadow-2xl border ${borderColor} ${paletteBg} overflow-hidden`}>
          <div className={`flex items-center border-b ${borderColor} px-3`}>
              <FiSearch className={`mr-2 ${secondaryTextColor}`} />
              <Command.Input 
                  value={value}
                  onValueChange={setValue}
                  placeholder="Type a command or search..." 
                  className={`w-full bg-transparent focus:outline-none py-3 text-sm ${textColor} ${inputBg} border-0 focus:ring-0 placeholder-${secondaryTextColor}`}
              />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className={`py-6 text-center text-sm ${secondaryTextColor}`}>No results found.</Command.Empty>
            
            {commands.map((group) => (
                <Command.Group key={group.group} heading={<div className={`px-2 py-1.5 text-xs font-medium ${secondaryTextColor}`}>{group.group}</div>}>
                    {group.items.map((item) => (
                        <Command.Item 
                            key={item.name}
                            onSelect={item.action}
                            disabled={item.disabled}
                            className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer ${textColor} ${item.disabled ? 'opacity-50 cursor-not-allowed' : `hover:${itemHoverBg}` } aria-selected:bg-blue-500 aria-selected:text-white data-[disabled]:opacity-50 data-[disabled]:pointer-events-none`}
                            // value={`${group.group} ${item.name}`} // Optional: explicit value for filtering
                        >
                            <span className="mr-3 w-4 h-4 flex items-center justify-center">{item.icon}</span>
                            <span>{item.name}</span>
                        </Command.Item>
                    ))}
                </Command.Group>
            ))}
          </Command.List>
        </div>
      </Command.Dialog>

      {/* Componente de Feedback Visual */}
      {feedbackState.visible && (
        <CommandFeedback
          status={feedbackState.status}
          message={feedbackState.message}
          duration={feedbackState.duration}
          onComplete={clearFeedback}
          position="bottom-right"
        />
      )}
    </>
  );
}); 