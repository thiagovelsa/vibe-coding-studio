import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { LlmService } from '@llm/llm.service';
import { LoggerService } from '@logger/logger.service';
import { PromptLoaderService } from '../common/prompt-loader.service';
import { UserStory, ValidationResult } from './interfaces';
import { AgentInterface } from '@agents/interfaces/agent.interface';
import { ChatMessage } from '../../common/interfaces/chat.interface';
import { AgentTask } from '@orchestrator/interfaces/agent-task.interface';
import { AgentResponse } from '@agents/interfaces/agent-response.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agente responsável por analisar requisitos e criar especificações
 */
@Injectable()
export class ProductAgentService implements AgentInterface {
  private readonly logger = new Logger(ProductAgentService.name);
  private agentName = 'ProductAgent';
  public readonly type = 'product';
  
  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LlmService,
    private readonly loggerService: LoggerService,
    private readonly promptLoader: PromptLoaderService,
  ) {
    this.logger.log(`${this.agentName} initialized`);
  }
  
  /**
   * Processa a tarefa do agente com foco na análise de requisitos.
   * @param task A tarefa completa do agente, contendo input (requirement, history, feedback).
   * @returns Uma AgentResponse estruturada.
   */
  async handle(task: AgentTask): Promise<AgentResponse> {
    this.logger.log(`Handling task ${task.id} for agent ${this.agentName}`);
    this.logger.debug(`Task input: ${JSON.stringify(task.input)}`);

    // Extrair dados necessários do input da tarefa
    // Assumindo que o Orchestrator preenche task.input com { requirement: string, history: ChatMessage[], feedback?: string }
    const { requirement, history, feedback } = task.input as { 
      requirement?: string; 
      history?: ChatMessage[]; 
      feedback?: string 
    };

    if (!requirement) {
        this.logger.warn(`Task ${task.id} missing requirement in input.`);
        return {
            status: 'error',
            message: 'Input validation failed: Requirement text is missing in the task input.',
        };
    }
    
    const validHistory = history || []; // Usar array vazio se não houver histórico

    try {
        // TODO: Adicionar lógica para rotear para diferentes métodos (analyze, validate)
        // com base em task.input ou outro campo em AgentTask se necessário.
        // Por enquanto, assume que a tarefa é sempre para analisar.
        
        const userStories = await this.analyzeRequirement(requirement, validHistory, feedback);

        if (!userStories) {
             // analyzeRequirement agora pode retornar null em caso de erro de processamento interno
             this.logger.error(`Task ${task.id} failed: analyzeRequirement returned null.`);
             return {
                 status: 'error',
                 message: 'Failed to analyze requirement due to an internal processing error (e.g., prompt loading, LLM call failed, JSON parsing failed). Check logs for details.',
             };
        }

        // Se o LLM retornar array vazio (intencionalmente)
        if (userStories.length === 0) {
            this.logger.warn(`Task ${task.id}: LLM did not generate any user stories for the requirement.`);
            return {
                status: 'success', // Ou 'partial_success'? Decidir a semântica. Considerar 'success' por enquanto.
                message: "I analyzed the request, but couldn't identify specific user stories. Could you please provide more details or clarify the requirements?",
                data: [], // Retorna array vazio
            };
        }

        this.logger.log(`Task ${task.id} completed successfully with ${userStories.length} user stories.`);
        // Retorna sucesso com os dados das user stories
        return {
            status: 'success',
            data: userStories,
            message: `Successfully generated ${userStories.length} user stories.`,
        };

    } catch (error) {
        // Captura erros inesperados não tratados internamente em analyzeRequirement
        this.logger.error(`Critical error during ProductAgent handle execution for task ${task.id}: ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            status: 'error',
            message: `Sorry, I encountered a critical error processing your request: ${errorMessage}`,
        };
    }
  }
  
  /**
   * Verifica se o agente está disponível para uso
   * @returns true se o agente estiver disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Verifica se o LLM está disponível
      return await this.llmService.isAvailable();
    } catch (error) {
      this.logger.error('ProductAgent is not available', error);
      return false;
    }
  }
  
  /**
   * Obtém a lista de habilidades suportadas pelo agente
   * @returns Array de strings com as habilidades suportadas
   */
  getCapabilities(): string[] {
    return [
      'analyze_requirements',
      'create_user_stories',
      'prioritize_features',
      'generate_acceptance_criteria',
    ];
  }
  
  /**
   * Analisa um requisito e gera user stories estruturadas, usando histórico e feedback.
   * @param requirement Texto do requisito atual
   * @param history Histórico da conversa
   * @param feedback Feedback opcional (do usuário ou sistema)
   * @returns Array de user stories geradas, ou null em caso de erro interno irrecuperável.
   */
  async analyzeRequirement(
      requirement: string, 
      history: ChatMessage[], 
      feedback?: string
  ): Promise<UserStory[] | null> {
    this.logger.log(`Analyzing requirement: ${requirement.substring(0, 100)}...`);
    
    try {
      const promptTemplate = await this.promptLoader.loadPrompt(
        'product', 
        'analyze_requirement' // Nome do arquivo .hbs
      );
      
      if (!promptTemplate) {
        // Erro crítico se o prompt não for encontrado
        this.logger.error(`Prompt template 'product/analyze_requirement.hbs' not found!`);
        return null; // Indica falha
      }
      
      // Formatar histórico para o prompt
      const formattedHistory = history
          .map(msg => {
              let prefix = msg.role === 'user' ? 'User' : (msg.role === 'assistant' ? `Assistant (${msg.agentType || 'Unknown'})` : 'System');
              return `${prefix}: ${msg.content}`
          })
          .join('\n\n');

      // Preparar dados para renderizar o prompt
      const promptData = {
          requirement: requirement,
          history: formattedHistory,
          feedbackContext: feedback || null // Inclui o feedback opcional
      };

      // Renderizar o prompt final 
      const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
      this.logger.debug(`Rendered prompt for LLM: ${finalPrompt.substring(0, 300)}...`);
      
      // --- ADICIONADO: Chamada padronizada com generateJsonResponse --- 
      try {
          const llmResponse = await this.llmService.generate({
              prompt: finalPrompt,
              options: {
                  temperature: 0.1,
                  maxTokens: 3000,
                  // O system prompt pode ser incluído no prompt principal via HBS se necessário
              },
          });

          if (!llmResponse || !llmResponse.text) {
              this.logger.error(`ProductAgent analyzeRequirement LLM generation failed: No text in response`);
              return null;
          }

          let parsedData: any;
          try {
              parsedData = JSON.parse(llmResponse.text);
          } catch (parseError: any) {
              this.logger.error('ProductAgent: Failed to parse LLM response text as JSON', { text: llmResponse.text, error: parseError.message });
              return null;
          }

          // Validação do schema (o schema original estava no código comentado)
          const expectedSchema = {
              type: 'array',
              items: {
                  type: 'object',
                  properties: {
                      id: { type: 'string', description: "Unique identifier (optional, can be generated)" },
                      title: { type: 'string', description: "Short, descriptive title of the user story." },
                      role: { type: 'string', description: "The user role (e.g., As a user, As an admin)." },
                      goal: { type: 'string', description: "The action or goal the user wants to achieve." },
                      reason: { type: 'string', description: "The benefit or reason for the goal." },
                      acceptanceCriteria: {
                          type: 'array',
                          items: { type: 'string' },
                          description: "List of criteria that must be met for the story to be considered complete."
                      },
                      priority: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                          description: "Priority of the user story (high, medium, low)."
                      },
                      complexity: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                          description: "Estimated complexity (high, medium, low)."
                      }
                  },
                  required: ['title', 'role', 'goal', 'reason', 'acceptanceCriteria']
              }
          };

          // Validação básica (AJV seria melhor para validação de schema robusta)
          if (!Array.isArray(parsedData)) {
              this.logger.error('ProductAgent: Parsed JSON is not an array as expected by schema.', { responseData: parsedData });
              return null;
          }

          const userStories = parsedData as UserStory[];

          // Adicionar IDs se faltarem e normalizar campos
          const validatedStories = userStories.map((story: any) => {
              // Ensure priority and complexity are valid enum values or default
              const priorityStr = String(story.priority);
              const complexityStr = String(story.complexity);

              story.priority = priorityStr && expectedSchema.items.properties.priority.enum.includes(priorityStr) ? priorityStr : 'medium';
              story.complexity = complexityStr && expectedSchema.items.properties.complexity.enum.includes(complexityStr) ? complexityStr : 'medium';
              
              // Basic validation for required fields (adjust as per your UserStory interface)
              if (!story.title || !story.role || !story.goal || !story.reason || !Array.isArray(story.acceptanceCriteria)) {
                  this.logger.warn('ProductAgent: A user story is missing required fields after parsing.', { story });
                  // Decide se retorna null ou filtra essa história inválida.
                  // Por agora, vamos permitir, mas é um ponto de atenção.
              }
              return story;
          });

          this.logger.log(`Successfully generated and parsed ${validatedStories.length} user stories via generateJsonResponse.`);
          return validatedStories;

      } catch (error: any) { // Captura erros da chamada LLM ou parsing
          this.logger.error('ProductAgent: Failed during LLM call or JSON parsing in analyzeRequirement', { error: error.message });
          return null; // Indica falha para o handle tratar
      }
      // --- FIM ADICIONADO ---

    } catch (error: unknown) {
      // Erro antes da chamada LLM (ex: carregamento de prompt)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in analyzeRequirement setup: ${errorMessage}`, errorStack);
      return null; // Indica falha para o handle tratar
    }
  }
  
  /**
   * Valida se o código gerado atende aos requisitos das user stories
   * @param code Código gerado
   * @param userStories User stories a serem verificadas
   * @returns Resultado da validação
   */
  async validateCode(code: any, userStories: UserStory[]): Promise<ValidationResult> {
    this.logger.log(`Validando código contra ${userStories.length} user stories`);
    
    try {
      const promptTemplate = await this.promptLoader.loadPrompt(
        'product', 
        'validate_code'
      );
      
      if (!promptTemplate) {
        throw new Error('Não foi possível carregar o prompt para validação de código');
      }
      
      const codeFiles = code.files || {};
      const codeText = Object.entries(codeFiles)
        .map(([filename, content]) => `// Arquivo: ${filename}\n${content}`)
        .join('\n\n');
      
      const userStoriesText = JSON.stringify(userStories, null, 2);
      
      const prompt = promptTemplate
        .replace('{{user_stories}}', userStoriesText)
        .replace('{{code}}', codeText);
      
      const response = await this.llmService.generate({
        prompt,
        options: {
          temperature: 0.1, 
          maxTokens: 2000,
          systemPrompt: 'You are a product analyst validating if code meets requirements. Be thorough and objective.'
        },
        modelId: 'gpt-4' 
      });
      
      let validationResult: ValidationResult;
      try {
        validationResult = JSON.parse(response.text);
        if (validationResult.needsRevision === undefined) {
          validationResult.needsRevision = false;
        }
        if (validationResult.matchesRequirements === undefined) {
          validationResult.matchesRequirements = true;
        }
        if (validationResult.score === undefined) {
          validationResult.score = 7;
        }
        if (!Array.isArray(validationResult.missingFeatures)) {
          validationResult.missingFeatures = [];
        }
        if (!Array.isArray(validationResult.extraFeatures)) {
          validationResult.extraFeatures = [];
        }
        if (!validationResult.feedback) {
          validationResult.feedback = validationResult.needsRevision
            ? 'O código precisa de revisão para atender aos requisitos.'
            : 'O código atende aos requisitos especificados.';
        }
      } catch (error: unknown) {
         const errorMessage = error instanceof Error ? error.message : String(error);
         this.logger.error('Erro ao processar resposta do LLM para validação de código', error);
         throw new Error(`Falha ao processar a validação de código: ${errorMessage}`);
      }
      
      this.logger.log(`Validação de código concluída. Score: ${validationResult.score}/10. Necessita revisão: ${validationResult.needsRevision}`);
      return validationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro na validação de código: ${errorMessage}`, errorStack);
      throw error;
    }
  }
} 