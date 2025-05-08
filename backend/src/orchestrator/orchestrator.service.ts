import { Injectable, OnModuleInit, InternalServerErrorException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ProductAgentService } from '../agents/product/product-agent.service';
import { CoderAgentService } from '../agents/coder/coder-agent.service';
import { TestAgentService } from '../agents/test/test-agent.service';
import { SecurityAgentService } from '../agents/security/security-agent.service';
import { LoggerService } from '@logger/logger.service';
import { 
  AgentType 
} from './interfaces/workflow.interface';
import { AgentInterface, AgentResponse } from '../agents/interfaces';
import { ChatMessage, ChatMessageRole } from '../common/interfaces/chat.interface';
import { SessionEntity, SessionStatus } from '../database/entities/session.entity';
import { ChatMessageEntity } from '../database/entities/chat_message.entity';
import { LlmService } from '../llm/llm.service';
import { AgentTask } from '@orchestrator/interfaces/agent-task.interface';
import { 
    OrchestratorState, 
    OrchestratorStep, 
    OrchestratorStepStatus 
} from './interfaces/orchestrator-state.interface';

/**
 * Serviço responsável pela orquestração de fluxos de trabalho e tarefas entre agentes
 */
@Injectable()
export class OrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(OrchestratorService.name);
  
  constructor(
    private eventEmitter: EventEmitter2,
    private llmService: LlmService,
    private productAgent: ProductAgentService,
    private coderAgent: CoderAgentService,
    private testAgent: TestAgentService,
    private securityAgent: SecurityAgentService,
    private readonly loggerService: LoggerService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private messageRepository: Repository<ChatMessageEntity>,
  ) {}
  
  /**
   * Inicializa o serviço quando o módulo NestJS é carregado
   */
  onModuleInit(): void {
    this.logger.log('OrchestratorService Initialized');
  }
  
  /**
   * Retorna o emissor de eventos para uso externo
   * @returns EventEmitter2 instância
   */
  getEventEmitter(): EventEmitter2 {
    return this.eventEmitter;
  }
  
  /**
   * Adiciona ou atualiza um passo no estado do orquestrador da sessão e salva no DB
   */
  private async updateOrchestratorStep(
    session: SessionEntity,
    stepData: Partial<OrchestratorStep> & { agentType: AgentType },
    status: OrchestratorStepStatus,
    error?: string,
  ): Promise<SessionEntity> {
    if (!session.orchestratorState) {
      // This case should be rare due to default initialization in SessionEntity
      this.logger.warn(`Session ${session.id} missing orchestratorState. Initializing.`);
      session.orchestratorState = { status: 'idle', steps: [], context: {} };
    }
    if (!session.orchestratorState.steps) {
        session.orchestratorState.steps = [];
    }
    if (!session.orchestratorState.context) { // Ensure context exists
        session.orchestratorState.context = {};
    }

    const now = new Date().toISOString();
    const stepIndex = session.orchestratorState.steps.length;

    if (status === 'in_progress') {
        session.orchestratorState.steps.push({
            step: stepIndex + 1,
            agentType: stepData.agentType,
            status: 'in_progress',
            startTime: now,
            inputSummary: stepData.inputSummary,
        });
         session.orchestratorState.status = 'running';
         session.orchestratorState.currentAgent = stepData.agentType;
    } else {
        const lastStepIndex = session.orchestratorState.steps.length - 1;
        if (lastStepIndex >= 0 && session.orchestratorState.steps[lastStepIndex].status === 'in_progress') {
             session.orchestratorState.steps[lastStepIndex].status = status;
             session.orchestratorState.steps[lastStepIndex].endTime = now;
             session.orchestratorState.steps[lastStepIndex].error = error;
             session.orchestratorState.steps[lastStepIndex].outputSummary = stepData.outputSummary;
        } else {
            this.logger.warn(`[Session: ${session.id}] Attempted to complete step, but no step was in progress.`);
        }
        if (status === 'completed' || status === 'error') {
             session.orchestratorState.status = status === 'completed' ? 'completed' : 'failed';
             session.orchestratorState.currentAgent = undefined;
        }
    }

    try {
        return await this.sessionRepository.save(session);
    } catch (dbError: any) {
        this.logger.error(`Failed to save session ${session.id} after updating orchestrator state: ${dbError.message}`, dbError.stack);
        throw new InternalServerErrorException('Failed to save workflow state.');
    }
  }

  /**
   * Método handleUserMessage atualizado
   * @param session SessionEntity
   * @param userMessage ChatMessageEntity
   * @returns { content: string; agentType?: string; metadata?: any }
   */
  async handleUserMessage(
    session: SessionEntity, 
    userMessage: ChatMessageEntity
  ): Promise<{ 
    content: string; 
    agentType?: AgentType; 
    structuredOutput?: any; 
    metadata?: any; 
   }> { 
    this.logger.log(`Handling user message ${userMessage.id} for session ${session.id}`);

    const historyEntities = await this.messageRepository.find({
      where: { sessionId: session.id },
      order: { timestamp: 'ASC' } 
    });

    let feedbackContext = '';
    if (historyEntities.length >= 2) {
      const lastAssistantMessage = historyEntities[historyEntities.length - 2];
      if (lastAssistantMessage.role === 'assistant' && (lastAssistantMessage.rating !== null || lastAssistantMessage.correction !== null)) {
        feedbackContext = `\n\nSystem Note on Previous Response:`;
        if (lastAssistantMessage.rating !== null) {
          feedbackContext += ` Rating=${lastAssistantMessage.rating === 1 ? '👍' : (lastAssistantMessage.rating === -1 ? '👎' : 'Neutral')}.`;
        }
        if (lastAssistantMessage.correction) {
          feedbackContext += ` User Correction: '${lastAssistantMessage.correction}'.`;
        }
        feedbackContext += ` Please adjust your response accordingly.`;
        this.logger.log(`Including feedback for session ${session.id}: ${feedbackContext}`);
      }
    }

    const historyInterface: ChatMessage[] = historyEntities.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      sessionId: m.sessionId,
      agentType: m.agentType,
      metadata: m.metadata,
      rating: m.rating,
      correction: m.correction
    }));

    let orchestratorState = session.orchestratorState;
    if (!orchestratorState) { // Should be initialized by default
      this.logger.warn(`Orchestrator state for session ${session.id} was null/undefined. Re-initializing.`);
      orchestratorState = { status: 'idle', steps: [], context: {}, currentAgent: undefined };
      session.orchestratorState = orchestratorState; // Assign back to session
    }
    if (!orchestratorState.context) orchestratorState.context = {}; // Double ensure context
    
    const initialAgentType = this.routeUserMessage(orchestratorState, historyInterface);
    
    if (!initialAgentType) {
       return { content: "Workflow complete or cannot determine next step." };
    }
    orchestratorState.currentAgent = initialAgentType;
    const agentInstance = this.getAgentInstance(initialAgentType);
    if (!agentInstance) {
       throw new InternalServerErrorException(`Configuration error: Agent ${initialAgentType} not available.`);
    }
    this.logger.log(`Routing message to ${initialAgentType} agent for session ${session.id}`);

    const taskInput: Record<string, any> = {
        requirement: userMessage.content,
        history: historyInterface.slice(0, -1),
        feedbackContext: feedbackContext || null,
        ...(session.context || {})
    };
    try {
        this.logger.debug('Preparing specific context by analyzing history...');
        let relevantProductOutput: any = null;
        let relevantCoderOutput: any = null;
        let relevantTestOutput: any = null;
        let relevantSecurityOutput: any = null;

        const historyToScan = historyInterface.slice(0, -1);
        for (let i = historyToScan.length - 1; i >= 0; i--) {
             const msg = historyToScan[i];
            if (msg.role === 'assistant' && msg.metadata?.structuredOutput) {
                if (msg.agentType === 'product' && !relevantProductOutput) {
                    relevantProductOutput = msg.metadata.structuredOutput;
                }
                if (msg.agentType === 'coder' && !relevantCoderOutput) {
                    relevantCoderOutput = msg.metadata.structuredOutput;
                }
                 if (msg.agentType === 'test' && !relevantTestOutput) {
                     relevantTestOutput = msg.metadata.structuredOutput;
                 }
                 if (msg.agentType === 'security' && !relevantSecurityOutput) {
                     relevantSecurityOutput = msg.metadata.structuredOutput;
                 }
            }
            if (initialAgentType === 'coder' && relevantProductOutput) break;
            if (initialAgentType === 'test' && relevantCoderOutput && relevantProductOutput) break;
            if (initialAgentType === 'security' && relevantCoderOutput) break;
        }

        if (initialAgentType === 'coder' && relevantProductOutput) {
            taskInput.userStories = relevantProductOutput; 
        }
        if (initialAgentType === 'test') {
            if (relevantCoderOutput) taskInput.codeToTest = relevantCoderOutput; 
            if (relevantProductOutput) taskInput.userStories = relevantProductOutput;
        }
        if (initialAgentType === 'security') {
            if (relevantCoderOutput) taskInput.codeToAnalyze = relevantCoderOutput;
             if (relevantProductOutput) taskInput.userStories = relevantProductOutput; 
        }

        this.logger.debug(`Final task input keys for ${initialAgentType}: ${Object.keys(taskInput).join(', ')}`);

    } catch (contextError: any) {
        this.logger.error(`Error preparing agent context: ${contextError.message}`, contextError.stack);
    }

    const previousSteps = orchestratorState.steps || []; // orchestratorState definitely exists here
    
    if (initialAgentType === 'coder') {
      const productStep = previousSteps.find((s: OrchestratorStep) => s.agentType === AgentType.PRODUCT && s.status === 'completed');
      if (productStep && productStep.outputSummary) {
        try {
            const productOutput = JSON.parse(productStep.outputSummary); 
            if (productOutput.userStories) {
                taskInput.userStories = productOutput.userStories;
            }
        } catch (e) { this.logger.warn('Could not parse productStep.outputSummary for coder context'); }
      }
      if (orchestratorState.context?.userStories) {
          taskInput.userStories = orchestratorState.context.userStories;
      }
    } else if (initialAgentType === 'test') {
      const coderStep = previousSteps.find((s: OrchestratorStep) => s.agentType === AgentType.CODER && s.status === 'completed');
      if (coderStep && coderStep.outputSummary) {
         try {
            const coderOutput = JSON.parse(coderStep.outputSummary);
            if (coderOutput.code) {
                taskInput.contextCode = coderOutput.code;
                taskInput.contextLanguage = coderOutput.language || 'typescript';
            }
        } catch (e) { this.logger.warn('Could not parse coderStep.outputSummary for test context'); }
      }
      if (orchestratorState.context?.generatedCode) {
          taskInput.contextCode = orchestratorState.context.generatedCode.code;
          taskInput.contextLanguage = orchestratorState.context.generatedCode.language;
      }
      if (orchestratorState.context?.userStories) {
        taskInput.contextRequirements = orchestratorState.context.userStories;
      }
    } else if (initialAgentType === 'security') {
      const coderStep = previousSteps.find((s: OrchestratorStep) => s.agentType === AgentType.CODER && s.status === 'completed');
      if (coderStep && coderStep.outputSummary) {
         try {
            const coderOutput = JSON.parse(coderStep.outputSummary);
            if (coderOutput.code) {
                taskInput.contextCode = coderOutput.code;
                taskInput.contextLanguage = coderOutput.language || 'typescript';
            }
        } catch (e) { this.logger.warn('Could not parse coderStep.outputSummary for security context'); }
      }
      if (orchestratorState.context?.generatedCode) {
          taskInput.contextCode = orchestratorState.context.generatedCode.code;
          taskInput.contextLanguage = orchestratorState.context.generatedCode.language;
      }
    }

    session = await this.updateOrchestratorStep(session, {
        agentType: initialAgentType,
        inputSummary: JSON.stringify(taskInput).substring(0, 500)
    }, 'in_progress');
    orchestratorState = session.orchestratorState!; // State is guaranteed to be updated

    // Recreate agentTask here
    const agentTask: AgentTask = {
        id: uuidv4(),
        agentType: initialAgentType,
        input: taskInput,
        priority: 5, 
        status: 'pending', // Will be handled by agent
        createdAt: new Date(),
        updatedAt: new Date(),
        taskType: 'generate' // Default, specific agents might infer or be told differently
    };
     // Infer taskType for Coder based on context (example)
    if (initialAgentType === AgentType.CODER) {
        if (taskInput.securityIssues || taskInput.failedTests) {
            agentTask.taskType = 'fix';
        }
    }

    try {
      let response: AgentResponse = await agentInstance.handle(agentTask);
      
      let assistantResponseContent: string = response.message || 'An issue occurred.'; 
      let assistantStructuredOutput: any = response.data; 
      let nextAgentType: AgentType | null = null;
      let previousAgentType = initialAgentType;

      if (response.status === 'success') {
          this.logger.log(`Agent ${previousAgentType} task ${agentTask.id} successful.`);
          assistantResponseContent = response.message || 'Task completed successfully.'; 

          let auxiliaryTaskSuccess = true; 
          let auxiliaryResults: any = {
              testGeneration: null,
              securityAnalysis: null,
          }; 
          try {
              if (previousAgentType === 'coder') {
                  const codeOutput = response.data; 
                  const lastProductOutput = orchestratorState.context?.userStories;
                  if (codeOutput?.code && typeof codeOutput.code === 'string' && lastProductOutput) { 
                      const codeFilesMap = { [`generated.${codeOutput.language || 'ts'}`]: codeOutput.code };
                      this.logger.log(`Triggering automatic Test Generation after Coder success (code present).`);
                      const testGenResult = await this.runTestGeneration(session, codeFilesMap, Array.isArray(lastProductOutput) ? lastProductOutput : [lastProductOutput]);
                      if (!testGenResult || !Array.isArray(testGenResult.testFiles)) { 
                          throw new Error('Auxiliary task (Test Generation) failed to return valid data.');
                      }
                      if (orchestratorState.context) orchestratorState.context.generatedTests = testGenResult;
                      auxiliaryResults.testGeneration = testGenResult;
                      await this.sessionRepository.save(session); 
                      this.logger.log(`Test Generation finished. Files generated: ${testGenResult.testFiles.length}`);
                  } else {
                      this.logger.log("Skipping automatic Test Generation: Coder output missing code or User Stories context missing.");
                  }
              } 
              else if (previousAgentType === 'test') {
                   const lastCoderOutput = orchestratorState.context?.generatedCode;
                   const lastProductOutput = orchestratorState.context?.userStories;
                   if (lastCoderOutput?.code && lastProductOutput) {
                       const codeFilesMap = { [`generated.${lastCoderOutput.language || 'ts'}`]: lastCoderOutput.code };
                       this.logger.log(`Triggering automatic Security Analysis after Test success (previous code present).`);
                       const securityResult = await this.runSecurityAnalysis(session, codeFilesMap, lastProductOutput ? JSON.stringify(lastProductOutput) : null);
                       if (!securityResult || !Array.isArray(securityResult.potentialRisksIdentified)) {
                            throw new Error('Auxiliary task (Security Analysis) failed to return valid data.');
                       }
                       if (orchestratorState.context) orchestratorState.context.securityAnalysis = securityResult;
                       auxiliaryResults.securityAnalysis = securityResult;
                       await this.sessionRepository.save(session);
                       this.logger.log(`Security Analysis finished. Issues found: ${securityResult.potentialRisksIdentified.length}`);
                  } else {
                       this.logger.log("Skipping automatic Security Analysis: Missing generated code context from previous Coder step or user stories.");
                  }
              }
          } catch (auxError: any) {
               this.logger.error(`Error executing auxiliary task after ${previousAgentType}: ${auxError.message}`, auxError.stack);
               auxiliaryTaskSuccess = false;
               response.status = 'error'; 
               assistantResponseContent = `Main task (${previousAgentType}) succeeded, but the automatic follow-up task (${previousAgentType === 'coder' ? 'Test Generation' : 'Security Analysis'}) failed: ${auxError.message}`;
          }

          if (auxiliaryTaskSuccess) {
             nextAgentType = this.determineContinuationAgent(previousAgentType, response.data, agentTask.taskType);
             orchestratorState.currentAgent = nextAgentType;
             session.status = nextAgentType ? SessionStatus.ACTIVE : SessionStatus.COMPLETED; 
          } else {
             nextAgentType = null;
             orchestratorState.currentAgent = previousAgentType;
             session.status = SessionStatus.ERROR;
          }

      } else if (response.status === 'requires_feedback') {
          this.logger.log(`Agent ${previousAgentType} requires feedback.`);
          nextAgentType = null;
          orchestratorState.currentAgent = previousAgentType;
          session.status = SessionStatus.PAUSED;
          if (!orchestratorState.context) orchestratorState.context = {};
          orchestratorState.context.pausedReason = 'requires_feedback';
          orchestratorState.context.pausedMessage = response.message || 'Need more info.';
          assistantResponseContent = response.message || 'Preciso de mais informações para continuar.';
      } else { 
          this.logger.error(`Agent ${previousAgentType} handle task failed. Status: ${response.status}, Message: ${response.message}`);
          nextAgentType = null;
          orchestratorState.currentAgent = previousAgentType; 
          session.status = SessionStatus.ERROR;
          assistantResponseContent = response.message || `Agent ${previousAgentType} failed.`;
      }
      
       if (response.data && orchestratorState.context) {
           if (previousAgentType === 'product') orchestratorState.context.userStories = response.data;
           if (previousAgentType === 'coder') orchestratorState.context.generatedCode = response.data;
           if (previousAgentType === 'test') orchestratorState.context.testHandleOutput = response.data;
           if (previousAgentType === 'security') orchestratorState.context.securityHandleOutput = response.data;
       }
      
      session.orchestratorState = orchestratorState;
      if (session.status === SessionStatus.COMPLETED) session.completedAt = new Date();
      await this.sessionRepository.save(session);

      let nextTaskInput: Record<string, any> = {};
      let nextTaskTypeForAgent: AgentTask['taskType'] = 'generate'; // Default

      if (nextAgentType && orchestratorState.context) {
          this.logger.debug(`Preparing context for the next agent: ${nextAgentType}`);
          const currentState = orchestratorState.context;
          const lastProductOutput = currentState.userStories;
          const lastCoderOutput = currentState.generatedCode;
          const lastSecurityHandleOutput = currentState.securityHandleOutput;

          if (nextAgentType === 'coder') {
              nextTaskInput.userStories = lastProductOutput;
              if (previousAgentType === 'security' && lastSecurityHandleOutput?.potentialRisksIdentified?.length > 0) {
                   nextTaskInput.securityIssues = lastSecurityHandleOutput.potentialRisksIdentified;
                   nextTaskInput.previousCode = lastCoderOutput?.code;
                   nextTaskTypeForAgent = 'fix';
                   this.logger.log(`Setting taskType to 'fix' for Coder due to security issues.`);
              } else {
                   nextTaskTypeForAgent = 'generate';
              }
          } else if (nextAgentType === 'test') {
              nextTaskInput.codeToTest = lastCoderOutput; 
              nextTaskInput.userStories = lastProductOutput;
              nextTaskTypeForAgent = 'generate'; // Or 'simulate' depending on workflow
          } else if (nextAgentType === 'security') {
              nextTaskInput.codeToAnalyze = lastCoderOutput;
              nextTaskInput.userStories = lastProductOutput; 
              nextTaskTypeForAgent = 'analyze';
          }
          nextTaskInput.history = historyInterface;
          nextTaskInput.feedbackContext = feedbackContext || null;
      }

      if (nextAgentType) {
           // The orchestrator doesn't call itself recursively.
           // It prepares the state for the next interaction (e.g., next WebSocket message from client).
           this.logger.log(`Next agent determined: ${nextAgentType}. Task type for next step: ${nextTaskTypeForAgent}`);
      } 
      
      this.logger.log(`Orchestrator finished processing task for ${previousAgentType}. Next agent type set to: ${nextAgentType ?? 'None'}. Session status: ${session.status}`);
      
      return { 
        content: assistantResponseContent,
        agentType: previousAgentType,
        structuredOutput: assistantStructuredOutput, 
        metadata: { 
            ...(response.metadata || {}), 
            status: response.status,
            nextAgent: nextAgentType,
            nextTaskType: nextAgentType ? nextTaskTypeForAgent : undefined
        } 
      };
      
    } catch (error: any) {
       this.logger.error(`Critical error during Orchestrator handleUserMessage for agent ${initialAgentType}: ${error.message}`, error.stack);
       orchestratorState.currentAgent = initialAgentType;
       session.orchestratorState = orchestratorState;
       session.status = SessionStatus.ERROR;
       await this.sessionRepository.save(session);
       
       throw new InternalServerErrorException(`Orchestrator failed critically processing task for ${initialAgentType}: ${error.message}`);
    }
  }

  // --- Métodos Auxiliares --- 

  /** 
   * Determina o agente inicial baseado no estado e na mensagem do usuário.
   * (Lógica original de determineNextAgent focada na entrada do usuário).
   */
  private routeUserMessage(
    orchestratorState: OrchestratorState, 
    history: ChatMessage[] 
  ): AgentType | null {
     const currentAgent = orchestratorState.currentAgent;
     const lastMessage = history.length > 0 ? history[history.length - 1] : null;

     if (!currentAgent || lastMessage?.role === 'system') {
         this.logger.debug('Routing to ProductAgent: No current agent or last message was system message.');
        return AgentType.PRODUCT;
     }

     if (lastMessage && lastMessage.role === 'user') {
       const userContentLower = lastMessage.content.toLowerCase();
       if (userContentLower.includes('gerar código') || userContentLower.includes('escrever código') || userContentLower.includes('implementar')) return AgentType.CODER;
       if (userContentLower.includes('teste') || userContentLower.includes('testar') || userContentLower.includes('casos de teste')) return AgentType.TEST;
       if (userContentLower.includes('segurança') || userContentLower.includes('vulnerabilidade') || userContentLower.includes('security')) return AgentType.SECURITY;
       if (userContentLower.includes('requisitos') || userContentLower.includes('história') || userContentLower.includes('user story')) return AgentType.PRODUCT;
     }

     if (currentAgent) {
         this.logger.debug(`Routing to current agent: ${currentAgent}`);
         return currentAgent;
     }

     this.logger.debug('Routing to ProductAgent: Fallback.');
     return AgentType.PRODUCT;
  }

  /**
   * Determina o próximo agente no fluxo APÓS uma resposta bem-sucedida.
   * @param previousAgentType O tipo do agente que acabou de rodar.
   * @param responseData Os dados (`AgentResponse.data`) retornados pelo agente anterior (pode ser usado para lógicas mais complexas no futuro).
   * @returns O tipo do próximo agente, ou null se o fluxo deve parar/completar.
   */
  private determineContinuationAgent(
    previousAgentType: AgentType,
    responseData: any,
    previousTaskType?: AgentTask['taskType'] // Pass the taskType of the completed agent
  ): AgentType | null {
    this.logger.debug(`Determining continuation agent after ${previousAgentType} (Task Type: ${previousTaskType}). Response data: ${JSON.stringify(responseData).substring(0, 100)}...`);

    switch (previousAgentType) {
      case AgentType.PRODUCT:
        if (responseData && Array.isArray(responseData) && responseData.length > 0) {
          this.logger.log('Product Agent generated user stories. Transitioning to Coder Agent.');
          return AgentType.CODER;
        } else {
          this.logger.log('Product Agent did not generate user stories or returned empty. No automatic transition.');
          return null;
        }

      case AgentType.CODER:
        // If Coder was fixing something and succeeded, maybe stop or re-test.
        // If Coder generated new code, Test Agent is next (auxiliary already ran test generation).
        // Here we decide the next *main* agent.
        this.logger.log(`Coder Agent finished (Task Type: ${previousTaskType}). Transitioning to Test Agent for main handling.`);
        return AgentType.TEST;

      case AgentType.TEST:
        // If the Test agent's main 'handle' task was to simulate or validate, and it succeeded:
        if (responseData && responseData.success === true) { // Assuming TestAgent's handle response for simulation/validation has 'success'
          this.logger.log('Test Agent reported success. Transitioning to Security Agent.');
          return AgentType.SECURITY;
        } else if (responseData && responseData.success === false) {
          this.logger.log('Test Agent reported failure. Stopping for user feedback/intervention or potential Coder fix loop.');
          // For a Coder fix loop: return AgentType.CODER; (needs careful state management for taskType='fix')
          return null; 
        } else {
          this.logger.log('Test Agent finished. No clear success/failure for main task or unknown responseData. No automatic transition.');
          return null;
        }

      case AgentType.SECURITY:
        this.logger.log('Security Agent finished. Ending automatic workflow.');
        // If security issues were found (responseData might indicate this), a Coder 'fix' task could be next.
        // For now, stopping the automatic flow.
        return null;

      default:
        this.logger.warn(`Unknown previous agent type: ${previousAgentType}. No automatic transition defined.`);
        return null;
    }
  }

  private getAgentInstance(agentType: AgentType): AgentInterface | null {
      switch (agentType) {
          case AgentType.PRODUCT: return this.productAgent;
          case AgentType.CODER: return this.coderAgent;
          case AgentType.TEST: return this.testAgent;
          case AgentType.SECURITY: return this.securityAgent;
          default:
            this.logger.error(`No agent instance found for type: ${agentType}`); 
            return null;
      }
  }

  // --- Métodos Públicos para Acionar Capacidades Específicas --- 

  /**
   * Aciona diretamente a geração de código de teste pelo TestAgent.
   * @param session A entidade da sessão atual.
   * @param codeFiles Mapeamento path->conteúdo do código a ser testado.
   * @param userStories User stories ou requisitos relevantes.
   * @returns O objeto GenerateTestsResponse do agente.
   */
  async runTestGeneration(
      session: SessionEntity, 
      codeFiles: { [path: string]: string }, 
      userStories: any[]
  ): Promise<any> { // Retorna GenerateTestsResponse
      this.logger.log(`Orchestrator explicitly triggering Test Generation for session ${session.id}`);
      try {
          const result = await this.testAgent.generateTests(codeFiles, userStories);
          this.logger.log(`Test Generation completed for session ${session.id}. Framework: ${result?.testFramework}`);
          return result;
      } catch (error: any) {
          this.logger.error(`Error during explicit Test Generation for session ${session.id}: ${error.message}`, error.stack);
          return { explanation: `Error triggering test generation: ${error.message}`, testFiles: [] };
      }
  }

  /**
   * Aciona diretamente a simulação de execução de testes pelo TestAgent.
   * @param session A entidade da sessão atual.
   * @param codeFiles Código fonte.
   * @param testFiles Arquivos de teste gerados.
   * @returns O objeto TestResult do agente.
   */
  async runTestSimulation(
      session: SessionEntity, 
      codeFiles: { [path: string]: string }, 
      testFiles: { [path: string]: string }
  ): Promise<any> { // Retorna TestResult
      this.logger.log(`Orchestrator explicitly triggering Test Simulation for session ${session.id}`);
      try {
           const result = await this.testAgent.simulateTestExecution(codeFiles, testFiles);
          this.logger.log(`Test Simulation completed for session ${session.id}. Success: ${result?.success}`);
          return result;
      } catch (error: any) {
          this.logger.error(`Error during explicit Test Simulation for session ${session.id}: ${error.message}`, error.stack);
          return { success: false, passed: 0, failed: 0, total: 0, passRate: 0, failedTests: [], summary: `Error triggering test simulation: ${error.message}` };
      }
  }

  /**
   * Aciona diretamente a validação de correção de teste pelo TestAgent.
   * @param session A entidade da sessão atual.
   * @param codeFiles Código corrigido.
   * @param previousTestResult Resultado anterior que continha a falha.
   * @param originalCodeContext Código original (opcional).
   * @param originalPassingTestsContext Testes que passavam (opcional).
   * @returns O objeto ValidationFixResponse do agente.
   */
    async runTestFixValidation(
        session: SessionEntity,
        codeFiles: { [path: string]: string },
        previousTestResult: any,
        originalCodeContext?: string | null,
        originalPassingTestsContext?: string | null
    ): Promise<any> { // Retorna ValidationFixResponse
        this.logger.log(`Orchestrator explicitly triggering Test Fix Validation for session ${session.id}`);
         try {
            const result = await this.testAgent.validateFix(codeFiles, previousTestResult, originalCodeContext, originalPassingTestsContext);
            this.logger.log(`Test Fix Validation completed for session ${session.id}. Is valid: ${result?.isValid}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Error during explicit Test Fix Validation for session ${session.id}: ${error.message}`, error.stack);
            return { isValid: false, explanation: `Error triggering test fix validation: ${error.message}` };
        }
    }

  /**
   * Aciona diretamente a análise de segurança estática pelo SecurityAgent.
   * @param session A entidade da sessão atual.
   * @param codeFiles Código a ser analisado.
   * @param requirementsContext Contexto de requisitos (opcional).
   * @returns O objeto SecurityAnalysisResponse do agente.
   */
  async runSecurityAnalysis(
      session: SessionEntity, 
      codeFiles: { [path: string]: string }, 
      requirementsContext?: string | null
  ): Promise<any> { // Retorna SecurityAnalysisResponse
      this.logger.log(`Orchestrator explicitly triggering Security Analysis for session ${session.id}`);
        try {
            const result = await this.securityAgent.analyzeCode(codeFiles, requirementsContext);
            this.logger.log(`Security Analysis completed for session ${session.id}. Issues found: ${result?.potentialRisksIdentified?.length || 0}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Error during explicit Security Analysis for session ${session.id}: ${error.message}`, error.stack);
            return { summary: `Error triggering security analysis: ${error.message}`, potentialRisksIdentified: [] };
        }
  }

  /**
   * Aciona diretamente a verificação de correções de segurança pelo SecurityAgent.
   * @param session A entidade da sessão atual.
   * @param codeFiles Código corrigido.
   * @param previousAnalysis Análise anterior que continha as issues.
   * @param originalCodeContext Código original (opcional).
   * @returns O objeto SecurityFixVerificationResponse do agente.
   */
    async runSecurityFixVerification(
        session: SessionEntity,
        codeFiles: { [path: string]: string },
        previousAnalysis: any,
        originalCodeContext?: string | null
    ): Promise<any> { // Retorna SecurityFixVerificationResponse
        this.logger.log(`Orchestrator explicitly triggering Security Fix Verification for session ${session.id}`);
         try {
             const result = await this.securityAgent.verifyFixes(codeFiles, previousAnalysis, originalCodeContext);
            this.logger.log(`Security Fix Verification completed for session ${session.id}. Summary: ${result?.summary}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Error during explicit Security Fix Verification for session ${session.id}: ${error.message}`, error.stack);
            return { summary: `Error triggering security fix verification: ${error.message}`, verificationResults: [], newIssuesFound: [] };
        }
    }
} 