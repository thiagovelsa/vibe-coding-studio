import { IsString, IsOptional, IsObject, MaxLength, IsEnum } from 'class-validator';
import { SessionStatus } from '../../database/entities/session.entity';

export class UpdateSessionDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @IsObject()
    @IsOptional()
    context?: Record<string, any>;

    @IsEnum(SessionStatus) // Validar se o status está entre os permitidos
    @IsOptional()
    status?: SessionStatus;

    @IsObject()
    @IsOptional()
    orchestratorState?: Record<string, any>;

    // Adicionar outros campos atualizáveis, se necessário
} 