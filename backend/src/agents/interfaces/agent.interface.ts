import { ChatMessage } from "../../common/interfaces/chat.interface";
import { AgentTask } from "../../orchestrator/interfaces/agent-task.interface";
import { AgentResponse } from "./agent-response.interface";

/**
 * Interface base LEGADA para agentes baseados em execução de tarefa única.
 * (Será substituída ou coexistirá com AgentInterface focada em conversação)
 */
export interface LegacyAgent {
    /**
     * Executa a tarefa principal do agente
     * @param input Dados de entrada para o agente
     * @param context Contexto adicional para execução
     * @returns Resultado da execução
     */
    execute(input: Record<string, any>, context?: Record<string, any>): Promise<Record<string, any>>;
    
    /**
     * Verifica se o agente está disponível para uso
     * (verifica configurações, dependências, etc.)
     * @returns true se o agente estiver disponível
     */
    isAvailable(): Promise<boolean>;
    
    /**
     * Obtém a lista de habilidades suportadas pelo agente
     * @returns Array de strings com as habilidades suportadas
     */
    getCapabilities(): string[];

    /**
     * Nome do tipo de agente
     */
    readonly type: 'product' | 'coder' | 'test' | 'security' | 'refactor' | 'review';
}

/**
 * Interface base para todos os agentes especializados do VibeForge.
 */
export interface AgentInterface {
    /**
     * Processa uma tarefa designada ao agente.
     * 
     * @param task - A tarefa completa do agente, contendo o input necessário.
     * @returns Uma promessa que resolve com uma AgentResponse estruturada.
     */
    handle(task: AgentTask): Promise<AgentResponse>;

    /**
     * Verifica se o agente está disponível para uso.
     * @returns true se o agente estiver disponível.
     */
    isAvailable(): Promise<boolean>;

    /**
     * Obtém a lista de habilidades ou capacidades do agente.
     * @returns Array de strings com as capacidades.
     */
    getCapabilities(): string[];

    /**
     * O tipo do agente (e.g., 'coder', 'product').
     */
    readonly type: string;

    // Outros métodos potenciais da interface do agente podem ser definidos aqui
} 