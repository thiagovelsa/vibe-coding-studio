/**
 * Representa uma User Story para guiar o desenvolvimento
 */
export interface UserStory {
  /** Identificador único da User Story */
  id: string;
  
  /** Título da User Story */
  title: string;
  
  /** Descrição no formato "Como..., eu quero..., para..." */
  description: string;
  
  /** Critérios de aceitação */
  acceptanceCriteria: string[];
  
  /** Prioridade (alta, média, baixa ou valor numérico) */
  priority: string | number;
  
  /** Complexidade estimada (alta, média, baixa ou valor numérico) */
  complexity?: string | number;
  
  /** Informações técnicas adicionais */
  technicalNotes?: string;
  
  /** Tags para categorização */
  tags?: string[];
  
  /** Estado atual da User Story */
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  
  /** Role of the user story */
  role: string;
  
  /** Goal of the user story */
  goal: string;
  
  /** Reason for the user story */
  reason: string;
  
  /** Dependencies on other user stories */
  dependencies?: string[];
  
  /** Notes about the user story */
  notes?: string;
} 