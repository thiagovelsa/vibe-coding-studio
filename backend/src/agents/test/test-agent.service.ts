/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { AgentInterface, AgentResponse } from '../interfaces';
import { AgentTask } from '../../orchestrator/interfaces/agent-task.interface';
import { ChatMessage } from '../../common/interfaces/chat.interface';
import { LlmService } from '../../llm/llm.service';
import { LoggerService } from '@logger/logger.service';
import { PromptLoaderService } from '../common/prompt-loader.service';
import { UserStory } from '../product/interfaces';
import { v4 as uuidv4 } from 'uuid';

// Local interface definitions (restored/ensured)
interface GenerateTestsOptions {
    framework?: string; // e.g., jest, pytest
    maxTests?: number;
    testType?: 'unit' | 'integration' | 'e2e';
}

interface TestFile {
    name: string;
    content: string;
}

interface GenerateTestsResponse {
    testFramework: string;
    testFiles: TestFile[];
    explanation?: string; // Added for consistency with handle() output
}

interface SimulateTestExecutionOptions {
    environment?: string; // e.g., node, browser
    mockDependencies?: boolean;
}

interface FailedTestData {
    name: string;
    error: string; // Renamed from message for clarity
    details?: string; // For stack trace or more info
}

interface TestResult {
    success: boolean;
    summary: string;
    total: number;
    passed: number;
    failed: number;
    passRate?: number;
    failedTests: FailedTestData[];
}

interface ValidateFixOptions {
    validationScope?: 'failed_tests_only' | 'all_relevant_tests';
    includeRegression?: boolean;
}

interface ValidationFixResponse {
    isValid: boolean;
    explanation: string;
    remainingFailedTests?: FailedTestData[];
    newlyPassingTests?: string[];
    regressions?: FailedTestData[];
}

const GENERATE_TESTS_SCHEMA = { /* Minimal example */ type: 'object', properties: { testFramework: {type: 'string'}, testFiles: { type: 'array'} }, required: ['testFramework', 'testFiles'] };
const SIMULATE_TEST_EXECUTION_SCHEMA = { /* Minimal example */ type: 'object', properties: { success: {type: 'boolean'}, summary: {type: 'string'} }, required: ['success', 'summary'] };
const VALIDATE_FIX_SCHEMA = { /* Minimal example */ type: 'object', properties: { isValid: {type: 'boolean'}, explanation: {type: 'string'} }, required: ['isValid', 'explanation'] };

// --- Interfaces Específicas para TestAgent --- 

interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e';
  steps: string[];
  expectedResult: string;
  requirementsCovered?: string[];
}

interface TestAgentLLMResponse {
  action: 'generate_test_cases' | 'analyze_results' | 'create_test_plan' | 'other';
  summary: string;
  testCases?: TestCase[];
  analysis?: string;
  testPlan?: string;
}

/**
 * Interface defining the expected structure of task.input for TestAgentService
 */
interface TestTaskInput {
    requirement: string;
    history?: ChatMessage[];
    feedbackContext?: string;
    contextCode?: string;
    contextLanguage?: string;
    contextRequirements?: UserStory[] | string;
    previousTestResults?: any;
}

@Injectable()
export class TestAgentService implements AgentInterface {
  readonly type = 'test';
  private readonly logger = new Logger(TestAgentService.name);
  private agentName = 'TestAgent';

  constructor(
    private readonly llmService: LlmService,
    private readonly loggerService: LoggerService,
    private readonly promptLoader: PromptLoaderService,
  ) {
    this.logger.log(`${this.agentName} initialized`);
  }

