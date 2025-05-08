import { useState, useCallback, useEffect, useRef } from 'react';
import { useApi, handleApiError } from './api.service';
import { 
  useWebSocket,
  TriggerTestGenerationPayload,
  TriggerSecurityAnalysisPayload,
  TriggerTestSimulationPayload,
  TriggerTestFixValidationPayload,
  TriggerSecurityFixVerificationPayload,
  TriggerResult,
  UseWebSocketReturn
} from './websocket.service';
import { Logger } from '../lib/Logger';

// Tipos de agentes disponíveis
export enum AgentType {
  CODER = 'coder',
  PRODUCT = 'product',
  REVIEWER = 'reviewer',
  DEBUGGER = 'debugger',
  TESTER = 'tester',
  ARCHITECT = 'architect',
  REQUIREMENTS = 'requirements',
  DOCUMENTATION = 'documentation',
  CUSTOM = 'custom'
}

// Status de um agente
export enum AgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  THINKING = 'thinking',
  WORKING = 'working',
  WAITING_FOR_INPUT = 'waiting_for_input',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Nível de proficiência de um agente
export enum AgentProficiencyLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  PRINCIPAL = 'principal'
}

// Modos de personalidade de um agente
export enum AgentPersonaMode {
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  CONCISE = 'concise',
  DETAILED = 'detailed',
  CREATIVE = 'creative',
  ANALYTICAL = 'analytical'
}

// Formatos de resposta
export enum ResponseFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  CODE = 'code',
  TEXT = 'text',
  HTML = 'html'
}

// Mensagem de chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    thinking?: string;
    references?: {
      type: 'file' | 'url' | 'documentation';
      title: string;
      path?: string;
      url?: string;
      content?: string;
    }[];
    codeBlocks?: {
      language: string;
      code: string;
      filename?: string;
      lineStart?: number;
      lineEnd?: number;
    }[];
    actions?: {
      type: string;
      description: string;
      status: 'pending' | 'success' | 'error';
      result?: any;
    }[];
    attachments?: {
      type: string;
      name: string;
      url?: string;
      content?: string;
    }[];
    [key: string]: any;
  };
}

// Definição de um agente
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  avatar?: string;
  status: AgentStatus;
  persona?: {
    mode: AgentPersonaMode;
    customInstructions?: string;
    proficiencyLevel: AgentProficiencyLevel;
  };
  capabilities: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Configuração do agente para criar ou atualizar
export interface AgentConfig {
  name: string;
  type: AgentType;
  description?: string;
  avatar?: string;
  persona?: {
    mode: AgentPersonaMode;
    customInstructions?: string;
    proficiencyLevel: AgentProficiencyLevel;
  };
  capabilities?: string[];
  metadata?: Record<string, any>;
}

// Parâmetros para uma sessão de chat
export interface ChatSessionParams {
  agentId: string;
  context?: {
    files?: {
      path: string;
      content?: string;
    }[];
    codebase?: {
      repositories?: string[];
      branches?: string[];
      rootDirectories?: string[];
    };
    requirements?: string[];
    references?: {
      type: 'file' | 'url' | 'documentation';
      title: string;
      path?: string;
      url?: string;
      content?: string;
    }[];
    previousSessions?: string[];
    [key: string]: any;
  };
  preferredResponseFormat?: ResponseFormat;
  systemPrompt?: string;
  initialMessages?: Omit<ChatMessage, 'id' | 'timestamp'>[];
}

// Sessão de chat
export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'deleted';
  context?: Record<string, any>;
  orchestratorState?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Opções para enviar uma mensagem
export interface SendMessageOptions {
  content: string;
  responseFormat?: ResponseFormat;
  metadata?: Record<string, any>;
  requestedActions?: string[];
}

