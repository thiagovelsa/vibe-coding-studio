import React, { useCallback } from 'react';
import { useAgentContext } from '../../../context/AgentContext';
import { VirtualizedSessionList } from '../VirtualizedSessionList';
import { CollapsibleSection } from '../../common/CollapsibleSection';

interface SessionListPanelProps {
  className?: string;
}

const SessionListPanel: React.FC<SessionListPanelProps> = React.memo(({ className }) => {
  const { 
    sessions, 
    activeChatSessionId, 
    setActiveSession,
    deleteSession,
    updateSessionTitle
  } = useAgentContext();

  // Handler para seleção de sessão com useCallback para memoização
  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSession(sessionId);
  }, [setActiveSession]);

  return (
    <div 
      className={className}
      role="region"
      aria-label="Lista de sessões"
    >
      <CollapsibleSection 
        title="Sessões Recentes" 
        defaultOpen={true}
        aria-label="Sessões de chat recentes"
      >
        {sessions.length === 0 ? (
          <div 
            className="p-4 text-center text-gray-500 text-sm"
            aria-live="polite"
          >
            Nenhuma sessão encontrada.
          </div>
        ) : (
          <VirtualizedSessionList
            sessions={sessions}
            activeSessionId={activeChatSessionId}
            onSessionSelect={handleSessionSelect}
            onSessionDelete={deleteSession}
            onSessionRename={updateSessionTitle}
            aria-label="Lista de sessões de chat"
            role="listbox"
            aria-activedescendant={activeChatSessionId ? `session-${activeChatSessionId}` : undefined}
          />
        )}
      </CollapsibleSection>
    </div>
  );
});

export default SessionListPanel; 