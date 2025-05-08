import { Injectable } from '@nestjs/common';
import { LlmService } from '../../backend/src/llm/llm.service';

/**
 * Serviço de mock para LlmService usado em testes
 */
@Injectable()
export class MockLlmService {
  /**
   * Simula a geração de texto por um LLM
   * @param options Opções de geração
   * @returns Resposta simulada
   */
  async generate(options: any): Promise<any> {
    // Extrai o prompt para análise
    const prompt = options.prompt || '';
    
    // Simula diferentes respostas com base no conteúdo do prompt
    if (prompt.includes('analyze_requirement')) {
      return {
        text: JSON.stringify([
          {
            id: 'US-1',
            title: 'Basic Feature Implementation',
            description: 'As a user, I want to be able to use the basic features',
            acceptanceCriteria: ['Feature works correctly', 'UI is responsive'],
            priority: 'high',
            complexity: 'medium',
          },
        ]),
        model: 'mock-model',
        promptTokens: 100,
        completionTokens: 150,
        totalTokens: 250,
      };
    }
    
    if (prompt.includes('generate_code')) {
      return {
        text: JSON.stringify({
          files: {
            'src/index.js': 'console.log("Hello World");',
            'src/utils.js': 'export const sum = (a, b) => a + b;',
          },
          summary: 'Generated code with basic functionality',
          technologies: ['JavaScript', 'Node.js'],
          dependencies: {
            'express': '^4.17.1',
          },
        }),
        model: 'mock-model',
        promptTokens: 200,
        completionTokens: 500,
        totalTokens: 700,
      };
    }
    
    if (prompt.includes('revise_code')) {
      return {
        text: JSON.stringify({
          files: {
            'src/index.js': 'console.log("Hello Revised World");',
            'src/utils.js': 'export const sum = (a, b) => a + b;\nexport const multiply = (a, b) => a * b;',
          },
          summary: 'Revised code with additional functions',
          technologies: ['JavaScript', 'Node.js'],
          dependencies: {
            'express': '^4.17.1',
          },
          changes: [
            {
              file: 'src/index.js',
              description: 'Updated greeting message',
            },
            {
              file: 'src/utils.js',
              description: 'Added multiply function',
            },
          ],
        }),
        model: 'mock-model',
        promptTokens: 250,
        completionTokens: 550,
        totalTokens: 800,
      };
    }
    
    if (prompt.includes('generate_tests')) {
      return {
        text: JSON.stringify({
          testFiles: {
            'tests/index.test.js': 'test("should log correct message", () => { expect(true).toBe(true); });',
            'tests/utils.test.js': 'test("sum function", () => { expect(sum(1, 2)).toBe(3); });',
          },
          testCases: [
            {
              name: 'Index module tests',
              file: 'tests/index.test.js',
              description: 'Tests for the main module',
              assertions: ['Should log the correct message'],
            },
            {
              name: 'Utils module tests',
              file: 'tests/utils.test.js',
              description: 'Tests for utility functions',
              assertions: ['Sum function should correctly add two numbers'],
            },
          ],
        }),
        model: 'mock-model',
        promptTokens: 300,
        completionTokens: 600,
        totalTokens: 900,
      };
    }
    
    if (prompt.includes('simulate_tests')) {
      return {
        text: JSON.stringify({
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
        }),
        model: 'mock-model',
        promptTokens: 350,
        completionTokens: 200,
        totalTokens: 550,
      };
    }
    
    if (prompt.includes('security_review') || prompt.includes('analyze_code')) {
      return {
        text: JSON.stringify({
          hasIssues: false,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          issues: [],
          summary: 'No security issues found',
          overallRisk: 'none',
          recommendations: ['Keep dependencies updated', 'Continue following security best practices'],
        }),
        model: 'mock-model',
        promptTokens: 400,
        completionTokens: 300,
        totalTokens: 700,
      };
    }
    
    // Resposta padrão para outros casos
    return {
      text: 'This is a mock response',
      model: 'mock-model',
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
    };
  }
} 