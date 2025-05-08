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
interface SecurityAnalysisOptions {
    temperature?: number;
    maxTokens?: number;
    toolsAvailable?: string;
    analysisDepth?: 'quick' | 'standard' | 'deep';
    focusAreas?: string[];
}

interface SecurityFixVerificationOptions {
    temperature?: number;
    maxTokens?: number;
    verificationFocus?: 'all_issues' | 'specific_cves' | string[];
    compareWithOriginal?: boolean;
}

const SECURITY_ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        potentialRisksIdentified: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    description: { type: 'string' },
                    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'informational'] },
                    file: { type: 'string' },
                    line: { type: 'number' },
                    cwe: { type: 'string' },
                    owasp: { type: 'string' },
                    recommendation: { type: 'string' }
                },
                required: ['description', 'severity', 'recommendation']
            }
        }
    },
    required: ['summary', 'potentialRisksIdentified']
};

const SECURITY_FIX_VERIFICATION_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        allOriginalIssuesFixed: { type: 'boolean' },
        newIssuesFound: { type: 'array', items: { /* PotentialRisk schema */ } },
        previouslyFixedIssuesReintroduced: { type: 'array', items: { /* PotentialRisk schema */ } },
        overallAssessment: { type: 'string' },
        verificationResults: { 
            type: 'array', 
            items: { 
                type: 'object',
                properties: {
                    originalIssueDescription: { type: 'string' },
                    status: { type: 'string', enum: ['fixed', 'partially_fixed', 'not_fixed', 'reintroduced'] },
                    verificationNotes: { type: 'string' }
                },
                required: ['originalIssueDescription', 'status']
            }
        }
    },
    required: ['summary', 'allOriginalIssuesFixed', 'newIssuesFound', 'previouslyFixedIssuesReintroduced', 'overallAssessment']
};

interface PotentialRisk {
    riskId?: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    file?: string;
    line?: number;
    cwe?: string;
    owasp?: string;
    recommendation: string;
}

interface SecurityAnalysisResponse {
    summary: string;
    potentialRisksIdentified: PotentialRisk[];
}

interface SecurityFixVerificationResponse {
    summary: string;
    allOriginalIssuesFixed: boolean;
    newIssuesFound: PotentialRisk[];
    previouslyFixedIssuesReintroduced: PotentialRisk[];
    overallAssessment: string;
    verificationResults?: Array<{
        originalIssueDescription: string;
        status: 'fixed' | 'partially_fixed' | 'not_fixed' | 'reintroduced';
        verificationNotes: string;
    }>;
    isSecure?: boolean;
}

interface SecurityIssue {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  cwe?: string;
  owasp?: string;
  recommendation: string;
  code?: string;
}

interface SecurityReport {
  hasIssues: boolean;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: SecurityIssue[];
  summary: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'none';
  recommendations: string[];
}

interface SecurityAgentLLMResponse {
  analysisSummary: string;
  potentialRisksIdentified: Array<{ 
    riskId: string; 
    description: string; 
    severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    cwe?: string;
    owasp?: string;
    recommendation: string; 
  }>;
  recommendationsGeneral: string[];
}

interface SecurityTaskInput {
    requirement: string;
    history?: ChatMessage[];
    feedbackContext?: string;
    contextCode?: string;
    contextLanguage?: string;
    contextRequirements?: UserStory[] | string;
    contextArchitecture?: string;
}

@Injectable()
export class SecurityAgentService implements AgentInterface {
    private readonly logger = new Logger(SecurityAgentService.name);
    public readonly type = 'security';
    private agentName = 'SecurityAgent';

    constructor(
        private readonly llmService: LlmService,
        private readonly loggerService: LoggerService,
        private readonly promptLoader: PromptLoaderService,
    ) {
        this.logger.log(`${this.agentName} initialized`);
    }

    async handle(task: AgentTask): Promise<AgentResponse> {
        this.logger.log(`SecurityAgent handling task: ${task.id}, Type: ${task.taskType}`);
        const { input, taskType } = task;

        try {
            let resultData: any;
            let message: string;

            if (taskType === 'analyze') {
                if (!input.codeToAnalyze || typeof input.codeToAnalyze !== 'object') {
                    throw new Error('Input for analyze task must include a valid codeToAnalyze object (map of file paths to content).');
                }
                resultData = await this.analyzeCode(input.codeToAnalyze, input.requirementsContext, input.options);
                message = resultData.summary || 'Security analysis completed.';
            } else if (taskType === 'verify_fix') {
                if (!input.codeToAnalyze || typeof input.codeToAnalyze !== 'object' || !input.previousAnalysis) {
                    throw new Error('Input for verify_fix task must include codeToAnalyze (object) and previousAnalysis.');
                }
                resultData = await this.verifyFixes(input.codeToAnalyze, input.previousAnalysis, input.originalCodeContext, input.options);
                message = resultData.summary || 'Security fix verification completed.';
            } else {
                this.logger.warn(`SecurityAgent received unknown taskType: ${taskType} for task ${task.id}`);
                return {
                    status: 'error',
                    message: `Unknown task type for Security Agent: ${taskType}`,
                    data: null,
                };
            }

            return {
                status: 'success',
                message,
                data: resultData,
            };

        } catch (error: any) {
            this.logger.error(`Error in SecurityAgent handle (Task ${task.id}): ${error.message}`, error.stack);
            return {
                status: 'error',
                message: `An unexpected error occurred in the Security Agent: ${error.message}`,
                data: null,
            };
        }
    }

    async isAvailable(): Promise<boolean> {
        // Check if LLM service is available and prompts are loadable
        return this.llmService.isAvailable();
    }

