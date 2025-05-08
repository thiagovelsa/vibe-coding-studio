import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiClipboard } from 'react-icons/fi';

export interface Requirement {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'implemented' | 'partially-implemented' | 'not-implemented' | 'blocked';
  complexity: 'high' | 'medium' | 'low';
  notes?: string;
  acceptanceCriteria?: string[];
  dependencies?: string[];
  suggestedImplementation?: string;
}

interface RequirementAnalysisProps {
  requirements: Requirement[];
  onRequirementClick?: (requirement: Requirement) => void;
  title?: string;
  onCopy?: (content: string) => void;
}

const RequirementAnalysis: React.FC<RequirementAnalysisProps> = ({
  requirements,
  onRequirementClick,
  title = 'Análise de Requisitos',
  onCopy,
}) => {
  const [expandedRequirements, setExpandedRequirements] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'status' | 'priority'>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const toggleRequirement = (id: string) => {
    setExpandedRequirements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyRequirement = (requirement: Requirement) => {
    if (onCopy) {
      const content = `
Requisito: ${requirement.name}
Descrição: ${requirement.description}
Prioridade: ${getPriorityLabel(requirement.priority)}
Status: ${getStatusLabel(requirement.status)}
Complexidade: ${getComplexityLabel(requirement.complexity)}
${requirement.notes ? `\nNotas: ${requirement.notes}` : ''}
${requirement.acceptanceCriteria ? `\nCritérios de Aceitação:\n${requirement.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}` : ''}
${requirement.dependencies ? `\nDependências:\n${requirement.dependencies.map(dep => `- ${dep}`).join('\n')}` : ''}
${requirement.suggestedImplementation ? `\nImplementação Sugerida:\n${requirement.suggestedImplementation}` : ''}
      `.trim();
      
      onCopy(content);
    } else {
      // Fallback para a API nativa do navegador
      navigator.clipboard.writeText(JSON.stringify(requirement, null, 2))
        .catch(err => console.error('Erro ao copiar para a área de transferência:', err));
    }
  };

  const getFilteredRequirements = () => {
    if (activeFilter === 'all') {
      return requirements;
    }
    
    if (activeFilter === 'status' && statusFilter) {
      return requirements.filter(req => req.status === statusFilter);
    }
    
    if (activeFilter === 'priority' && priorityFilter) {
      return requirements.filter(req => req.priority === priorityFilter);
    }
    
    return requirements;
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'implemented': return 'Implementado';
      case 'partially-implemented': return 'Parcialmente Implementado';
      case 'not-implemented': return 'Não Implementado';
      case 'blocked': return 'Bloqueado';
      default: return status;
    }
  };

  const getComplexityLabel = (complexity: string): string => {
    switch (complexity) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return complexity;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-500 dark:text-red-400';
      case 'medium': return 'text-yellow-500 dark:text-yellow-400';
      case 'low': return 'text-blue-500 dark:text-blue-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <FiCheckCircle className="text-green-500" />;
      case 'partially-implemented':
        return <FiInfo className="text-yellow-500" />;
      case 'not-implemented':
        return <FiX className="text-gray-400" />;
      case 'blocked':
        return <FiAlertTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'implemented': return 'text-green-500 dark:text-green-400';
      case 'partially-implemented': return 'text-yellow-500 dark:text-yellow-400';
      case 'not-implemented': return 'text-gray-500 dark:text-gray-400';
      case 'blocked': return 'text-red-500 dark:text-red-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'high': return 'text-red-500 dark:text-red-400';
      case 'medium': return 'text-yellow-500 dark:text-yellow-400';
      case 'low': return 'text-green-500 dark:text-green-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const filteredRequirements = getFilteredRequirements();

  if (requirements.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Nenhum requisito disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">{title}</h2>
          <div className="flex space-x-1 text-xs">
            <button
              className={`rounded px-2 py-1 ${activeFilter === 'all' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => {
                setActiveFilter('all');
                setStatusFilter(null);
                setPriorityFilter(null);
              }}
            >
              Todos
            </button>
            <button
              className={`rounded px-2 py-1 ${activeFilter === 'status' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveFilter('status')}
            >
              Status
            </button>
            <button
              className={`rounded px-2 py-1 ${activeFilter === 'priority' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveFilter('priority')}
            >
              Prioridade
            </button>
          </div>
        </div>

        {/* Filtros secundários */}
        {activeFilter === 'status' && (
          <div className="mt-2 flex space-x-1 text-xs">
            <button
              className={`rounded px-2 py-1 ${statusFilter === 'implemented' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('implemented')}
            >
              Implementado
            </button>
            <button
              className={`rounded px-2 py-1 ${statusFilter === 'partially-implemented' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('partially-implemented')}
            >
              Parcial
            </button>
            <button
              className={`rounded px-2 py-1 ${statusFilter === 'not-implemented' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('not-implemented')}
            >
              Não Implementado
            </button>
            <button
              className={`rounded px-2 py-1 ${statusFilter === 'blocked' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setStatusFilter('blocked')}
            >
              Bloqueado
            </button>
          </div>
        )}

        {activeFilter === 'priority' && (
          <div className="mt-2 flex space-x-1 text-xs">
            <button
              className={`rounded px-2 py-1 ${priorityFilter === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setPriorityFilter('high')}
            >
              Alta
            </button>
            <button
              className={`rounded px-2 py-1 ${priorityFilter === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setPriorityFilter('medium')}
            >
              Média
            </button>
            <button
              className={`rounded px-2 py-1 ${priorityFilter === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              onClick={() => setPriorityFilter('low')}
            >
              Baixa
            </button>
          </div>
        )}
      </div>

      {/* Lista de requisitos */}
      <div className="flex-1 overflow-auto p-2">
        {filteredRequirements.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Nenhum requisito encontrado com o filtro selecionado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequirements.map((requirement) => (
              <div 
                key={requirement.id} 
                className="group rounded-md border border-gray-200 dark:border-gray-700"
              >
                <div 
                  className="flex cursor-pointer items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => {
                    toggleRequirement(requirement.id);
                    if (onRequirementClick) onRequirementClick(requirement);
                  }}
                >
                  <div className="flex flex-1 items-center">
                    <button className="mr-2">
                      {expandedRequirements[requirement.id] ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
                    <div className="mr-2">{getStatusIcon(requirement.status)}</div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{requirement.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className={getStatusColor(requirement.status)}>
                          {getStatusLabel(requirement.status)}
                        </span>
                        <span className="mx-1">•</span>
                        <span className={getPriorityColor(requirement.priority)}>
                          Prioridade: {getPriorityLabel(requirement.priority)}
                        </span>
                        <span className="mx-1">•</span>
                        <span className={getComplexityColor(requirement.complexity)}>
                          Complexidade: {getComplexityLabel(requirement.complexity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyRequirement(requirement);
                    }}
                    className="ml-2 rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Copiar requisito"
                  >
                    <FiClipboard size={16} />
                  </button>
                </div>
                
                {expandedRequirements[requirement.id] && (
                  <div className="border-t border-gray-200 p-3 text-sm dark:border-gray-700">
                    <div className="mb-3 text-gray-700 dark:text-gray-300">
                      {requirement.description}
                    </div>
                    
                    {requirement.notes && (
                      <div className="mb-3">
                        <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">Notas:</div>
                        <div className="rounded bg-gray-50 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {requirement.notes}
                        </div>
                      </div>
                    )}
                    
                    {requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 && (
                      <div className="mb-3">
                        <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">Critérios de Aceitação:</div>
                        <ul className="list-inside list-disc space-y-1 rounded bg-gray-50 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {requirement.acceptanceCriteria.map((criteria, index) => (
                            <li key={index}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {requirement.dependencies && requirement.dependencies.length > 0 && (
                      <div className="mb-3">
                        <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">Dependências:</div>
                        <ul className="list-inside list-disc space-y-1 rounded bg-gray-50 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {requirement.dependencies.map((dependency, index) => (
                            <li key={index}>{dependency}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {requirement.suggestedImplementation && (
                      <div>
                        <div className="mb-1 font-medium text-gray-700 dark:text-gray-300">Implementação Sugerida:</div>
                        <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {requirement.suggestedImplementation}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementAnalysis; 