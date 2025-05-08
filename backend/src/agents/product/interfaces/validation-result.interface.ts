/**
 * Representa o resultado da validação de código gerado
 */
export interface ValidationResult {
  /** Indica se o código passa na validação */
  valid: boolean;
  
  /** Pontuação de qualidade (0-10) */
  score: number;
  
  /** Comentários sobre a qualidade do código */
  comments: string;
  
  /** Indica se o código atende aos requisitos */
  matchesRequirements: boolean;
  
  /** Indica se o código precisa de revisão */
  needsRevision: boolean;
  
  /** Feedback geral sobre o código */
  feedback: string;
  
  /** Recursos/funcionalidades que faltam no código */
  missingFeatures: string[];
  
  /** Recursos/funcionalidades extras implementados no código */
  extraFeatures: string[];
  
  /** Problemas encontrados */
  issues?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    suggestion?: string;
    location?: string;
  }>;
  
  /** Sugestões de melhoria */
  suggestions?: string[];
  
  /** Requisitos que foram atendidos */
  fulfilledRequirements?: string[];
  
  /** Requisitos que não foram atendidos */
  missingRequirements?: string[];
  
  /** Artefatos validados */
  artifacts?: string[];
} 