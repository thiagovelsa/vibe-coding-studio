import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { ChatSession, ChatMessage } from '../services/agent-api.service';
import { useAgentContext } from './AgentContext';

// State type for the active chat context
interface ActiveChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ActiveChatState = {
  messages: [],
  isLoading: false,
  error: null
};

// Action types
type ActiveChatAction =
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer
const activeChatReducer = (state: ActiveChatState, action: ActiveChatAction): ActiveChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates } 
            : msg
        )
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

// Context type
interface ActiveChatContextType {
  state: ActiveChatState;
  sendMessage: (content: string) => Promise<void>;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  submitFeedback: (messageId: string, rating: number, correction?: string) => Promise<void>;
}

// Create context
const ActiveChatContext = createContext<ActiveChatContextType | undefined>(undefined);

// Provider component
interface ActiveChatProviderProps {
  children: ReactNode;
}

export const ActiveChatProvider: React.FC<ActiveChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(activeChatReducer, initialState);
  const { state: agentState, sendMessage: agentSendMessage, submitFeedback: agentSubmitFeedback } = useAgentContext();
  
  const { activeChatSessionId, sessions } = agentState;
  
  // Update local messages when active session changes
  useEffect(() => {
    if (activeChatSessionId && sessions[activeChatSessionId]?.messages) {
      dispatch({ 
        type: 'SET_MESSAGES', 
        payload: sessions[activeChatSessionId].messages 
      });
    } else {
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, [activeChatSessionId, sessions]);
  
  // Send a message in the active chat session
  const sendMessage = useCallback(async (content: string) => {
    if (!activeChatSessionId) {
      dispatch({ type: 'SET_ERROR', payload: 'No active chat session' });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await agentSendMessage(activeChatSessionId, content);
      // No need to update local state as it will be updated via the effect when sessions change
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to send message' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [activeChatSessionId, agentSendMessage]);
  
  // Update a message locally
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    dispatch({ 
      type: 'UPDATE_MESSAGE', 
      payload: { id: messageId, updates } 
    });
  }, []);
  
  // Submit feedback for a message
  const submitFeedback = useCallback(async (messageId: string, rating: number, correction?: string) => {
    if (!activeChatSessionId) {
      dispatch({ type: 'SET_ERROR', payload: 'No active chat session' });
      return;
    }
    
    try {
      await agentSubmitFeedback(activeChatSessionId, messageId, rating, correction);
      // The message will be updated via the effect when sessions change
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to submit feedback' 
      });
    }
  }, [activeChatSessionId, agentSubmitFeedback]);
  
  return (
    <ActiveChatContext.Provider value={{ state, sendMessage, updateMessage, submitFeedback }}>
      {children}
    </ActiveChatContext.Provider>
  );
};

// Hook for using the context
export const useActiveChatContext = (): ActiveChatContextType => {
  const context = useContext(ActiveChatContext);
  if (context === undefined) {
    throw new Error('useActiveChatContext must be used within an ActiveChatProvider');
  }
  return context;
}; 