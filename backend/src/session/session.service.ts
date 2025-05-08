import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatMessage, ChatMessageRole } from '../common/interfaces/chat.interface';
import { SessionEntity, SessionStatus } from '../database/entities/session.entity';
import { ChatMessageEntity } from '../database/entities/chat_message.entity';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger/logger.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { OptimizePromptDto } from './dto/optimize-prompt.dto';
import { LlmService } from '../llm/llm.service';
import { PromptLoaderService } from '../agents/common/prompt-loader.service';

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);

    constructor(
        private readonly orchestratorService: OrchestratorService,
        private readonly loggerService: LoggerService,
        private readonly llmService: LlmService,
        private readonly promptLoader: PromptLoaderService,
        @InjectRepository(SessionEntity)
        private sessionRepository: Repository<SessionEntity>,
        @InjectRepository(ChatMessageEntity)
        private messageRepository: Repository<ChatMessageEntity>,
    ) {}

    async addMessageToSession(sessionId: string, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
        this.logger.log(`Adding message to session ${sessionId}`);
        
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (!session) {
            this.logger.error(`Session with ID ${sessionId} not found.`);
            throw new NotFoundException(`Session with ID ${sessionId} not found`);
        }
        if (session.status !== 'active') {
             this.logger.warn(`Attempted to add message to inactive session ${sessionId} (status: ${session.status})`);
             throw new Error(`Session ${sessionId} is not active.`);
        }

        const userMessageEntity = this.messageRepository.create({
            sessionId: sessionId,
            session: session,
            role: 'user',
            content: sendMessageDto.content,
            metadata: sendMessageDto.metadata 
        });
        await this.messageRepository.save(userMessageEntity);
        this.logger.debug(`User message saved: ${userMessageEntity.id}`);

        try {
            const assistantResponse = await this.orchestratorService.handleUserMessage(
                session,
                userMessageEntity
            );

            const assistantMessageEntity = this.messageRepository.create({
                sessionId: sessionId,
                session: session,
                role: 'assistant',
                content: assistantResponse.content, 
                agentType: assistantResponse.agentType,
                metadata: {
                    ...(assistantResponse.metadata || {}),
                    structuredOutput: assistantResponse.structuredOutput
                }
            });
            await this.messageRepository.save(assistantMessageEntity);
            this.logger.debug(`Assistant message saved: ${assistantMessageEntity.id}`);

            session.updatedAt = new Date();
            await this.sessionRepository.save(session);

            return {
                id: assistantMessageEntity.id,
                role: assistantMessageEntity.role,
                content: assistantMessageEntity.content,
                timestamp: assistantMessageEntity.timestamp.toISOString(),
                sessionId: assistantMessageEntity.sessionId,
                agentType: assistantMessageEntity.agentType,
                metadata: assistantMessageEntity.metadata
            };

        } catch (error: any) {
            this.logger.error(`Error handling message via orchestrator for session ${sessionId}: ${error.message}`, error.stack);
            await this.updateSessionStatus(sessionId, SessionStatus.ERROR);
            throw new InternalServerErrorException('Failed to get response from assistant');
        }
    }

    async optimizePrompt(
        sessionId: string, 
        optimizeDto: OptimizePromptDto
    ): Promise<{ optimizedPrompt: string }> {
        this.logger.log(`Optimizing prompt for session ${sessionId}, target agent: ${optimizeDto.targetAgentType}`);
        
        const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
        if (!session) {
            this.logger.error(`Session with ID ${sessionId} not found for prompt optimization.`);
            throw new NotFoundException(`Session with ID ${sessionId} not found`);
        }
        
        const historyEntities = await this.messageRepository.find({
            where: { sessionId: sessionId },
            order: { timestamp: 'DESC' },
            take: 10,
        });
        const recentHistory = historyEntities.reverse();

        const formattedHistory = recentHistory
            .map(msg => `${msg.role === 'user' ? 'User' : (msg.role === 'assistant' ? `Assistant (${msg.agentType || 'Agent'})` : 'System')}: ${msg.content}`)
            .join('\n\n');
            
        const workflowContext = JSON.stringify(session.orchestratorState?.context || {}, null, 2);
        
        try {
            const promptTemplate = await this.promptLoader.loadPrompt('utility', 'optimize_prompt.hbs');
            if (!promptTemplate) {
                 this.logger.error('Prompt template utility/optimize_prompt.hbs not found!');
                 throw new InternalServerErrorException('Prompt optimization template not found.');
            }

            const promptData = {
                targetAgentType: optimizeDto.targetAgentType,
                originalPrompt: optimizeDto.originalPrompt,
                history: formattedHistory || "No recent history available.",
                workflowContext: workflowContext !== '{}' ? workflowContext : "No specific workflow context available."
            };

            const finalPrompt = this.promptLoader.applyVariables(promptTemplate, promptData);
            this.logger.debug(`Rendered optimize prompt for session ${sessionId}`);

            const llmResponse = await this.llmService.generate({
                prompt: finalPrompt,
                options: {
                    temperature: 0.2,
                    maxTokens: 500,
                },
            });

            if (!llmResponse || !llmResponse.text) {
                this.logger.error(`LLM failed to generate optimized prompt for session ${sessionId}`);
                throw new InternalServerErrorException('Failed to get optimization from AI.');
            }

            const optimizedPrompt = llmResponse.text.trim();
            this.logger.log(`Prompt optimized successfully for session ${sessionId}`);
            
            return { optimizedPrompt };

        } catch (error: any) {
            this.logger.error(`Error during prompt optimization for session ${sessionId}: ${error.message}`, error.stack);
            if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
                 throw error;
            }
            throw new InternalServerErrorException(`Failed to optimize prompt: ${error.message}`);
        }
    }

    async getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
        this.logger.log(`Fetching messages for session ${sessionId}`);
        const messages = await this.messageRepository.find({ 
            where: { sessionId }, 
            order: { timestamp: 'ASC' } 
        });
        return messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
            sessionId: m.sessionId,
            agentType: m.agentType,
            metadata: m.metadata
        }));
    }

    async createSession(createSessionDto: CreateSessionDto): Promise<SessionEntity> {
        this.logger.log(`Creating new session with title: ${createSessionDto.title || '(no title)'}, agentType: ${createSessionDto.agentType}, modelId: ${createSessionDto.modelId}`);
        const newSession = this.sessionRepository.create({
            title: createSessionDto.title,
            context: createSessionDto.initialContext || {},
            agentType: createSessionDto.agentType,
            modelId: createSessionDto.modelId,
            status: SessionStatus.ACTIVE,
            orchestratorState: { 
                status: 'idle', 
                steps: [], 
                currentAgent: createSessionDto.agentType || undefined,
                context: createSessionDto.initialContext || {}
            }
        });
        await this.sessionRepository.save(newSession);
        this.logger.log(`Session created with ID: ${newSession.id}`);
        return newSession;
    }

    async getSession(sessionId: string): Promise<SessionEntity | null> {
        this.logger.log(`Fetching session ${sessionId}`);
        return this.sessionRepository.findOne({ 
            where: { id: sessionId },
            relations: ['messages']
        });
    }

    async updateSession(sessionId: string, updateSessionDto: UpdateSessionDto): Promise<SessionEntity> {
        this.logger.log(`Updating session ${sessionId}`);
        const session = await this.sessionRepository.preload({
            id: sessionId,
            ...updateSessionDto,
        });
        if (!session) {
            throw new NotFoundException(`Session with ID ${sessionId} not found for update`);
        }
        if ((updateSessionDto.status === 'completed' || updateSessionDto.status === 'error') && !session.completedAt) {
            session.completedAt = new Date();
        }
        await this.sessionRepository.save(session);
        this.logger.log(`Session ${sessionId} updated.`);
        return session;
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.logger.log(`Deleting session ${sessionId}`);
        const result = await this.sessionRepository.delete(sessionId);
        if (result.affected === 0) {
            throw new NotFoundException(`Session with ID ${sessionId} not found for deletion`);
        }
        this.logger.log(`Session ${sessionId} deleted.`);
    }

    async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<SessionEntity> {
        const session = await this.getSession(sessionId);
        if (!session) {
             throw new NotFoundException(`Session with ID ${sessionId} not found`);
        }
        session.status = status;
        if (status === 'completed' || status === 'error') {
            session.completedAt = new Date();
        }
        return this.sessionRepository.save(session);
    }

    async addFeedbackToMessage(
        sessionId: string, 
        messageId: string, 
        feedbackDto: SubmitFeedbackDto
    ): Promise<ChatMessageEntity> {
        this.logger.log(`Adding feedback to message ${messageId} in session ${sessionId}`);

        if (feedbackDto.rating === undefined && feedbackDto.correction === undefined) {
            throw new Error('At least one feedback field (rating or correction) must be provided.');
        }

        const message = await this.messageRepository.findOne({ where: { id: messageId, sessionId: sessionId } });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found in session ${sessionId}`);
        }

        if (feedbackDto.rating !== undefined) {
            message.rating = feedbackDto.rating;
        }
        if (feedbackDto.correction !== undefined) {
            message.correction = feedbackDto.correction.trim() || undefined;
        }

        await this.messageRepository.save(message);
        this.logger.log(`Feedback added to message ${messageId}`);

        return message;
    }
}
