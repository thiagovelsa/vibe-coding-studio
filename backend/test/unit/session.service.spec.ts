import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionService } from '../../src/session/session.service';
import { SessionEntity } from '../../src/database/entities/session.entity';
import { ChatMessageEntity } from '../../src/database/entities/chat-message.entity';
import { CreateSessionDto } from '../../src/session/dto/create-session.dto';
import { OrchestratorService } from '../../src/orchestrator/orchestrator.service';
import { NotFoundException } from '@nestjs/common';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: Repository<SessionEntity>;
  let messageRepository: Repository<ChatMessageEntity>;
  let orchestratorService: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ChatMessageEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: OrchestratorService,
          useValue: {
            initializeSession: jest.fn(),
            handleUserMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get<Repository<SessionEntity>>(getRepositoryToken(SessionEntity));
    messageRepository = module.get<Repository<ChatMessageEntity>>(getRepositoryToken(ChatMessageEntity));
    orchestratorService = module.get<OrchestratorService>(OrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const dto: CreateSessionDto = {
        title: 'Test Session',
        agentType: 'coder',
        modelId: 'gpt-4',
      };

      const session = new SessionEntity();
      session.id = '123';
      session.title = dto.title;
      session.orchestratorState = { currentAgentType: dto.agentType, status: 'idle', steps: [] };
      session.createdAt = new Date();
      session.updatedAt = new Date();

      jest.spyOn(sessionRepository, 'create').mockReturnValue(session);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(session);
      jest.spyOn(orchestratorService, 'initializeSession').mockResolvedValue({
        currentAgentType: dto.agentType,
        status: 'idle',
        steps: [],
      });

      const result = await service.createSession(dto);

      expect(orchestratorService.initializeSession).toHaveBeenCalledWith(dto.agentType, dto.modelId);
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(session);
    });
  });

  describe('findAllSessions', () => {
    it('should return an array of sessions', async () => {
      const sessions = [new SessionEntity(), new SessionEntity()];
      jest.spyOn(sessionRepository, 'find').mockResolvedValue(sessions);

      const result = await service.findAllSessions();

      expect(sessionRepository.find).toHaveBeenCalled();
      expect(result).toEqual(sessions);
    });
  });

  describe('findOneSession', () => {
    it('should return a session by id', async () => {
      const session = new SessionEntity();
      session.id = '123';
      
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(session);

      const result = await service.findOneSession('123');

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['messages'],
      });
      expect(result).toEqual(session);
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOneSession('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMessageToSession', () => {
    it('should add a message to a session', async () => {
      const sessionId = '123';
      const content = 'Test message';
      const role = 'user';
      
      const session = new SessionEntity();
      session.id = sessionId;
      
      const message = new ChatMessageEntity();
      message.id = 'msg-1';
      message.content = content;
      message.role = role;
      message.session = session;
      
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(session);
      jest.spyOn(messageRepository, 'create').mockReturnValue(message);
      jest.spyOn(messageRepository, 'save').mockResolvedValue(message);
      jest.spyOn(orchestratorService, 'handleUserMessage').mockResolvedValue({
        content: 'Response from agent',
        role: 'assistant',
        agentType: 'coder',
      });

      const result = await service.addMessageToSession(sessionId, content);

      expect(sessionRepository.findOne).toHaveBeenCalled();
      expect(messageRepository.create).toHaveBeenCalled();
      expect(messageRepository.save).toHaveBeenCalled();
      expect(orchestratorService.handleUserMessage).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        content: 'Response from agent',
        role: 'assistant',
        agentType: 'coder',
      }));
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addMessageToSession('nonexistent', 'Test message')).rejects.toThrow(NotFoundException);
    });
  });
}); 