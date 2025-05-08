import { UserStory } from './user-story.interface';
import { ValidationResult } from './validation-result.interface';

/**
 * Interface que define os métodos e propriedades do agente de produto
 */
export interface ProductAgent {
  /**
   * Tipo do agente
   */
  readonly type: 'product';
  
  /**
   * Verifica se o agente está disponível
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Retorna as capacidades do agente
   */
  getCapabilities(): string[];
  
  /**
   * Executa o agente com os parâmetros fornecidos
   * @param input Parâmetros de entrada
   * @param context Contexto opcional
   */
  execute(input: Record<string, any>, context?: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Analisa um requisito e gera user stories
   * @param requirement Texto do requisito
   * @param feedback Feedback opcional
   */
  analyzeRequirement(requirement: string, feedback?: string): Promise<UserStory[]>;
  
  /**
   * Valida código contra user stories
   * @param code Código gerado
   * @param userStories User stories a validar
   */
  validateCode(code: any, userStories: UserStory[]): Promise<ValidationResult>;
} 