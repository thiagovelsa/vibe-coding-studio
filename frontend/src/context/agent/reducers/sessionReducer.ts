import { ChatSession, AgentAction, AgentState } from '../types';

/**
 * Reducer especializado em gerenciar estado de sessões
 * Responsável por carregar, criar, limpar, ativar e atualizar sessões
 */
export const sessionReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    // --- Gerenciamento de Sessão ---
    case 'LOAD_SESSION_START':
      return {
        ...state,
        isLoadingSession: { ...state.isLoadingSession, [action.payload.sessionId]: true },
        error: null,
      };

    case 'LOAD_SESSION_SUCCESS':
      // Armazena a sessão completa (incluindo mensagens) no estado 'sessions'
      return {
        ...state,
        isLoadingSession: { ...state.isLoadingSession, [action.payload.id]: false },
        sessions: { ...state.sessions, [action.payload.id]: action.payload },
        error: null,
      };

    case 'LOAD_SESSION_FAILURE':
      return {
        ...state,
        isLoadingSession: { ...state.isLoadingSession, [action.payload.sessionId]: false },
        error: `Falha ao carregar sessão ${action.payload.sessionId}: ${action.payload.error}`, 
      };

    case 'CREATE_SESSION_START': 
      return { 
        ...state, 
        isLoadingSession: { ...state.isLoadingSession, _new: true }, 
        error: null 
      }; 

    case 'CREATE_SESSION_SUCCESS':
      const { _new, ...restLoadingSession } = state.isLoadingSession; 
      return {
        ...state,
        isLoadingSession: restLoadingSession,
        sessions: { ...state.sessions, [action.payload.id]: action.payload },
        activeChatSessionId: action.payload.id, // Ativa a nova sessão automaticamente
        error: null,
      };

    case 'CREATE_SESSION_FAILURE':
      const { _new: __, ...restLoadingSessionFail } = state.isLoadingSession;
      return {
        ...state,
        isLoadingSession: restLoadingSessionFail,
        error: `Falha ao criar sessão: ${action.payload}`,
      };

    case 'CLEAR_SESSION': 
      const { [action.payload.sessionId]: ___, ...remainingSessions } = state.sessions;
      const { [action.payload.sessionId]: _____, ...remainingLoadingSession } = state.isLoadingSession;
      return {
        ...state,
        sessions: remainingSessions,
        isLoadingSession: remainingLoadingSession,
        activeChatSessionId: state.activeChatSessionId === action.payload.sessionId ? null : state.activeChatSessionId,
      };

    case 'SET_ACTIVE_CHAT_SESSION':
      if (action.payload === state.activeChatSessionId) return state; // Sem mudança
      return {
        ...state,
        activeChatSessionId: action.payload,
      };
        
    // --- Atualizar Mensagens de uma Sessão Específica ---
    case 'UPDATE_SESSION_MESSAGES':
      const { sessionId, messages } = action.payload;
      if (state.sessions[sessionId]) {
        const updatedSession = { 
          ...state.sessions[sessionId], 
          messages: messages, 
          updatedAt: new Date().toISOString() 
        };
        return {
          ...state,
          sessions: { ...state.sessions, [sessionId]: updatedSession },
        };
      }
      return state;

    // Atualização e deleção de sessões
    case 'UPDATE_SESSION_SUCCESS': 
      if (state.sessions[action.payload.id]) {
        const existingSession = state.sessions[action.payload.id];
        const updatedSessionData = { 
          ...existingSession, 
          ...action.payload, 
          messages: action.payload.messages || existingSession.messages || [] 
        };
        
        // Evita update se nada mudou
        if (JSON.stringify(existingSession) === JSON.stringify(updatedSessionData)) return state; 
        
        return {
          ...state,
          sessions: { ...state.sessions, [action.payload.id]: updatedSessionData },
        };
      }
      return state;
      
    case 'DELETE_SESSION_SUCCESS': 
      if (!state.sessions[action.payload.sessionId]) return state; 

      const { [action.payload.sessionId]: deletedSession, ...remainingSessionsAfterDelete } = state.sessions;
      const { [action.payload.sessionId]: _ls, ...remLoadSess } = state.isLoadingSession;

      return {
        ...state,
        sessions: remainingSessionsAfterDelete,
        isLoadingSession: remLoadSess,
        activeChatSessionId: state.activeChatSessionId === action.payload.sessionId ? null : state.activeChatSessionId,
      };

    default:
      // Este reducer não lida com essa ação
      return state;
  }
}; 