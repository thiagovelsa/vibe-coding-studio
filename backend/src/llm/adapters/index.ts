import { OllamaAdapter } from './ollama.adapter';
import { OpenAiAdapter } from './openai.adapter';
import { AnthropicAdapter } from './anthropic.adapter';

export const LLM_ADAPTERS = [
  OllamaAdapter,
  OpenAiAdapter,
  AnthropicAdapter,
];

export * from './ollama.adapter';
export * from './openai.adapter';
export * from './anthropic.adapter'; 