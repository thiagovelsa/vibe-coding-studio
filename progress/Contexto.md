# VibeForge: Contexto Detalhado do Sistema (Sessão Atual)

**Última Atualização:** (Data da Sessão Atual)

**ATENÇÃO NOVO MEMBRO DA EQUIPE / PRÓXIMO AGENTE IA:** Este documento é sua fonte **PRIMÁRIA** de informação para entender o estado atual do projeto VibeForge. Leia-o CUIDADOSAMENTE antes de prosseguir. Ele detalha a arquitetura, componentes chave, estado de desenvolvimento e próximos passos CRÍTICOS.

---

## 1. 🚀 Visão Geral do Projeto VibeForge

O VibeForge é um IDE Inteligente em desenvolvimento, projetado para otimizar o fluxo de trabalho de desenvolvimento de software através da colaboração sinérgica entre desenvolvedores humanos e múltiplos Agentes de IA especializados. O objetivo é criar um ambiente onde a IA auxilie ativamente em todas as fases do desenvolvimento, desde a análise de requisitos e design até a codificação, testes, segurança e documentação.

---

## 2. 🏛️ Arquitetura Geral do Sistema

O VibeForge é estruturado como um **MONOREPO** contendo três componentes principais:

1.  **Backend (NestJS):**
    *   **Linguagem/Framework:** TypeScript, NestJS.
    *   **Responsabilidades:** Orquestração de Agentes de IA, gerenciamento de sessões de chat e workflows, interação com Modelos de Linguagem Grandes (LLMs), persistência de dados, e comunicação em tempo real com o frontend.
    *   **API:** Expõe endpoints RESTful (para operações CRUD em sessões, mensagens, etc.) e uma interface WebSocket (para comunicação bidirecional em tempo real, status de agentes, triggers).
    *   **Banco de Dados:** PostgreSQL (via TypeORM) para persistência de entidades como `SessionEntity` (sessões de chat/workflow) e `ChatMessageEntity` (mensagens individuais).
    *   **Módulos Chave:**
        *   `OrchestratorService`: O cérebro do backend. Gerencia o fluxo de trabalho entre diferentes agentes de IA, o estado da sessão (`orchestratorState` em `SessionEntity`), e a transição entre agentes baseada nas respostas e no contexto.
        *   `Agents` (Product, Coder, Tester, Security, etc.): Módulos contendo a lógica específica de cada agente, incluindo a formatação de prompts (arquivos `.hbs`), interação com o `LlmService`, e processamento de respostas para gerar saídas estruturadas (JSON) ou Markdown.
        *   `LlmService`: Abstrai a comunicação com diferentes LLMs, permitindo a troca de modelos e provedores.
        *   `SessionService`: Gerencia o ciclo de vida das sessões de usuário, incluindo criação, recuperação, atualização e deleção.
        *   `WebSocketGateway`: Implementa a comunicação via Socket.IO, lidando com conexões de clientes, subscrição a eventos, e broadcasting de atualizações. Configurado no path `/ws`.
        *   `DatabaseModule`: Configura a conexão com o banco de dados e registra as entidades TypeORM.

2.  **Frontend (React/Vite):**
    *   **Linguagem/Frameworks:** TypeScript, React, Vite (para build e desenvolvimento).
    *   **Estilização:** TailwindCSS, com foco em um design moderno de "Glasmorfismo" (efeitos de vidro, blur, transparência).
    *   **Gerenciamento de Estado:** Múltiplos Contextos React para gerenciar diferentes aspectos do estado da aplicação de forma modular.
    *   **Responsabilidades:** Interface do usuário principal do IDE, visualização de chats, código, fluxos de agentes, interação com o backend via API REST e WebSockets, e renderização de componentes interativos.
    *   **Comunicação com Backend:**
        *   `axios` (via `api.service.ts`) para chamadas REST.
        *   `socket.io-client` (via `websocket.service.ts`, configurado para o path `/ws`) para comunicação WebSocket.

