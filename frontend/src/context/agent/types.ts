import { ReactElement } from 'react';
import { 
  ChatSession as ApiChatSession,
  ChatMessage as ApiChatMessage,
  AgentType as ApiAgentType,
  TriggerResult,
  TriggerTestGenerationPayload,
  TriggerSecurityAnalysisPayload,
  TriggerTestSimulationPayload,
  TriggerTestFixValidationPayload,
  TriggerSecurityFixVerificationPayload,
  UpdateSessionPayload
} from '../../services/agent-api.service';

// Interface para as funções de atualização da lista de sessões que o AgentContext precisa
export interface SessionListUpdaters {
  addSessionToList: (session: ApiChatSession) => void;
  updateSessionInList: (session: ApiChatSession) => void;
  updateSessionTitle: (sessionId: string, title: string) => Promise<ApiChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>; // Confirmado que é usado em AgentContext
}

// Tipo para Modelos de IA
export interface AIModel {
  id: string;
  name: string;
  provider?: string;
  icon?: React.ElementType;
  capabilities?: string[];
}

// Interface básica para ChatSession 
export interface ChatSession {
  id: string;
  agentType: ApiAgentType; 
  createdAt: string;
  updatedAt: string;
  title?: string;
  modelId?: string;
  orchestratorState?: any; 
  messages?: ApiChatMessage[];
}

// Estado global do AgentContext
export interface AgentState {
  // Sessões e estado ativo
  sessions: Record<string, ApiChatSession>;
  activeChatSessionId: string | null;
  isLoadingSession: Record<string, boolean>;
  
  // Estado de erro e conexão
  error: string | null;
  isConnected: boolean;
  
  // Modelos de IA
  availableModels: AIModel[];
  selectedModelId: string | null;
  
  // Resultados de trigger
  lastTriggerResult: TriggerResult | null;
}

// União discriminada de todas as ações possíveis
export type AgentAction =
  // Sessão
  | { type: 'LOAD_SESSION_START'; payload: { sessionId: string } }
  | { type: 'LOAD_SESSION_SUCCESS'; payload: ApiChatSession }
  | { type: 'LOAD_SESSION_FAILURE'; payload: { sessionId: string, error: string } }
  | { type: 'CREATE_SESSION_START' }
  | { type: 'CREATE_SESSION_SUCCESS'; payload: ApiChatSession }
  | { type: 'CREATE_SESSION_FAILURE'; payload: string }
  | { type: 'CLEAR_SESSION'; payload: { sessionId: string } }
  | { type: 'SET_ACTIVE_CHAT_SESSION'; payload: string | null }
  
  // Erro e conexão
  | { type: 'SET_ERROR'; payload: string | null } 
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  
  // Modelos
  | { type: 'SET_AVAILABLE_MODELS'; payload: AIModel[] }
  | { type: 'SET_SELECTED_MODEL'; payload: string | null }
  
  // Trigger
  | { type: 'SET_TRIGGER_RESULT'; payload: TriggerResult | null }
  | { type: 'CLEAR_LAST_TRIGGER_RESULT' }
  | { type: 'RECEIVE_TRIGGER_RESULT'; payload: TriggerResult }
  
  // Updates/Deletes
  | { type: 'UPDATE_SESSION_SUCCESS'; payload: ApiChatSession }
  | { type: 'DELETE_SESSION_SUCCESS'; payload: { sessionId: string } }
  | { type: 'UPDATE_SESSION_MESSAGES'; payload: { sessionId: string, messages: ApiChatMessage[] } };

// Interface do Context
export interface AgentContextType {
  state: AgentState;
  dispatch?: React.Dispatch<AgentAction>;
  
  // Funções para gerenciar sessões
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (agentType: ApiAgentType, modelId?: string | null) => Promise<ApiChatSession | null>;
  clearSession: (sessionId: string) => void;
  setActiveChatSession: (sessionId: string | null) => void;
  
  // Funções para gerenciar estado geral
  clearError: () => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setSelectedModel: (modelId: string | null) => void;
  
  // Funções de trigger
  triggerTestGeneration: (payload: TriggerTestGenerationPayload) => Promise<void>;
  triggerSecurityAnalysis: (payload: TriggerSecurityAnalysisPayload) => Promise<void>;
  triggerTestSimulation: (payload: TriggerTestSimulationPayload) => Promise<void>;
  triggerTestFixValidation: (payload: TriggerTestFixValidationPayload) => Promise<void>;
  triggerSecurityFixVerification: (payload: TriggerSecurityFixVerificationPayload) => Promise<void>;
  clearLastTriggerResult: () => void;
  
  // Funções de Update/Delete
  updateSession: (sessionId: string, payload: UpdateSessionPayload) => Promise<ApiChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<ApiChatSession | null>;

  // Função para registrar updaters da lista de sessões
  registerSessionListUpdaters: (updaters: SessionListUpdaters) => void;
}

// Re-exportação de tipos da API para facilitar o uso
export {
  ApiChatSession,
  ApiChatMessage,
  ApiAgentType,
  TriggerResult,
  TriggerTestGenerationPayload,
  TriggerSecurityAnalysisPayload,
  TriggerTestSimulationPayload,
  TriggerTestFixValidationPayload,
  TriggerSecurityFixVerificationPayload,
  UpdateSessionPayload
}; 