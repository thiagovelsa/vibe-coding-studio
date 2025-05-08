/**
 * Estrutura padronizada para a resposta de um agente.
 */
export interface AgentResponse {
  /** Status da execução pelo agente. */
  status: 'success' | 'error' | 'partial_success' | 'requires_feedback';

  /** Os dados de resultado principais retornados pelo agente. */
  data?: any; // Could be UserStory[], code string, validation results, etc.

  /** Mensagem informativa ou de erro. */
  message?: string;

  /** Metadados adicionais (e.g., tokens usados, tempo de execução). */
  metadata?: Record<string, any>;
} 