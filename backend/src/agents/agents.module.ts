import { Module } from '@nestjs/common';
import { CoderAgentService } from './coder/coder-agent.service';
import { ProductAgentService } from './product/product-agent.service';
import { TestAgentService } from './test/test-agent.service';
import { SecurityAgentService } from './security/security-agent.service';
import { LlmModule } from '@llm/llm.module';
import { LoggerModule } from '@logger/logger.module';
import { PromptLoaderService } from './common/prompt-loader.service';

/**
 * Módulo que registra todos os agentes do VibeForge IDE
 */
@Module({
  imports: [LlmModule, LoggerModule],
  providers: [
    CoderAgentService,
    ProductAgentService,
    TestAgentService,
    SecurityAgentService,
    PromptLoaderService,
  ],
  exports: [
    CoderAgentService,
    ProductAgentService,
    TestAgentService,
    SecurityAgentService,
  ],
})
export class AgentsModule {} 