import { AgentAction, AgentState } from '../types';
import { Logger } from '../../../lib/Logger';

/**
 * Reducer especializado em gerenciar resultados de triggers de agentes
 */
export const triggerReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    case 'SET_TRIGGER_RESULT':
      // Atualiza o resultado do trigger e define erro global se falhou
      return { 
        ...state, 
        lastTriggerResult: action.payload, 
        error: action.payload?.success === false 
          ? (action.payload.message || 'Trigger action failed') 
          : state.error 
      };
      
    case 'CLEAR_LAST_TRIGGER_RESULT': 
      if (!state.lastTriggerResult) return state; // Sem mudança
      return { ...state, lastTriggerResult: null };
      
    case 'RECEIVE_TRIGGER_RESULT': 
      Logger.info('AgentContext received trigger result:', action.payload);
      return {
        ...state,
        lastTriggerResult: action.payload,
      };
      
    default:
      // Este reducer não lida com essa ação
      return state;
  }
}; 