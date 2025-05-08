import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Replicando a estrutura de SendMessageOptions do frontend para validação
// Adaptar ResponseFormat se necessário ou usar string

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsString()
    @IsOptional()
    responseFormat?: string; // Ou um Enum se definido no backend

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    requestedActions?: string[];
} 