3.  **Desktop Shell (Electron - Menos Foco Recente):**
    *   **Framework:** Electron.
    *   **Responsabilidades:** Empacotar a aplicação web frontend em uma aplicação desktop nativa, permitindo acesso ao sistema de arquivos local e outras funcionalidades específicas do desktop (via IPC - Inter-Process Communication).
    *   **Status:** A integração e funcionalidades específicas do Electron não foram o foco principal das sessões de desenvolvimento mais recentes, que se concentraram na estabilização do core Backend/Frontend.

---

## 3. 🔄 Fluxo de Dados e Interações Principais

*   **Criação de Sessão:** Usuário no frontend (via `Sidebar` ou `ActivityBar`) inicia uma nova sessão de chat. O `AgentContext` chama `agentApiService.createSession`, que faz uma requisição `POST /api/sessions` ao backend. O `SessionService` cria uma nova `SessionEntity` no banco.
*   **Envio de Mensagem:** Usuário envia uma mensagem no chat. Frontend envia a mensagem via WebSocket (ou REST) ao backend. O `OrchestratorService` recebe a mensagem, atualiza o histórico da sessão, seleciona o agente apropriado, e inicia o processamento.
*   **Processamento pelo Agente:** O agente selecionado formata um prompt (usando templates `.hbs` e contexto da sessão/histórico/input do usuário), envia ao `LlmService`, e recebe a resposta do LLM. O agente processa a resposta, extrai dados estruturados (JSON) ou formata como Markdown, e retorna um `AgentResponse`.
*   **Orquestração e Transição:** O `OrchestratorService` analisa o `AgentResponse`. Se a tarefa estiver concluída ou um novo agente for necessário, ele atualiza o `orchestratorState` da sessão e pode disparar o próximo agente no fluxo.
*   **Atualizações em Tempo Real:** O `WebSocketGateway` envia atualizações para o frontend sobre o status dos agentes, novas mensagens, resultados de triggers, etc.
*   **Triggers Manuais:** O frontend (via botões em `ChatMessageBubble`) pode enviar mensagens WebSocket (`trigger:testGeneration`, etc.) para o `WebSocketGateway`. O gateway busca o contexto necessário de mensagens anteriores no banco de dados e invoca métodos públicos no `OrchestratorService` para executar ações específicas.
*   **Persistência:** Todas as sessões e mensagens de chat são persistidas no banco de dados PostgreSQL pelo `SessionService` e `ChatMessageRepository`. O `orchestratorState` também é salvo na `SessionEntity`.

---

## 4. 💻 Estado Detalhado do Frontend

O frontend do VibeForge é uma aplicação React complexa que utiliza o Context API extensivamente para gerenciamento de estado.

### 4.1. Principais Contextos React:

*   **`AgentContext` (`frontend/src/context/AgentContext.tsx`):**
    *   Gerencia o estado global relacionado aos agentes e sessões de chat ativas.
    *   Lida com a criação de novas sessões, carregamento de sessões existentes, envio de mensagens, e disparo de "triggers" (ações especiais dos agentes).
    *   Interage com `agent-api.service.ts` para chamadas de API e WebSocket.
    *   Mantém o estado de `availableModels`, `selectedModelId`, `activeChatSessionId`.
    *   Implementa um mecanismo de `registerSessionListUpdaters` para permitir que o `SessionListContext` registre callbacks para atualizar sua própria lista quando o `AgentContext` realiza operações (quebra de dependência circular).
*   **`SessionListContext` (`frontend/src/context/SessionListContext.tsx`):**
    *   Responsável por buscar e gerenciar a lista de TODAS as sessões de chat do usuário.
    *   Exibe a lista de sessões no `SessionListPanel` da `Sidebar`.
    *   Registra callbacks (`addSessionToList`, `updateSessionInList`, etc.) com o `AgentContext`.
*   **`UIStateContext` (`frontend/src/context/ui/UIContextManager.tsx` e `reducers`):**
    *   Gerencia o estado da UI global, como visibilidade e tamanho de painéis, tema (claro/escuro), estado das abas (quais estão abertas, qual está ativa).
    *   Permite o redimensionamento dinâmico dos painéis (`PanelGroup`, `Panel`).
