import { Test } from '@nestjs/testing';
import { OrchestratorService } from '../../backend/src/orchestrator/orchestrator.service';
import { ProductAgentService } from '../../backend/src/agents/product/product-agent.service';
import { CoderAgentService } from '../../backend/src/agents/coder/coder-agent.service';
import { TestAgentService } from '../../backend/src/agents/test/test-agent.service';
import { SecurityAgentService } from '../../backend/src/agents/security/security-agent.service';
import { PersistenceService } from '../../backend/src/database/persistence.service';
import { LoggerService } from '../../backend/src/logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowStatus } from '../../backend/src/orchestrator/interfaces/workflow.interface';
import { MockLlmService } from '../mocks/mock-llm.service';
import { LlmService } from '../../backend/src/llm/llm.service';
import { PromptLoaderService } from '../../backend/src/agents/common/prompt-loader.service';

/**
 * Testes de integração para o fluxo de trabalho do orquestrador
 */
describe('Fluxo de orquestração completo', () => {
  let orchestratorService: OrchestratorService;
  let productAgentService: ProductAgentService;
  let coderAgentService: CoderAgentService;
  let testAgentService: TestAgentService;
  let securityAgentService: SecurityAgentService;
  let persistenceService: PersistenceService;
  let eventEmitter: EventEmitter2;
  
  // Mock dos eventos disparados
  const emittedEvents: Record<string, any[]> = {};
  
  // Caminho de execução registrado para verificação
  const executionPath: string[] = [];
  
  beforeAll(async () => {
    // Cria um módulo de teste com mocks para os serviços
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        ProductAgentService,
        CoderAgentService,
        TestAgentService,
        SecurityAgentService,
        PromptLoaderService,
        {
          provide: PersistenceService,
          useValue: {
            startRun: jest.fn().mockImplementation(() => {
              executionPath.push('startRun');
              return Promise.resolve();
            }),
            completeRun: jest.fn().mockImplementation((id, status) => {
              executionPath.push(`completeRun:${status}`);
              return Promise.resolve();
            }),
            logAgentActivity: jest.fn().mockImplementation(({ agent_type, action }) => {
              executionPath.push(`logAgentActivity:${agent_type}:${action}`);
              return Promise.resolve();
            }),
            logHumanFeedback: jest.fn().mockImplementation(({ stage, approved }) => {
              executionPath.push(`logHumanFeedback:${stage}:${approved}`);
              return Promise.resolve();
            }),
            saveCodeVersion: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LlmService,
          useClass: MockLlmService,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn().mockImplementation((event, payload) => {
              if (!emittedEvents[event]) {
                emittedEvents[event] = [];
              }
              emittedEvents[event].push(payload);
              return true;
            }),
            on: jest.fn(),
          },
        },
      ],
    }).compile();
    
    // Obtém as instâncias dos serviços
    orchestratorService = moduleRef.get<OrchestratorService>(OrchestratorService);
    productAgentService = moduleRef.get<ProductAgentService>(ProductAgentService);
    coderAgentService = moduleRef.get<CoderAgentService>(CoderAgentService);
    testAgentService = moduleRef.get<TestAgentService>(TestAgentService);
    securityAgentService = moduleRef.get<SecurityAgentService>(SecurityAgentService);
    persistenceService = moduleRef.get<PersistenceService>(PersistenceService);
    eventEmitter = moduleRef.get<EventEmitter2>(EventEmitter2);
    
    // Mock das implementações dos agentes
    jest.spyOn(productAgentService, 'analyzeRequirement').mockImplementation((requirement) => {
      executionPath.push('productAgent:analyzeRequirement');
      return Promise.resolve([
        {
          id: 'US-1',
          title: 'Test User Story',
          description: 'As a user, I want to test the feature',
          acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
          priority: 'high',
          complexity: 'medium',
        },
      ]);
    });
    
    jest.spyOn(productAgentService, 'validateCode').mockImplementation((code, userStories) => {
      executionPath.push('productAgent:validateCode');
      return Promise.resolve({
        needsRevision: false,
        matchesRequirements: true,
        score: 9,
        feedback: 'O código atende aos requisitos',
      });
    });
    
    jest.spyOn(coderAgentService, 'generateCode').mockImplementation((userStories) => {
      executionPath.push('coderAgent:generateCode');
      return Promise.resolve({
        files: {
          'src/index.js': '// Initial content',
          'src/utils.js': 'export const sum = (a, b) => a + b;',
        },
        summary: 'Código gerado com sucesso',
        technologies: ['JavaScript', 'Node.js'],
        dependencies: {
          'express': '^4.17.1',
        },
      });
    });
    
    jest.spyOn(coderAgentService, 'reviseCode').mockImplementation((code, feedback) => {
      executionPath.push('coderAgent:reviseCode');
      return Promise.resolve({
        files: {
          'src/index.js': '// Revised content',
          'src/utils.js': 'export const sum = (a, b) => a + b;\nexport const multiply = (a, b) => a * b;',
        },
        summary: 'Código revisado com sucesso',
        technologies: ['JavaScript', 'Node.js'],
        dependencies: {
          'express': '^4.17.1',
        },
      });
    });
    
    jest.spyOn(testAgentService, 'generateAndRunTests').mockImplementation((codeFiles, userStories) => {
      executionPath.push('testAgent:generateAndRunTests');
      return Promise.resolve({
        success: true,
        passed: 5,
        failed: 0,
        total: 5,
        passRate: 100,
        coverage: {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        executionTime: 120,
        failedTests: [],
        testFiles: {
          'tests/index.test.js': 'test("should work", () => { expect(true).toBe(true); });',
        },
      });
    });
    
    jest.spyOn(securityAgentService, 'analyzeCode').mockImplementation((codeFiles) => {
      executionPath.push('securityAgent:analyzeCode');
      return Promise.resolve({
        hasIssues: false,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        issues: [],
        summary: 'Nenhum problema de segurança encontrado',
        overallRisk: 'none',
        recommendations: ['Manter as dependências atualizadas'],
      });
    });
  });
  
  afterEach(() => {
    // Limpa os registros entre testes
    Object.keys(emittedEvents).forEach(key => {
      emittedEvents[key] = [];
    });
    executionPath.length = 0;
  });
  
  test('Deve completar o fluxo de trabalho sem intervenção humana', async () => {
    // Cria um workflow
    const workflow = await orchestratorService.createWorkflow(
      'Criar uma aplicação simples em JavaScript',
      { enableCrossValidation: false }
    );
    
    // Verifica se o workflow foi criado corretamente
    expect(workflow.id).toBeDefined();
    expect(workflow.status).toBe('requirements');
    
    // Aguarda que o workflow seja concluído (timeout de 5 segundos)
    const maxWaitTime = 5000;
    const pollInterval = 100;
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      const currentWorkflow = orchestratorService.getWorkflow(workflow.id);
      
      if (currentWorkflow.status === 'completed') {
        break;
      }
      
      if (currentWorkflow.status === 'failed' || currentWorkflow.status === 'cancelled') {
        throw new Error(`Workflow failed or cancelled: ${currentWorkflow.error}`);
      }
      
      // Se o workflow está esperando feedback mas o teste não prevê, fornecemos feedback automaticamente
      if (currentWorkflow.status === 'waiting_feedback') {
        await orchestratorService.provideHumanFeedback(
          workflow.id,
          currentWorkflow.waitingFor,
          { approved: true }
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // Verifica se o workflow foi concluído
    const finalWorkflow = orchestratorService.getWorkflow(workflow.id);
    expect(finalWorkflow.status).toBe('completed');
    
    // Verifica se todos os agentes foram executados na ordem correta
    expect(executionPath).toContain('productAgent:analyzeRequirement');
    expect(executionPath).toContain('coderAgent:generateCode');
    expect(executionPath).toContain('testAgent:generateAndRunTests');
    expect(executionPath).toContain('securityAgent:analyzeCode');
    
    // Verifica a ordem de execução
    const productIndex = executionPath.indexOf('productAgent:analyzeRequirement');
    const coderIndex = executionPath.indexOf('coderAgent:generateCode');
    const testIndex = executionPath.indexOf('testAgent:generateAndRunTests');
    const securityIndex = executionPath.indexOf('securityAgent:analyzeCode');
    
    expect(productIndex).toBeLessThan(coderIndex);
    expect(coderIndex).toBeLessThan(testIndex);
    expect(testIndex).toBeLessThan(securityIndex);
    
    // Verifica se os eventos foram emitidos
    expect(emittedEvents['workflow.created']).toBeDefined();
    expect(emittedEvents['workflow.started']).toBeDefined();
    expect(emittedEvents['task.completed']).toBeDefined();
    expect(emittedEvents['workflow.completed']).toBeDefined();
    
    // Verifica se o persistenceService foi chamado corretamente
    expect(persistenceService.startRun).toHaveBeenCalled();
    expect(persistenceService.logAgentActivity).toHaveBeenCalled();
    expect(persistenceService.completeRun).toHaveBeenCalledWith(
      workflow.id,
      'completed',
      expect.any(Object)
    );
  }, 10000); // Aumenta o timeout para 10 segundos
  
  test('Deve interromper o fluxo quando receber feedback negativo', async () => {
    // Cria um workflow com pontos de feedback humano
    const workflow = await orchestratorService.createWorkflow(
      'Criar uma API REST em Node.js',
      { humanFeedbackPoints: ['requirements', 'code'] }
    );
    
    // Verifica se o workflow foi criado corretamente
    expect(workflow.id).toBeDefined();
    expect(workflow.status).toBe('requirements');
    
    // Aguarda até que o workflow chegue ao ponto de feedback dos requisitos
    const maxWaitTime = 5000;
    const pollInterval = 100;
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      const currentWorkflow = orchestratorService.getWorkflow(workflow.id);
      
      if (currentWorkflow.status === 'waiting_feedback' && currentWorkflow.waitingFor === 'requirements') {
        // Fornece feedback negativo para os requisitos
        await orchestratorService.provideHumanFeedback(
          workflow.id,
          'requirements',
          {
            approved: false,
            feedback: 'Os requisitos não estão claros o suficiente, por favor revise.',
          }
        );
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // Verifica se o agente de produto foi chamado novamente após o feedback
    expect(executionPath.filter(step => step === 'productAgent:analyzeRequirement').length).toBe(2);
    
    // Verifica se o evento de feedback foi emitido
    expect(emittedEvents['workflow.feedback_processed']).toBeDefined();
    expect(emittedEvents['workflow.feedback_processed'][0].approved).toBe(false);
    
    // Verifica se o log de feedback humano foi registrado
    expect(persistenceService.logHumanFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        run_id: workflow.id,
        stage: 'requirements',
        approved: false,
      })
    );
  }, 10000); // Aumenta o timeout para 10 segundos
  
  test('Deve lidar com falhas de teste e iniciar revisões de código', async () => {
    // Força o teste a falhar para este caso
    jest.spyOn(testAgentService, 'generateAndRunTests').mockImplementationOnce((codeFiles, userStories) => {
      executionPath.push('testAgent:generateAndRunTests:failure');
      return Promise.resolve({
        success: false,
        passed: 3,
        failed: 2,
        total: 5,
        passRate: 60,
        coverage: {
          statements: 80,
          branches: 70,
          functions: 90,
          lines: 85,
        },
        executionTime: 150,
        failedTests: [
          {
            name: 'should handle edge case',
            file: 'tests/utils.test.js',
            message: 'Expected sum(1, -1) to be 0 but got -2',
          },
          {
            name: 'should validate input',
            file: 'tests/utils.test.js',
            message: 'TypeError: Cannot read property of undefined',
          },
        ],
        testFiles: {
          'tests/utils.test.js': 'test("should work", () => { expect(true).toBe(true); });',
        },
      });
    });
    
    // Cria um workflow
    const workflow = await orchestratorService.createWorkflow(
      'Criar uma biblioteca de utilidades matemáticas',
      { enableCrossValidation: true }
    );
    
    // Verifica se o workflow foi criado corretamente
    expect(workflow.id).toBeDefined();
    
    // Aguarda até que o coder seja chamado para revisão após falha de teste
    const maxWaitTime = 5000;
    const pollInterval = 100;
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      const reviseIndex = executionPath.indexOf('coderAgent:reviseCode');
      const testFailureIndex = executionPath.indexOf('testAgent:generateAndRunTests:failure');
      
      if (reviseIndex > -1 && testFailureIndex > -1 && reviseIndex > testFailureIndex) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // Verifica se houve a sequência correta: teste falhou -> coder revisa
    const testFailureIndex = executionPath.indexOf('testAgent:generateAndRunTests:failure');
    const reviseIndex = executionPath.indexOf('coderAgent:reviseCode');
    
    expect(testFailureIndex).toBeGreaterThan(-1);
    expect(reviseIndex).toBeGreaterThan(testFailureIndex);
    
    // Verifica se o persistenceService registrou a atividade de revisão
    expect(persistenceService.logAgentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_type: 'coder',
        action: 'revise_code',
      })
    );
  }, 10000); // Aumenta o timeout para 10 segundos
}); 