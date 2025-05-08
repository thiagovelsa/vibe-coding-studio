import React, { createContext, useReducer, useCallback, ReactNode, useEffect, useContext } from 'react';
import { 
    useAgentApiService, 
    ChatSession as ApiChatSession,
    SessionStatus
} from '../services/agent-api.service';
import { Logger } from '../lib/Logger';
import { toast } from 'react-toastify';
import { useUIState } from './UIStateContext';
import { useAgentContext } from './AgentContext';
import { formatApiErrorMessage } from '../services/api.service';
import axios, { AxiosError } from 'axios';

// Definição local do payload de atualização, consistente com AgentContext.tsx
interface UpdateSessionPayload {
  title?: string;
  status?: SessionStatus;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// --- State ---
interface SessionListState {
  allSessions: ApiChatSession[];
  isLoadingAllSessions: boolean;
  // Estados de edição de sessão
  editingSessionId: string | null;
  editingTitle: string;
  isSavingTitle: boolean;
  error: string | null;
}

// --- Actions ---
type SessionListAction =
  | { type: 'LOAD_ALL_SESSIONS_START' }
  | { type: 'LOAD_ALL_SESSIONS_SUCCESS'; payload: ApiChatSession[] }
  | { type: 'LOAD_ALL_SESSIONS_FAILURE'; payload: string }
  | { type: 'ADD_SESSION'; payload: ApiChatSession } // Action to add a new session (e.g., after creation)
  | { type: 'UPDATE_SESSION'; payload: ApiChatSession } // Action to update an existing session (e.g., after title change)
  | { type: 'REMOVE_SESSION'; payload: { sessionId: string } } // Action to remove a session (e.g., after deletion)
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  // Ações para edição de sessão
  | { type: 'SET_EDITING_SESSION'; payload: { sessionId: string, title: string } }
  | { type: 'UPDATE_EDITING_TITLE'; payload: string }
  | { type: 'CANCEL_EDITING' }
  | { type: 'SAVE_TITLE_START' }
  | { type: 'SAVE_TITLE_SUCCESS'; payload: ApiChatSession }
  | { type: 'SAVE_TITLE_FAILURE'; payload: string };

// --- Initial State ---
const initialSessionListState: SessionListState = {
  allSessions: [],
  isLoadingAllSessions: false,
  editingSessionId: null,
  editingTitle: '',
  isSavingTitle: false,
  error: null,
};

// --- Reducer ---
const sessionListReducer = (state: SessionListState, action: SessionListAction): SessionListState => {
  switch (action.type) {
    case 'LOAD_ALL_SESSIONS_START':
      return { ...state, isLoadingAllSessions: true, error: null };
    case 'LOAD_ALL_SESSIONS_SUCCESS':
      // Sort by updatedAt descending
      const sortedSessions = [...action.payload].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return { ...state, isLoadingAllSessions: false, allSessions: sortedSessions, error: null };
    case 'LOAD_ALL_SESSIONS_FAILURE':
      return { ...state, isLoadingAllSessions: false, error: action.payload };
    case 'ADD_SESSION':
      // Add to start and re-sort (optional, depends if list should always be sorted)
      const addedList = [action.payload, ...state.allSessions.filter(s => s.id !== action.payload.id)]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { ...state, allSessions: addedList };
    case 'UPDATE_SESSION':
      const updatedList = state.allSessions.map(session =>
        session.id === action.payload.id ? action.payload : session
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return { ...state, allSessions: updatedList };
    case 'REMOVE_SESSION':
      const filteredList = state.allSessions.filter(session => session.id !== action.payload.sessionId);
      // No need to re-sort after removal if already sorted
      return { ...state, allSessions: filteredList };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    // Cases para edição de sessão
    case 'SET_EDITING_SESSION':
      return { 
        ...state, 
        editingSessionId: action.payload.sessionId,
        editingTitle: action.payload.title
      };
    case 'UPDATE_EDITING_TITLE':
      return { ...state, editingTitle: action.payload };
    case 'CANCEL_EDITING':
      return { 
        ...state, 
        editingSessionId: null,
        editingTitle: '',
        error: null 
      };
    case 'SAVE_TITLE_START':
      return { ...state, isSavingTitle: true, error: null };
    case 'SAVE_TITLE_SUCCESS':
      return { 
        ...state, 
        isSavingTitle: false, 
        editingSessionId: null,
        editingTitle: '',
        allSessions: state.allSessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      };
    case 'SAVE_TITLE_FAILURE':
      return { ...state, isSavingTitle: false, error: action.payload };
    default:
      return state;
  }
};

// --- Context Type ---
interface SessionListContextType {
  state: SessionListState;
  loadAllSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>; 
  updateSessionTitle: (sessionId: string, title: string) => Promise<ApiChatSession | null>;
  // Expose functions for AgentContext to update the list
  addSessionToList: (session: ApiChatSession) => void; 
  updateSessionInList: (session: ApiChatSession) => void;
  // Funções para edição de sessão
  startEditing: (session: ApiChatSession) => void;
  cancelEditing: () => void;
  updateEditingTitle: (title: string) => void;
  saveTitle: () => Promise<void>;
  // Função para abrir uma sessão
  openSession: (sessionId: string) => void;
}

// --- Context ---
const SessionListContext = createContext<SessionListContextType | undefined>(undefined);

// --- Provider ---
interface SessionListProviderProps {
  children: ReactNode;
}

export const SessionListProvider: React.FC<SessionListProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionListReducer, initialSessionListState);
  const agentApiService = useAgentApiService(); // Get API functions
  const { openTab, setActiveTab, updateTab } = useUIState();
  const agentContext = useAgentContext(); // Changed from: const { setActiveSession: setActiveChatSession } = useAgentContext();

