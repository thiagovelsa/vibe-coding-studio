import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Ajuste o caminho conforme necessário
import { LlmService } from '../src/llm/llm.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionEntity } from '../src/database/entities/session.entity';
import { ChatMessageEntity } from '../src/database/entities/chat_message.entity';
import { Repository } from 'typeorm';

// Mock do LlmService
const mockLlmService = {
  generate: jest.fn(),
  // Adicione outros métodos se forem chamados durante o fluxo
};

describe('SessionController (e2e)', () => {
  let app: INestApplication;
  let sessionRepository: Repository<SessionEntity>;
  let messageRepository: Repository<ChatMessageEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Usar AppModule para um teste e2e mais completo
    })
    .overrideProvider(LlmService)
    .useValue(mockLlmService) // Substituir LlmService pelo mock
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Aplicar validação como na app real
    await app.init();

    // Obter repositórios para asserções no banco de dados
    sessionRepository = moduleFixture.get<Repository<SessionEntity>>(
      getRepositoryToken(SessionEntity),
    );
    messageRepository = moduleFixture.get<Repository<ChatMessageEntity>>(
      getRepositoryToken(ChatMessageEntity),
    );

    // Limpar banco de dados de teste antes de começar (se necessário e configurado)
    // await messageRepository.query('DELETE FROM chat_message_entity;');
    // await sessionRepository.query('DELETE FROM session_entity;');
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Testes --- 

  describe('/sessions (POST) - Criação', () => {
    it('deve criar uma nova sessão', async () => {
      const createDto = { title: 'Test Session E2E' };
      return request(app.getHttpServer())
        .post('/sessions')
        .send(createDto)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toEqual(createDto.title);
          expect(res.body.status).toEqual('active');
        });
    });
  });

  describe('/sessions/:sessionId/messages (POST) - Fluxo de Mensagem e Orquestração', () => {
    let sessionId: string;

    beforeAll(async () => {
      // Criar uma sessão para usar nos testes de mensagem
      const newSession = await sessionRepository.save({ title: 'Message Flow Test' });
      sessionId = newSession.id;
    });

    it('deve processar a primeira mensagem, chamar ProductAgent e salvar respostas', async () => {
      const userMessageContent = 'Preciso de um app de tarefas simples.';
      const mockProductResponse = {
        markdown: '**US-1: Criar Tarefa**\nAs a **user**, I want **criar uma nova tarefa** so that **possa organizar meu trabalho**.\n*Priority: high, Complexity: low*\nAcceptance Criteria:\n- Campo de texto para nome da tarefa.\n- Botão para salvar.',
        structuredOutput: [
          {
            id: 'US-1',
            title: 'Criar Tarefa',
            role: 'user',
            goal: 'criar uma nova tarefa',
            reason: 'possa organizar meu trabalho',
            acceptanceCriteria: [
              'Campo de texto para nome da tarefa.',
              'Botão para salvar.',
            ],
            priority: 'high',
            complexity: 'low',
          },
        ],
      };

      // Configurar o mock para a chamada do ProductAgent
      // Precisa simular o retorno do LlmService.generate, que é o que o Agent usa.
      // O LlmService.generate retorna { text: string, ... }
      // O ProductAgent.handle processa isso e retorna { markdown: string, structuredOutput: any }
      // O Orchestrator.handleUserMessage retorna { content, agentType, structuredOutput, metadata }
      // O SessionService salva isso.
      // O mock DEVE ser da resposta do LlmService.generate, que é usada pelo ProductAgent.analyzeRequirement
      const mockLlmGenerateResponse = {
          text: JSON.stringify(mockProductResponse.structuredOutput), // Simula a saída JSON crua do LLM
          // Outros campos de LlmResponse podem ser necessários se o adapter os usar
          model: 'mock-model', 
          provider: 'mock-provider',
          usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 },
          finishReason: 'stop'
      };
      // Limpar mocks anteriores e configurar para esta chamada
      jest.clearAllMocks(); // Limpa chamadas anteriores do mock
      mockLlmService.generate.mockResolvedValueOnce(mockLlmGenerateResponse);

      // Enviar a mensagem do usuário
      await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/messages`)
        .send({ content: userMessageContent })
        .expect(201) 
        .expect(res => {
           expect(res.body).toHaveProperty('id');
           expect(res.body.role).toEqual('assistant');
           expect(res.body.agentType).toEqual('product');
           expect(res.body.content).toEqual(mockProductResponse.markdown);
           expect(res.body.metadata).toBeDefined();
           // DESCOMENTADO: Verificar se o structuredOutput foi salvo nos metadados retornados pela API
           expect(res.body.metadata.structuredOutput).toEqual(mockProductResponse.structuredOutput); 
         });

      // Verificar o banco de dados
      const messages = await messageRepository.find({ where: { sessionId }, order: { timestamp: 'ASC' } });
      expect(messages).toHaveLength(2); 
      expect(messages[0].role).toEqual('user');
      expect(messages[0].content).toEqual(userMessageContent);
      expect(messages[1].role).toEqual('assistant');
      expect(messages[1].agentType).toEqual('product');
      expect(messages[1].content).toEqual(mockProductResponse.markdown);
      expect(messages[1].metadata).toBeDefined();
      // DESCOMENTADO: Verificar metadados no DB
      expect(messages[1].metadata.structuredOutput).toEqual(mockProductResponse.structuredOutput);

      // Verificar estado do orquestrador na sessão
      const updatedSession = await sessionRepository.findOne({ where: { id: sessionId } });
      expect(updatedSession?.orchestratorState).toEqual({ currentAgent: 'coder' }); 
    });

    // TODO: Adicionar teste para a segunda mensagem -> Coder -> Test
    // TODO: Adicionar teste para a terceira mensagem -> Test -> Security
    // TODO: Adicionar teste para a quarta mensagem -> Security -> Coder (se risco alto) / Null (se ok)
    // TODO: Adicionar teste verificando a injeção de contexto (userStories para Coder, etc.)

  });

}); 