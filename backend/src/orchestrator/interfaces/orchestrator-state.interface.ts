import { AgentType } from './workflow.interface'; // Corrigido

// Enum ou tipo para status dos passos
export type OrchestratorStepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

// Interface para um passo no fluxo do orquestrador
export interface OrchestratorStep {
  step: number; // Número sequencial do passo
  agentType: AgentType; // Corrigido para AgentType
  status: OrchestratorStepStatus;
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  error?: string; // Mensagem de erro se status for 'error'
  inputSummary?: string; // Opcional: resumo do input para este agente
  outputSummary?: string; // Opcional: resumo do output deste agente
}

// Interface para o estado completo gerenciado pelo orquestrador
export interface OrchestratorState {
  currentAgent?: AgentType | null; // Changed to allow null
  status: 'idle' | 'running' | 'completed' | 'failed'; // Status geral do fluxo da sessão
  context?: Record<string, any>; // Contexto compartilhado se necessário (pode estar na SessionEntity)
  steps: OrchestratorStep[]; // Array com o histórico de passos executados
} 