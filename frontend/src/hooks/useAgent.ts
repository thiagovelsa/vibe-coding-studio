import { useContext } from 'react';
import { AgentContext, AgentType } from '../context/AgentContext';

/**
 * Hook para acessar as funcionalidades de agentes IA
 * @param agentType Tipo opcional de agente específico para interagir
 * @returns Funções e estado para interagir com agentes
 */
export function useAgent(agentType?: AgentType) {
  const context = useContext(AgentContext);
  
  if (context === undefined) {
    throw new Error('useAgent deve ser usado dentro de um AgentProvider');
  }
  
  // Se um tipo de agente específico for solicitado, retorna apenas as funções e estado relevantes
  if (agentType) {
    const { state, sendMessage, clearMessages } = context;
    
    const agentInfo = state.agents[agentType];
    
    return {
      status: agentInfo.status,
      messages: agentInfo.messages,
      capabilities: agentInfo.capabilities || [],
      lastUpdated: agentInfo.lastUpdated,
      isActive: state.activeAgent === agentType,
      isConnected: state.isConnected,
      
      // Funções específicas para o agente
      sendMessage: (content: string, metadata?: Record<string, any>) => 
        sendMessage(agentType, content, metadata),
      clearMessages: () => clearMessages(agentType),
    };
  }
  
  // Retorna o contexto completo se nenhum tipo específico for solicitado
  return context;
} 