  /**
   * Processa a tarefa de teste, gerando casos, analisando resultados ou criando planos.
   * @param task A tarefa completa do agente, contendo o input necessário.
   * @returns Uma AgentResponse estruturada com o resultado da tarefa de teste.
   */
  async handle(task: AgentTask): Promise<AgentResponse> {
    this.logger.log(`Handling task ${task.id} for agent ${this.agentName}`);
    this.logger.debug(`Task input: ${JSON.stringify(task.input)}`);

    const input = task.input as TestTaskInput;
    if (!input || typeof input !== 'object' || !input.requirement) {
        this.logger.warn(`Task ${task.id} has invalid or missing input/requirement.`);
        return {
            status: 'error',
            message: `Input validation failed: Task input is invalid or missing the required 'requirement' field.`,
        };
    }

    const { 
        requirement,
        history = [], 
        feedbackContext = null,
        contextCode = null,
        contextLanguage = 'typescript',
        contextRequirements = null,
        previousTestResults = null
    } = input;

    const formattedHistory = history
      .map(msg => `${msg.role === 'user' ? 'User' : (msg.role === 'assistant' ? `Assistant (${msg.agentType || 'Test'})` : 'System')}: ${msg.content}`)
      .join('\n\n');
      
    const formattedRequirements = typeof contextRequirements === 'string' 
        ? contextRequirements 
        : (contextRequirements ? JSON.stringify(contextRequirements, null, 2) : null);
    const formattedTestResults = typeof previousTestResults === 'string'
        ? previousTestResults
        : (previousTestResults ? JSON.stringify(previousTestResults, null, 2) : null);

    try {
      const promptTemplate = await this.promptLoader.loadPrompt('test', 'handle_interaction.hbs');
      if (!promptTemplate) {
        this.logger.error('Prompt template test/handle_interaction.hbs not found!');
        return { status: 'error', message: 'Internal error: Test prompt template not found.' };
      }

      const promptData = {
        requirement: requirement,
        history: formattedHistory,
        contextCode: contextCode,
        contextLanguage: contextLanguage,
        contextRequirements: formattedRequirements,
        previousTestResults: formattedTestResults,
        feedbackContext: feedbackContext
      };

      const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
      this.logger.debug(`Rendered TestAgent prompt for LLM (Task ${task.id}).`);

      const llmResponse = await this.llmService.generate({
        prompt: finalPrompt,
        options: {
          temperature: 0.1, 
          maxTokens: 4096,
        },
      });

      if (!llmResponse?.text) {
        this.logger.error(`TestAgent LLM generation failed (Task ${task.id}): No text in response. ${llmResponse?.model || 'Unknown model'}`);
        return {
          status: 'error',
          message: `Failed to process test task: AI response generation error. ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'No text in response'}`,
        };
      }
      
      let parsedData: any;
      try {
          parsedData = JSON.parse(llmResponse.text);
      } catch (parseError: any) {
          this.logger.error(`TestAgent: Failed to parse LLM response (Task ${task.id}) as JSON`, { text: llmResponse.text, error: parseError.message });
          return { 
              status: 'error', 
              message: `Failed to process test task: AI response was not valid JSON. Response: ${llmResponse.text}` 
          }; 
      }
      
      const expectedSchema = {
          type: 'object',
          properties: {
              responseType: { type: 'string', enum: ['test_plan', 'test_cases', 'analysis', 'clarification', 'error'] },
              explanation: { type: 'string' },
              outputData: { type: 'object' }
          },
          required: ['responseType', 'explanation', 'outputData']
      }; 

      if (typeof parsedData.responseType !== 'string' || !expectedSchema.properties.responseType.enum.includes(parsedData.responseType) ||
          typeof parsedData.explanation !== 'string' || 
          typeof parsedData.outputData === 'undefined'
      ) {
          this.logger.error(`TestAgent LLM JSON response (Task ${task.id}) is missing required fields or has invalid types.`);
           return { 
              status: 'error', 
              message: 'Failed to process test task: AI response has invalid structure after parsing.' 
          }; 
      }
      
      this.logger.log(`TestAgent (Task ${task.id}) response type: ${parsedData.responseType}`);

      let responseStatus: AgentResponse['status'] = 'success';
      if (parsedData.responseType === 'clarification') {
          responseStatus = 'requires_feedback';
      } else if (parsedData.responseType === 'error') {
          responseStatus = 'error';
      }

      return {
          status: responseStatus,
          message: parsedData.explanation,
          data: parsedData.outputData
      };

    } catch (error: any) {
      this.logger.error(`Error in TestAgent handle (Task ${task.id}): ${error.message}`, error.stack);
      return {
        status: 'error',
        message: `An unexpected error occurred in the Test Agent: ${error.message}`,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
      try {
          return await this.llmService.isAvailable();
      } catch (error) {
          this.logger.error('TestAgent is not available', error);
          return false;
      }
  }

  getCapabilities(): string[] {
      return [
          'generate_test_cases',
          'analyze_test_results',
          'create_test_plan',
          'run_tests_simulation',
          'validate_fixes'
      ];
  }

  async generateAndRunTests(codeFiles: { [path: string]: string }, userStories: any[]): Promise<TestResult> {
      this.logger.log(`Generating and simulating tests for ${Object.keys(codeFiles).length} file(s)...`);
      try {
          const testGenerationResponse = await this.generateTests(codeFiles, userStories);
          if (!testGenerationResponse?.testFiles || testGenerationResponse.testFiles.length === 0) { 
              this.logger.warn('No test files were generated.');
              return { success: true, total: 0, passed: 0, failed: 0, failedTests: [], summary: "No tests generated." };
          }
          const testFilesMap: { [path: string]: string } = {};
          testGenerationResponse.testFiles.forEach(file => {
              testFilesMap[file.name] = file.content;
          });
          const results = await this.simulateTestExecution(codeFiles, testFilesMap);
          this.logger.log(`Test simulation completed: ${results.passed} passed, ${results.failed} failed.`);
          return results;
      } catch (error: any) {
          this.logger.error('Error during generateAndRunTests', error.stack);
          const errorMessage = error && typeof error === 'object' && error.message ? String(error.message) : String(error);
          return { 
              success: false, 
              total: 0, passed: 0, failed: 0, 
              failedTests: [], 
              summary: `Error running tests: ${errorMessage}` 
          } as TestResult;
      }
  }

  /**
   * Gera arquivos de teste com base nos arquivos de código e user stories.
   * @param codeFiles Mapeamento de path para conteúdo do código.
   * @param userStories Array de user stories.
   * @returns Um objeto JSON estruturado conforme GenerateTestsResponse.
   */
  public async generateTests(
    codeFiles: { [path: string]: string }, 
    userStories: any[], 
    options?: GenerateTestsOptions
  ): Promise<GenerateTestsResponse> {
    this.logger.log(`Generating tests based on ${Object.keys(codeFiles).length} code file(s).`);

    const codeContext = Object.entries(codeFiles)
      .map(([path, content]) => `// File: ${path}\n${content}`)
      .join('\n\n---\n\n');
    
    const requirementsContext = JSON.stringify(userStories, null, 2);

    try {
      const promptTemplate = await this.promptLoader.loadPrompt('test', 'generate_tests.hbs');
      if (!promptTemplate) {
        this.logger.error('Prompt template test/generate_tests.hbs not found!');
        throw new Error('Internal error: Generate tests prompt template not found.');
      }

      const promptData = {
        codeContext: codeContext,
        requirementsContext: requirementsContext,
      };

      const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
      this.logger.debug('Rendered generateTests prompt for LLM.');
      
      const llmResponse = await this.llmService.generate({
        prompt: finalPrompt,
        options: {
          temperature: 0.2,
          maxTokens: 4096, 
        },
      });
      
      if (!llmResponse?.text) {
        this.logger.error(`generateTests LLM JSON generation failed: No text in response. ${llmResponse?.model || 'Unknown model'}`);
        throw new Error(`Failed to generate tests: ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'AI response generation error - no text'}`);
      }

      let parsedOutput: GenerateTestsResponse;
      try {
          parsedOutput = JSON.parse(llmResponse.text);
      } catch (e: any) {
          this.logger.error('Failed to parse LLM response for generateTests as JSON', { text: llmResponse.text, error: e.message });
          throw new Error('Failed to parse AI response for test generation.');
      }

      const expectedSchema = {
          type: 'object',
          properties: {
              testFramework: { type: 'string', description: "Testing framework used (e.g., jest, pytest, junit)" },
              testFiles: {
                  type: 'array',
                  items: {
                      type: 'object',
                      properties: {
                          name: { type: 'string', description: "Filename for the test file (e.g., component.test.ts)" },
                          content: { type: 'string', description: "The actual code content of the test file." }
                      },
                      required: ['name', 'content']
                  }
              }
          },
          required: ['testFramework', 'testFiles']
      };

      if (!parsedOutput || typeof parsedOutput.testFramework !== 'string' || !Array.isArray(parsedOutput.testFiles)) {
          this.logger.error('generateTests: generateJsonResponse returned invalid data structure despite schema.');
          throw new Error('Failed to generate tests: AI response has invalid structure after parsing.');
      }

      this.logger.log(`generateTests completed. Framework: ${parsedOutput.testFramework}, Files: ${parsedOutput.testFiles.length}`);
      return parsedOutput;

    } catch (error: any) {
      this.logger.error(`Error in generateTests: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Simula a execução de testes (usando LLM) e retorna os resultados.
   * @param codeFiles Código fonte original.
   * @param testFiles Arquivos de teste gerados.
   * @returns Um objeto JSON estruturado conforme TestResult.
   */
  public async simulateTestExecution(
    codeFiles: { [path: string]: string }, 
    testFiles: { [path: string]: string }, 
    options?: SimulateTestExecutionOptions
  ): Promise<TestResult> {
    this.logger.log(`Simulating test execution for ${Object.keys(testFiles).length} test file(s)...`);

    const codeContext = JSON.stringify(codeFiles);
    const testsContext = JSON.stringify(testFiles);

    try {
      const promptTemplate = await this.promptLoader.loadPrompt('test', 'simulate_tests.hbs');
      if (!promptTemplate) {
        this.logger.error('Prompt template test/simulate_tests.hbs not found!');
        throw new Error('Internal error: Simulate tests prompt template not found.');
      }

      const promptData = {
        code: codeContext,
        tests: testsContext,
      };

      const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
      this.logger.debug('Rendered simulateTestExecution prompt for LLM.');

      const llmResponse = await this.llmService.generate({
        prompt: finalPrompt,
        options: {
          temperature: 0.0,
          maxTokens: 4096, 
        },
      });

       if (!llmResponse?.text) {
        this.logger.error(`simulateTestExecution LLM JSON generation failed: No text in response. ${llmResponse?.model || 'Unknown model'}`);
        throw new Error(`Failed to simulate tests: ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'AI response generation error - no text'}`);
      }

      let parsedOutputSim: TestResult;
      try {
          parsedOutputSim = JSON.parse(llmResponse.text);
      } catch (e: any) {
          this.logger.error('Failed to parse LLM response for simulateTestExecution as JSON', { text: llmResponse.text, error: e.message });
          throw new Error('Failed to parse AI response for test simulation.');
      }

      const expectedSchema = {
          type: 'object',
          properties: {
              success: { type: 'boolean', description: "Overall test suite success status." },
              total: { type: 'number', description: "Total number of tests simulated." },
              passed: { type: 'number', description: "Number of tests that passed." },
              failed: { type: 'number', description: "Number of tests that failed." },
              failedTests: {
                  type: 'array',
                  items: {
                      type: 'object',
                      properties: {
                          name: { type: 'string', description: "Name or description of the failed test." },
                          message: { type: 'string', description: "Reason or error message for the failure." }
                      },
                      required: ['name', 'message']
                  }
              },
              summary: { type: 'string', description: "Optional summary of the test execution." }
          },
          required: ['success', 'total', 'passed', 'failed', 'failedTests']
      };

       if (!parsedOutputSim || typeof parsedOutputSim.success !== 'boolean' || 
           typeof parsedOutputSim.total !== 'number' || typeof parsedOutputSim.passed !== 'number' || 
           typeof parsedOutputSim.failed !== 'number' || !Array.isArray(parsedOutputSim.failedTests)
       ) {
          this.logger.error('simulateTestExecution: generateJsonResponse returned invalid data structure despite schema.');
          throw new Error('Failed to simulate tests: AI response has invalid structure after parsing.');
      }

      this.logger.log(`simulateTestExecution completed. Success: ${parsedOutputSim.success}, Passed: ${parsedOutputSim.passed}, Failed: ${parsedOutputSim.failed}`);
      return parsedOutputSim;

    } catch (error: any) {
      this.logger.error(`Error in simulateTestExecution: ${error && typeof error === 'object' && error.message ? error.message : String(error)}`, error && typeof error === 'object' && error.stack ? error.stack : undefined);
      
      const errorMessage = error && typeof error === 'object' && error.message ? String(error.message) : String(error);
      const errorStack = error && typeof error === 'object' && error.stack ? String(error.stack) : undefined;

      return { 
          success: false, 
          summary: `Error running tests: ${errorMessage}`,
          passed: 0, failed: 1, total: 1, 
          failedTests: [{ name: 'SimulationError', error: errorMessage, details: errorStack }]
      } as TestResult;
    }
  }

  /**
   * Valida se o código corrigido resolveu as falhas de teste anteriores.
   * @param codeFiles Código fonte corrigido.
   * @param previousTests Resultado da execução anterior (formato TestResult).
   * @param originalCodeContext Código original (opcional, para contexto).
   * @param originalPassingTestsContext Testes que passavam (opcional, para regressão).
   * @returns Um objeto JSON estruturado conforme ValidationFixResponse.
   */
  public async validateFix(
    codeFiles: { [path: string]: string }, 
    previousTestResult: TestResult,
    originalCodeContext?: string | null,
    originalPassingTestsContext?: string | null,
    options?: ValidateFixOptions
  ): Promise<ValidationFixResponse> {
    this.logger.log(`Validating fix based on previous test results (${previousTestResult?.failed || 0} failed)...`);

    const failedTestDetails = previousTestResult?.failedTests?.[0] || null;
    if (!failedTestDetails) {
        const errorMsg = "Cannot validate fix: No details found for previously failed tests.";
        this.logger.warn(errorMsg);
        return { isValid: false, explanation: errorMsg };
    }

    const fixedCodeContext = JSON.stringify(codeFiles); 

    try {
      const promptTemplate = await this.promptLoader.loadPrompt('test', 'validate_fix.hbs');
      if (!promptTemplate) {
        this.logger.error('Prompt template test/validate_fix.hbs not found!');
        throw new Error('Internal error: Validate fix prompt template not found.');
      }

      const promptData = {
        failedTestDetails: JSON.stringify(failedTestDetails, null, 2),
        originalPassingTestsContext: originalPassingTestsContext || "Not provided",
        originalCodeContext: originalCodeContext || "Not provided",
        fixedCodeContext: fixedCodeContext
      };

      const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
      this.logger.debug('Rendered validateFix prompt for LLM.');

      const llmResponse = await this.llmService.generate({
        prompt: finalPrompt,
        options: {
          temperature: 0.0,
          maxTokens: 2048,
        },
      });

       if (!llmResponse?.text) {
        this.logger.error(`validateFix LLM JSON generation failed: No text in response. ${llmResponse?.model || 'Unknown model'}`);
        throw new Error(`Failed to validate fix: ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'AI response generation error - no text'}`);
      }

      let parsedOutputVal: ValidationFixResponse;
      try {
          parsedOutputVal = JSON.parse(llmResponse.text);
      } catch (e: any) {
          this.logger.error('Failed to parse LLM response for validateFix as JSON', { text: llmResponse.text, error: e.message });
          throw new Error('Failed to parse AI response for test fix validation.');
      }

      const expectedSchema = {
          type: 'object',
          properties: {
              isValid: { type: 'boolean', description: "Whether the fix is considered valid (likely resolved the issues)." },
              explanation: { type: 'string', description: "Explanation of the validation result, including any remaining issues or regressions." }
          },
          required: ['isValid', 'explanation']
      };

       if (!parsedOutputVal || typeof parsedOutputVal.isValid !== 'boolean' || typeof parsedOutputVal.explanation !== 'string') {
          this.logger.error('validateFix: generateJsonResponse returned invalid data structure despite schema.');
          throw new Error('Failed to validate fix: AI response has invalid structure after parsing.');
      }

      this.logger.log(`validateFix completed. Is valid: ${parsedOutputVal.isValid}`);
      return parsedOutputVal;
      
    } catch (error: any) {
       this.logger.error(`Error in validateFix: ${error.message}`, error.stack);
       throw error;
    }
  }
} 