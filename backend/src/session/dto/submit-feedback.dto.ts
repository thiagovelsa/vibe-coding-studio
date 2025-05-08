import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitFeedbackDto {
    // Rating é opcional, mas se fornecido, deve ser -1, 0 ou 1
    @IsInt()
    @Min(-1)
    @Max(1)
    @IsOptional()
    rating?: number;

    // Correção é opcional, mas se fornecida, deve ser uma string
    @IsString()
    @IsOptional()
    correction?: string;

    // Garante que pelo menos um dos campos seja fornecido (validação customizada seria melhor, mas DTO cobre estrutura)
    // Um Pipe de validação customizado no controller poderia verificar isso.
} 