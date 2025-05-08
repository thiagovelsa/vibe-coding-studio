import { describe, it, expect } from 'vitest';
import { agentReducer } from '../../frontend/src/context/AgentContext';
import { AgentState, AgentAction } from '../../frontend/src/context/AgentContext';

describe('agentReducer', () => {
  const initialState: AgentState = {
    sessions: [],
    activeChatSessionId: null,
    isLoadingSession: false,
    error: null,
    availableModels: [],
    defaultModelId: null,
    orchestratorState: null,
    connectionStatus: 'disconnected'
  };

  it('should handle SET_ACTIVE_SESSION', () => {
    const action: AgentAction = {
      type: 'SET_ACTIVE_SESSION',
      payload: '123'
    };

    const newState = agentReducer(initialState, action);
    
    expect(newState.activeChatSessionId).toBe('123');
  });

  it('should handle START_LOADING_SESSION', () => {
    const action: AgentAction = {
      type: 'START_LOADING_SESSION'
    };

    const newState = agentReducer(initialState, action);
    
    expect(newState.isLoadingSession).toBe(true);
    expect(newState.error).toBe(null);
  });

  it('should handle SESSION_LOADED', () => {
    const session = {
      id: '123',
      title: 'Test Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orchestratorState: null
    };
    
    const action: AgentAction = {
      type: 'SESSION_LOADED',
      payload: session
    };

    const newState = agentReducer(initialState, action);
    
    expect(newState.isLoadingSession).toBe(false);
    expect(newState.activeChatSessionId).toBe('123');
    expect(newState.sessions).toContainEqual(session);
  });

  it('should handle LOADING_SESSION_FAILED', () => {
    const error = new Error('Failed to load session');
    const action: AgentAction = {
      type: 'LOADING_SESSION_FAILED',
      payload: error
    };

    const newState = agentReducer(initialState, action);
    
    expect(newState.isLoadingSession).toBe(false);
    expect(newState.error).toBe(error);
  });
}); 