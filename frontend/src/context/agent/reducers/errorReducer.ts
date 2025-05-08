import { AgentAction, AgentState } from '../types';

/**
 * Reducer especializado em gerenciar erros e status de conexão
 */
export const errorReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'CLEAR_ERROR':
      return { ...state, error: null };
      
    case 'SET_CONNECTION_STATUS':
      // Evitar re-render desnecessário se o estado já for o mesmo
      if (state.isConnected === action.payload) return state;
      return { ...state, isConnected: action.payload };
      
    default:
      // Este reducer não lida com essa ação
      return state;
  }
}; 