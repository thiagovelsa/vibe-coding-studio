import { AgentAction, AgentState } from '../types';

/**
 * Reducer especializado em gerenciar os modelos de IA disponíveis
 * Responsável por definir modelos disponíveis e selecionados
 */
export const modelReducer = (state: AgentState, action: AgentAction): AgentState => {
  switch (action.type) {
    case 'SET_AVAILABLE_MODELS':
      const selectedExists = action.payload.some(m => m.id === state.selectedModelId);
      return {
        ...state,
        availableModels: action.payload,
        selectedModelId: selectedExists 
          ? state.selectedModelId 
          : (action.payload.length > 0 ? action.payload[0].id : null),
      };

    case 'SET_SELECTED_MODEL':
      if (state.selectedModelId === action.payload) return state; // Sem mudança
      return {
        ...state,
        selectedModelId: action.payload,
      };

    default:
      // Este reducer não lida com essa ação
      return state;
  }
}; 