// Estado de execução de tarefas
export interface TaskExecution {
  id: string;
  agentId: string;
  taskId: string;
  status: AgentStatus;
  progress: number; // 0-100
  result?: any;
  error?: {
    message: string;
    details?: any;
  };
  logs: {
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
  }[];
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

// Tarefa a ser executada
export interface Task {
  id: string;
  agentId: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  executionId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// Estado global do serviço de agentes
export interface AgentApiState {
  agents: Agent[];
  activeAgent: Agent | null;
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  tasks: Task[];
  activeTasks: TaskExecution[];
  isTyping: boolean;
  loading: boolean;
  error: Error | null;
}

// Adicionar os tipos reais usados pelo backend
export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  ERROR = 'error'
}

// Interface do DTO para otimização
interface OptimizePromptPayload {
  originalPrompt: string;
  targetAgentType: AgentType;
}

// Interface do DTO para feedback
interface SubmitFeedbackPayload {
  rating?: number | null; // -1, 0, 1 or null
  correction?: string | null;
}

// Interface para a resposta da otimização
interface OptimizePromptResponse {
  optimizedPrompt: string;
}

// Atualizar ChatSession para usar SessionStatus
export interface ChatSession {
  id: string;
  agentId?: string; // Tornar opcional se não for sempre presente?
  title: string;
  messages?: ChatMessage[]; // Geralmente carregado separadamente
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  status: SessionStatus;
  context?: Record<string, any>;
  orchestratorState?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Interface da API para o backend (adaptada)
export interface ApiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sessionId: string;
  agentType?: AgentType;
  rating?: number | null;
  correction?: string | null;
  metadata?: {
    structuredOutput?: any;
    codeSnippet?: string;
    codeLanguage?: string;
    files?: string[];
    status?: string;
    nextAgent?: AgentType | null;
    [key: string]: any;
  };
}

// Interface do serviço de API de agentes (Atualizada)
export interface AgentApiService extends AgentApiState {
  // Gerenciamento de agentes
  getAgents: () => Promise<Agent[]>;
  getAgentById: (id: string) => Promise<Agent>;
  createAgent: (config: AgentConfig) => Promise<Agent | null>;
  updateAgent: (id: string, config: Partial<AgentConfig>) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<void>;
  
  // Gestão de sessões de chat
  getSessions: () => Promise<ChatSession[]>;
  getSessionById: (sessionId: string) => Promise<ChatSession>;
  createSession: (params: { title?: string, initialContext?: any, agentType?: AgentType, modelId?: string }) => Promise<ChatSession>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  getMessages: (sessionId: string) => Promise<ApiChatMessage[]>;
  
  // Interação com chat
  sendMessage: (sessionId: string, content: string, metadata?: Record<string, any>) => Promise<ApiChatMessage>;
  submitFeedback: (sessionId: string, messageId: string, feedback: SubmitFeedbackPayload) => Promise<ApiChatMessage>;
  optimizePrompt: (sessionId: string, payload: OptimizePromptPayload) => Promise<OptimizePromptResponse>;
  
