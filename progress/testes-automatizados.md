# 🧪 Implementação de Testes Automatizados no VibeForge

## 📜 Contexto e Motivação

A necessidade de implementar testes automatizados no projeto VibeForge surgiu da crescente complexidade do sistema e da importância de garantir sua estabilidade e qualidade à medida que novas funcionalidades são adicionadas. Um sistema de testes robusto oferece:

- **Confiança nas mudanças**: Redução de regressões e efeitos colaterais inesperados
- **Documentação executável**: Os testes servem como documentação viva do comportamento esperado
- **Feedback rápido**: Identificação imediata de problemas durante o desenvolvimento
- **Refatoração segura**: Capacidade de reestruturar o código com segurança

## 🏗️ Arquitetura de Testes

Implementamos uma estratégia em três camadas:

### 1. Testes Unitários (Vitest)

Focados em testar unidades isoladas de código, como funções, hooks e reducers.

**Ferramentas escolhidas:**
- **Vitest**: Framework de testes compatível com Vite, oferecendo integração perfeita com nosso ambiente de desenvolvimento
- **Testing Library**: Para facilitar testes de componentes React
- **Happy-DOM**: Ambiente DOM virtual leve para testes

**Exemplos implementados:**
- Testes de reducers (AgentContext)
- Testes de funções utilitárias (classNames, formatDate, etc.)

### 2. Testes de Integração (Vitest + Testing Library)

Verificam como múltiplos componentes ou unidades funcionam juntos.

**Ferramentas escolhidas:**
- **Vitest**: Mesmo framework dos testes unitários
- **Testing Library**: Para renderizar componentes em um ambiente controlado
- **userEvent**: Para simular interações do usuário

**Exemplos implementados:**
- Testes do FileTreeView (expansão de diretórios, seleção de arquivos)
- Testes do AgentChat (envio de mensagens, exibição de respostas)

### 3. Testes End-to-End (Playwright)

Simulam fluxos completos do usuário em um ambiente real.

**Ferramentas escolhidas:**
- **Playwright**: Framework moderno para testes E2E, suportando múltiplos navegadores
- **Módulo Electron do Playwright**: Para testes específicos da aplicação desktop

**Exemplos implementados:**
- Fluxos básicos de navegação e uso do chat
- Funcionalidades específicas do Electron (diálogos, drag-and-drop)

## 🛠️ Configuração do Ambiente

### Vitest (Testes Unitários e de Integração)

Configurado através do arquivo `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/unit/**/*.test.{ts,tsx}', './tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
});
```

Arquivo de setup (`tests/setup.ts`) para configurar o ambiente de testes:
- Extensão do Vitest com matchers do Testing Library
- Mocks para APIs do navegador (localStorage, matchMedia)
- Mocks para APIs do Electron

### Playwright (Testes E2E)

Configurado através do arquivo `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  
  projects: [
    // Setup e Teardown
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'shutdown',
    },
    {
      name: 'shutdown',
      testMatch: /global\.teardown\.ts/,
    },
    
    // Navegadores Web
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    
    // Testes Electron
    {
      name: 'electron',
      testDir: './tests/e2e',
      testMatch: /electron-.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  
  // Servidor de desenvolvimento
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

## 📊 Áreas Cobertas

### Frontend

#### Testes Unitários
- Reducer do AgentContext
- Funções utilitárias (classNames, formatDate, truncateString)
- Hooks personalizados

#### Testes de Integração
- Componente FileTreeView
  - Renderização inicial
  - Expansão de diretórios
  - Seleção de arquivos
- Componente AgentChat
  - Envio de mensagens
  - Exibição de respostas
  - Estados de carregamento

#### Testes E2E
- Fluxos básicos do usuário
  - Navegação pela aplicação
  - Interação com o chat
  - Abertura de arquivos
  - Alteração de tema
- Funcionalidades específicas do Electron
  - Diálogos nativos
  - Drag-and-drop de arquivos
  - Acesso a informações do sistema

### Backend

#### Testes Unitários
- SessionService
  - Criação de sessões
  - Busca de sessões
  - Adição de mensagens
- OrchestratorService (via mocks)

#### Testes E2E
- API REST de sessões
  - CRUD completo
  - Fluxo de envio e resposta de mensagens

## 🧩 Padrões e Técnicas

### Mocks e Stubs

Utilizamos técnicas de mock para isolar os componentes testados:

```typescript
// Exemplo de mock para serviço
vi.mock('../../frontend/src/services/file-system.service', () => ({
  useFileSystemService: () => ({
    listDirectory: vi.fn().mockResolvedValue([
      { name: 'src', path: '/src', type: 'directory', children: [] },
      { name: 'package.json', path: '/package.json', type: 'file', children: null }
    ])
  })
}));
```

### Utilitários de Renderização

Criamos helpers para renderizar componentes com seus providers:

```typescript
// Helper para renderizar com providers necessários
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <UIStateProvider>
      <WorkspaceProvider>
        {ui}
      </WorkspaceProvider>
    </UIStateProvider>
  );
};
```

### Asserções para UI

Padrões de verificação de estado da UI:

```typescript
// Verificar se um elemento está visível
await expect(page.locator('[data-testid="file-tree-item"]')).toBeVisible({ timeout: 5000 });