*   **`WorkspaceContext` (`frontend/src/context/WorkspaceContext.tsx`):**
    *   Gerencia o estado do workspace do usuário, incluindo o caminho do diretório raiz, a lista de arquivos abertos, o conteúdo do arquivo ativo, e o estado "dirty" (modificado mas não salvo) de arquivos.
    *   Interage com `useFileSystemService` (que por sua vez usa IPC para o Desktop Shell ou uma API mock/real para a versão web) para operações de sistema de arquivos.
*   **`ProblemsContext` (`frontend/src/context/ProblemsContext.tsx`):**
    *   Gerencia a lista de problemas, erros de linter, ou outras diagnósticos que devem ser exibidos no `ProblemsPanel`.

### 4.2. Componentes Chave e Funcionalidades (Foco no que foi trabalhado):

*   **`AppLayout.tsx`:** Estrutura principal da aplicação usando `react-resizable-panels` para um layout com painéis redimensionáveis (Sidebar, Área Principal, Painel Inferior).
*   **`MainContentArea.tsx`:** Área central que utiliza Headless UI Tabs para exibir diferentes tipos de conteúdo (sessões de chat, visualizador de código, visualizador de fluxo de agentes).
*   **`ActivityBar.tsx`:** Barra lateral esquerda com ícones para ações rápidas como iniciar um novo chat, alternar tema, etc. (Estilizada com Glasmorfismo).
*   **`Sidebar.tsx`:** Painel lateral direito, também com Glasmorfismo, contendo múltiplos sub-painéis colapsáveis:
    *   `AgentSelectionPanel.tsx`: Permite ao usuário selecionar o tipo de agente para uma nova sessão de chat. (Estilizado com Glasmorfismo).
    *   `ModelSelector.tsx` (Dentro da Sidebar): Permite selecionar o modelo de IA para a sessão. (Estilizado com Glasmorfismo).
    *   `FileTreePanel.tsx`: Contém `OptimizedFileExplorer.tsx`, que usa `VirtualizedFileTree.tsx` (com `react-virtuoso`) para exibir a árvore de arquivos do workspace. (Estilizado com Glasmorfismo; **TRABALHO RECENTE E PENDENTE PARA CONECTAR COMPLETAMENTE AO `useFileSystemService`**).
    *   `SessionListPanel.tsx`: Exibe a lista de sessões de chat do `SessionListContext`.
    *   `SettingsPanel.tsx`: Placeholder para configurações.
*   **`CodeViewer.tsx`:** Componente baseado no Monaco Editor para visualização e **EDIÇÃO** de código. Suporta temas customizados (ex: `vibe-glass-theme`), syntax highlighting, e ações como copiar/download.
*   **`ChatMessageBubble.tsx`:** Renderiza mensagens individuais no chat, incluindo blocos de código (usando `CodeViewer`), markdown, e botões de AÇÃO para triggers manuais (ex: "Gerar Testes", "Analisar Segurança").
*   **`AgentCollaborationPanel.tsx`:** O painel principal para interação de chat com os agentes. Inclui o input de mensagem, a lista de mensagens (`ChatMessageBubble`), e a lógica para exibir feedback de triggers (toasts, mensagens de sistema).
*   **`AgentFlowVisualizer.tsx`:** (Menos foco recente) Painel para visualizar o fluxo de trabalho entre agentes usando `reactflow`.
*   **`ProblemsPanel.tsx`:** Painel inferior para exibir erros e avisos.
*   **`CommandPalette.tsx`:** Paleta de comandos (acessível via Ctrl+Shift+P ou similar) usando `cmdk` para acesso rápido a funcionalidades.

### 4.3. Estilização:

*   **Glasmorfismo:** Aplicado consistentemente em componentes como `Sidebar`, `ActivityBar`, `MainContentArea` (abas), `CollapsibleSection` usando TailwindCSS para fundos translúcidos (`bg-opacity`), blur (`backdrop-blur`), e bordas sutis.
*   **Tema:** Suporte a temas claro/escuro. Tema customizado `vibe-glass-theme` para o Monaco Editor.
*   **TailwindCSS:** Utilizado extensivamente para todas as estilizações.