  // Gerenciamento de tarefas
  getTasks: (agentId?: string, status?: Task['status']) => Promise<Task[]>;
  getTaskById: (taskId: string) => Promise<Task>;
  createTask: (agentId: string, taskData: Omit<Task, 'id' | 'agentId' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  cancelTask: (taskId: string) => Promise<Task>;
  getTaskExecution: (executionId: string) => Promise<TaskExecution>;
  
  // Utilitários
  clearHistory: (sessionId: string) => Promise<void>;
  exportSession: (sessionId: string, format: 'json' | 'markdown' | 'pdf') => Promise<Blob>;

  // --- NOVAS FUNÇÕES DE TRIGGER ---
  triggerTestGeneration: (payload: TriggerTestGenerationPayload) => Promise<void>;
  triggerSecurityAnalysis: (payload: TriggerSecurityAnalysisPayload) => Promise<void>;
  triggerTestSimulation: (payload: TriggerTestSimulationPayload) => Promise<void>;
  triggerTestFixValidation: (payload: TriggerTestFixValidationPayload) => Promise<void>;
  triggerSecurityFixVerification: (payload: TriggerSecurityFixVerificationPayload) => Promise<void>;
  
  // Callback para lidar com resultados de triggers vindos do WebSocket
  setTriggerResultCallback: (callback: ((result: TriggerResult) => void) | null) => void;
}

// Callback para resultados de trigger
type TriggerResultCallback = ((result: TriggerResult) => void) | null;

export function useAgentApiService(): AgentApiService {
  const api = useApi();
  
  // Estado local do serviço
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskExecution[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Callback ref para o resultado do trigger
  const triggerResultCallbackRef = useRef<TriggerResultCallback>(null);

  const ws = useWebSocket({
    onTriggerResult: (result) => {
      if (triggerResultCallbackRef.current) {
        triggerResultCallbackRef.current(result);
      }
    }
  });

  const setTriggerResultCallback = useCallback((callback: TriggerResultCallback) => {
    triggerResultCallbackRef.current = callback;
  }, []);

  // Gerenciamento de Agentes
  const getAgents = useCallback(async (): Promise<Agent[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Agent[]>('/agents');
      setAgents(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao buscar agentes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getAgentById = useCallback(async (id: string): Promise<Agent> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Agent>(`/agents/${id}`);
      setActiveAgent(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao buscar agente ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  const createAgent = useCallback(async (config: AgentConfig): Promise<Agent | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<Agent>('/agents', config);
      setAgents(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao criar agente');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateAgent = useCallback(async (id: string, config: Partial<AgentConfig>): Promise<Agent | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put<Agent>(`/agents/${id}`, config);
      setAgents(prev => prev.map(agent => agent.id === id ? response.data : agent));
      if (activeAgent?.id === id) setActiveAgent(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao atualizar agente ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, activeAgent]);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/agents/${id}`);
      setAgents(prev => prev.filter(agent => agent.id !== id));
      if (activeAgent?.id === id) setActiveAgent(null);
    } catch (err) {
      handleApiError(err, setError, `Falha ao deletar agente ${id}`);
    } finally {
      setLoading(false);
    }
  }, [api, activeAgent]);

  // Gestão de Sessões de Chat
  const getSessions = useCallback(async (): Promise<ChatSession[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ChatSession[]>('/sessions');
      setSessions(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao buscar sessões');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getSessionById = useCallback(async (sessionId: string): Promise<ChatSession> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ChatSession>(`/sessions/${sessionId}`);
      return response.data; 
    } catch (err) {
      handleApiError(err, setError, `Falha ao buscar sessão ${sessionId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createSession = useCallback(async (params: { title?: string, initialContext?: any, agentType?: AgentType, modelId?: string }): Promise<ChatSession> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<ChatSession>('/sessions', params);
      setSessions(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao criar sessão');
      throw err; 
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put<ChatSession>(`/sessions/${sessionId}`, updates);
      setSessions(prev => prev.map(s => s.id === sessionId ? response.data : s));
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao atualizar sessão ${sessionId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      handleApiError(err, setError, `Falha ao deletar sessão ${sessionId}`);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getMessages = useCallback(async (sessionId: string): Promise<ApiChatMessage[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiChatMessage[]>(`/sessions/${sessionId}/messages`);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao buscar mensagens da sessão ${sessionId}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // Interação com Chat
  const sendMessage = useCallback(async (sessionId: string, content: string, metadata?: Record<string, any>): Promise<ApiChatMessage> => {
    setLoading(true);
    setError(null);
    setIsTyping(true);
    try {
      const response = await api.post<ApiChatMessage>(`/sessions/${sessionId}/messages`, { role: 'user', content, metadata });
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao enviar mensagem');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, ws]);

  const submitFeedback = useCallback(async (sessionId: string, messageId: string, feedback: SubmitFeedbackPayload): Promise<ApiChatMessage> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<ApiChatMessage>(`/sessions/${sessionId}/messages/${messageId}/feedback`, feedback);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao enviar feedback');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const optimizePrompt = useCallback(async (sessionId: string, payload: OptimizePromptPayload): Promise<OptimizePromptResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<OptimizePromptResponse>(`/sessions/${sessionId}/optimize-prompt`, payload);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao otimizar prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Gerenciamento de Tarefas
  const getTasks = useCallback(async (agentId?: string, status?: Task['status']): Promise<Task[]> => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (agentId) params.agentId = agentId;
      if (status) params.status = status;
      const response = await api.get<Task[]>('/tasks', { params });
      setTasks(response.data);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao buscar tarefas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getTaskById = useCallback(async (taskId: string): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Task>(`/tasks/${taskId}`);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao buscar tarefa ${taskId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createTask = useCallback(async (agentId: string, taskData: Omit<Task, 'id' | 'agentId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<Task>(`/agents/${agentId}/tasks`, taskData);
      setTasks(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, 'Falha ao criar tarefa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  const cancelTask = useCallback(async (taskId: string): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put<Task>(`/tasks/${taskId}/cancel`, {});
      setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao cancelar tarefa ${taskId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const getTaskExecution = useCallback(async (executionId: string): Promise<TaskExecution> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<TaskExecution>(`/tasks/executions/${executionId}`);
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao buscar execução da tarefa ${executionId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Utilitários
  const clearHistory = useCallback(async (sessionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/sessions/${sessionId}/messages`);
      if (activeSession?.id === sessionId) {
        setActiveSession(prev => prev ? { ...prev, messages: [] } : null);
      }
    } catch (err) {
      handleApiError(err, setError, `Falha ao limpar histórico da sessão ${sessionId}`);
    } finally {
      setLoading(false);
    }
  }, [api, activeSession]);

  const exportSession = useCallback(async (sessionId: string, format: 'json' | 'markdown' | 'pdf'): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Blob>(`/sessions/${sessionId}/export`, { 
        params: { format },
        responseType: 'blob' 
      });
      return response.data;
    } catch (err) {
      handleApiError(err, setError, `Falha ao exportar sessão ${sessionId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // --- IMPLEMENTAÇÃO DAS FUNÇÕES DE TRIGGER ---
  const triggerTestGeneration = useCallback(async (payload: TriggerTestGenerationPayload): Promise<void> => {
    if (!ws.connected) {
      Logger.warn('[AgentApiService] WebSocket not connected. Cannot triggerTestGeneration.');
      setError(new Error('WebSocket não conectado.'));
      return;
    }
    try {
      Logger.info('[AgentApiService] Disparando triggerTestGeneration:', payload);
      ws.triggerTestGeneration(payload);
    } catch (err) {
      const castedError = err as Error;
      Logger.error('[AgentApiService] Falha ao disparar triggerTestGeneration:', castedError);
      setError(castedError);
    }
  }, [ws]);

  const triggerSecurityAnalysis = useCallback(async (payload: TriggerSecurityAnalysisPayload): Promise<void> => {
    if (!ws.connected) {
      Logger.warn('[AgentApiService] WebSocket not connected. Cannot triggerSecurityAnalysis.');
      setError(new Error('WebSocket não conectado.'));
      return;
    }
    try {
      Logger.info('[AgentApiService] Disparando triggerSecurityAnalysis:', payload);
      ws.triggerSecurityAnalysis(payload);
    } catch (err) {
      const castedError = err as Error;
      Logger.error('[AgentApiService] Falha ao disparar triggerSecurityAnalysis:', castedError);
      setError(castedError);
    }
  }, [ws]);

  const triggerTestSimulation = useCallback(async (payload: TriggerTestSimulationPayload): Promise<void> => {
    if (!ws.connected) {
      Logger.warn('[AgentApiService] WebSocket not connected. Cannot triggerTestSimulation.');
      setError(new Error('WebSocket não conectado.'));
      return;
    }
    try {
      Logger.info('[AgentApiService] Disparando triggerTestSimulation:', payload);
      ws.triggerTestSimulation(payload);
    } catch (err) {
      const castedError = err as Error;
      Logger.error('[AgentApiService] Falha ao disparar triggerTestSimulation:', castedError);
      setError(castedError);
    }
  }, [ws]);

  const triggerTestFixValidation = useCallback(async (payload: TriggerTestFixValidationPayload): Promise<void> => {
    if (!ws.connected) {
      Logger.warn('[AgentApiService] WebSocket not connected. Cannot triggerTestFixValidation.');
      setError(new Error('WebSocket não conectado.'));
      return;
    }
    try {
      Logger.info('[AgentApiService] Disparando triggerTestFixValidation:', payload);
      ws.triggerTestFixValidation(payload);
    } catch (err) {
      const castedError = err as Error;
      Logger.error('[AgentApiService] Falha ao disparar triggerTestFixValidation:', castedError);
      setError(castedError);
    }
  }, [ws]);

  const triggerSecurityFixVerification = useCallback(async (payload: TriggerSecurityFixVerificationPayload): Promise<void> => {
    if (!ws.connected) {
      Logger.warn('[AgentApiService] WebSocket not connected. Cannot triggerSecurityFixVerification.');
      setError(new Error('WebSocket não conectado.'));
      return;
    }
    try {
      Logger.info('[AgentApiService] Disparando triggerSecurityFixVerification:', payload);
      ws.triggerSecurityFixVerification(payload);
    } catch (err) {
      const castedError = err as Error;
      Logger.error('[AgentApiService] Falha ao disparar triggerSecurityFixVerification:', castedError);
      setError(castedError);
    }
  }, [ws]);

  // Efeito para lidar com a conexão WebSocket e logs
  useEffect(() => {
    if (ws.connected) {
      Logger.info('[AgentApiService] Conectado ao WebSocket.');
    }
    if (ws.connectionError) {
      Logger.error('[AgentApiService] Erro de conexão WebSocket:', ws.connectionError);
      setError(ws.connectionError);
    }
  }, [ws.connected, ws.connectionError]);

  // Retornar todas as funções e estados
  return {
    agents,
    activeAgent,
    sessions,
    activeSession,
    tasks,
    activeTasks,
    isTyping,
    loading,
    error,
    getAgents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    getSessions,
    getSessionById,
    createSession,
    updateSession,
    deleteSession,
    getMessages,
    sendMessage,
    submitFeedback,
    optimizePrompt,
    getTasks,
    getTaskById,
    createTask,
    cancelTask,
    getTaskExecution,
    clearHistory,
    exportSession,
    // Triggers
    triggerTestGeneration,
    triggerSecurityAnalysis,
    triggerTestSimulation,
    triggerTestFixValidation,
    triggerSecurityFixVerification,
    setTriggerResultCallback
  };
}

// Função para atualizar a lista de sessões de forma segura (exemplo, pode não ser necessária aqui)
const updateSessions = (data: ChatSession[] | undefined, setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>) => {
  if (data) {
    setSessions(data);
  }
}; 