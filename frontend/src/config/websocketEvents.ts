/**
 * Definição centralizada de eventos do WebSocket
 * Este arquivo evita strings duplicadas e erros de digitação em eventos WebSocket
 */

// Eventos de conexão
export const connectionEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
} as const;

// Eventos de mensagem
export const messageEvents = {
  MESSAGE: 'message',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_STOP_TYPING: 'chat:stopTyping',
  CHAT_HISTORY: 'chat:history',
} as const;

// Eventos de agentes
export const agentEvents = {
  AGENT_STATUS: 'agent:status',
  AGENT_THINKING: 'agent:thinking',
  AGENT_ERROR: 'agent:error',
  AGENT_RESULT: 'agent:result',
  AGENT_FEEDBACK: 'agent:feedback',
} as const;

// Eventos de trigger
export const triggerEvents = {
  // Triggers (enviados do cliente)
  TRIGGER_TEST_GENERATION: 'trigger:testGeneration',
  TRIGGER_SECURITY_ANALYSIS: 'trigger:securityAnalysis',
  TRIGGER_TEST_SIMULATION: 'trigger:testSimulation',
  TRIGGER_TEST_FIX_VALIDATION: 'trigger:testFixValidation',
  TRIGGER_SECURITY_FIX_VERIFICATION: 'trigger:securityFixVerification',
  
  // Resultados (recebidos do servidor)
  RESULT_TEST_GENERATION: 'result:testGeneration',
  RESULT_SECURITY_ANALYSIS: 'result:securityAnalysis',
  RESULT_TEST_SIMULATION: 'result:testSimulation',
  RESULT_TEST_FIX_VALIDATION: 'result:testFixValidation',
  RESULT_SECURITY_FIX_VERIFICATION: 'result:securityFixVerification',
  RESULT_ERROR: 'error:trigger',
} as const;

// Eventos de sessão
export const sessionEvents = {
  SESSION_CREATED: 'session:created',
  SESSION_UPDATED: 'session:updated',
  SESSION_DELETED: 'session:deleted',
  SESSION_STATUS: 'session:status',
} as const;

// Eventos de sistema
export const systemEvents = {
  SYSTEM_ERROR: 'system:error',
  SYSTEM_NOTIFICATION: 'system:notification',
  SYSTEM_STATUS: 'system:status',
} as const;

// Tipos para inferência
export type ConnectionEvent = typeof connectionEvents[keyof typeof connectionEvents];
export type MessageEvent = typeof messageEvents[keyof typeof messageEvents];
export type AgentEvent = typeof agentEvents[keyof typeof agentEvents];
export type TriggerEvent = typeof triggerEvents[keyof typeof triggerEvents];
export type SessionEvent = typeof sessionEvents[keyof typeof sessionEvents];
export type SystemEvent = typeof systemEvents[keyof typeof systemEvents];

// Todos os eventos agrupados
export const websocketEvents = {
  ...connectionEvents,
  ...messageEvents,
  ...agentEvents,
  ...triggerEvents,
  ...sessionEvents,
  ...systemEvents,
} as const;

export type WebSocketEvent = typeof websocketEvents[keyof typeof websocketEvents]; 