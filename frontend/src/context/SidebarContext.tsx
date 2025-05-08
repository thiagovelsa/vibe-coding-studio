import React, { createContext, useReducer, useCallback, useContext, useEffect, ReactNode } from 'react';
import { useAgentContext, AIModel } from './AgentContext';
import { useSessionListContext } from './SessionListContext';
import { AgentType } from '../services/agent-api.service';
import { IconType } from 'react-icons';
import { FiPlus, FiUsers, FiFileText, FiGitBranch, FiCpu, FiDatabase, FiCheckSquare, FiSearch } from 'react-icons/fi';

// Tipos e dados para seleção de agente
interface AgentTypeOption {
  id: AgentType;
  name: string;
  icon: IconType;
}

export const agentTypeOptions: AgentTypeOption[] = [
  { id: AgentType.PRODUCT, name: "Product Manager", icon: FiUsers },
  { id: AgentType.CODER, name: "Coder Agent", icon: FiCpu },
  { id: AgentType.TESTER, name: "Test Agent", icon: FiCheckSquare },
  { id: AgentType.REVIEWER, name: "Code Reviewer", icon: FiSearch },
  { id: AgentType.DOCUMENTATION, name: "Documentation Writer", icon: FiFileText },
  { id: AgentType.ARCHITECT, name: "System Architect", icon: FiGitBranch },
];

// Estado do contexto
interface SidebarState {
  // Estado de criação de novas sessões
  selectedAgentType: AgentTypeOption | null;
  isCreatingSession: boolean;
  error: string | null;
}

// Ações do reducer
type SidebarAction =
  | { type: 'SELECT_AGENT_TYPE'; payload: AgentTypeOption | null }
  | { type: 'CREATE_SESSION_START' }
  | { type: 'CREATE_SESSION_SUCCESS' }
  | { type: 'CREATE_SESSION_FAILURE'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialSidebarState: SidebarState = {
  selectedAgentType: agentTypeOptions.find(opt => opt.id === AgentType.CODER) || null,
  isCreatingSession: false,
  error: null
};

// Reducer
const sidebarReducer = (state: SidebarState, action: SidebarAction): SidebarState => {
  switch (action.type) {
    case 'SELECT_AGENT_TYPE':
      return {
        ...state,
        selectedAgentType: action.payload
      };
    case 'CREATE_SESSION_START':
      return {
        ...state,
        isCreatingSession: true,
        error: null
      };
    case 'CREATE_SESSION_SUCCESS':
      return {
        ...state,
        isCreatingSession: false
      };
    case 'CREATE_SESSION_FAILURE':
      return {
        ...state,
        isCreatingSession: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Interface do contexto
interface SidebarContextType {
  state: SidebarState;
  selectAgentType: (agentType: AgentTypeOption | null) => void;
  createSession: (modelId: string) => Promise<void>;
  clearError: () => void;
}

// Criar contexto
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Provider
interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sidebarReducer, initialSidebarState);
  const { createSession: agentCreateSession, setSelectedModel } = useAgentContext();
  
  // Selecionar tipo de agente
  const selectAgentType = useCallback((agentType: AgentTypeOption | null) => {
    dispatch({ type: 'SELECT_AGENT_TYPE', payload: agentType });
  }, []);
  
  // Criar sessão
  const createSession = useCallback(async (modelId: string) => {
    if (!state.selectedAgentType) return;
    
    dispatch({ type: 'CREATE_SESSION_START' });
    
    try {
      await agentCreateSession({
        title: 'Nova Sessão',
        agentType: state.selectedAgentType.id,
        modelId: modelId
      });
      
      dispatch({ type: 'CREATE_SESSION_SUCCESS' });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao criar sessão';
      dispatch({ type: 'CREATE_SESSION_FAILURE', payload: errorMessage });
    }
  }, [state.selectedAgentType, agentCreateSession]);
  
  // Limpar erro
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  return (
    <SidebarContext.Provider value={{
      state,
      selectAgentType,
      createSession,
      clearError
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Hook para usar o contexto
export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}; 