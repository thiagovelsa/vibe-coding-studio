import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { LlmService } from '@llm/llm.service';
import { LoggerService } from '@logger/logger.service';
import { PromptLoaderService } from '../common/prompt-loader.service';
import { UserStory } from '../product/interfaces';
import { CodeGenerationRequest, CodeGenerationResult } from './interfaces';
import { AgentInterface, AgentResponse } from '../interfaces';
import { AgentTask } from '@orchestrator/interfaces/agent-task.interface';
import { ChatMessage } from '../../common/interfaces/chat.interface';
import { v4 as uuidv4 } from 'uuid';

interface GeneratedCode {
  files: { [path: string]: string };
  summary: string;
  technologies: string[];
  dependencies: { [name: string]: string };
}

interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  failedTests: { name: string, message: string }[];
}

interface SecurityIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  recommendation: string;
}

interface SecurityReport {
  hasIssues: boolean;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: SecurityIssue[];
  summary: string;
}

interface CoderAgentLLMResponse {
  explanation: string;
  files: Array<{ name: string; content: string; language?: string }>;
  dependencies?: string[];
  instructions?: string;
}

/**
 * Interface defining the expected structure of task.input for CoderAgentService
 */
interface CoderTaskInput {
    requirement: string;
    history?: ChatMessage[];
    userStories?: UserStory[];
    existingCode?: string;
    language?: string;
    framework?: string;
    patterns?: string[];
    feedbackContext?: string | null;
    previousCode?: { code: string; language: string; } | null;
    failedTests?: any | null;
    securityIssues?: any | null;
    taskType?: 'generate' | 'fix';
}

/**
 * Agente responsável por gerar código a partir de especificações
 */
@Injectable()
export class CoderAgentService implements AgentInterface {
  readonly type = 'coder';
  
  private readonly logger = new Logger(CoderAgentService.name);
  private agentName = 'CoderAgent';
  
