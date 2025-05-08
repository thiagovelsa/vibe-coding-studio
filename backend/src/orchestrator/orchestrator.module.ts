import { Module } from '@nestjs/common';
// import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrchestratorService } from './orchestrator.service';
import { AgentsModule } from '../agents/agents.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';

/**
 * Módulo de orquestração que coordena fluxos de trabalho entre agentes
 */
@Module({
  imports: [
    AgentsModule,
    DatabaseModule,
    LoggerModule,
    // EventEmitterModule.forRoot(...) REMOVED from here
  ],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {} 