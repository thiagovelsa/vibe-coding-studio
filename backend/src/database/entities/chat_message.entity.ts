import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SessionEntity } from './session.entity';
import { ChatMessageRole } from '../../common/interfaces/chat.interface';

@Entity('chat_messages')
export class ChatMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Coluna para a chave estrangeira da sessão
    @Column()
    sessionId!: string;

    // Relacionamento: Muitas mensagens pertencem a uma sessão
    @ManyToOne(() => SessionEntity, (session) => session.messages, {
        onDelete: 'CASCADE', // Excluir mensagens se a sessão for excluída
    })
    @JoinColumn({ name: 'sessionId' }) // Especifica a coluna FK
    session!: SessionEntity;

    @Column({ type: 'varchar', length: 20 })
    role!: ChatMessageRole;

    @Column({ type: 'text' })
    content!: string;

    // Usar JSONB ou 'simple-json' para metadados
    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    timestamp!: Date;

    // Opcional: Tipo do agente que enviou (se role='assistant')
    @Column({ type: 'varchar', length: 50, nullable: true })
    agentType?: string;

    // --- Campos de Feedback ---

    // Avaliação simples: 1 (positivo), -1 (negativo), 0 (neutro/sem nota)
    @Column({ type: 'smallint', nullable: true })
    rating?: number;

    // Correção textual fornecida pelo usuário
    @Column({ type: 'text', nullable: true })
    correction?: string;
} 