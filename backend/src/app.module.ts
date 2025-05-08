import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { LlmModule } from './llm/llm.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { AgentsModule } from './agents/agents.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SessionModule } from './session/session.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    // Core NestJS utility modules earlier
    DiscoveryModule, 
    EventEmitterModule.forRoot(),

    // Then other application modules
    DatabaseModule,
    LlmModule,
    OrchestratorModule,
    AgentsModule,
    WebSocketModule,
    SessionModule,
    
    // TODO: Adicionar outros módulos à medida que forem desenvolvidos
    // - AuthModule
    // - ProjectModule
    // - EditorModule
    // - PluginModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 