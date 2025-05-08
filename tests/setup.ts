import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  constructor(private callback: ResizeObserverCallback) {}
  
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Mock Electron API
vi.stubGlobal('electronAPI', {
  getBackendUrl: vi.fn().mockResolvedValue('http://localhost:3000'),
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn().mockImplementation(() => () => {}),
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readDir: vi.fn(),
  },
  app: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
  },
  dialog: {
    openFile: vi.fn(),
    saveFile: vi.fn(),
    openDirectory: vi.fn(),
    showMessage: vi.fn(),
  },
  dragDrop: {
    registerFileDropZone: vi.fn(),
    unregisterFileDropZone: vi.fn(),
    onDrop: vi.fn().mockImplementation(() => () => {}),
  },
  system: {
    getInfo: vi.fn(),
    getPlatform: vi.fn(),
    getCpuUsage: vi.fn(),
    getMemoryInfo: vi.fn(),
    openPath: vi.fn(),
    openExternal: vi.fn(),
  },
  clipboard: {
    readText: vi.fn(),
    writeText: vi.fn(),
    readImage: vi.fn(),
    writeImage: vi.fn(),
    readHTML: vi.fn(),
    writeHTML: vi.fn(),
    clear: vi.fn(),
  },
}); 