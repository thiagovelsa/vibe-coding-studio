import { AgentAction, AgentState } from '../types';
import { sessionReducer } from './sessionReducer';
import { modelReducer } from './modelReducer';
import { errorReducer } from './errorReducer';
import { triggerReducer } from './triggerReducer';

/**
 * Combina todos os redutores especializados em um único redutor principal.
 * Cada ação é processada sequencialmente por cada um dos redutores.
 */
export const rootReducer = (state: AgentState, action: AgentAction): AgentState => {
  // Aplica cada reducer em sequência, permitindo que cada um processe a ação se for relevante
  return [
    // A ordem é importante para casos onde múltiplos redutores podem responder à mesma ação
    errorReducer,      // Primeiro erros para que ações subsequentes possam limpar erros
    sessionReducer,    // Sessões são centrais, precisam ser processadas antes de modelos ou triggers
    modelReducer,      // Modelos são menos frequentemente atualizados
    triggerReducer,    // Processamento de resultados pode depender de sessões
  ].reduce((currentState, reducer) => reducer(currentState, action), state);
};

// Re-exporta todos os redutores para acesso direto quando necessário
export {
  sessionReducer,
  modelReducer,
  errorReducer,
  triggerReducer
}; 