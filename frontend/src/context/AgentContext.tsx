import React, { createContext, useReducer, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FiCpu, FiUsers, FiDatabase } from 'react-icons/fi'; // Icons for models

// Importar o hook e tipos do serviço de API de agente
import { 
    useAgentApiService, 
    ChatSession as ApiChatSession, 
    ApiChatMessage, // Importar o tipo COMPLETO ApiChatMessage de agent-api.service
    AgentType as ApiAgentType,
    SessionStatus
} from '../services/agent-api.service'; 

// Importar tipos de Trigger DIRETAMENTE do websocket.service.ts
import { 
    TriggerResult, 
    TriggerTestGenerationPayload,
    TriggerSecurityAnalysisPayload,
    TriggerTestSimulationPayload,
    TriggerTestFixValidationPayload,
    TriggerSecurityFixVerificationPayload
} from '../services/websocket.service'; // << FONTE CORRIGIDA

import { useProblems, ProblemType } from './ProblemsContext'; 
import { Logger } from '../lib/Logger'; 
import { AgentState, AgentAction, AgentContextType, AIModel, SessionListUpdaters } from './agent/types'; // ChatMessage removido daqui
import { rootReducer } from './agent/reducers';
import { formatApiErrorMessage } from '../services/api.service';
import axios, { AxiosError } from 'axios';

// Definir uma interface simples para payload de atualização de sessão
interface UpdateSessionPayload {
  title?: string;
  status?: SessionStatus;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const mockAvailableModels: AIModel[] = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: FiCpu, capabilities: ['code-generation', 'text-summarization', 'planning'] },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', icon: FiUsers, capabilities: ['code-generation', 'documentation', 'refactoring'] },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', icon: FiDatabase, capabilities: ['code-generation', 'debugging', 'vulnerability-scanning'] },
];