  // Moved these definitions BEFORE the useEffect that uses them
  const addSessionToList = useCallback((session: ApiChatSession) => {
      dispatch({ type: 'ADD_SESSION', payload: session });
      Logger.info(`[SessionListContext] Session ${session.id} added to list via AgentContext.`);
  }, []);

  const updateSessionInList = useCallback((session: ApiChatSession) => {
      dispatch({ type: 'UPDATE_SESSION', payload: session });
      Logger.info(`[SessionListContext] Session ${session.id} updated in list via AgentContext.`);
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      Logger.info(`[SessionListContext] Deleting session ${sessionId}...`);
      await agentApiService.deleteSession(sessionId);
      dispatch({ type: 'REMOVE_SESSION', payload: { sessionId } });
      Logger.info(`[SessionListContext] Session ${sessionId} deleted successfully.`);
      return true;
    } catch (error: any) {
      Logger.error(`[SessionListContext] Failed to delete session ${sessionId}:`, error);
      let errorMsg = 'Erro desconhecido ao deletar sessão.';
      if (axios.isAxiosError(error)) {
        errorMsg = formatApiErrorMessage(error as AxiosError);
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      toast.error(`Erro ao deletar sessão: ${errorMsg}`);
      return false;
    }
  }, [agentApiService]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string): Promise<ApiChatSession | null> => {
    const payload: UpdateSessionPayload = { title };
    try {
      Logger.info(`[SessionListContext] Updating title for session ${sessionId}...`);
      // Conversão explícita para resolver incompatibilidade de tipo
      const apiPayload = payload as unknown as Partial<ApiChatSession>;
      const updatedSession = await agentApiService.updateSession(sessionId, apiPayload);
      dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
      Logger.info(`[SessionListContext] Session ${sessionId} title updated successfully.`);
      return updatedSession;
    } catch (error: any) {
      Logger.error(`[SessionListContext] Failed to update title for session ${sessionId}:`, error);
      let errorMsg = 'Erro desconhecido ao atualizar título.';
      if (axios.isAxiosError(error)) {
        errorMsg = formatApiErrorMessage(error as AxiosError);
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      toast.error(`Erro ao atualizar título: ${errorMsg}`);
      return null;
    }
  }, [agentApiService]);

  // Register updaters with AgentContext (NOW AFTER function definitions)
  useEffect(() => {
    if (agentContext.registerSessionListUpdaters) {
      agentContext.registerSessionListUpdaters({
        addSessionToList,
        updateSessionInList,
        updateSessionTitle,
        deleteSession      
      });
      Logger.info('[SessionListContext] Registered its updaters with AgentContext.');
    }
  }, [agentContext.registerSessionListUpdaters, addSessionToList, updateSessionInList, updateSessionTitle, deleteSession]);

