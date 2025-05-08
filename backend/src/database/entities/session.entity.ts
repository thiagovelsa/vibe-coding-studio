import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessageEntity } from './chat_message.entity'; // Importar ChatMessageEntity
import { OrchestratorState } from '../../orchestrator/interfaces/orchestrator-state.interface'; // Importar OrchestratorState
// import { AgentType } from '../../common/enums/agent-type.enum'; // Se AgentType enum for usado

export enum SessionStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ERROR = 'error'
}

@Entity('sessions')
export class SessionEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title?: string;

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status!: SessionStatus;

    // Adicionando agentType e modelId
    @Column({ type: 'varchar', length: 50, nullable: true })
    agentType?: string; // Ou AgentType se o enum for definido e usado

    @Column({ type: 'varchar', length: 100, nullable: true })
    modelId?: string;

    // Coluna para armazenar o contexto geral da sessão (arquivos abertos, estado do projeto, etc.)
    // Usar JSONB para PostgreSQL ou 'simple-json' para SQLite/MySQL
    @Column({ type: 'simple-json', nullable: true })
    context?: Record<string, any>;

    // Coluna para armazenar o estado interno do orquestrador para esta sessão
    @Column({ type: 'jsonb', nullable: true, default: { status: 'idle', steps: [], context: {} } })
    orchestratorState?: OrchestratorState;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ nullable: true })
    completedAt?: Date;

    // Relacionamento: Uma sessão pode ter muitas mensagens
    @OneToMany(() => ChatMessageEntity, (message) => message.session)
    messages!: ChatMessageEntity[];

    // Opcional: Relacionar com um usuário, se aplicável
    // @Column({ nullable: true })
    // userId?: string;
} 