import { Module, Provider } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { LlmService } from './llm.service';
import { LlmAdapter } from './interfaces/llm.interface';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';

// export const LLM_ADAPTER_TOKEN = 'LLM_ADAPTERS'; // Token no longer needed

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
  ],
  providers: [
    // Remove the token provider entirely
    /*
    {
      provide: LLM_ADAPTER_TOKEN, 
      useValue: [], // Simplified value for testing provider order
    },
    */
    // Provide the services/adapters individually
    LlmService, 
    OllamaAdapter, // Still provided, even if not injected directly in LlmService currently
    OpenAiAdapter,
    AnthropicAdapter,
  ],
  exports: [LlmService],
})
export class LlmModule {} 