  /** Linguagens de programação suportadas pelo agente */
  private readonly supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'go',
    'ruby', 'php', 'rust', 'html', 'css', 'sql'
  ];
  
  /** Frameworks suportados pelo agente */
  private readonly supportedFrameworks = {
    'javascript': ['react', 'vue', 'angular', 'express', 'nest', 'next'],
    'typescript': ['react', 'vue', 'angular', 'express', 'nest', 'next'],
    'python': ['django', 'flask', 'fastapi', 'pytorch', 'tensorflow'],
    'java': ['spring', 'jakarta-ee', 'android'],
    'csharp': ['aspnet', 'wpf', 'xamarin', 'unity'],
  };
  
  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LlmService,
    private readonly loggerService: LoggerService,
    private readonly promptLoader: PromptLoaderService,
  ) {
    this.logger.log(`${this.agentName} initialized`);
  }
  
  /**
   * Processa a tarefa de geração/modificação de código.
   * @param task A tarefa completa do agente, contendo o input necessário.
   * @returns Uma AgentResponse estruturada com o resultado da geração de código.
   */
  async handle(task: AgentTask): Promise<AgentResponse> {
    this.logger.log(`Handling task ${task.id} for agent ${this.agentName}`);
    this.logger.debug(`Task input: ${JSON.stringify(task.input)}`);

    // Validar e extrair dados do input da tarefa
    const input = task.input as CoderTaskInput;
    if (!input || typeof input !== 'object' || !input.requirement) {
        this.logger.warn(`Task ${task.id} has invalid or missing input/requirement.`);
        return {
            status: 'error',
            message: `Input validation failed: Task input is invalid or missing the required 'requirement' field.`,
        };
    }

    // Extrair dados com defaults
    const { 
        requirement,
        history = [], 
        userStories = [],
        existingCode = null,
        language = 'typescript', // Default language
        framework = null,
        patterns = [],
        feedbackContext = null,
        previousCode = null, // Vindo de execução anterior do Coder
        failedTests = null, // Vindo do Test Agent (se falhou)
        securityIssues = null, // Vindo do Security Agent (se encontrou)
        taskType = 'generate' // Default para gerar, pode ser 'fix'
    } = input;

    // Formatar histórico para o prompt
    const formattedHistory = history
        .map(msg => `${msg.role === 'user' ? 'User' : (msg.role === 'assistant' ? `Assistant (${msg.agentType || 'Coder'})` : 'System')}: ${msg.content}`)
        .join('\n\n');
    const formattedUserStories = userStories ? JSON.stringify(userStories, null, 2) : null;
    const formattedPreviousCode = previousCode?.code || null; // Extrai o código do objeto { code, language }
    const formattedLanguage = previousCode?.language || 'typescript'; // Assume TS se não especificado

    // Preparar contexto de correção
    let fixContext: string | null = null;
    if (taskType === 'fix') {
        if (failedTests && Array.isArray(failedTests) && failedTests.length > 0) {
            fixContext = `Focus on fixing these failed tests:\n${JSON.stringify(failedTests, null, 2)}`;
        } else if (securityIssues && Array.isArray(securityIssues) && securityIssues.length > 0) {
            fixContext = `Focus on fixing these security issues:\n${JSON.stringify(securityIssues, null, 2)}`;
        }
        if (!formattedPreviousCode) {
            this.logger.warn(`Task ${task.id} is a 'fix' task but previous code is missing.`);
             // Pode retornar erro ou tentar gerar mesmo assim?
             // Por ora, vamos deixar continuar, mas o prompt precisa lidar com isso.
        }
    }

    try {
        // Carregar o prompt
        const promptTemplate = await this.promptLoader.loadPrompt('coder', 'handle_interaction.hbs');
        if (!promptTemplate) {
            this.logger.error('Prompt template coder/handle_interaction.hbs not found!');
            return { status: 'error', message: 'Internal error: Coder prompt template not found.' };
        }

        // Preparar dados para o prompt Handlebars
        const promptData = {
            requirement,
            history: formattedHistory,
            userStories: formattedUserStories,
            previousCode: formattedPreviousCode,
            language: formattedLanguage,
            fixContext: fixContext,
            feedbackContext
        };

        // Renderizar o prompt final
        const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
        this.logger.debug(`Rendered CoderAgent prompt (Task ${task.id}). Type: ${taskType}`);

        // Chamar o LLM
        const llmResponse = await this.llmService.generate({
            prompt: finalPrompt,
            options: {
                temperature: 0.15,
                maxTokens: 4096,
            },
        });

        if (!llmResponse?.text) {
            this.logger.error('Failed to get AI response text', { model: llmResponse?.model });
            return {
                status: 'error',
                message: 'Failed to get AI response text',
            };
        }

        let parsedData: any;
        try {
            parsedData = JSON.parse(llmResponse.text);
        } catch (parseError) {
            this.logger.error('Failed to parse AI response text as JSON', { text: llmResponse.text, error: parseError });
            return {
                status: 'error',
                message: 'Failed to parse AI response as JSON. Response was: ' + llmResponse.text,
            };
        }
        
        // A validação do schema que estava em generateJsonResponse precisaria ser feita aqui.
        // Exemplo simplificado (assumindo que o schema original está disponível):
        const expectedSchema = { // Este é o schema que era passado para generateJsonResponse
            type: 'object',
            properties: {
                responseType: { type: 'string', enum: ['code_generated', 'code_modified', 'clarification', 'error'] },
                explanation: { type: 'string' },
                outputData: { 
                    type: 'object',
                    properties: {
                        code: { type: 'string' },
                        language: { type: 'string' }
                    },
                } 
            },
            required: ['responseType', 'explanation'] // 'outputData' não é sempre obrigatório
        };

        // Validação básica (uma biblioteca como AJV seria melhor para validação de schema complexa)
        if (typeof parsedData.responseType !== 'string' || !expectedSchema.properties.responseType.enum.includes(parsedData.responseType)) {
            this.logger.error('Parsed JSON responseType is invalid', { parsedData });
            return { status: 'error', message: 'AI response has invalid responseType.' };
        }
        if (typeof parsedData.explanation !== 'string') {
            this.logger.error('Parsed JSON explanation is invalid', { parsedData });
            return { status: 'error', message: 'AI response has invalid explanation.' };
        }
        // outputData pode não existir para todos os responseTypes
        if (parsedData.responseType === 'code_generated' || parsedData.responseType === 'code_modified') {
            if (!parsedData.outputData || typeof parsedData.outputData.code !== 'string' ) {
                 this.logger.error('Parsed JSON outputData.code is invalid for code generation/modification', { parsedData });
                 return { status: 'error', message: 'AI response for code generation/modification is missing code.' };
            }
            if (parsedData.outputData.language && typeof parsedData.outputData.language !== 'string') {
                 this.logger.error('Parsed JSON outputData.language is invalid', { parsedData });
                // Não necessariamente um erro fatal se a linguagem estiver faltando, pode assumir um default.
            }
        }

        let responseStatus: AgentResponse['status'] = 'success';
        if (parsedData.responseType === 'clarification') {
            responseStatus = 'requires_feedback';
        } else if (parsedData.responseType === 'error' || (responseStatus === 'success' && !parsedData.outputData?.code)) {
            // Considerar erro se deveria ter código mas não tem
            responseStatus = 'error';
            parsedData.explanation = parsedData.explanation || 'Agent indicated success but returned no code.';
        }

        this.logger.log(`Task ${task.id} completed successfully by CoderAgent.`);
        return {
            status: responseStatus,
            message: parsedData.explanation,
            data: parsedData.outputData
        };

    } catch (error) {
        // Captura erros antes da chamada LLM ou erros inesperados
        this.logger.error(`Critical error during CoderAgent handle execution for task ${task.id}: ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            status: 'error',
            message: `Sorry, I encountered a critical error processing your code request: ${errorMessage}`,
        };
    }
  }
  
  /**
   * Verifica se o agente está disponível para uso
   * @returns true se o agente estiver disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.llmService.isAvailable();
    } catch (error) {
      this.logger.error('CoderAgent is not available', error);
      return false;
    }
  }
  
  /**
   * Obtém a lista de habilidades suportadas pelo agente
   * @returns Array de strings com as habilidades suportadas
   */
  getCapabilities(): string[] {
    return [
      'generate_code',
      'modify_code',
      'refactor_code',
      'explain_code',
      'fix_code_errors',
      ...this.supportedLanguages,
      ...Object.values(this.supportedFrameworks).flat()
    ];
  }
  
  private guessLanguage(fileName?: string): string | undefined {
    if (!fileName) return undefined;
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'rb': return 'ruby';
      case 'php': return 'php';
      case 'rs': return 'rust';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sql': return 'sql';
      default: return undefined;
    }
  }
} 