    getCapabilities(): string[] {
        return ['analyze_code', 'verify_security_fixes'];
    }

    /**
     * Task-specific method: Analyze code for security vulnerabilities.
     * This is called by the main handle() method when taskType is 'analyze'.
     */
    public async analyzeCode(
        codeFiles: { [path: string]: string }, 
        requirementsContext?: string | null,
        options?: SecurityAnalysisOptions
    ): Promise<SecurityAnalysisResponse> {
        this.logger.log(`analyzeCode called with ${Object.keys(codeFiles).length} files.`);
        const template = await this.promptLoader.loadPrompt('security', 'analyze_code.hbs');
        if (!template) {
            this.logger.error('Prompt template security/analyze_code.hbs not found!');
            throw new Error('Internal error: Analyze code prompt template not found.');
        }

        const codeContext = Object.entries(codeFiles)
            .map(([path, content]) => `// File: ${path}\n${content}`)
            .join('\n\n---\n\n');

        const promptData = {
            codeContext: codeContext,
            requirementsContext: requirementsContext || "No specific requirements provided.",
            toolsAvailable: options?.toolsAvailable || "N/A",
            analysisDepth: options?.analysisDepth || "standard",
        };

        try {
            const prompt = this.promptLoader.applyVariables(template, promptData);

            const llmResponse = await this.llmService.generate({
                prompt,
                options: {
                    temperature: options?.temperature ?? 0.1,
                    maxTokens: options?.maxTokens ?? 2000, 
                },
            });

            if (!llmResponse?.text) {
                this.logger.error(`analyzeCode LLM generation failed: No text in response. ${llmResponse?.model || 'Unknown model'}`);
                throw new Error(`Failed to analyze code: AI response generation error. ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'No text in response'}`);
            }
            
            let parsedOutput: SecurityAnalysisResponse;
            try {
                parsedOutput = JSON.parse(llmResponse.text);
            } catch (e: any) {
                this.logger.error('Failed to parse LLM response for analyzeCode as JSON', { text: llmResponse.text, error: e.message });
                throw new Error('Failed to parse AI response for security analysis.');
            }
            
            this.logger.log(`analyzeCode completed. Issues found: ${parsedOutput.potentialRisksIdentified?.length || 0}`);
            return parsedOutput;

        } catch (error: any) {
            this.logger.error(`Error in analyzeCode: ${error.message}`, error.stack);
            throw new Error(`Failed to analyze code: ${error.message}`);
        }
    }

    /**
     * Task-specific method: Verify if security fixes were applied correctly.
     * This is called by the main handle() method when taskType is 'verify_fix'.
     */
    public async verifyFixes(
        codeFiles: { [path: string]: string }, 
        previousAnalysis: SecurityAnalysisResponse, 
        originalCodeContext?: string | null,
        options?: SecurityFixVerificationOptions
    ): Promise<SecurityFixVerificationResponse> {
        this.logger.log(`verifyFixes called for ${Object.keys(codeFiles).length} files.`);
        const template = await this.promptLoader.loadPrompt('security', 'verify_fixes.hbs');
        if (!template) {
            this.logger.error('Prompt template security/verify_fixes.hbs not found!');
            throw new Error('Internal error: Verify fixes prompt template not found.');
        }

        if (!previousAnalysis?.potentialRisksIdentified || previousAnalysis.potentialRisksIdentified.length === 0) {
            const msg = "No previous security issues provided to verify fixes against.";
            this.logger.warn(msg);
            return { 
                summary: msg, 
                verificationResults: [], 
                newIssuesFound: [], 
                allOriginalIssuesFixed: true,
                overallAssessment: 'No issues to verify.',
                previouslyFixedIssuesReintroduced: []
            };
        }

        const fixedCodeContext = Object.entries(codeFiles)
            .map(([path, content]) => `// File: ${path}\n${content}`)
            .join('\n\n---\n\n');

        const originalIssuesJson = JSON.stringify(previousAnalysis.potentialRisksIdentified.map(r => ({ 
            description: r.description, 
            severity: r.severity, 
            file: r.file, 
            line: r.line 
        })), null, 2);

        const promptData = {
            originalIssuesJson,
            originalCodeContext: originalCodeContext || "Not provided",
            fixedCodeContext,
            verificationFocus: options?.verificationFocus || 'all_issues',
        };

        try {
            const prompt = this.promptLoader.applyVariables(template, promptData);

            const llmResponse = await this.llmService.generate({
                prompt,
                options: {
                    temperature: options?.temperature ?? 0.1,
                    maxTokens: options?.maxTokens ?? 1500, 
                },
            });

            if (!llmResponse?.text) {
                this.logger.error(`verifyFixes LLM JSON generation failed: No text in response. ${llmResponse?.model || 'Unknown model'}`);
                throw new Error(`Failed to verify fixes: ${llmResponse?.finishReason === 'error' ? 'Finish reason: error' : 'AI response generation error - no text'}`);
            }
            
            let parsedOutputVerify: SecurityFixVerificationResponse;
            try {
                parsedOutputVerify = JSON.parse(llmResponse.text);
            } catch (e: any) {
                this.logger.error('Failed to parse LLM response for verifyFixes as JSON', { text: llmResponse.text, error: e.message });
                throw new Error('Failed to parse AI response for security fix verification.');
            }
            
            this.logger.log(`verifyFixes completed. Verification summary: ${parsedOutputVerify.summary}`);
            return parsedOutputVerify;

        } catch (error: any) {
            this.logger.error(`Error in verifyFixes: ${error.message}`, error.stack);
            throw new Error(`Failed to verify security fixes: ${error.message}`);
        }
    }
}