---

## 5. 🛠️ Estado Atual do Desenvolvimento e Correções Recentes

O projeto passou por um extenso período de refatoração e correção de bugs para estabilizar a comunicação entre o frontend e o backend, e para refinar a lógica de interação dos agentes.

### 5.1. Fases de Desenvolvimento (Conforme `progress.md`):
*   As fases iniciais cobrindo a fundação do backend, layout do frontend, e estilização base foram majoritariamente concluídas.
*   Funcionalidades chave como chat multi-sessão, edição de código no `CodeViewer`, fluxo básico de orquestração de agentes, histórico de sessões, e paleta de comandos foram implementadas.

### 5.2. MARATONA RECENTE DE DEBUGGING E REATORAÇÃO (FOCO DA SESSÃO ANTERIOR):

1.  **Erro `POST /api/sessions 405 (Method Not Allowed)**:
    *   **CAUSA:** Incompatibilidade entre o payload enviado pelo frontend e o `CreateSessionDto` esperado pelo backend na criação de novas sessões.
    *   **SOLUÇÃO (Backend):**
        *   `CreateSessionDto` atualizado para aceitar `agentType` e `modelId`.
        *   `SessionEntity` atualizada com as colunas correspondentes.
        *   `SessionService` atualizado para usar os novos campos.
    *   **AÇÃO DO USUÁRIO:** Atualizar schema do DB e reiniciar backend.

2.  **Falha na Conexão WebSocket (`ws://localhost:3000/socket.io/` falhando):**
    *   **CAUSA:** O backend `WebSocketGateway` estava configurado no path `/ws`, enquanto o cliente `socket.io-client` no frontend tentava o path padrão `/socket.io/`.
    *   **SOLUÇÃO (Frontend):**
        *   Identificado que `frontend/src/services/websocket.service.ts` inicializa o cliente Socket.IO.
        *   Modificada a chamada `io()` em `websocket.service.ts` para incluir `{ path: '/ws', ... }`.

3.  **Outras Correções de Build e Linter (Resumo de sessões anteriores, mas relevantes para o estado estável):**
    *   Resolvidos múltiplos erros de "No matching export", "Multiple exports with the same name".
    *   Corrigidas importações (`classNames` -> `cn`, caminhos de componentes).
    *   Corrigido erro `process is not defined` no `api.service.ts` (usando `import.meta.env.VITE_API_URL`).
    *   Resolvida dependência circular entre `AgentContext` e `SessionListContext` através do padrão de registro de callbacks.
    *   Corrigidos erros de hooks (`useAgentContext must be used within an AgentProvider`, etc.) ajustando a ordem dos providers em `RootProvider.tsx`.

---

## 6. 🎯 PRÓXIMOS PASSOS IMEDIATOS E PRIORIDADES (TAREFA CRÍTICA ATUAL!)

A estabilização da comunicação básica é PARAMOUNT.

1.  **PRIORIDADE ZERO (AÇÃO IMEDIATA DO USUÁRIO / PRÓXIMO AGENTE):**
    *   **TESTAR A CORREÇÃO DA CONEXÃO WEBSOCKET:**
        *   **AÇÃO:** O usuário (ou o próximo agente IA, se assumindo o controle) DEVE rodar o frontend (após as modificações no `websocket.service.ts` e as correções no backend para o erro 405 terem sido aplicadas e o backend reiniciado).
        *   **VERIFICAR:** Observar o console do navegador. Os erros `WebSocket connection to 'ws://localhost:3000/socket.io/' failed:` NÃO DEVEM MAIS APARECER. Idealmente, deve haver logs indicando uma conexão bem-sucedida ao path `/ws`.
        *   **REPORTAR:** O resultado deste teste é CRUCIAL para os próximos passos.

