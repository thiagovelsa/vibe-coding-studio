import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from '../../src/database/entities/session.entity';
import { ChatMessageEntity } from '../../src/database/entities/chat-message.entity';
import { CreateSessionDto } from '../../src/session/dto/create-session.dto';

describe('SessionController (e2e)', () => {
  let app: INestApplication;
  let createdSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [SessionEntity, ChatMessageEntity],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // CREATE SESSION
  it('/sessions (POST) - should create a new session', () => {
    const createSessionDto: CreateSessionDto = {
      title: 'Test Session',
      agentType: 'coder',
      modelId: 'gpt-4',
    };

    return request(app.getHttpServer())
      .post('/sessions')
      .send(createSessionDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe(createSessionDto.title);
        expect(res.body.orchestratorState.currentAgentType).toBe(createSessionDto.agentType);
        
        // Store the ID for later tests
        createdSessionId = res.body.id;
      });
  });

  // GET ALL SESSIONS
  it('/sessions (GET) - should return all sessions', () => {
    return request(app.getHttpServer())
      .get('/sessions')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('title');
      });
  });

  // GET ONE SESSION
  it('/sessions/:id (GET) - should return a specific session', () => {
    return request(app.getHttpServer())
      .get(`/sessions/${createdSessionId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', createdSessionId);
        expect(res.body).toHaveProperty('messages');
        expect(Array.isArray(res.body.messages)).toBe(true);
      });
  });

  // ADD MESSAGE TO SESSION
  it('/sessions/:id/messages (POST) - should add a message to a session', () => {
    const messageContent = 'Hello, agent!';

    return request(app.getHttpServer())
      .post(`/sessions/${createdSessionId}/messages`)
      .send({ content: messageContent })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
        expect(res.body).toHaveProperty('role', 'assistant');
        expect(res.body).toHaveProperty('agentType');
      });
  });

  // GET UPDATED SESSION AFTER MESSAGE
  it('/sessions/:id (GET) - should return session with messages', () => {
    return request(app.getHttpServer())
      .get(`/sessions/${createdSessionId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', createdSessionId);
        expect(res.body).toHaveProperty('messages');
        expect(Array.isArray(res.body.messages)).toBe(true);
        expect(res.body.messages.length).toBeGreaterThanOrEqual(2); // User message + agent response
      });
  });

  // UPDATE SESSION
  it('/sessions/:id (PATCH) - should update a session', () => {
    const updateData = {
      title: 'Updated Test Session',
    };

    return request(app.getHttpServer())
      .patch(`/sessions/${createdSessionId}`)
      .send(updateData)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id', createdSessionId);
        expect(res.body).toHaveProperty('title', updateData.title);
      });
  });

  // DELETE SESSION
  it('/sessions/:id (DELETE) - should delete a session', () => {
    return request(app.getHttpServer())
      .delete(`/sessions/${createdSessionId}`)
      .expect(200);
  });

  // VERIFY SESSION WAS DELETED
  it('/sessions/:id (GET) - should return 404 for deleted session', () => {
    return request(app.getHttpServer())
      .get(`/sessions/${createdSessionId}`)
      .expect(404);
  });
}); 