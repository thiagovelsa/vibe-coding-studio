// Tipos comuns utilizados em toda a aplicação

// Tipos de agentes suportados pelo sistema
export type AgentType = 'coder' | 'product' | 'security' | 'test';

// Estrutura de arquivo no sistema de arquivos
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
  children?: FileInfo[];
}

// Representação de uma sessão de chat
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  agentType: AgentType;
  modelId: string;
  messages?: ChatMessage[];
  status?: 'active' | 'archived' | 'deleted';
}

// Mensagem individual dentro de uma sessão de chat
export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  metadata?: Record<string, any>;
  rating?: number;
  correction?: string;
}

// Opções de configuração para criação de nova sessão
export interface CreateSessionOptions {
  title?: string;
  agentType: AgentType;
  modelId: string;
}

// Estado do orquestrador que gerencia fluxo entre agentes
export interface OrchestratorState {
  activeAgentType: AgentType | null;
  status: 'idle' | 'processing' | 'error';
  steps: OrchestratorStep[];
  error?: string;
  metadata?: Record<string, any>;
}

// Passo individual no fluxo de orquestração
export interface OrchestratorStep {
  id: string;
  agentType: AgentType;
  action: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  result?: any;
  error?: string;
} 