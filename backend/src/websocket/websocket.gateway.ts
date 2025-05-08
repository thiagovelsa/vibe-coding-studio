import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse as NestWsResponse,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { WebSocketService } from './websocket.service';
import { LoggerService } from '../logger/logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from '../database/entities/session.entity';
import { ChatMessageEntity } from '../database/entities/chat_message.entity';
import { AgentTask } from '../orchestrator/interfaces/agent-task.interface';
import { OrchestratorState } from '../orchestrator/interfaces/orchestrator-state.interface';

interface WebSocketMessage {
  type: string;
  payload: any;
}

// Placeholder for TestFile structure if not defined elsewhere
interface TestFile {
  path: string;
  content: string;
  framework?: string;
}

// Placeholder for what a "Workflow" might look like if getAllWorkflows was implemented
interface Workflow extends OrchestratorState { // Assuming a workflow is an enhanced OrchestratorState
  id: string; 
  name?: string;
  // tasks?: AgentTask[]; // Tasks might be part of OrchestratorState.steps or managed separately
}

// Placeholder for SocketEvent enum if not defined elsewhere
enum SocketEvent {
  ERROR = 'error',
  TEST_GENERATION_EXPLICIT_COMPLETED = 'test_generation_explicit_completed',
  RUN_TEST_GENERATION_EXPLICIT = 'run_test_generation_explicit',
  // Add other expected events
}

// Placeholder for WsResponseMessage interface if not defined elsewhere
interface WsResponseMessage<T = any> {
  event: SocketEvent | string; // Allow string for other events
  data: T;
}

/**
 * Gateway WebSocket principal da aplicação
 * Responsável pela comunicação em tempo real com o frontend
 */
@NestWebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  path: '/ws',
})
export class WebSocketGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  // Logger para registrar eventos do WebSocket
  private logger = new Logger('WebSocketGateway');
  
  // Servidor Socket.io
  @WebSocketServer()
  server!: Server;
  
  // Contador de clientes conectados
  private clientCount = 0;
  
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly webSocketService: WebSocketService,
    private readonly loggerService: LoggerService,
    @InjectRepository(SessionEntity)
    private sessionRepository: Repository<SessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private messageRepository: Repository<ChatMessageEntity>,
  ) {}
  
  onModuleInit() {
    this.logger.log('WebSocket Gateway inicializado');
    this.registerEventListeners();
  }
  
  /**
   * Registra os ouvintes de eventos do orquestrador
   */
  private registerEventListeners() {
    // Usando o método getter para obter o eventEmitter de forma segura
    const eventEmitter = this.orchestratorService.getEventEmitter();
    
    eventEmitter.on('task:created', (task) => {
      this.server.emit('task:created', task);
    });
    
    eventEmitter.on('task:updated', (task) => {
      this.server.emit('task:updated', task);
    });
    
    eventEmitter.on('task:completed', (task) => {
      this.server.emit('task:completed', task);
    });
    
    eventEmitter.on('workflow:updated', (workflow) => {
      this.server.emit('workflow:updated', workflow);
    });
  }
  
  /**
   * Método executado quando um cliente se conecta
   */
  handleConnection(client: Socket, ...args: any[]): any {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection_established', { message: 'Connected to WebSocket server' });
  }
  
  /**
   * Método executado quando um cliente se desconecta
   */
  handleDisconnect(client: Socket): any {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  
  /**
   * Envia o estado inicial do sistema para um cliente
   */
  private async sendInitialState(client: Socket) {
    try {
      // Envia o estado inicial para o cliente que acabou de conectar
      // const workflowsState = this.orchestratorService.getAllWorkflows(); // Method doesn't exist
      const workflowsState: Workflow[] = []; // Mock or empty
      
      // Corrigir: obter tarefas ativas a partir dos workflows
      // const activeTasks = workflowsState
      //  .flatMap((wf: Workflow) => wf.tasks || []) // tasks might not exist on Workflow depending on its real definition
      //  .filter((task: AgentTask) => task.status === 'running' || task.status === 'pending');
      const activeTasks: AgentTask[] = []; // Mock or empty

      client.emit('state:initial', {
        workflows: workflowsState,
        tasks: activeTasks
      });
    } catch (error: any) {
      this.logger.error(`Erro ao enviar estado inicial: ${error.message}`);
      client.emit('error', { message: 'Falha ao carregar estado inicial' });
    }
  }
  
  /**
   * Handler para mensagens de solicitação de status
   */
  @SubscribeMessage('get:status')
  handleStatusRequest(client: Socket): NestWsResponse<any> {
    return {
      event: 'status',
      data: {
        serverTime: new Date().toISOString(),
        clientsConnected: this.clientCount,
      },
    };
  }
  
  /**
   * Handler para solicitação de execução de tarefas
   */
  @SubscribeMessage('task:submit')
  async handleTaskSubmit(client: Socket, payload: any) {
    try {
      if (!payload.workflowId || !payload.agentType || !payload.input) {
        throw new Error('Dados de tarefa inválidos');
      }
      
      // const taskId = await this.orchestratorService.addTask(
      //   payload.workflowId,
      //   payload.agentType,
      //   payload.input,
      //   payload.priority || 10
      // );
      const mockTaskId = `mock_task_submit_${Date.now()}`;
      this.logger.warn(`Method orchestratorService.addTask does not exist for 'task:submit'. Emitting mock taskId: ${mockTaskId}`);
      
      client.emit('task:submitted', { taskId: mockTaskId });
    } catch (error: any) {
      this.logger.error(`Erro ao processar solicitação de tarefa: ${error.message}`);
      client.emit('error', {
        code: 'TASK_SUBMIT_ERROR',
        message: error.message,
      });
    }
  }
  
  /**
   * Método para transmitir mensagens para todos os clientes conectados
   */
  broadcast(type: string, payload: any) {
    const message: WebSocketMessage = { type, payload };
    this.server.emit('message', message);
  }

  @SubscribeMessage('send_message')
  handleMessage(client: Socket, payload: WebSocketMessage): NestWsResponse<any> {
    this.logger.log(`Received message from ${client.id}: ${payload.payload}`);
    // TODO: Implementar processamento real da mensagem se necessário
    // Por enquanto, apenas faz broadcast do payload recebido
    this.server.emit('message', payload);
    return { event: 'message', data: payload };
  }

  // --- Helper para buscar e validar mensagem de contexto ---
  private async fetchContextMessage(messageId: string, expectedDataType?: string): Promise<any> {
      if (!messageId) return null;
      try {
          const message = await this.messageRepository.findOneOrFail({ 
              where: { id: messageId },
              select: ['metadata'] // Seleciona apenas o campo metadata
          });
          const contextData = message.metadata?.structuredOutput;
          if (!contextData) {
              this.logger.warn(`Context message ${messageId} found, but metadata.structuredOutput is missing or empty.`);
              return null;
          }
          // Validação opcional do tipo (simples)
          if (expectedDataType && typeof contextData !== expectedDataType) {
               this.logger.warn(`Context message ${messageId} has unexpected data type. Expected ${expectedDataType}, got ${typeof contextData}.`);
               // Não retorna null aqui, pois o chamador pode lidar com tipos diferentes (ex: string ou object)
               // Mas mantém o aviso. O chamador deve validar a estrutura se necessário.
          }
          return contextData;
      } catch (error) {
          this.logger.error(`Failed to fetch or access context message ${messageId}`, error);
          // Lança um erro para ser pego pelo handler do trigger
          throw new Error(`Could not retrieve required context from message ${messageId}.`);
      }
  }

  // --- Handlers para Acionar Capacidades Específicas dos Agentes (Refatorados) --- 

  @SubscribeMessage('trigger:testGeneration')
  async handleTriggerTestGeneration(client: Socket, payload: { sessionId: string; coderMessageId: string; productMessageId?: string; }) {
    this.logger.log(`Received trigger:testGeneration from ${client.id} with payload: ${JSON.stringify(payload)}`);
    const eventName = 'trigger:testGeneration';
    try {
      const { sessionId, coderMessageId, productMessageId } = payload;
       if (!sessionId || !coderMessageId) {
        throw new Error('Invalid payload: Missing sessionId or coderMessageId.');
      }
      
      const session = await this.sessionRepository.findOneOrFail({ where: { id: sessionId } });
      this.logger.debug(`Fetched session ${sessionId}`);

      // Busca o output estruturado da mensagem do Coder
      const codeOutput = await this.fetchContextMessage(coderMessageId, 'object'); // Espera { code: string, language: string, ... }
      if (!codeOutput || typeof codeOutput !== 'object' || !codeOutput.code) {
          throw new Error(`Could not extract valid structured code output from coderMessageId ${coderMessageId}.`);
      }
      this.logger.debug(`Fetched codeOutput from ${coderMessageId}: ${JSON.stringify(codeOutput)}`);
      
      // Busca as user stories (opcional)
      let userStories: any[] = [];
      if (productMessageId) {
          const storiesOutput = await this.fetchContextMessage(productMessageId, 'object'); // Espera UserStory[] ou similar
          if (storiesOutput && Array.isArray(storiesOutput)) {
              userStories = storiesOutput;
              this.logger.debug(`Fetched userStories from ${productMessageId}: ${userStories.length} stories`);
          } else if (storiesOutput) {
              this.logger.warn(`Fetched data from productMessageId ${productMessageId} but it was not an array. Treating as single story object.`);
              userStories = [storiesOutput]; // Tenta tratar como objeto único
          } else {
              this.logger.warn(`productMessageId ${productMessageId} provided but failed to fetch valid stories.`);
          }
      }
      
      // Monta o codeFiles map
      const codeFiles = { [`source.${codeOutput.language || 'ts'}`]: codeOutput.code };

      this.logger.log(`Calling orchestrator.runTestGeneration for session ${sessionId}`);
      const result = await this.orchestratorService.runTestGeneration(session, codeFiles, userStories);
      
      client.emit(`result:${eventName}`, { success: true, data: result });
      this.logger.log(`Sent result:${eventName} back to ${client.id}`);

    } catch (error: any) {
      this.logger.error(`Error processing ${eventName}: ${error.message}`, error.stack);
      client.emit('error:trigger', { event: eventName, message: error.message });
    }
  }

  @SubscribeMessage('trigger:securityAnalysis')
  async handleTriggerSecurityAnalysis(client: Socket, payload: { sessionId: string; coderMessageId: string; productMessageId?: string }) {
    this.logger.log(`Received trigger:securityAnalysis from ${client.id} with payload: ${JSON.stringify(payload)}`);
    const eventName = 'trigger:securityAnalysis';
     try {
      const { sessionId, coderMessageId, productMessageId } = payload;
       if (!sessionId || !coderMessageId) {
        throw new Error('Invalid payload: Missing sessionId or coderMessageId.');
      }
      
      const session = await this.sessionRepository.findOneOrFail({ where: { id: sessionId } });
      this.logger.debug(`Fetched session ${sessionId}`);
      
      // Busca o output estruturado da mensagem do Coder
      const codeOutput = await this.fetchContextMessage(coderMessageId, 'object');
      if (!codeOutput || typeof codeOutput !== 'object' || !codeOutput.code) {
          throw new Error(`Could not extract valid structured code output from coderMessageId ${coderMessageId}.`);
      }
      this.logger.debug(`Fetched codeOutput from ${coderMessageId}: ${JSON.stringify(codeOutput)}`);
      
      // Busca o contexto de requisitos (opcional)
      let requirementsContext: string | null = null;
      if (productMessageId) {
          const reqOutput = await this.fetchContextMessage(productMessageId); // Pode ser string ou object (user stories)
          if (reqOutput) {
              requirementsContext = typeof reqOutput === 'string' ? reqOutput : JSON.stringify(reqOutput);
              this.logger.debug(`Fetched requirementsContext from ${productMessageId}`);
          } else {
               this.logger.warn(`productMessageId ${productMessageId} provided but failed to fetch valid requirements context.`);
          }
      }

      // Monta o codeFiles map
      const codeFiles = { [`source.${codeOutput.language || 'ts'}`]: codeOutput.code };
      
      this.logger.log(`Calling orchestrator.runSecurityAnalysis for session ${sessionId}`);
      const result = await this.orchestratorService.runSecurityAnalysis(session, codeFiles, requirementsContext);
      
      client.emit(`result:${eventName}`, { success: true, data: result });
       this.logger.log(`Sent result:${eventName} back to ${client.id}`);

    } catch (error: any) {
      this.logger.error(`Error processing ${eventName}: ${error.message}`, error.stack);
      client.emit('error:trigger', { event: eventName, message: error.message });
    }
  }

  @SubscribeMessage('trigger:testSimulation')
  async handleTriggerTestSimulation(client: Socket, payload: { sessionId: string; coderMessageId: string; testGenMessageId: string; }) {
    this.logger.log(`Received trigger:testSimulation from ${client.id} with payload: ${JSON.stringify(payload)}`);
     const eventName = 'trigger:testSimulation';
    try {
      const { sessionId, coderMessageId, testGenMessageId } = payload;
      if (!sessionId || !coderMessageId || !testGenMessageId) {
        throw new Error('Invalid payload: Missing sessionId, coderMessageId, or testGenMessageId.');
      }
      
      const session = await this.sessionRepository.findOneOrFail({ where: { id: sessionId } });
       this.logger.debug(`Fetched session ${sessionId}`);

      // Busca o output do Coder
      const codeOutput = await this.fetchContextMessage(coderMessageId, 'object'); 
       if (!codeOutput || typeof codeOutput !== 'object' || !codeOutput.code) {
          throw new Error(`Could not extract valid structured code output from coderMessageId ${coderMessageId}.`);
      }
      this.logger.debug(`Fetched codeOutput from ${coderMessageId}: ${JSON.stringify(codeOutput)}`);
      
      // Busca o output da Geração de Testes
      const testGenOutput = await this.fetchContextMessage(testGenMessageId, 'object'); // Espera GenerateTestsResponse { testFiles: [{ name, content }] }
      if (!testGenOutput || typeof testGenOutput !== 'object' || !testGenOutput.testFiles || !Array.isArray(testGenOutput.testFiles)) {
         throw new Error(`Could not extract valid testFiles array from testGenMessageId ${testGenMessageId}. Expected { testFiles: [...] }.`);
      }
      this.logger.debug(`Fetched testGenOutput from ${testGenMessageId}: ${testGenOutput.testFiles.length} test files`);
      
      // Converte a estrutura de testFiles para o formato { path: content } esperado por simulateTestExecution
      const testFilesMap: { [path: string]: string } = testGenOutput.testFiles.reduce(
        (acc: { [path: string]: string; }, file: TestFile) => {
          // Adiciona validação extra
          if (file && typeof file === 'object' && file.path && file.content) {
              acc[file.path] = file.content;
          } else {
              this.logger.warn(`Skipping invalid test file entry in testGenMessageId ${testGenMessageId}: ${JSON.stringify(file)}`);
          }
          return acc;
      }, {});

       if (Object.keys(testFilesMap).length === 0 && testGenOutput.testFiles.length > 0) {
           throw new Error(`Extracted test file data from ${testGenMessageId} was malformed. No valid test files found.`);
       }

      this.logger.log(`Calling orchestrator.runTestGeneration for session ${sessionId}`);
      const result = await this.orchestratorService.runTestGeneration(session, codeOutput, testGenOutput.testFiles);
      
      client.emit(`result:${eventName}`, { success: true, data: result });
      this.logger.log(`Sent result:${eventName} back to ${client.id}`);

    } catch (error: any) {
      this.logger.error(`Error processing ${eventName}: ${error.message}`, error.stack);
      client.emit('error:trigger', { event: eventName, message: error.message });
    }
  }

  @SubscribeMessage('getRunningTasks')
  handleGetRunningTasks(client: Socket): void {
    this.logger.log('Client requested running tasks');
    // const workflowsState = this.orchestratorService.getAllWorkflows(); // Method doesn't exist
    const runningTasks: AgentTask[] = []; 
    /*
    const workflowsState_mock: Workflow[] = []; // Mock data
    if (workflowsState_mock && Array.isArray(workflowsState_mock)) {
        runningTasks = workflowsState_mock
        .flatMap((wf: Workflow) => wf.steps || []) // wf is Workflow
        .filter((task: AgentTask) => task.status === 'running' || task.status === 'pending') // task is AgentTask
        .map((task: AgentTask) => ({ 
            id: task.id,
            agentType: task.agentType,
            status: task.status,
        }));
    }
    */
    this.server.to(client.id).emit('runningTasks', runningTasks);
  }

  @SubscribeMessage(SocketEvent.RUN_TEST_GENERATION_EXPLICIT)
  async handleRunTestGenerationExplicit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; codeFiles: { [path: string]: string }; userStories: any[] },
  ): Promise<WsResponseMessage<any>> {
    this.logger.log(`[WS] Received runTestGenerationExplicit for session ${payload.sessionId}`);
    try {
      const session = await this.sessionRepository.findOneOrFail({ where: { id: payload.sessionId } });
      if (!session) {
        return { event: SocketEvent.ERROR, data: { message: `Session ${payload.sessionId} not found.` } };
      }
      const testGenOutput = await this.orchestratorService.runTestGeneration(
        session,
        payload.codeFiles,
        payload.userStories,
      );

      const testFilesMap: { [path: string]: string } = (testGenOutput.testFiles || []).reduce(
        (acc: { [path: string]: string; }, file: TestFile) => {
          if (file && file.path && typeof file.content === 'string') {
            acc[file.path] = file.content;
          }
          return acc;
        },
        {},
      );
      this.logger.log(`Generated test files map for client: ${Object.keys(testFilesMap).length} files`);

      return { event: SocketEvent.TEST_GENERATION_EXPLICIT_COMPLETED, data: testGenOutput };
    } catch (error: any) {
      this.logger.error(`Error in handleRunTestGenerationExplicit: ${error.message}`, error.stack);
      return { event: SocketEvent.ERROR, data: { message: error.message } };
    }
  }
}