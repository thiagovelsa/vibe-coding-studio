import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentCollaborationPanel from '../../frontend/src/components/panel/AgentCollaborationPanel';
import { AgentProvider } from '../../frontend/src/context/AgentContext';
import { ActiveChatProvider } from '../../frontend/src/context/ActiveChatContext';
import { ThemeProvider } from '../../frontend/src/context/ThemeContext';

// Mock the agent API service
vi.mock('../../frontend/src/services/agent-api.service', () => ({
  useAgentApiService: () => ({
    sendMessage: vi.fn().mockResolvedValue({
      id: 'msg-response-1',
      content: 'This is a response from the agent.',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      agentType: 'coder',
      status: 'completed'
    }),
    createSession: vi.fn().mockResolvedValue({
      id: 'session-1',
      title: 'New Chat Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orchestratorState: {
        currentAgentType: 'coder',
        status: 'idle',
        steps: []
      }
    }),
    loadSession: vi.fn(),
    loadAllSessions: vi.fn().mockResolvedValue([])
  })
}));

// Wrap the component with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider defaultTheme="light">
      <AgentProvider>
        <ActiveChatProvider>
          {ui}
        </ActiveChatProvider>
      </AgentProvider>
    </ThemeProvider>
  );
};

describe('AgentCollaborationPanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the chat interface', () => {
    renderWithProviders(<AgentCollaborationPanel />);
    
    // Check that the input field and send button are rendered
    expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should send a message and display the response', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentCollaborationPanel />);
    
    // Type a message
    const input = screen.getByPlaceholderText(/Type a message/i);
    await user.type(input, 'Hello, agent!');
    
    // Click the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Check that the user message is displayed
    expect(screen.getByText('Hello, agent!')).toBeInTheDocument();
    
    // Wait for the agent response
    await waitFor(() => {
      expect(screen.getByText('This is a response from the agent.')).toBeInTheDocument();
    });
  });

  it('should display loading state while waiting for response', async () => {
    // Override the mock to add a delay
    const originalSendMessage = vi.mocked(useAgentApiService().sendMessage);
    vi.mocked(useAgentApiService().sendMessage).mockImplementation(
      () => new Promise(resolve => {
        setTimeout(() => resolve(originalSendMessage()), 100);
      })
    );
    
    const user = userEvent.setup();
    renderWithProviders(<AgentCollaborationPanel />);
    
    // Type and send a message
    await user.type(screen.getByPlaceholderText(/Type a message/i), 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Check for loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Wait for the response
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(screen.getByText('This is a response from the agent.')).toBeInTheDocument();
    });
  });
}); 