import { AgentTask } from './agent-task.interface';

/**
 * Representa o estado completo de um fluxo de trabalho
 */
export interface WorkflowState {
  /** Identificador único do fluxo de trabalho */
  id: string;
  
  /** Nome descritivo do fluxo de trabalho */
  name?: string;
  
  /** Lista de todas as tarefas no fluxo de trabalho */
  tasks: AgentTask[];
  
  /** IDs das tarefas atualmente em execução */
  activeTaskIds: string[];
  
  /** Status geral do fluxo de trabalho */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  
  /** Contexto compartilhado entre todas as tarefas */
  context: Record<string, any>;
  
  /** Metadados opcionais para o fluxo de trabalho */
  metadata?: Record<string, any>;
  
  /** ID do usuário que iniciou o fluxo */
  userId?: string;
  
  /** Timestamp de criação */
  createdAt: Date;
  
  /** Timestamp da última atualização */
  updatedAt: Date;
  
  /** Timestamp de conclusão */
  completedAt?: Date;
} 