const initialAgentState: AgentState = {
  sessions: {},
  activeChatSessionId: null,
  isLoadingSession: {},
  error: null,
  isConnected: false, 
  availableModels: mockAvailableModels, 
  selectedModelId: mockAvailableModels.length > 0 ? mockAvailableModels[0].id : null,
  lastTriggerResult: null, // O reducer usa SET_TRIGGER_RESULT, o campo pode ser renomeado ou a action ajustada
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgentContext = () => {
  const context = React.useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

interface AgentProviderProps {
  children: ReactNode;
}

export const AgentContextProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, initialAgentState);
  const agentApiService = useAgentApiService();
  const { addProblem } = useProblems();
  
  const sessionListUpdatersRef = useRef<SessionListUpdaters | null>(null);

  const registerSessionListUpdaters = useCallback((updaters: SessionListUpdaters) => {
    sessionListUpdatersRef.current = updaters;
    Logger.info('[AgentContext] SessionList updaters registered.');
  }, []);

  const handleTriggerResult = useCallback((result: TriggerResult) => {
    Logger.info('[AgentContext] Received trigger result:', result);
    dispatch({ type: 'SET_TRIGGER_RESULT', payload: result });

    if (state.activeChatSessionId) {
      const systemMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: result.message || `Ação ${result.event} ${result.success ? 'concluída' : 'falhou'}.`,
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: {
          triggerEvent: result.event,
          triggerSuccess: result.success,
          triggerData: result.data,
          triggerError: result.data?.error || null,
        }
      };

      // Adicionar mensagem ao estado - adaptado à estrutura do reducer
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, systemMessage]
            : [systemMessage] 
        }
      });
    } else {
      Logger.warn('[AgentContext] Received trigger result but no active session to add message to.');
    }

    if (!result.success) {
        const errorMsg = result.message || 'Trigger action failed';
        if (addProblem) {
            addProblem({
                message: `Erro no trigger ${result.event}: ${errorMsg}`,
                type: ProblemType.ERROR,
                source: 'trigger',
                details: JSON.stringify(result.data || {})
            });
        } else {
            Logger.error('[AgentContext] addProblem function is not available from useProblems.');
        }
    }
  }, [state.activeChatSessionId, state.sessions, addProblem]);

  useEffect(() => {
    agentApiService.setTriggerResultCallback(handleTriggerResult);
    return () => {
      agentApiService.setTriggerResultCallback(null);
    };
  }, [agentApiService, handleTriggerResult]);

  useEffect(() => {
    if (agentApiService.error) {
        Logger.error('[AgentContext] Error from AgentApiService:', agentApiService.error);
        dispatch({ type: 'SET_ERROR', payload: agentApiService.error.message });
        if (addProblem) {
            addProblem({
                message: `Erro no serviço de agente: ${agentApiService.error.message}`,
                type: ProblemType.ERROR,
                source: 'service',
                details: agentApiService.error.toString()
            });
        } else {
             Logger.error('[AgentContext] addProblem function is not available from useProblems for service_error.');
        }
    }
  }, [agentApiService.error, addProblem]);

  const loadSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'LOAD_SESSION_START', payload: { sessionId } });
    try {
      const sessionData = await agentApiService.getSessionById(sessionId);
      if (!sessionData) {
         throw new Error('Session not found.');
      }
      dispatch({ type: 'LOAD_SESSION_SUCCESS', payload: sessionData });
      sessionListUpdatersRef.current?.updateSessionInList(sessionData);
      Logger.info(`[AgentContext] Session ${sessionId} details and messages loaded into global state.`);
    } catch (err: any) {
      let errorMsg = 'Failed to load session';
      if (axios.isAxiosError(err)) {
        errorMsg = formatApiErrorMessage(err as AxiosError);
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      Logger.error(`[AgentContext] Failed to load session ${sessionId}:`, err);
      dispatch({ type: 'LOAD_SESSION_FAILURE', payload: { sessionId, error: errorMsg } });
    }
  }, [agentApiService]);

  const createSession = useCallback(async (agentType: ApiAgentType, modelId?: string | null): Promise<ApiChatSession | null> => {
    dispatch({ type: 'CREATE_SESSION_START' });
    try {
        const newSession = await agentApiService.createSession({
            agentType: agentType,
            modelId: modelId || undefined 
        });
        
        if (newSession) {
            dispatch({ type: 'CREATE_SESSION_SUCCESS', payload: newSession });
            sessionListUpdatersRef.current?.addSessionToList(newSession); 
            return newSession;
        } else {
            const errorMessage = 'API returned null session on creation.';
            dispatch({ type: 'CREATE_SESSION_FAILURE', payload: errorMessage });
            Logger.error('createSession API returned null:', { agentType, modelId });
            return null;
        }
    } catch (err) {
        let errorMessage = 'Erro desconhecido ao criar sessão.';
        if (axios.isAxiosError(err)) {
            errorMessage = formatApiErrorMessage(err as AxiosError);
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }
        dispatch({ type: 'CREATE_SESSION_FAILURE', payload: errorMessage });
        Logger.error('Error creating session:', err, { agentType, modelId });
        return null; 
    }
}, [agentApiService]);

  const sendMessage = useCallback(async (content: string, metadata?: Record<string, any>): Promise<void> => {
    if (!state.activeChatSessionId) {
      Logger.warn('[AgentContext] sendMessage called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Nenhuma sessão ativa para enviar mensagem.' });
      return;
    }
    const userMessage: ApiChatMessage = { 
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      sessionId: state.activeChatSessionId, 
      metadata
    };

    // Adicionar mensagem ao estado - adaptado à estrutura do reducer
    dispatch({ 
      type: 'UPDATE_SESSION_MESSAGES', 
      payload: { 
        sessionId: state.activeChatSessionId, 
        messages: state.sessions[state.activeChatSessionId]?.messages 
          ? [...state.sessions[state.activeChatSessionId].messages, userMessage]
          : [userMessage] 
      }
    });

    try {
      await agentApiService.sendMessage(state.activeChatSessionId, content, metadata);
    } catch (err) {
      let errorMsg = 'Falha ao enviar mensagem';
       if (axios.isAxiosError(err)) {
        errorMsg = formatApiErrorMessage(err as AxiosError);
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      const errorMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: `Erro ao enviar mensagem: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { error: true }
      };
      if (state.activeChatSessionId) {
        // Adicionar mensagem de erro ao estado - adaptado à estrutura do reducer 
        dispatch({ 
          type: 'UPDATE_SESSION_MESSAGES', 
          payload: { 
            sessionId: state.activeChatSessionId, 
            messages: state.sessions[state.activeChatSessionId]?.messages 
              ? [...state.sessions[state.activeChatSessionId].messages, errorMessage]
              : [errorMessage]
          }
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions]);

  const clearSession = useCallback((sessionId: string) => {
      dispatch({ type: 'CLEAR_SESSION', payload: { sessionId } });
      Logger.info(`[AgentContext] Session ${sessionId} cleared from local state.`);
  }, []);

  const setActiveChatSession = useCallback((sessionId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_CHAT_SESSION', payload: sessionId });
      if (sessionId) {
        const currentSession = state.sessions[sessionId];
        if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
            loadSession(sessionId);
        }
      }  
      Logger.info(`[AgentContext] Active session ID set to: ${sessionId}`);
  }, [state.sessions, loadSession]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setConnectionStatus = useCallback((isConnected: boolean) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
  }, []);
  
  const setSelectedModel = useCallback((modelId: string | null) => {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
  }, []);
  
  // Novas funções necessárias conforme o tipo AgentContextType
  const updateSession = useCallback(async (sessionId: string, payload: UpdateSessionPayload): Promise<ApiChatSession | null> => {
    try {
      // Conversão explícita de tipo para resolver incompatibilidade
      const apiPayload = payload as unknown as Partial<ApiChatSession>;
      const updatedSession = await agentApiService.updateSession(sessionId, apiPayload);
      dispatch({ type: 'UPDATE_SESSION_SUCCESS', payload: updatedSession });
      sessionListUpdatersRef.current?.updateSessionInList(updatedSession);
      return updatedSession;
    } catch (err) {
      let errorMsg = 'Falha ao atualizar sessão';
      if (axios.isAxiosError(err)) {
        errorMsg = formatApiErrorMessage(err as AxiosError);
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      Logger.error(`[AgentContext] Failed to update session ${sessionId}:`, err);
      return null;
    }
  }, [agentApiService]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      await agentApiService.deleteSession(sessionId);
      dispatch({ type: 'DELETE_SESSION_SUCCESS', payload: { sessionId } });
      if (state.activeChatSessionId === sessionId) {
        dispatch({ type: 'SET_ACTIVE_CHAT_SESSION', payload: null });
      }
      return true;
    } catch (err) {
      let errorMsg = 'Falha ao deletar sessão';
      if (axios.isAxiosError(err)) {
        errorMsg = formatApiErrorMessage(err as AxiosError);
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      Logger.error(`[AgentContext] Failed to delete session ${sessionId}:`, err);
      return false;
    }
  }, [agentApiService, state.activeChatSessionId]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string): Promise<ApiChatSession | null> => {
    return updateSession(sessionId, { title });
  }, [updateSession]);

  const clearLastTriggerResult = useCallback(() => {
    dispatch({ type: 'CLEAR_LAST_TRIGGER_RESULT' });
  }, []);

  useEffect(() => {
       Logger.info('[AgentContext] Setting initial available models.');
  }, []); 

  const triggerTestGeneration = useCallback(async (payload: Omit<TriggerTestGenerationPayload, 'sessionId'>) => {
    if (!state.activeChatSessionId) {
      Logger.error('[AgentContext] triggerTestGeneration called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Nenhuma sessão ativa para triggerTestGeneration.'});
      return;
    }
    
    // Indicar loading através do estado de erro (poderia ser melhorado no futuro com um reducer específico)
    dispatch({ type: 'SET_ERROR', payload: null }); // Limpar erros anteriores
    
    const fullPayload: TriggerTestGenerationPayload = { ...payload, sessionId: state.activeChatSessionId };
    Logger.info('[AgentContext] Triggering Test Generation:', fullPayload);
    try {
      await agentApiService.triggerTestGeneration(fullPayload);
      const optimisticMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: 'Iniciando geração de testes...',
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { action: 'triggerTestGeneration', status: 'pending' }
      };
      // Adicionar mensagem otimista ao estado - adaptado à estrutura do reducer
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, optimisticMessage]
            : [optimisticMessage]
        }
      });
      
      // Sucesso do disparo já está indicado pelo lastTriggerResult em handleTriggerResult
    } catch (error) {
      const err = error as Error;
      Logger.error('[AgentContext] Failed to trigger Test Generation:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Falha ao disparar geração de testes.' });
      
      // Reportar problema para o sistema de problemas
      if (addProblem) {
        addProblem({
          message: `Falha ao disparar geração de testes: ${err.message || 'Erro desconhecido'}`,
          type: ProblemType.ERROR,
          source: 'trigger',
          details: err.stack || err.toString()
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions, addProblem]);

  const triggerSecurityAnalysis = useCallback(async (payload: Omit<TriggerSecurityAnalysisPayload, 'sessionId'>) => {
    if (!state.activeChatSessionId) {
      Logger.error('[AgentContext] triggerSecurityAnalysis called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Nenhuma sessão ativa para triggerSecurityAnalysis.'});
      return;
    }
    
    // Indicar loading através do estado de erro (poderia ser melhorado no futuro com um reducer específico)
    dispatch({ type: 'SET_ERROR', payload: null }); // Limpar erros anteriores
    
    const fullPayload: TriggerSecurityAnalysisPayload = { ...payload, sessionId: state.activeChatSessionId };
    Logger.info('[AgentContext] Triggering Security Analysis:', fullPayload);
    try {
      await agentApiService.triggerSecurityAnalysis(fullPayload);
      const optimisticMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: 'Iniciando análise de segurança...',
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { action: 'triggerSecurityAnalysis', status: 'pending' }
      };
      // Adicionar mensagem otimista ao estado
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, optimisticMessage]
            : [optimisticMessage]
        }
      });
      
      // Sucesso do disparo já está indicado pelo lastTriggerResult em handleTriggerResult
    } catch (error) {
      const err = error as Error;
      Logger.error('[AgentContext] Failed to trigger Security Analysis:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Falha ao disparar análise de segurança.' });
      
      // Reportar problema
      if (addProblem) {
        addProblem({
          message: `Falha ao disparar análise de segurança: ${err.message || 'Erro desconhecido'}`,
          type: ProblemType.ERROR,
          source: 'trigger',
          details: err.stack || err.toString()
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions, addProblem]);
  
  const triggerTestSimulation = useCallback(async (payload: Omit<TriggerTestSimulationPayload, 'sessionId'>) => {
    if (!state.activeChatSessionId) { 
      Logger.error('[AgentContext] triggerTestSimulation called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Sessão não ativa para Test Simulation.'}); 
      return; 
    }
    const fullPayload: TriggerTestSimulationPayload = { ...payload, sessionId: state.activeChatSessionId };
    Logger.info('[AgentContext] Triggering Test Simulation:', fullPayload);
    try {
      await agentApiService.triggerTestSimulation(fullPayload);
      const optimisticMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: 'Iniciando simulação de testes...',
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { action: 'triggerTestSimulation', status: 'pending' }
      };
      // Adicionar mensagem otimista ao estado - adaptado à estrutura do reducer
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, optimisticMessage]
            : [optimisticMessage]
        }
      });
    } catch (error) {
      const err = error as Error;
      Logger.error('[AgentContext] Failed to trigger Test Simulation:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Falha ao disparar simulação de testes.' });
      
      // Reportar problema para o sistema de problemas (Adicionando consistência com outros triggers)
      if (addProblem) {
        addProblem({
          message: `Falha ao disparar simulação de testes: ${err.message || 'Erro desconhecido'}`,
          type: ProblemType.ERROR,
          source: 'trigger',
          details: err.stack || err.toString()
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions, addProblem]);

  const triggerTestFixValidation = useCallback(async (payload: Omit<TriggerTestFixValidationPayload, 'sessionId'>) => {
    if (!state.activeChatSessionId) { 
      Logger.error('[AgentContext] triggerTestFixValidation called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Sessão não ativa para Test Fix Validation.'}); 
      return; 
    }
    const fullPayload: TriggerTestFixValidationPayload = { ...payload, sessionId: state.activeChatSessionId };
    Logger.info('[AgentContext] Triggering Test Fix Validation:', fullPayload);
    try {
      await agentApiService.triggerTestFixValidation(fullPayload);
      const optimisticMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: 'Iniciando validação de correções de testes...',
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { action: 'triggerTestFixValidation', status: 'pending' }
      };
      // Adicionar mensagem otimista ao estado - adaptado à estrutura do reducer
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, optimisticMessage]
            : [optimisticMessage]
        }
      });
    } catch (error) {
      const err = error as Error;
      Logger.error('[AgentContext] Failed to trigger Test Fix Validation:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Falha ao disparar validação de correções de testes.' });
      
      // Reportar problema para o sistema de problemas (Adicionando consistência com outros triggers)
      if (addProblem) {
        addProblem({
          message: `Falha ao disparar validação de correções de testes: ${err.message || 'Erro desconhecido'}`,
          type: ProblemType.ERROR,
          source: 'trigger',
          details: err.stack || err.toString()
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions, addProblem]);

  const triggerSecurityFixVerification = useCallback(async (payload: Omit<TriggerSecurityFixVerificationPayload, 'sessionId'>) => {
    if (!state.activeChatSessionId) { 
      Logger.error('[AgentContext] triggerSecurityFixVerification called without active session.');
      dispatch({ type: 'SET_ERROR', payload: 'Sessão não ativa para Security Fix Verification.'}); 
      return; 
    }
    const fullPayload: TriggerSecurityFixVerificationPayload = { ...payload, sessionId: state.activeChatSessionId };
    Logger.info('[AgentContext] Triggering Security Fix Verification:', fullPayload);
    try {
      await agentApiService.triggerSecurityFixVerification(fullPayload);
      const optimisticMessage: ApiChatMessage = { 
        id: uuidv4(),
        role: 'system',
        content: 'Iniciando verificação de correções de segurança...',
        timestamp: new Date().toISOString(),
        sessionId: state.activeChatSessionId, 
        metadata: { action: 'triggerSecurityFixVerification', status: 'pending' }
      };
      // Adicionar mensagem otimista ao estado - adaptado à estrutura do reducer
      dispatch({ 
        type: 'UPDATE_SESSION_MESSAGES', 
        payload: { 
          sessionId: state.activeChatSessionId, 
          messages: state.sessions[state.activeChatSessionId]?.messages 
            ? [...state.sessions[state.activeChatSessionId].messages, optimisticMessage]
            : [optimisticMessage]
        }
      });
    } catch (error) {
      const err = error as Error;
      Logger.error('[AgentContext] Failed to trigger Security Fix Verification:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Falha ao disparar verificação de correções de segurança.' });
      
      // Reportar problema para o sistema de problemas (Adicionando consistência com outros triggers)
      if (addProblem) {
        addProblem({
          message: `Falha ao disparar verificação de correções de segurança: ${err.message || 'Erro desconhecido'}`,
          type: ProblemType.ERROR,
          source: 'trigger',
          details: err.stack || err.toString()
        });
      }
    }
  }, [agentApiService, state.activeChatSessionId, state.sessions, addProblem]);

  // Adicionar efeito para monitorar conexão WebSocket (simplificado)
  useEffect(() => {
    // Verificar periodicamente se há erros de conexão
    const checkConnectionStatus = () => {
      // Se houver erro, reportar
      if (agentApiService.error) {
        Logger.error('[AgentContext] Connection issue detected:', agentApiService.error);
        if (addProblem) {
          addProblem({
            message: `Problema de conexão com o servidor: ${agentApiService.error.message || 'Conexão instável'}`,
            type: ProblemType.ERROR,
            source: 'connection',
            details: agentApiService.error.toString()
          });
        }
      }
    };
    
    // Verificar inicialmente
    checkConnectionStatus();
    
    // Criar um intervalo para verificar periodicamente
    const intervalId = setInterval(checkConnectionStatus, 30000); // verificar a cada 30 segundos
    
    return () => {
      clearInterval(intervalId);
    };
  }, [agentApiService.error, addProblem]);

  const contextValue = useMemo(() => ({
    // Estado atual
    ...state,
    
    // Funções básicas de sessão
    loadSession,
    createSession,
    sendMessage,
    clearSession,
    setActiveChatSession,
    clearError,
    setConnectionStatus,
    setSelectedModel,
    
    // Funções para atualização/exclusão
    updateSession,
    deleteSession,
    updateSessionTitle,
    
    // Funções de trigger
    triggerTestGeneration,
    triggerSecurityAnalysis,
    triggerTestSimulation,
    triggerTestFixValidation,
    triggerSecurityFixVerification,
    clearLastTriggerResult,
    
    // Registro de atualizadores
    registerSessionListUpdaters,
    
    // Para compatibilidade com a interface AgentContextType
    state: state,
  }), [
    state, 
    loadSession, 
    createSession, 
    sendMessage, 
    clearSession, 
    setActiveChatSession, 
    clearError,
    setConnectionStatus, 
    setSelectedModel,
    updateSession,
    deleteSession,
    updateSessionTitle,
    triggerTestGeneration, 
    triggerSecurityAnalysis, 
    triggerTestSimulation, 
    triggerTestFixValidation, 
    triggerSecurityFixVerification,
    clearLastTriggerResult,
    registerSessionListUpdaters
  ]);

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}; 

export { AgentContextProvider as AgentProvider }; 

export type { AgentContextType, AgentState, AIModel }; 