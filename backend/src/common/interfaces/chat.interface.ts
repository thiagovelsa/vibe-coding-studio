// Baseado na interface ChatMessage do frontend/src/services/agent-api.service.ts

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export type ReferenceType = 'file' | 'url' | 'documentation';
export type ActionStatus = 'pending' | 'success' | 'error';
export type AttachmentType = 'file' | 'image' | 'document'; // Exemplo

export interface ChatMessageReference {
    type: ReferenceType;
    title: string;
    path?: string;
    url?: string;
    content?: string; // Pode ser grande, usar com cuidado
}

export interface ChatMessageCodeBlock {
    language: string;
    code: string;
    filename?: string;
    lineStart?: number;
    lineEnd?: number;
}

export interface ChatMessageAction {
    type: string; // Ex: 'run_command', 'apply_diff', 'open_file'
    description: string;
    status: ActionStatus;
    payload?: any; // Detalhes específicos da ação
    result?: any;
}

export interface ChatMessageAttachment {
    type: AttachmentType;
    name: string;
    url?: string;
    content?: string; // Base64 ou similar, usar com cuidado
}

export interface ChatMessageMetadata {
    thinking?: string; // Raciocínio intermediário
    references?: ChatMessageReference[];
    codeBlocks?: ChatMessageCodeBlock[];
    actions?: ChatMessageAction[];
    attachments?: ChatMessageAttachment[];
    llmResponseId?: string; // ID da resposta do LLM
    tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    latencyMs?: number;
    // Adicionar outros campos relevantes aqui
    [key: string]: any;
}

export interface ChatMessage {
    id: string; // Gerado pelo backend (ex: UUID)
    role: ChatMessageRole;
    content: string;
    timestamp: string; // ISO 8601
    sessionId: string; // Referência à sessão
    agentType?: string; // Tipo do agente que gerou (se role='assistant')
    metadata?: ChatMessageMetadata;

    // --- Campos de Feedback --- 
    rating?: number; // 1 (positivo), -1 (negativo), 0 (neutro)
    correction?: string; // Texto da correção
} 