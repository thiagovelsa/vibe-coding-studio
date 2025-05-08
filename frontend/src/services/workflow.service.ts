import { useState, useCallback } from 'react';
import { useApi } from './api.service';
import { useWebSocket } from './websocket.service';
import { v4 as uuidv4 } from 'uuid';

// Tipos de etapas do fluxo de trabalho
export enum WorkflowStepType {
  AGENT_TASK = 'agent_task',
  HUMAN_REVIEW = 'human_review',
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  DEPLOYMENT = 'deployment',
  CUSTOM = 'custom'
}

// Tipos de fluxo de trabalho predefinidos
export enum WorkflowTemplateType {
  CREATE_COMPONENT = 'create_component',
  FIX_BUG = 'fix_bug',
  ADD_FEATURE = 'add_feature',
  REFACTOR = 'refactor',
  CODE_REVIEW = 'code_review',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  CUSTOM = 'custom'
}

// Status do fluxo de trabalho
export enum WorkflowStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING_FOR_HUMAN = 'waiting_for_human',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Status da etapa do fluxo de trabalho
export enum WorkflowStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING_FOR_HUMAN = 'waiting_for_human',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

// Interface para uma etapa do fluxo de trabalho
export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  order: number;
  config: any;
  dependsOn?: string[];
  output?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  timeoutMinutes?: number;
  assignedTo?: string;
  metadata?: Record<string, any>;
}