  const loadAllSessions = useCallback(async () => {
    dispatch({ type: 'LOAD_ALL_SESSIONS_START' });
    try {
      Logger.info('[SessionListContext] Fetching all sessions...');
      const sessions = await agentApiService.getSessions();
      dispatch({ type: 'LOAD_ALL_SESSIONS_SUCCESS', payload: sessions });
      Logger.info(`[SessionListContext] Loaded ${sessions.length} sessions.`);
    } catch (error: any) {
      Logger.error('[SessionListContext] Failed to load sessions:', error);
      let errorMsg = 'Erro desconhecido ao carregar sessões.';
      if (axios.isAxiosError(error)) {
        errorMsg = formatApiErrorMessage(error as AxiosError);
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      dispatch({ type: 'LOAD_ALL_SESSIONS_FAILURE', payload: errorMsg });
      toast.error(`Erro ao carregar lista de sessões: ${errorMsg}`);
    }
  }, [agentApiService]);

  // Load all sessions on initial mount
  useEffect(() => {
    loadAllSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Funções para edição de sessão
  const startEditing = useCallback((session: ApiChatSession) => {
    dispatch({ 
      type: 'SET_EDITING_SESSION', 
      payload: { 
        sessionId: session.id, 
        title: session.title || '' 
      } 
    });
  }, []);

  const cancelEditing = useCallback(() => {
    dispatch({ type: 'CANCEL_EDITING' });
  }, []);

  const updateEditingTitle = useCallback((title: string) => {
    dispatch({ type: 'UPDATE_EDITING_TITLE', payload: title });
  }, []);

  const saveTitle = useCallback(async () => {
    const { editingSessionId, editingTitle } = state;
    
    if (!editingSessionId || !editingTitle.trim()) {
      cancelEditing();
      return;
    }
    
    const originalSession = state.allSessions.find(s => s.id === editingSessionId);
    if (editingTitle.trim() === originalSession?.title) {
      cancelEditing();
      return;
    }
    
    dispatch({ type: 'SAVE_TITLE_START' });
    
    try {
      const updatedSession = await updateSessionTitle(editingSessionId, editingTitle.trim());
      
      if (updatedSession) {
        dispatch({ type: 'SAVE_TITLE_SUCCESS', payload: updatedSession });
        updateTab({ id: editingSessionId, title: editingTitle.trim() });
        toast.info(`Sessão renomeada para "${editingTitle.trim()}"`);
      } else {
        dispatch({ type: 'SAVE_TITLE_FAILURE', payload: 'Falha ao atualizar o título da sessão' });
      }
    } catch (error: any) {
      let errorMsg = 'Erro ao salvar o título';
      if (axios.isAxiosError(error)) {
        errorMsg = formatApiErrorMessage(error as AxiosError);
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      dispatch({ type: 'SAVE_TITLE_FAILURE', payload: errorMsg });
      toast.error(`Erro ao salvar título: ${errorMsg}`);
    }
  }, [state.editingSessionId, state.editingTitle, state.allSessions, cancelEditing, updateSessionTitle, updateTab]);

  // Função para abrir uma sessão
  const openSession = useCallback((sessionId: string) => {
    agentContext.setActiveChatSession(sessionId); 
    const sessionToOpen = state.allSessions.find(s => s.id === sessionId);
    openTab({
      id: sessionId,
      type: 'chat',
      title: sessionToOpen?.title || `Chat ${sessionId.substring(0, 4)}...`
    });
    setActiveTab(sessionId);
    Logger.info(`[SessionListContext] Session ${sessionId} opened.`);
  }, [agentContext, state.allSessions, openTab, setActiveTab]); // agentContext em vez de agentContext.setActiveChatSession

  return (
    <SessionListContext.Provider
      value={{
        state,
        loadAllSessions,
        deleteSession,
        updateSessionTitle,
        // Expose add/update functions for AgentContext
        addSessionToList, 
        updateSessionInList,
        // Funções para edição de sessão
        startEditing,
        cancelEditing,
        updateEditingTitle,
        saveTitle,
        // Função para abrir uma sessão
        openSession
      }}
    >
      {children}
    </SessionListContext.Provider>
  );
};

// --- Hook ---
export const useSessionListContext = () => {
  const context = useContext(SessionListContext);
  if (context === undefined) {
    throw new Error('useSessionListContext must be used within a SessionListProvider');
  }
  return context;
}; 