import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { AgentType } from '../../orchestrator/interfaces/workflow.interface'; // Import AgentType

export class CreateSessionDto {
    @ApiProperty({ description: 'Optional title for the session', example: 'My Coding Session' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiProperty({ 
        description: 'Initial agent type for the session', 
        enum: AgentType, 
        example: AgentType.CODER,
        required: false
    })
    @IsOptional()
    @IsEnum(AgentType) // Ensure it's validated as an enum member
    agentType?: AgentType;

    @ApiProperty({ description: 'Optional model ID for the session', example: 'gpt-4-turbo' })
    @IsOptional()
    @IsString()
    modelId?: string;

    @ApiProperty({ description: 'Optional initial context for the session', type: 'object', example: { currentFile: 'test.py' } })
    @IsOptional()
    @IsObject()
    initialContext?: Record<string, any>;

    // Adicionar outros campos que podem ser definidos na criação, se houver
    // Ex: @IsUUID() @IsOptional() userId?: string;
} 