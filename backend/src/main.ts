import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Configurar logger
  app.useLogger(app.get(Logger));

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configurar middlewares de segurança
  app.use(helmet());

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('VibeForge API')
    .setDescription('API do VibeForge Coding Studio')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Configurar prefixo global para as rotas da API
  app.setGlobalPrefix('api');

  // Iniciar servidor
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port);

  // Use o logger do NestJS
  const logger = app.get(Logger);
  logger.log(`🚀 VibeForge Backend rodando na porta ${port}`);
}

bootstrap(); 