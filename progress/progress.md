# 📚 Plano de Desenvolvimento VibeForge (47 Passos / 9 Fases)

Este documento detalha as fases e tarefas planejadas para o desenvolvimento do VibeForge IDE.

---

## Fase 1: Fundação e Configuração Essencial (Pré-requisitos)
**Objetivo:** Garantir que o ambiente esteja pronto e as dependências/configurações básicas estejam corretas.

- [DONE] Verificar/Instalar Dependências: Garantir libs (react-icons, @headlessui/react, framer-motion, @monaco-editor/react) instaladas (#36).
- [DONE] Configurar Bundler (Monaco): Verificar/Configurar Vite para Monaco Editor (#36).
- [DONE] Verificar Fontes: Garantir fontes (Inter, JetBrains Mono) importadas/linkadas (#37).
- [DONE] Configurar Tailwind: Verificar se tailwind.config.js usa darkMode: 'class' (#24).
- [DONE] Envolver com ThemeProvider: Garantir <ThemeProvider> na raiz da aplicação (#23).
- [DONE] Verificar Caminhos de Importação: Revisar/corrigir caminhos de importação (#38).

---

## Fase 2: Finalização do Core Backend
**Objetivo:** Completar a lógica fundamental do backend.

- [DONE] Implementar Agentes Restantes: Implementar estrutura básica para TestAgent e SecurityAgent (#1).
- [DONE] Integrar Agentes ao Orquestrador: Estrutura do método `handle(context, history)` implementada e integrada com OrchestratorService (#2).
- [DONE] Implementar Persistência de Workflow: Entidades `SessionEntity`, `ChatMessageEntity` criadas; Serviços atualizados para salvar/carregar estado e histórico do DB (#5).
- [DONE] Implementar Sistema de Feedback: Estrutura para coletar (API), armazenar (DB) e passar feedback para agentes implementada (#3).
- [PENDING] Refinar Prompts e Lógica `handle`: Detalhar prompts e lógica de processamento de contexto/histórico/feedback em cada agente (#4, #2, #3).
- [DONE] Desenvolver Endpoints REST: Endpoints CRUD para Sessões e Mensagens/Feedback implementados (#6).

---

## Fase 3: Integração Estrutural do Frontend (Layout)
**Objetivo:** Montar a estrutura visual principal.

- [DONE] Integrar AppLayout: Garantir estrutura PanelGroup correta (#7).
- [DONE] Integrar ActivityBar: Posicionar ActivityBar no AppLayout (#7, #8).
- [DONE] Integrar Sidebar: Posicionar Sidebar no AppLayout (#7, #8).
- [DONE] Integrar Painel Principal: Posicionar AgentCollaborationPanel e AgentFlowVisualizer (#8, #9, #10).
- [PENDING] Implementar Sistema de Abas: Funcionalidade de abas na área principal (#11).

---

## Fase 4: Consistência de Estilo e Tema
**Objetivo:** Aplicar estilos globais e temas.

- [DONE] Aplicar Estilos Globais: Revisar e aplicar classes semânticas (bg-panel, etc.) (#25).
- [PENDING] Refinar/Centralizar Tema Monaco: Refinar vibe-glass-theme e mover (#26).
- [DONE] Implementar Syntax Highlighting: Adicionar highlighting ao CodeBlock em AgentMessage (#27).
- [PENDING] Conectar Theme Toggle: Conectar botão na ActivityBar ao toggleTheme (#21).
- [PENDING] Opcional: Scrollbars: Adicionar estilos globais para scrollbar customizada (#30).

---

### 🚀 Conclusão Fases 3 e 4 + Consolidação do Plano

- **Descrição:** Finalizamos a implementação do sistema de abas (Fase 3) e a consistência de estilo/tema (Fase 4), incluindo a refatoração do tema Monaco, conexão do toggle de tema e estilos de scrollbar. Reavaliamos o progresso e consolidamos o plano para as fases restantes (5 a 10).
- **Arquivos Impactados:**
    - `frontend/src/context/UIStateContext.tsx` (Estado das Abas)
    - `frontend/src/components/layout/MainContentArea.tsx` (Renderização das Abas e Conteúdo)
    - `frontend/src/context/WorkspaceContext.tsx` (Coordenação Abertura de Aba de Arquivo)
    - `frontend/src/components/layout/ActivityBar.tsx` (Botões para Abrir Abas Chat/Flow)
    - `frontend/src/themes/monaco/vibe-glass-theme.ts` (Definição Centralizada do Tema Monaco)
    - `frontend/src/components/common/CodeViewer.tsx` (Aplicação do Tema Centralizado, Refatoração de Props)
    - `frontend/src/globals.css` (Estilos Globais da Scrollbar)
- **Raciocínio Aplicado (Ω):** Procedural (implementação passo a passo das funcionalidades), Exploratório (análise da estrutura existente), Deductivo (derivação dos próximos passos lógicos), Contrastive (comparação e reconciliação dos planos de fase).
- **Diagnóstico se Existente (Ξ):** Identificada discrepância entre versões anteriores do plano de fases, resolvida pela consolidação e re-priorização.
- **Padrões Capturados (Λ):** N/A para esta atualização de planejamento.
- **Abstrações Derivadas (Φ):** N/A para esta atualização de planejamento.
- **Próximos Passos:** Iniciar a **Fase 5: Funcionalidades Essenciais do Editor e Chat**, começando pela permissão de edição real no `CodeViewer` e implementação da funcionalidade de salvar arquivos.

---

## Fase 5: Integração Funcional Frontend-Backend e Lógica Interna
**Objetivo:** Conectar UI à lógica de negócio e dados.

- [PENDING] Conectar Serviços: Conectar UI aos serviços API/WebSocket (#15).
- [PENDING] Implementar Comunicação WebSocket: Envio/recebimento de mensagens/status (#16).
  - [DONE] *Nota: Refatoração do gateway backend para buscar contexto via messageId concluída.*
- [PENDING] Lógica da Sidebar: Implementar interações (seleção agente, workflow, modelo) (#17).
- [PENDING] Dados Reais (Chat/Flow): Substituir placeholders por dados reais (#18).
- [PENDING] Lógica do PromptOptimizer: Implementar chamada real (#19).
- [PENDING] Lógica CodeViewer/DiffViewer: Implementar ações (Download, Maximize, Copy) (#20).
- [PENDING] Integração CodeViewer/DiffViewer: Integrar visualizadores onde necessário (#13).
- [PENDING] Conteúdo Real Sidebar: Substituir placeholders (Project Files, Settings) (#14).
- [PENDING] Implementar Logging/Feedback UI: Adicionar logs e feedback visual (#22).
- [PENDING] Integrar PromptOptimizer: Adicionar gatilho e controlar modal (#12).

---

## Fase 6: Animações e Polimento Visual
**Objetivo:** Adicionar animações e refinamentos visuais.

- [DONE] Integrar Componentes Animados: Usar AnimatedDiv, AnimatedButton, etc. (#28).
- [PENDING] Animações de Estado/Contínuas: Aplicar animações (estado, subtlePulse) (#29, #5 anterior).
- [PENDING] Opcional: Refinamentos Visuais: Adicionar detalhes (reflexos, gradientes) (#31).

---

## Fase 7: Desktop Shell
**Objetivo:** Implementar funcionalidades específicas da versão desktop.

- [PENDING] Gerenciamento Multi-Janela: Implementar (#32).
- [PENDING] Persistência de Estado Shell: Implementar (#33).
- [PENDING] Layouts/Temas Shell: Adicionar suporte (#34).

---

## Fase 8: Testes e QA
**Objetivo:** Garantir qualidade, estabilidade e performance.

- [PENDING] Testes Unitários: Desenvolver (#39).
- [PENDING] Testes de Integração: Desenvolver (#40).
- [PENDING] Testes Funcionais: Desenvolver (#41).
- [PENDING] Testar Performance Animações: Avaliar fluidez (#42).
- [PENDING] Revisão Visual: Verificar consistência UI/UX (#43).
- [PENDING] Monitorar Console: Verificar erros/avisos (#44).

---

## Fase 9: Segurança, Documentação e Extras
**Objetivo:** Adicionar camadas finais.

- [PENDING] Implementar Autenticação: Adicionar para IPC/WebSocket (#45).
- [PENDING] Opcional: Conexões SVG Dinâmicas: Implementar se necessário (#46).
- [PENDING] Criar Documentação: Documentar APIs, interfaces, etc. (#47).

---

### 📋 Resumo Detalhado da Conversa Recente (Sessão Atual - Foco em Conectividade e Correção de Erros)

**Objetivo Principal:** Diagnosticar e corrigir erros que impediam a funcionalidade básica da aplicação, com foco na comunicação Frontend-Backend, e preparar o terreno para testes mais aprofundados das funcionalidades de agente.

1.  **Diagnóstico Inicial e Correção de Erro `POST /api/sessions 405`:**
    *   **Problema:** A criação de novas sessões no frontend falhava com um erro 405 (Method Not Allowed).
    *   **Causa Raiz:** O payload enviado pelo frontend (`{ agentType, modelId }`) não correspondia ao esperado pelo `CreateSessionDto` do backend (`{ title?, initialContext? }`).
    *   **Solução Implementada (Backend):**
        *   Modificado `backend/src/session/dto/create-session.dto.ts`: Adicionados campos opcionais `agentType: string` e `modelId: string`.
        *   Modificado `backend/src/database/entities/session.entity.ts`: Adicionadas colunas `agentType` e `modelId` (ambas `string`, `nullable`).
        *   Modificado `backend/src/session/session.service.ts`: Atualizada a função `createSession` para utilizar os novos campos do DTO ao criar a `SessionEntity`.
    *   **Instrução ao Usuário:** Atualizar a estrutura do banco de dados (via migrações TypeORM ou `synchronize: true` em desenvolvimento) e reiniciar o servidor backend.

2.  **Diagnóstico e Correção de Falha na Conexão WebSocket:**
    *   **Problema:** Após a correção do erro 405, o console do frontend mostrava repetidos erros `WebSocket connection to 'ws://localhost:3000/socket.io/?EIO=4&transport=websocket' failed:`.
    *   **Investigação:**
        *   Análise do `backend/src/websocket/websocket.gateway.ts` revelou que o gateway WebSocket estava configurado para o path `'/ws'` (`@NestWebSocketGateway({ path: '/ws', ... })`).
        *   O cliente Socket.IO no frontend tentava conectar-se ao path padrão `'/socket.io/'`.
    *   **Localização da Configuração do Cliente:**
        *   Identificado que `frontend/src/services/agent-api.service.ts` utiliza `useWebSocket` de `frontend/src/services/websocket.service.ts`.
        *   Em `websocket.service.ts`, a inicialização do cliente (`io(wsUrl, { ... })`) não especificava um `path` customizado.
    *   **Solução Implementada (Frontend):**
        *   Modificado `frontend/src/services/websocket.service.ts`: Adicionada a opção `path: '/ws'` na chamada de `io()` para alinhar com a configuração do backend:
            ```typescript
            const newSocket = io(wsUrl, {
              path: '/ws', // Especifica o caminho customizado
              transports: ['websocket'],
              reconnection: false,
            });
            ```

3.  **Estado Atual e Próximos Passos Imediatos:**
    *   **PENDENTE (Ação do Usuário):** Testar a aplicação frontend para verificar se a alteração do `path` do WebSocket em `websocket.service.ts` resolveu os erros de conexão.
    *   Se a conexão WebSocket for bem-sucedida, a próxima tarefa é continuar a **Prioridade 1: Conectividade e Funcionalidade Essencial**, com foco em conectar os componentes da UI aos seus respectivos serviços (ex: `FileTreePanel` ao `useFileSystemService`).
    *   Investigar e resolver quaisquer novos erros de runtime que possam surgir.

**Raciocínio Aplicado (Ω):**
*   **Dedutivo e Analítico:** Análise de logs de erro, código backend e frontend para identificar causas raiz.
*   **Procedural:** Aplicação de correções passo a passo em DTOs, Entidades, Serviços e configurações de cliente.
*   **Skeptical (Ω.modes):** Questionamento das configurações padrão do Socket.IO até encontrar a discrepância de path.

**Diagnóstico (Ξ):**
*   Identificada falha de comunicação REST (405) devido a DTO incompatível.
*   Identificada falha de comunicação WebSocket devido a mismatch de path entre cliente e servidor.

**Padrões Capturados (Λ) / Abstrações Derivadas (Φ):** N/A para esta sessão de debugging focada.

### Sessão Atual: Análise e Refatoração Detalhada do Frontend

**Sumário da Sessão:**

Esta sessão foi dedicada a uma análise completa e refatoração da pasta `/frontend` para corrigir erros, inconsistências e otimizar a configuração e estrutura do código.

**Principais Atividades e Correções no Frontend:**

1.  **Configuração do Projeto (`package.json`, Vite, TypeScript, ESLint, Tailwind):**
    *   Movida a dependência `uuid` e `@types/uuid` de `devDependencies` para `dependencies` no `package.json`.
    *   Adicionadas dependências ausentes ao `package.json`: `@fontsource/inter`, `@fontsource/jetbrains-mono`, `remark-math`, `rehype-katex`, `react-window`, `react-virtuoso`.
    *   `vite.config.ts` atualizado: alias `@lib/*` adicionado; estratégia de `manualChunks` aprimorada (incluindo novas dependências) e plugin `rollup-plugin-visualizer` integrado condicionalmente (via `ANALYZE_BUNDLE=true`). Arquivo `vite.config.optimized.ts` removido por redundância.
    *   Confirmado que as fontes (`@fontsource/*`) são importadas em `main.tsx` e agora serão corretamente empacotadas.
    *   Configurações `tsconfig.json`, `.eslintrc.js`, `tailwind.config.js`, `postcss.config.js` revisadas e consideradas adequadas.
    *   `index.html` revisado; observação para substituir o favicon padrão.

2.  **Estrutura e Código Fonte (`src/`):
    *   `main.tsx`: Ponto de entrada revisado e considerado limpo.
    *   `App.tsx`: Removido `RootProvider` redundante. Consolidada a importação de CSS global, removendo `index.css` e movendo seus estilos e diretivas Tailwind para `globals.css`.
    *   `globals.css`: Tornou-se o único arquivo CSS global principal, incorporando estilos de base, componentes e utilitários do antigo `index.css`, e resolvendo conflitos de estilos (scrollbar, body, fontes de código).
    *   `RootProvider.tsx`: Ordem dos providers verificada, comentário interno corrigido.
    *   `ThemeProvider.tsx`: Lógica de detecção e persistência de tema (light/dark/system) refinada para maior robustez e clareza.
    *   `UIContextManager.tsx`: Estrutura de gerenciamento de contextos de UI modulares (`SidebarUIContext`, `EditorUIContext`, `PanelUIContext`) considerada bem estruturada.
    *   `SidebarUIContext.tsx`: Adicionado painel `'terminal'` ao estado inicial para consistência com `PanelId` type.
    *   `WorkspaceContext.tsx` (Análise e Correções Iniciais):
        *   Corrigida a busca de nó pai em `deleteFile` (usar path em vez de ID para lookup inicial).
        *   Implementada e memoizada a função `getFileTree` para construir uma árvore hierárquica (`TreeFileNode[]`) a partir do estado plano `files`, incluindo ordenação.
        *   Adicionada action `SET_ROOT_DIRECTORY` para desacoplar o setup do diretório raiz da action `SET_WORKSPACE`.
        *   Corrigida chamada para `fileSystemService.saveFile` (era `writeFile`) e o payload de `options`.
        *   Corrigido uso de `dirty: boolean` (em vez de `isDirty`) ao chamar `updateTab` do `UIStateContext`.
        *   Tipados os erros em blocos `catch` para `error: any` para compatibilidade com `errorManager`.
        *   Identificada a necessidade de substituir `loadMockFiles` e outras operações de arquivo mock por chamadas reais ao `fileSystemService`.
        *   Identificada a necessidade de sincronização bidirecional de abas entre `WorkspaceContext` e `EditorUIContext`.
    *   `agent-api.service.ts`:
        *   Corrigido payload da função `createSession` para incluir `agentType` e `modelId`.
        *   Identificada ausência crítica de definições de tipos e métodos para **operações de trigger** de agentes (e.g., `TriggerTestGenerationPayload`, `triggerTestGeneration()`).
        *   Identificada necessidade de clarificar como os resultados de triggers (via WebSocket) são recebidos e propagados para `AgentContext`.
    *   `AgentContext.tsx`:
        *   Adicionado comentário proeminente sobre os placeholders de tipos de trigger devido à ausência no `agent-api.service.ts`.
        *   Chamadas para `getSessionById` e `createSession` validadas contra a interface do serviço.
        *   Identificada a necessidade de substituir `mockAvailableModels` por uma chamada de API.
        *   Identificada a necessidade de refatorar `updateSession` para usar `agentApiService.updateSession`.
        *   Identificada a necessidade de implementar chamadas reais de trigger e tratamento de seus resultados via WebSocket.

**Estado Atual do Frontend:**
*   Configurações de build, linting e estilo estão mais robustas e consistentes.
*   Gerenciamento de CSS global foi unificado.
*   Principais contextos de UI e estado (`Theme`, `SidebarUI`, `UIContextManager`) foram revisados e refinados.
*   `WorkspaceContext` teve correções importantes e uma implementação funcional de `getFileTree`, mas ainda depende de dados mock para operações de arquivo.
*   `AgentContext` está funcional para operações básicas de sessão, mas as funcionalidades de trigger de agentes estão bloqueadas pela ausência de definições e implementações no `agent-api.service.ts`.

**Próximos Passos Imediatos para o Frontend (se o foco permanecer aqui):**
1.  **Resolver o GAP CRÍTICO no `agent-api.service.ts`:** Definir e implementar os tipos e métodos para todas as operações de trigger de agentes, incluindo o manejo de seus resultados (provavelmente via WebSocket).
2.  **Integrar `WorkspaceContext` com `fileSystemService` real:** Substituir `loadMockFiles` e outras operações de arquivo mock por chamadas reais, incluindo o carregamento da estrutura de arquivos e conteúdo.
3.  **Implementar sincronização bidirecional de abas** entre `WorkspaceContext` e `EditorUIContext`.
4.  Substituir `mockAvailableModels` em `AgentContext` por chamada de API.
