import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { LoggerModule } from '../../logger/logger.module';
import { LlmModule } from '../../llm/llm.module';
import { AgentsCommonModule } from '../common';
import { ProductAgentService } from './product-agent.service';

/**
 * Módulo que fornece o agente de produto para análise de requisitos
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    LlmModule,
    AgentsCommonModule,
  ],
  providers: [ProductAgentService],
  exports: [ProductAgentService],
})
export class ProductAgentModule {} 