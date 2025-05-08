import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { AgentContextProvider } from './AgentContext';
import { WorkspaceProvider } from './WorkspaceContext';
import { UIContextManager } from './ui/UIContextManager';
import { SessionListProvider } from './SessionListContext';
import { ActiveChatProvider } from './ActiveChatContext';
import { ErrorManagerProvider } from './ErrorManagerContext';
import { ProblemsProvider } from './ProblemsContext';

interface RootProviderProps {
  children: ReactNode;
}

/**
 * Componente que agrega todos os providers de contexto da aplicação
 * Ordem de aninhamento importante:
 * 1. ThemeProvider (mais externo) - tema afeta todos os componentes
 * 2. ErrorManagerProvider - gestão de erros global
 * 3. ProblemsProvider - estado de problemas
 * 4. UIContextManager - gerencia todos os estados de UI de forma modular
 * 5. WorkspaceProvider - gerencia arquivos e projetos
 * 6. AgentContextProvider - gerencia estado global de sessões e agentes (anteriormente AgentProvider no comentário)
 * 7. SessionListProvider - gerencia a lista de sessões
 * 8. ActiveChatProvider (mais interno) - gerencia o estado da sessão de chat *ativa*
 */
export const RootProvider: React.FC<RootProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <ErrorManagerProvider>
        <ProblemsProvider>
          <UIContextManager>
            <WorkspaceProvider>
              <AgentContextProvider>
                <SessionListProvider>
                  <ActiveChatProvider>
                    {children}
                  </ActiveChatProvider>
                </SessionListProvider>
              </AgentContextProvider>
            </WorkspaceProvider>
          </UIContextManager>
        </ProblemsProvider>
      </ErrorManagerProvider>
    </ThemeProvider>
  );
};

export default RootProvider; 