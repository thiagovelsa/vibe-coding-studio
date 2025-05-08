import { Module } from '@nestjs/common';
import { SecurityAgentService } from './security/security-agent.service';
import { LlmModule } from '../llm/llm.module';
import { LoggerModule } from '../logger/logger.module';
import { ConfigModule } from '../config/config.module';
import { PromptLoaderService } from './common/prompt-loader.service';

@Module({
  imports: [LlmModule, LoggerModule, ConfigModule],
  providers: [SecurityAgentService, PromptLoaderService],
  exports: [SecurityAgentService],
})
export class SecurityModule {}
