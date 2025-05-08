import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AgentType } from '../../orchestrator/interfaces/workflow.interface'; // Reutilizar o enum de tipos de agente

export class OptimizePromptDto {
  @ApiProperty({
    description: 'The original user prompt to be optimized.',
    example: 'make the button blue',
  })
  @IsNotEmpty()
  @IsString()
  originalPrompt!: string;

  @ApiProperty({
    description: 'The type of agent the optimized prompt is intended for.',
    enum: AgentType,
    example: AgentType.CODER,
  })
  @IsNotEmpty()
  @IsEnum(AgentType)
  targetAgentType!: AgentType;
} 