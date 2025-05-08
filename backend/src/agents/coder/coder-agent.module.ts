import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { LoggerModule } from '../../logger/logger.module';
import { LlmModule } from '../../llm/llm.module';
import { AgentsCommonModule } from '../common';
import { CoderAgentService } from './coder-agent.service';

/**
 * Módulo que fornece o agente de código para geração de código
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    LlmModule,
    AgentsCommonModule,
  ],
  providers: [CoderAgentService],
  exports: [CoderAgentService],
})
export class CoderAgentModule {} 