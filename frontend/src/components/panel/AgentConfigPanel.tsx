import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiSliders, FiList } from 'react-icons/fi';
import { AgentType } from '../../context/AgentContext';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextSize: number;
  isRecommended?: boolean;
}

interface AgentConfigPanelProps {
  agentType: AgentType;
  onSave?: (config: AgentConfig) => Promise<void>;
  onReset?: () => void;
  initialConfig?: AgentConfig;
}

export interface AgentConfig {
  agentType: AgentType;
  modelId: string;
  temperature: number;
  maxTokens: number;
  systemInstructions: string;
  additionalContext?: string;
  enabledCapabilities: string[];
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  agentType,
  onSave,
  onReset,
  initialConfig,
}) => {
  // Modelos disponíveis simulados (na implementação real, seriam obtidos da API)
  const availableModels: ModelOption[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Modelo avançado multimodal com excelente desempenho em tarefas complexas.',
      capabilities: ['code-generation', 'reasoning', 'planning', 'creativity'],
      contextSize: 128000,
      isRecommended: true,
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Modelo de alta capacidade para tarefas que exigem raciocínio complexo.',
      capabilities: ['planning', 'reasoning', 'creativity', 'code-review'],
      contextSize: 200000,
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Bom equilíbrio entre desempenho e velocidade para tarefas cotidianas.',
      capabilities: ['code-generation', 'reasoning', 'planning'],
      contextSize: 150000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Modelo rápido para tarefas mais simples, boa relação custo-benefício.',
      capabilities: ['code-generation', 'answering'],
      contextSize: 16000,
    },
  ];

  // Capacidades disponíveis com base no tipo de agente
  const getCapabilitiesByAgentType = (): { id: string; name: string; description: string }[] => {
    switch (agentType) {
      case 'coder':
        return [
          { id: 'code-generation', name: 'Geração de Código', description: 'Gerar código baseado em requisitos' },
          { id: 'refactoring', name: 'Refatoração', description: 'Melhorar código existente' },
          { id: 'debugging', name: 'Depuração', description: 'Encontrar e corrigir bugs' },
          { id: 'optimization', name: 'Otimização', description: 'Melhorar performance do código' },
        ];
      case 'product':
        return [
          { id: 'requirements', name: 'Análise de Requisitos', description: 'Extrair requisitos de descrições' },
          { id: 'user-stories', name: 'User Stories', description: 'Criar histórias de usuário' },
          { id: 'roadmapping', name: 'Roadmap', description: 'Planejar desenvolvimento de produto' },
          { id: 'documentation', name: 'Documentação', description: 'Gerar documentação técnica e de usuário' },
        ];
      case 'test':
        return [
          { id: 'test-plan', name: 'Plano de Testes', description: 'Criar planos de teste' },
          { id: 'unit-testing', name: 'Testes Unitários', description: 'Gerar testes unitários' },
          { id: 'integration-testing', name: 'Testes de Integração', description: 'Gerar testes de integração' },
          { id: 'e2e-testing', name: 'Testes E2E', description: 'Gerar testes end-to-end' },
        ];
      case 'security':
        return [
          { id: 'code-review', name: 'Revisão de Código', description: 'Revisar código em busca de vulnerabilidades' },
          { id: 'threat-modeling', name: 'Modelagem de Ameaças', description: 'Identificar potenciais ameaças' },
          { id: 'security-testing', name: 'Testes de Segurança', description: 'Gerar testes de segurança' },
          { id: 'compliance', name: 'Compliance', description: 'Verificar conformidade com padrões' },
        ];
      default:
        return [];
    }
  };

  // Estado para o formulário
  const [config, setConfig] = useState<AgentConfig>({
    agentType,
    modelId: initialConfig?.modelId || availableModels[0].id,
    temperature: initialConfig?.temperature || 0.7,
    maxTokens: initialConfig?.maxTokens || 4096,
    systemInstructions: initialConfig?.systemInstructions || getDefaultInstructions(),
    additionalContext: initialConfig?.additionalContext || '',
    enabledCapabilities: initialConfig?.enabledCapabilities || getCapabilitiesByAgentType().map(c => c.id),
  });

  // Estados para UI
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [activeTab, setActiveTab] = useState<'model' | 'parameters' | 'instructions' | 'capabilities'>('model');

  // Atualizar configuração quando o tipo de agente muda
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      agentType,
      enabledCapabilities: prev.agentType === agentType ? 
        prev.enabledCapabilities : 
        getCapabilitiesByAgentType().map(c => c.id),
    }));
  }, [agentType]);

  // Função para definir instruções padrão com base no tipo de agente
  function getDefaultInstructions(): string {
    switch (agentType) {
      case 'coder':
        return `Você é um assistente especializado em programação que ajuda a gerar, analisar e corrigir código.
        
- Gere código limpo, modular e bem documentado
- Siga as convenções de estilo da base de código existente
- Considere desempenho, segurança e manutenção do código
- Explique partes complexas com comentários úteis
- Forneça apenas o código solicitado, sem texto adicional`;
      case 'product':
        return `Você é um assistente especializado em análise de produto que ajuda a definir requisitos, criar histórias de usuário e planejar produtos.
        
- Extraia requisitos claros de descrições de produto
- Crie histórias de usuário detalhadas e acionáveis
- Priorize recursos com base em valor de negócio e esforço
- Sugira critérios de aceitação para cada recurso
- Organize requisitos em um roadmap lógico`;
      case 'test':
        return `Você é um assistente especializado em testes que ajuda a criar casos de teste, identificar cenários de teste e gerar scripts de teste.
        
- Analise os requisitos para identificar cenários de teste críticos
- Crie casos de teste que cobrem o fluxo feliz e casos de borda
- Gere código de teste limpo, modular e manutenível
- Considere a cobertura de teste em relação aos requisitos
- Priorize testes com base em risco e complexidade`;
      case 'security':
        return `Você é um assistente especializado em segurança que ajuda a identificar e corrigir vulnerabilidades em código e sistemas.
        
- Identifique vulnerabilidades comuns (OWASP Top 10, CWE Top 25)
- Sugira correções específicas para problemas de segurança
- Realize análise estática e revisão de código
- Considere implicações de segurança em decisões de design
- Priorize problemas com base em impacto e probabilidade`;
      default:
        return 'Você é um assistente de IA para o VibeForge IDE.';
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (onSave) {
        await onSave(config);
      }
      setSavedSuccessfully(true);
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      setConfig({
        agentType,
        modelId: availableModels[0].id,
        temperature: 0.7,
        maxTokens: 4096,
        systemInstructions: getDefaultInstructions(),
        additionalContext: '',
        enabledCapabilities: getCapabilitiesByAgentType().map(c => c.id),
      });
    }
    
    if (onReset) {
      onReset();
    }
  };

  const toggleCapability = (capabilityId: string) => {
    setConfig(prev => {
      if (prev.enabledCapabilities.includes(capabilityId)) {
        return {
          ...prev,
          enabledCapabilities: prev.enabledCapabilities.filter(id => id !== capabilityId),
        };
      } else {
        return {
          ...prev,
          enabledCapabilities: [...prev.enabledCapabilities, capabilityId],
        };
      }
    });
  };

  const selectedModel = availableModels.find(model => model.id === config.modelId) || availableModels[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">
            Configurações do Agente {agentType.toUpperCase()}
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              disabled={isSaving}
            >
              <FiRefreshCw className="mr-1" size={14} />
              Redefinir
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center rounded bg-primary-500 px-3 py-1 text-sm text-white hover:bg-primary-600 disabled:bg-primary-400 dark:bg-primary-600 dark:hover:bg-primary-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <FiRefreshCw className="mr-1 animate-spin" size={14} />
              ) : (
                <FiSave className="mr-1" size={14} />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
        {savedSuccessfully && (
          <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'model'
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('model')}
        >
          <FiSliders className="mr-1 inline" />
          Modelo
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'parameters'
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('parameters')}
        >
          <FiSliders className="mr-1 inline" />
          Parâmetros
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'instructions'
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('instructions')}
        >
          <FiList className="mr-1 inline" />
          Instruções
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'capabilities'
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('capabilities')}
        >
          <FiList className="mr-1 inline" />
          Capacidades
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-4">
        {/* Aba de Modelo */}
        {activeTab === 'model' && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Selecione o Modelo
              </label>
              <div className="space-y-3">
                {availableModels.map((model) => (
                  <div 
                    key={model.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      config.modelId === model.id
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setConfig({ ...config, modelId: model.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={config.modelId === model.id}
                          onChange={() => setConfig({ ...config, modelId: model.id })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:text-primary-400 dark:focus:ring-primary-400"
                        />
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                          {model.name}
                          {model.isRecommended && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Recomendado
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {model.contextSize.toLocaleString()} tokens
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{model.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {model.capabilities.map((capability) => (
                        <span 
                          key={capability}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Aba de Parâmetros */}
        {activeTab === 'parameters' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="temperature" className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Temperatura: {config.temperature.toFixed(1)}
              </label>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Controla a aleatoriedade das respostas. Valores mais baixos tornam as respostas mais determinísticas.
              </p>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Determinístico</span>
                <span>Criativo</span>
              </div>
            </div>

            <div>
              <label htmlFor="maxTokens" className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Tokens máximos: {config.maxTokens}
              </label>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Número máximo de tokens que o modelo pode gerar. O modelo actual suporta até {selectedModel.contextSize.toLocaleString()} tokens.
              </p>
              <input
                id="maxTokens"
                type="range"
                min="256"
                max={selectedModel.contextSize}
                step="256"
                value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>256</span>
                <span>{selectedModel.contextSize.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label htmlFor="additionalContext" className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Contexto adicional (opcional)
              </label>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Informações adicionais que serão incluídas em todas as solicitações para este agente.
              </p>
              <textarea
                id="additionalContext"
                value={config.additionalContext}
                onChange={(e) => setConfig({ ...config, additionalContext: e.target.value })}
                placeholder="Ex: Preferências específicas de código, padrões a seguir, etc."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-primary-400 dark:focus:ring-primary-400"
              />
            </div>
          </div>
        )}

        {/* Aba de Instruções */}
        {activeTab === 'instructions' && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="systemInstructions" className="block font-medium text-gray-700 dark:text-gray-300">
                  Instruções do sistema
                </label>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, systemInstructions: getDefaultInstructions() })}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Redefinir para padrão
                </button>
              </div>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Estas instruções guiam o comportamento do agente em todas as interações.
              </p>
              <textarea
                id="systemInstructions"
                value={config.systemInstructions}
                onChange={(e) => setConfig({ ...config, systemInstructions: e.target.value })}
                rows={15}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-primary-400 dark:focus:ring-primary-400"
              />
            </div>
          </div>
        )}

        {/* Aba de Capacidades */}
        {activeTab === 'capabilities' && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Capacidades habilitadas
              </label>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Selecione as capacidades que este agente pode utilizar.
              </p>
              <div className="space-y-3">
                {getCapabilitiesByAgentType().map((capability) => (
                  <div key={capability.id} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`capability-${capability.id}`}
                      checked={config.enabledCapabilities.includes(capability.id)}
                      onChange={() => toggleCapability(capability.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:text-primary-400 dark:focus:ring-primary-400"
                    />
                    <div className="ml-3">
                      <label
                        htmlFor={`capability-${capability.id}`}
                        className="block font-medium text-gray-700 dark:text-gray-300"
                      >
                        {capability.name}
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentConfigPanel; 