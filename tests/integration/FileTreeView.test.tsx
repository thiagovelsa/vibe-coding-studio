import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileTreeView from '../../frontend/src/components/layout/FileTreeView';
import { WorkspaceProvider } from '../../frontend/src/context/WorkspaceContext';
import { UIStateProvider } from '../../frontend/src/context/UIStateContext';

// Mock the fileSystemService
vi.mock('../../frontend/src/services/file-system.service', () => ({
  useFileSystemService: () => ({
    listDirectory: vi.fn().mockResolvedValue([
      { name: 'src', path: '/src', type: 'directory', children: [] },
      { name: 'package.json', path: '/package.json', type: 'file', children: null },
      { name: 'README.md', path: '/README.md', type: 'file', children: null }
    ]),
    readDirectory: vi.fn().mockImplementation((path) => {
      if (path === '/src') {
        return Promise.resolve([
          { name: 'components', path: '/src/components', type: 'directory', children: [] },
          { name: 'index.ts', path: '/src/index.ts', type: 'file', children: null }
        ]);
      }
      return Promise.resolve([]);
    })
  })
}));

// Wrap the component with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <UIStateProvider>
      <WorkspaceProvider>
        {ui}
      </WorkspaceProvider>
    </UIStateProvider>
  );
};

describe('FileTreeView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render root level files and directories', async () => {
    renderWithProviders(<FileTreeView />);
    
    // Wait for the initial file list to load
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });
  });

  it('should expand directory when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FileTreeView />);
    
    // Wait for the initial file list to load
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    // Click on the src directory to expand it
    await user.click(screen.getByText('src'));
    
    // Wait for the children to load
    await waitFor(() => {
      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.getByText('index.ts')).toBeInTheDocument();
    });
  });

  it('should select a file when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FileTreeView />);
    
    // Wait for the initial file list to load
    await waitFor(() => {
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    // Click on a file
    await user.click(screen.getByText('README.md'));
    
    // The file should have a selected class or attribute
    // This will depend on your implementation
    const fileElement = screen.getByText('README.md').closest('div');
    expect(fileElement).toHaveClass('selected'); // Adjust based on your actual implementation
  });
}); 