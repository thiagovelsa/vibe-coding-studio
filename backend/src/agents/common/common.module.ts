import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { LoggerModule } from '../../logger/logger.module';
import { PromptLoaderService } from './prompt-loader.service';

/**
 * Módulo que fornece funcionalidades comuns para todos os agentes
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
  ],
  providers: [PromptLoaderService],
  exports: [PromptLoaderService],
})
export class AgentsCommonModule {} 