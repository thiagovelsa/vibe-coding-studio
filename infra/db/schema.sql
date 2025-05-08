-- Schema inicial do banco de dados VibeForge

-- Configurações do banco de dados
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela RunHistory para armazenar histórico de execuções
CREATE TABLE IF NOT EXISTS run_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    duration_ms INTEGER,
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'cancelled'
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para RunHistory
CREATE INDEX IF NOT EXISTS idx_run_history_run_id ON run_history(run_id);
CREATE INDEX IF NOT EXISTS idx_run_history_user_id ON run_history(user_id);
CREATE INDEX IF NOT EXISTS idx_run_history_created_at ON run_history(created_at);
CREATE INDEX IF NOT EXISTS idx_run_history_model_name ON run_history(model_name);
CREATE INDEX IF NOT EXISTS idx_run_history_status ON run_history(status);

-- Tabela AgentInteractions para logs de interações
CREATE TABLE IF NOT EXISTS agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id VARCHAR(50) NOT NULL, -- Relacionado ao run_id em run_history
    agent_name VARCHAR(100) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'user_input', 'agent_response', 'tool_call', 'error'
    content TEXT NOT NULL,
    parent_interaction_id UUID REFERENCES agent_interactions(id),
    step_number INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para AgentInteractions
CREATE INDEX IF NOT EXISTS idx_agent_interactions_run_id ON agent_interactions(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent_name ON agent_interactions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created_at ON agent_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_parent_interaction_id ON agent_interactions(parent_interaction_id);

-- Trigger para atualizar o campo updated_at em run_history
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_run_history_updated_at
BEFORE UPDATE ON run_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE run_history IS 'Histórico de execuções de modelos de IA no VibeForge IDE';
COMMENT ON TABLE agent_interactions IS 'Logs de interações entre usuários e agentes de IA'; 