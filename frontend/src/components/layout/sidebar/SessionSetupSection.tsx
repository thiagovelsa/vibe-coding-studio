import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { AnimatedButton } from '../../common/AnimatedButton';
import ActiveSessionInfo from './ActiveSessionInfo';
import { useSessionSetup } from '../../../hooks/useSessionSetup';
import ModelSelector from './ModelSelector';
import AgentTypeSelector from './AgentTypeSelector';

interface SessionSetupSectionProps {
  className?: string;
  borderClass?: string;
}

const SessionSetupSection: React.FC<SessionSetupSectionProps> = React.memo(({
  className = '',
  borderClass = 'border-gray-200 dark:border-gray-700'
}) => {
  const {
    selectedModel,
    selectedAgentType,
    newSessionName,
    availableModels,
    agentTypes,
    currentSession,
    canCreateSession,
    onModelSelect,
    onAgentTypeSelect,
    onNameChange,
    onCreateSession
  } = useSessionSetup();

  return (
    <div className={`px-2 py-2 border-b ${borderClass} flex-shrink-0 ${className}`}>
      <h2 className="text-xs uppercase font-semibold tracking-wider mb-2 px-1">Setup New Chat</h2>
      
      <ModelSelector 
        models={availableModels}
        selectedModel={selectedModel} 
        onChange={onModelSelect} 
      />
      
      <AgentTypeSelector 
        agentTypes={agentTypes}
        selectedAgentType={selectedAgentType}
        onChange={onAgentTypeSelect}
      />
      
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1 dark:text-gray-300">
          Nome da Sessão (opcional)
        </label>
        <input
          type="text"
          className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Nova Sessão"
          value={newSessionName}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Nome da sessão"
        />
      </div>
      
      <AnimatedButton 
        className="w-full mt-3 border border-purple-500 bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded text-sm flex items-center justify-center"
        onClick={onCreateSession}
        disabled={!canCreateSession}
        title={!canCreateSession 
          ? "Selecione um modelo e tipo de agente primeiro" 
          : "Iniciar nova sessão"
        }
        aria-disabled={!canCreateSession}
      >
        <FiPlus className="w-4 h-4 mr-2" aria-hidden="true" />
        Nova Sessão de Chat
      </AnimatedButton>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <h3 className="text-xs uppercase font-semibold tracking-wider mb-1 px-1">Active Session</h3>
        <ActiveSessionInfo activeSession={currentSession} />
      </div>
    </div>
  );
});

export default SessionSetupSection; 