import { useState, useCallback } from 'react';
import { AIModel, useAgentContext } from '../context/AgentContext';
import { AgentType } from '../types';

export interface SessionSetupState {
  selectedModel: AIModel | null;
  selectedAgentType: AgentType | null;
  newSessionName: string;
}

export function useSessionSetup() {
  const { 
    createSession, 
    availableModels, 
    currentSession,
  } = useAgentContext();
  
  // Estado local para configuração de nova sessão
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(
    availableModels.length > 0 ? availableModels[0] : null
  );
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType | null>(null);
  const [newSessionName, setNewSessionName] = useState('');

  // Handler para seleção de modelo
  const handleModelSelect = useCallback((model: AIModel | null) => {
    setSelectedModel(model);
  }, []);

  // Handler para seleção de tipo de agente
  const handleAgentTypeSelect = useCallback((agentType: AgentType) => {
    setSelectedAgentType(agentType);
  }, []);

  // Handler para atualização do nome da sessão
  const handleNameChange = useCallback((name: string) => {
    setNewSessionName(name);
  }, []);

  // Handler para criar nova sessão
  const handleCreateSession = useCallback(() => {
    if (selectedModel && selectedAgentType) {
      createSession({
        title: newSessionName.trim() || 'Nova Sessão',
        agentType: selectedAgentType,
        modelId: selectedModel.id
      });
      
      // Reset do input após criar a sessão
      setNewSessionName('');
    }
  }, [selectedModel, selectedAgentType, newSessionName, createSession]);

  // Verificar se todos os dados necessários foram selecionados
  const canCreateSession = Boolean(selectedModel && selectedAgentType);

  // Lista dos tipos de agentes disponíveis
  const agentTypes = [
    { id: 'coder', name: 'Coding Agent', description: 'Helps with coding tasks, bug fixing, and code review' },
    { id: 'product', name: 'Product Agent', description: 'Assists with product requirements and specifications' },
    { id: 'security', name: 'Security Agent', description: 'Analyzes code for security vulnerabilities' },
    { id: 'test', name: 'Test Agent', description: 'Generates test cases and helps with testing' }
  ];

  return {
    // Estado
    selectedModel,
    selectedAgentType,
    newSessionName,
    availableModels,
    agentTypes,
    currentSession,
    canCreateSession,
    
    // Handlers
    onModelSelect: handleModelSelect,
    onAgentTypeSelect: handleAgentTypeSelect,
    onNameChange: handleNameChange,
    onCreateSession: handleCreateSession
  };
} 