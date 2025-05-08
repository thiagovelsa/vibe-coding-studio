import { Body, Controller, Param, Post, Get, Patch, Delete, HttpCode, HttpStatus, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { SessionService } from './session.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { OptimizePromptDto } from './dto/optimize-prompt.dto';
import { ChatMessage } from '../common/interfaces/chat.interface';
import { SessionEntity } from '../database/entities/session.entity';
import { ChatMessageEntity } from '../database/entities/chat_message.entity';

@Controller('sessions')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createSession(@Body() createSessionDto: CreateSessionDto): Promise<SessionEntity> {
        return this.sessionService.createSession(createSessionDto);
    }

    /* // REMOVING: Potential security/privacy issue. List all should be user-specific.
    @Get()
    async getAllSessions(): Promise<SessionEntity[]> {
        return this.sessionService.getAllSessions();
    }
    */

    @Get(':sessionId')
    async getSession(@Param('sessionId', ParseUUIDPipe) sessionId: string): Promise<SessionEntity> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) {
            throw new NotFoundException(`Session with ID ${sessionId} not found`);
        }
        return session;
    }

    @Post(':sessionId/messages')
    @HttpCode(HttpStatus.OK)
    async sendMessage(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @Body() sendMessageDto: SendMessageDto,
    ): Promise<ChatMessage> {
        return this.sessionService.addMessageToSession(sessionId, sendMessageDto);
    }

    @Get(':sessionId/messages')
    async getMessages(@Param('sessionId', ParseUUIDPipe) sessionId: string): Promise<ChatMessage[]> {
        const sessionExists = await this.sessionService.getSession(sessionId);
        if (!sessionExists) {
             throw new NotFoundException(`Session with ID ${sessionId} not found`);
        }
        return this.sessionService.getMessagesForSession(sessionId);
    }

    @Patch(':sessionId')
    async updateSession(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @Body() updateSessionDto: UpdateSessionDto,
    ): Promise<SessionEntity> {
        return this.sessionService.updateSession(sessionId, updateSessionDto);
    }

    @Delete(':sessionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSession(@Param('sessionId', ParseUUIDPipe) sessionId: string): Promise<void> {
        await this.sessionService.deleteSession(sessionId);
    }

    @Post(':sessionId/optimize-prompt')
    @HttpCode(HttpStatus.OK)
    async optimizePrompt(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @Body() optimizePromptDto: OptimizePromptDto,
    ): Promise<{ optimizedPrompt: string }> {
        return this.sessionService.optimizePrompt(sessionId, optimizePromptDto);
    }

    @Post(':sessionId/messages/:messageId/feedback')
    @HttpCode(HttpStatus.OK)
    async submitFeedback(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
        @Body() submitFeedbackDto: SubmitFeedbackDto
    ): Promise<ChatMessageEntity> {
        return this.sessionService.addFeedbackToMessage(sessionId, messageId, submitFeedbackDto);
    }
}