// Verificar conteúdo de texto
expect(screen.getByText('Hello, agent!')).toBeInTheDocument();
```

## 📈 Scripts e Automação

Adicionados no `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report"
}
```

## 🔄 Exemplos de Testes

### Exemplo de Teste Unitário (Reducer)

```typescript
import { describe, it, expect } from 'vitest';
import { agentReducer } from '../../frontend/src/context/AgentContext';

describe('agentReducer', () => {
  const initialState = {
    sessions: [],
    activeChatSessionId: null,
    isLoadingSession: false,
    error: null
  };

  it('should handle SET_ACTIVE_SESSION', () => {
    const action = {
      type: 'SET_ACTIVE_SESSION',
      payload: '123'
    };

    const newState = agentReducer(initialState, action);
    
    expect(newState.activeChatSessionId).toBe('123');
  });
});
```

### Exemplo de Teste de Integração (Componente)

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentCollaborationPanel from '../../frontend/src/components/panel/AgentCollaborationPanel';
import { AgentProvider } from '../../frontend/src/context/AgentContext';

describe('AgentCollaborationPanel Integration', () => {
  it('should send a message and display the response', async () => {
    const user = userEvent.setup();
    
    render(
      <AgentProvider>
        <AgentCollaborationPanel />
      </AgentProvider>
    );
    
    // Type a message
    await user.type(screen.getByPlaceholderText(/Type a message/i), 'Hello, agent!');
    
    // Click the send button
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for the agent response
    await waitFor(() => {
      expect(screen.getByText('Response from agent')).toBeInTheDocument();
    });
  });
});
```

### Exemplo de Teste E2E (Fluxo do Usuário)

```typescript
import { test, expect } from '@playwright/test';

test('should be able to interact with the agent', async ({ page }) => {
  // Navegar para a aplicação
  await page.goto('http://localhost:5173/');
  
  // Esperar carregar
  await page.waitForSelector('[data-testid="app-layout"]');
  
  // Encontrar input do chat
  const chatInput = page.locator('[data-testid="chat-input"]');
  await expect(chatInput).toBeVisible();
  
  // Digitar e enviar mensagem
  await chatInput.fill('Hello, can you help me?');
  await page.keyboard.press('Enter');
  
  // Verificar resposta do agente
  await expect(page.locator('[data-testid="assistant-message"]')).toBeVisible({ timeout: 15000 });
});
```

## 🔮 Próximos Passos

1. **Expandir a cobertura de testes**
   - Adicionar testes para mais componentes e serviços
   - Focar em áreas críticas como WebSocket e IPC

2. **Integrar com CI/CD**
   - Configurar GitHub Actions para executar testes em cada PR
   - Gerar e publicar relatórios de cobertura

3. **Melhorar a documentação de testes**
   - Criar guias para escrever novos testes
   - Documentar padrões e convenções

4. **Implementar testes de performance**
   - Medir e monitorar tempos de renderização
   - Testar otimizações de bundle

5. **Testes de resiliência**
   - Simular falhas de rede
   - Testar recuperação após erros

## 📝 Conclusão

A implementação de testes automatizados representa um passo importante na maturidade do projeto VibeForge. Com esta infraestrutura de testes, temos agora uma base sólida para continuar o desenvolvimento com confiança, garantindo que novas funcionalidades não quebrem comportamentos existentes e que o sistema como um todo mantenha sua qualidade e estabilidade.

### Nota sobre a Estrutura de Pastas de Teste (Atualização Recente)
**A estrutura das pastas de teste foi reorganizada. Todos os testes agora estão centralizados sob a pasta `tests/` na raiz do projeto. Os testes específicos do backend, anteriormente em `backend/test/`, foram movidos para `tests/backend/`. Por exemplo, os testes de unidade do backend estão agora em `tests/backend/unit/` e os testes E2E do backend em `tests/backend/e2e/`. Esta mudança visa melhorar a organização e a clareza da suíte de testes.**

// Exemplo de como um caminho pode ter mudado:
// Antes: Os testes de unidade do backend estão localizados em `backend/test/unit`.
// Depois: Os testes de unidade do backend estão localizados em `tests/backend/unit`.
// Por favor, revise o restante deste documento para ajustar outros caminhos conforme necessário. 