// Interface para o fluxo de trabalho
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  steps: WorkflowStep[];
  currentStepId?: string;
  template?: WorkflowTemplateType;
  context?: {
    projectId?: string;
    repositoryUrl?: string;
    branch?: string;
    files?: string[];
    requirements?: string;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

// Configuração para criar um novo fluxo de trabalho
export interface CreateWorkflowOptions {
  name: string;
  description: string;
  template?: WorkflowTemplateType;
  context?: {
    projectId?: string;
    repositoryUrl?: string;
    branch?: string;
    files?: string[];
    requirements?: string;
    [key: string]: any;
  };
  steps?: Omit<WorkflowStep, 'id' | 'workflowId' | 'status' | 'startTime' | 'endTime'>[];
  metadata?: Record<string, any>;
}

// Configuração para atualizar um fluxo de trabalho existente
export interface UpdateWorkflowOptions {
  id: string;
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  currentStepId?: string;
  context?: {
    projectId?: string;
    repositoryUrl?: string;
    branch?: string;
    files?: string[];
    requirements?: string;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}

// Resposta de uma ação humana em uma etapa de workflow
export interface HumanActionResponse {
  workflowId: string;
  stepId: string;
  action: 'approve' | 'reject' | 'modify' | 'comment';
  data?: any;
  comment?: string;
  modifications?: {
    [key: string]: any;
  };
}

// Interface para busca de workflows
export interface WorkflowSearchOptions {
  status?: WorkflowStatus | WorkflowStatus[];
  template?: WorkflowTemplateType;
  createdBy?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Interface para o resultado da busca de workflows
export interface WorkflowSearchResult {
  items: Workflow[];
  total: number;
  page: number;
  limit: number;
}

// Interface para o serviço de workflow
export interface WorkflowService {
  // Estado
  workflows: Workflow[];
  activeWorkflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  error: Error | null;
  
  // Métodos
  getWorkflows: (options?: WorkflowSearchOptions) => Promise<WorkflowSearchResult>;
  getWorkflowById: (id: string) => Promise<Workflow>;
  createWorkflow: (options: CreateWorkflowOptions) => Promise<Workflow>;
  updateWorkflow: (options: UpdateWorkflowOptions) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  
  // Controle de fluxo
  startWorkflow: (id: string) => Promise<Workflow>;
  pauseWorkflow: (id: string) => Promise<Workflow>;
  resumeWorkflow: (id: string) => Promise<Workflow>;
  cancelWorkflow: (id: string) => Promise<Workflow>;
  
  // Gestão de etapas
  getWorkflowStep: (workflowId: string, stepId: string) => Promise<WorkflowStep>;
  submitHumanAction: (response: HumanActionResponse) => Promise<WorkflowStep>;
  skipWorkflowStep: (workflowId: string, stepId: string) => Promise<Workflow>;
  retryWorkflowStep: (workflowId: string, stepId: string) => Promise<Workflow>;
  
  // Seleção
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  
  // Templates
  getWorkflowTemplates: () => Promise<{
    id: WorkflowTemplateType;
    name: string;
    description: string;
    steps: Omit<WorkflowStep, 'id' | 'workflowId' | 'status' | 'startTime' | 'endTime'>[];
  }[]>;
}

export function useWorkflowService(): WorkflowService {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  
  const api = useApi();
  
  // WebSocket para receber atualizações em tempo real do sistema de workflows
  const { messages } = useWebSocket({
    onOpen: () => {
      console.log('Workflow WebSocket conectado');
    },
  });
  
  // Processa mensagens WebSocket
  useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    
    try {
      const { type, payload } = lastMessage;
      
      switch (type) {
        case 'workflow:updated': {
          const updatedWorkflow = payload as Workflow;
          
          // Atualiza a lista de workflows
          setWorkflows(prev => 
            prev.map((w: Workflow) => w.id === updatedWorkflow.id ? updatedWorkflow : w)
          );
          
          // Atualiza a lista de workflows ativos
          const isActive = [
            WorkflowStatus.RUNNING, 
            WorkflowStatus.WAITING_FOR_HUMAN, 
            WorkflowStatus.PAUSED
          ].includes(updatedWorkflow.status);
          
          if (isActive) {
            setActiveWorkflows(prev => {
              const exists = prev.some((w: Workflow) => w.id === updatedWorkflow.id);
              if (!exists) {
                return [...prev, updatedWorkflow];
              }
              return prev.map((w: Workflow) => w.id === updatedWorkflow.id ? updatedWorkflow : w);
            });
          } else {
            setActiveWorkflows(prev => 
              prev.filter((w: Workflow) => w.id !== updatedWorkflow.id)
            );
          }
          
          // Atualiza o workflow atual, se for o mesmo
          if (currentWorkflow && currentWorkflow.id === updatedWorkflow.id) {
            setCurrentWorkflow(updatedWorkflow);
          }
          
          break;
        }
        
        case 'workflow:deleted': {
          const { id } = payload as { id: string };
          
          // Remove o workflow das listas
          setWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
          setActiveWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
          
          // Limpa o workflow atual se for o mesmo
          if (currentWorkflow && currentWorkflow.id === id) {
            setCurrentWorkflow(null);
          }
          
          break;
        }
        
        case 'workflow:step:updated': {
          const updatedStep = payload as WorkflowStep;
          const { workflowId, id: stepId } = updatedStep;
          
          // Função para atualizar um workflow com uma etapa atualizada
          const updateWorkflowWithStep = (workflow: Workflow): Workflow => {
            if (workflow.id !== workflowId) return workflow;
            
            return {
              ...workflow,
              steps: workflow.steps.map((step: WorkflowStep) => 
                step.id === stepId ? updatedStep : step
              )
            };
          };
          
          // Atualiza as listas
          setWorkflows(prev => prev.map((w: Workflow) => updateWorkflowWithStep(w)));
          setActiveWorkflows(prev => prev.map((w: Workflow) => updateWorkflowWithStep(w)));
          
          // Atualiza o workflow atual, se for o mesmo
          if (currentWorkflow && currentWorkflow.id === workflowId) {
            setCurrentWorkflow(updateWorkflowWithStep(currentWorkflow));
          }
          
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket do sistema de workflows:', error);
    }
  }, [messages, currentWorkflow]);
  
  // Função auxiliar definida DENTRO do hook para ter acesso a setWorkflows
  const updateWorkflowsInState = (data: Workflow | Workflow[]) => {
    const workflowsToUpdate = Array.isArray(data) ? data : [data];
    if (!workflowsToUpdate.length) return;
    
    setWorkflows(prev => {
      const updatedMap = new Map(prev.map(w => [w.id, w]));
      workflowsToUpdate.forEach(w => updatedMap.set(w.id, w));
      return Array.from(updatedMap.values());
    });
  };

  // Função auxiliar definida DENTRO do hook para ter acesso a setActiveWorkflows
  const updateActiveWorkflowsInState = (data: Workflow | Workflow[]) => {
     const workflowsToUpdate = Array.isArray(data) ? data : [data];
     if (!workflowsToUpdate.length) return;

      setActiveWorkflows(prev => {
        const activeMap = new Map(prev.map(w => [w.id, w]));
        workflowsToUpdate.forEach(w => {
          if ([
              WorkflowStatus.RUNNING,
              WorkflowStatus.WAITING_FOR_HUMAN,
              WorkflowStatus.PAUSED
             ].includes(w.status)) { 
            activeMap.set(w.id, w);
          } else {
            activeMap.delete(w.id);
          }
        });
        return Array.from(activeMap.values());
      });
  };
  
  // Métodos principais
  const getWorkflows = useCallback(async (
    options?: WorkflowSearchOptions
  ): Promise<WorkflowSearchResult> => {
    const response = await api.api?.get<WorkflowSearchResult>('/workflows', { 
      params: options 
    });
    const data = response?.data;
    
    if (data?.items) {
      updateWorkflowsInState(data.items);
      
      data.items.forEach(workflow => {
        updateActiveWorkflowsInState(workflow);
      });
    }
    
    return data ?? { items: [], total: 0, page: 1, limit: 0 };
  }, [api]);
  
  const getWorkflowById = useCallback(async (id: string): Promise<Workflow> => {
    const response = await api.api?.get<Workflow>(`/workflows/${id}`);
    const data = response?.data;
    if (!data) throw new Error("Workflow not found");
    
    // Atualiza as listas com o workflow obtido
    updateWorkflowsInState(data);
    
    // Atualiza workflows ativos, se aplicável
    const isActive = [
      WorkflowStatus.RUNNING, 
      WorkflowStatus.WAITING_FOR_HUMAN, 
      WorkflowStatus.PAUSED
    ].includes(data.status);
    
    if (isActive) {
      updateActiveWorkflowsInState(data);
    } else {
      setActiveWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
    }
    
    return data;
  }, [api]);
  
  const createWorkflow = useCallback(async (
    options: CreateWorkflowOptions
  ): Promise<Workflow> => {
    // Usando 'any' para step para evitar erro TS2339 em step.id
    const stepsWithIds = options.steps?.map((step: any) => ({ 
      ...step,
      id: step.id || uuidv4()
    })) || [];
    
    const response = await api.api?.post<Workflow>('/workflows', {
      ...options,
      steps: stepsWithIds
    });
    const data = response?.data;
    if (!data) throw new Error("Failed to create workflow");
    
    updateWorkflowsInState(data);
    updateActiveWorkflowsInState(data);
    
    return data;
  }, [api, updateWorkflowsInState, updateActiveWorkflowsInState]);
  
  const updateWorkflow = useCallback(async (
    options: UpdateWorkflowOptions
  ): Promise<Workflow> => {
    const { id, ...updateData } = options;
    const response = await api.api?.patch<Workflow>(`/workflows/${id}`, updateData);
    const data = response?.data;
    if (!data) throw new Error("Failed to update workflow");
    
    // Atualiza as listas com o workflow atualizado
    updateWorkflowsInState(data);
    
    // Atualiza workflows ativos, se aplicável
    const isActive = [
      WorkflowStatus.RUNNING, 
      WorkflowStatus.WAITING_FOR_HUMAN, 
      WorkflowStatus.PAUSED
    ].includes(data.status);
    
    if (isActive) {
      updateActiveWorkflowsInState(data);
    } else {
      setActiveWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
    }
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    await api.api?.delete(`/workflows/${id}`);
    
    // Remove o workflow das listas
    setWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
    setActiveWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
    
    // Limpa o workflow atual se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(null);
    }
  }, [api, currentWorkflow]);
  
  // Controle de fluxo
  const startWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(`/workflows/${id}/start`);
    const data = response?.data;
    if (!data) throw new Error("Failed to start workflow");
    
    // Atualiza as listas com o workflow iniciado
    updateWorkflowsInState(data);
    
    // Adiciona/atualiza na lista de workflows ativos
    updateActiveWorkflowsInState(data);
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  const pauseWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(`/workflows/${id}/pause`);
    const data = response?.data;
    if (!data) throw new Error("Failed to pause workflow");
    
    // Atualiza as listas com o workflow pausado
    updateWorkflowsInState(data);
    updateActiveWorkflowsInState(data);
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  const resumeWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(`/workflows/${id}/resume`);
    const data = response?.data;
    if (!data) throw new Error("Failed to resume workflow");
    
    // Atualiza as listas com o workflow retomado
    updateWorkflowsInState(data);
    updateActiveWorkflowsInState(data);
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  const cancelWorkflow = useCallback(async (id: string): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(`/workflows/${id}/cancel`);
    const data = response?.data;
    if (!data) throw new Error("Failed to cancel workflow");
    
    // Atualiza as listas com o workflow cancelado
    updateWorkflowsInState(data);
    
    // Remove da lista de workflows ativos
    setActiveWorkflows(prev => prev.filter((w: Workflow) => w.id !== id));
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === id) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  // Gestão de etapas
  const getWorkflowStep = useCallback(async (
    workflowId: string, 
    stepId: string
  ): Promise<WorkflowStep> => {
    const response = await api.api?.get<WorkflowStep>(`/workflows/${workflowId}/steps/${stepId}`);
    const data = response?.data;
    if (!data) throw new Error("Failed to get workflow step");

    // Atualiza o estado do workflow com a etapa atualizada
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => s.id === stepId ? data : s) } 
        : w
    ));
    setActiveWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => s.id === stepId ? data : s) } 
        : w
    ));
    if (currentWorkflow?.id === workflowId) {
       setCurrentWorkflow(prev => prev ? { ...prev, steps: prev.steps.map(s => s.id === stepId ? data : s) } : null);
    }

    return data;
  }, [api, currentWorkflow]);
  
  const submitHumanAction = useCallback(async (
    response: HumanActionResponse
  ): Promise<WorkflowStep> => {
    const { workflowId, stepId } = response;
    const apiResponse = await api.api?.post<WorkflowStep>(
      `/workflows/${workflowId}/steps/${stepId}/action`,
      response
    );
    const data = apiResponse?.data;
    if (!data) throw new Error("Failed to submit human action");

    // Atualiza o estado do workflow com a etapa atualizada (similar a getWorkflowStep)
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => s.id === stepId ? data : s) } 
        : w
    ));
    setActiveWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, steps: w.steps.map(s => s.id === stepId ? data : s) } 
        : w
    ));
     if (currentWorkflow?.id === workflowId) {
       setCurrentWorkflow(prev => prev ? { ...prev, steps: prev.steps.map(s => s.id === stepId ? data : s) } : null);
    }

    return data;
  }, [api, currentWorkflow]);
  
  const skipWorkflowStep = useCallback(async (
    workflowId: string, 
    stepId: string
  ): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(
      `/workflows/${workflowId}/steps/${stepId}/skip`
    );
    const data = response?.data;
    if (!data) throw new Error("Failed to skip step");
    
    // Atualiza as listas com o workflow atualizado
    updateWorkflowsInState(data);
    updateActiveWorkflowsInState(data);
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === workflowId) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  const retryWorkflowStep = useCallback(async (
    workflowId: string, 
    stepId: string
  ): Promise<Workflow> => {
    const response = await api.api?.post<Workflow>(
      `/workflows/${workflowId}/steps/${stepId}/retry`
    );
    const data = response?.data;
    if (!data) throw new Error("Failed to retry step");
    
    // Atualiza as listas com o workflow atualizado
    updateWorkflowsInState(data);
    updateActiveWorkflowsInState(data);
    
    // Atualiza o workflow atual, se for o mesmo
    if (currentWorkflow && currentWorkflow.id === workflowId) {
      setCurrentWorkflow(data);
    }
    
    return data;
  }, [api, currentWorkflow]);
  
  // Templates
  const getWorkflowTemplates = useCallback(async () => {
    const response = await api.api?.get<{
      id: WorkflowTemplateType;
      name: string;
      description: string;
      steps: Omit<WorkflowStep, 'id' | 'workflowId' | 'status' | 'startTime' | 'endTime'>[];
    }[]>('/workflows/templates');
    const data = response?.data;
    return data ?? [];
  }, [api]);
  
  return {
    // Estado
    workflows,
    activeWorkflows,
    currentWorkflow,
    loading: api.loading,
    error: api.error,
    
    // Métodos
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    
    // Controle de fluxo
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    
    // Gestão de etapas
    getWorkflowStep,
    submitHumanAction,
    skipWorkflowStep,
    retryWorkflowStep,
    
    // Seleção
    setCurrentWorkflow,
    
    // Templates
    getWorkflowTemplates,
  };
} 