/**
 * Representa uma tarefa a ser executada por um agente específico
 */
export interface AgentTask {
  /** Identificador único da tarefa */
  id: string;
  
  /** Tipo de agente que executará a tarefa */
  agentType: 'product' | 'coder' | 'test' | 'security' | 'refactor' | 'review';
  
  /** Dados de entrada para o agente */
  input: Record<string, any>;
  
  /** ID da tarefa pai, se esta for uma subtarefa */
  parentTaskId?: string;
  
  /** Prioridade da tarefa (menor valor = maior prioridade) */
  priority: number;
  
  /** Estado atual da tarefa */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  
  /** Resultados da execução da tarefa */
  output?: Record<string, any>;
  
  /** Timestamp de criação */
  createdAt: Date;
  
  /** Timestamp da última atualização */
  updatedAt: Date;
  
  /** Timestamp de conclusão */
  completedAt?: Date;
  
  /** Tipo específico da tarefa (e.g., generate, fix, analyze) */
  taskType?: 'generate' | 'fix' | 'analyze' | 'simulate' | 'validate_fix' | string; // Allow other string for custom task types
} 