2.  **SE A CONEXÃO WEBSOCKET ESTIVER OK (Após confirmação do Ponto 1):**
    *   **CONTINUAR COM A PRIORIDADE 1: Conectividade e Funcionalidade Essencial da UI.**
    *   **TAREFA IMEDIATA PENDENTE:**
        *   **Conectar `FileTreePanel` ao `useFileSystemService`:**
            *   **FOCO:** O componente `OptimizedFileExplorer.tsx` (dentro de `FileTreePanel.tsx`) precisa ser completamente funcional, buscando a estrutura de diretórios e o conteúdo dos arquivos através do `useFileSystemService`.
            *   **AÇÕES:**
                *   Revisar a integração atual do `useFileSystemService` dentro de `OptimizedFileExplorer.tsx` e `VirtualizedFileTree.tsx`.
                *   Garantir que as chamadas para listar diretórios e ler arquivos estão sendo feitas corretamente.
                *   Assegurar que o estado de carregamento (`loading`), erros, e a árvore de arquivos renderizada reflitam o estado real do sistema de arquivos (via IPC no Electron ou API mock/real).
                *   Verificar a funcionalidade de seleção de arquivo e como ela propaga o arquivo selecionado para outros contextos (ex: `WorkspaceContext` para abrir em uma aba no `CodeViewer`).

3.  **APÓS A CONEXÃO DO `FileTreePanel`:**
    *   **Revisar e Conectar Outros Componentes da UI:** Sistematicamente verificar outros componentes da UI que ainda possam estar usando dados mock ou que não estão totalmente conectados aos seus respectivos serviços ou contextos.
    *   **Testes Funcionais Leves:** Realizar testes manuais das funcionalidades básicas (criar sessão, enviar mensagem, ver resposta do agente, abrir arquivo, etc.) para identificar quaisquer regressões ou novos problemas de runtime.

4.  **Investigar Erro do Service Worker (Prioridade Menor, se não for bloqueante):**
    *   O erro `sw.js:52 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported` ainda aparece nos logs. Se não estiver impedindo o desenvolvimento das funcionalidades principais, pode ser investigado posteriormente.

---

## 7. ⚠️ Desafios e Pontos de Atenção

*   **Complexidade do Estado Frontend:** Gerenciar o estado entre múltiplos contextos React requer cuidado para evitar loops de dependência e garantir a propagação correta das atualizações.
*   **Estabilidade da Conexão WebSocket:** Garantir que a conexão seja robusta, com reconexão apropriada e tratamento de erros.
*   **Integração Backend-Frontend:** Manter a sincronia dos DTOs, payloads de API, e formatos de mensagem WebSocket é crucial.
*   **Performance do Frontend:** Com muitos componentes e estado, monitorar a performance, especialmente com listas virtualizadas e o editor Monaco.

---

**Este documento DEVE ser a sua referência principal. Boa sorte, e vamos fazer o VibeForge brilhar!**

### Atualização de Contexto da Sessão Atual: Análise e Refatoração do Frontend

**Foco da Sessão:**
A sessão foi inteiramente dedicada a uma análise profunda e refatoração do código-fonte e configurações do frontend (`/frontend`). O objetivo era corrigir erros, melhorar a estrutura, otimizar configurações de build e alinhar o código com as melhores práticas e as dependências corretas.

**Estado Atual do Projeto:**

*   **Backend (NestJS):**
    *   **Compilação:** Compila com sucesso.
    *   **Runtime:** Permanece o erro crítico de injeção de dependência (`EventSubscribersLoader` / `ModuleRef` / `EventEmitterModule`). O backend não está operacional.
    *   A resolução deste erro é um pré-requisito para testar qualquer funcionalidade que dependa do backend (incluindo WebSockets e a API de agentes).

*   **Frontend (React/Vite):**
    *   **Configurações (`package.json`, Vite, TSConfig, ESLint):**
        *   Dependências corrigidas e adicionadas em `package.json`.
        *   Configuração do Vite (`vite.config.ts`) otimizada e unificada.
        *   Outras configurações (`tsconfig.json`, `.eslintrc.js`, etc.) revisadas.
    *   **Estrutura CSS:**
        *   CSS global unificado em `globals.css`, com `index.css` removido.
    *   **Contextos e Estado Global:**
        *   `ThemeProvider`: Lógica de tema (light/dark/system) aprimorada.
        *   `SidebarUIContext`: Atualizado com painel 'terminal'.
        *   `WorkspaceContext`: Diversas correções e melhorias, incluindo `getFileTree` funcional. Persiste a dependência de mocks para operações de arquivo. Identificada a necessidade de integração com `fileSystemService` e sincronização de abas com `EditorUIContext`.
        *   `agent-api.service.ts`: Identificado um **GAP CRÍTICO** na definição de tipos e implementação de funções para **triggers de agentes**. O payload de `createSession` foi corrigido.
        *   `AgentContext`: Funcional para operações básicas de sessão, mas as funcionalidades avançadas de trigger de agentes estão bloqueadas pelo GAP no `agent-api.service.ts`. Comentários foram adicionados para destacar os placeholders.
    *   **Conectividade:** O problema original de WebSocket (falha na conexão `ws://localhost:3000/ws/`) não pôde ser testado devido ao erro de runtime do backend.

**Bloqueios Principais:**
1.  **Erro de DI no Backend:** Impede o backend de iniciar e, consequentemente, bloqueia o teste de funcionalidades de frontend que dependam dele (API de agentes, WebSocket).
2.  **Ausência de Implementação de Triggers no `agent-api.service.ts`:** Impede o `AgentContext` no frontend de interagir plenamente com as capacidades avançadas dos agentes.

**Próximos Passos Sugeridos (Geral):**
1.  **Prioridade Máxima:** Resolver o erro de injeção de dependência no backend NestJS para habilitar o servidor.
2.  **Após Backend Funcional:**
    *   Implementar as definições de tipos e métodos para os triggers de agentes em `frontend/src/services/agent-api.service.ts` e integrá-los ao `AgentContext.tsx`.
    *   Conectar `WorkspaceContext` ao `fileSystemService` real, eliminando os mocks.
    *   Verificar e corrigir a conexão WebSocket.
    *   Prosseguir com a integração do `FileTreePanel` e outras funcionalidades do frontend.

### Atualização de Contexto da Sessão Atual

**Foco da Sessão:**
A sessão iniciou com os objetivos de verificar a conexão WebSocket e integrar o `FileTreePanel` no frontend. Contudo, a maior parte do tempo foi dedicada à resolução de um grande volume de erros de compilação TypeScript no backend NestJS.

**Estado Atual do Projeto:**

*   **Backend (NestJS):**
    *   **Compilação:** Todos os erros de compilação TypeScript identificados foram corrigidos. O backend agora compila com sucesso.
    *   **Runtime:** Um erro crítico de injeção de dependência impede a inicialização do servidor NestJS: `Nest can't resolve dependencies of the EventSubscribersLoader (...) ModuleRef (...) EventEmitterModule context`. Diversas tentativas de correção foram realizadas (configuração de `EventEmitterModule`, `DiscoveryModule`, verificação de dependências duplicadas, reinstalação de `node_modules`), mas o erro persiste.
    *   A resolução deste erro de DI é o principal bloqueador para o backend.

*   **Frontend (React/Vite):**
    *   As tarefas relacionadas ao WebSocket e ao `FileTreePanel` estão em espera devido aos problemas no backend. A ausência de `socket.io-client` foi corrigida no `package.json` do frontend.

*   **Estrutura do Projeto e Limpeza:**
    *   Foi realizada uma reorganização das pastas de teste, centralizando-as em `tests/` (com subpasta `tests/backend/`).
    *   Arquivos de documentação (`Contexto.md` da raiz, `novo_prompt.md`) foram movidos para a pasta `docs/`.
    *   A pasta `sandbox/` (vazia) foi removida.

**Próximos Passos Críticos:**
1.  **Resolver o erro de injeção de dependência no backend NestJS.** Esta é a prioridade máxima para desbloquear qualquer funcionalidade dependente do backend.
2.  Após a estabilização do backend, retomar a verificação da conexão WebSocket e a integração do `FileTreePanel`.
3.  Continuar a documentação e o rastreamento do progresso. 