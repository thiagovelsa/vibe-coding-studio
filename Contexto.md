# 🚀 PROJETO VIBEFORGE - CONTEXTO COMPLETO

## 📋 VISÃO GERAL DO PROJETO

O VibeForge é um IDE inteligente com agentes especializados de IA que colaboram para melhorar o fluxo de desenvolvimento de software. Os agentes analisam requisitos, geram código, criam testes automatizados e verificam segurança, funcionando como parceiros de programação.

### 🏗️ ARQUITETURA GERAL

O projeto segue uma arquitetura de monorepo com três componentes principais:

1. **Backend (NestJS):** Gerencia sessões, orquestração de agentes, comunicação com LLMs
2. **Frontend (React/Vite):** Interface similar a VSCode com painel de chat, editor, tree view
3. **Desktop Shell (Electron):** Integração com sistema operacional, comunicação IPC

## 💾 DETALHES DA IMPLEMENTAÇÃO

### 📱 FRONTEND

#### 🧩 Estrutura de Componentes

- **AppLayout:** Componente principal com layout completo (sidebar, editor, painéis)
- **Sidebar:** Gerencia navegação principal, tree view, seleção de agentes, histórico de sessões
- **MainContentArea:** Área principal para edição e visualização, com abas e sistemas de painéis
- **AgentCollaborationPanel:** Interface de chat para interagir com agentes
- **AgentFlowVisualizer:** Visualiza fluxo de agentes usando reactflow
- **CommandPalette:** Paleta de comandos acessível via Ctrl+Shift+P (usando cmdk)
- **ProblemsPanel:** Exibe erros e avisos gerados pelos agentes
- **BottomPanel:** Painel inferior com terminal, problemas, mais...

#### 🔄 Gerenciamento de Estado (Context API)

O frontend usa React Context API com otimizações importantes:

1. **Context Splitting:** Dividindo contextos monolíticos em específicos:
   - `UIState` → `SidebarUIContext`, `EditorUIContext`, `PanelUIContext`, `UIContextManager`
   - Mantém compatibilidade via adapter pattern no `UIStateContext` original

2. **Compound Reducers:** Redutores específicos por domínio:
   - `AgentContext` → `sessionReducer`, `modelReducer`, `errorReducer`, `triggerReducer`
   - Combinados via `rootReducer` para organização e manutenção otimizadas

3. **Contextos Principais:**
   - `AgentContext`: Gerencia sessões e agentes (agora usando compound reducers)
   - `ActiveChatContext`: Gerencia estado da sessão de chat ativa
   - `WorkspaceContext`: Gerencia arquivos, estado dirty, operações de FS
   - `UIContextManager`: Coordena estados da UI (sidebar, editor, painéis)
   - `ProblemsContext`: Rastreia e gerencia problemas/erros
   - `SessionListContext`: Gerencia lista completa de sessões

#### 🛠️ Serviços

- `agent-api.service.ts`: Comunicação com API REST e WebSocket do backend
- `file-system.service.ts`: Comunicação com sistema de arquivos via IPC
- `workspace.service.ts`: Gerenciamento do workspace atual
- Estruturas específicas para diferentes necessidades (desktop, testes, etc.)

### 🔙 BACKEND

#### 🧠 Fluxo de Funcionamento

1. **REST API (NestJS):**
   - Endpoints para gerenciar sessões, mensagens, feedback
   - Controllers (`SessionController`, etc.) delegam para serviços

2. **Orquestração:**
   - `OrchestratorService`: Coração do backend
   - Gerencia estado das sessões (`orchestratorState`)
   - Direciona mensagens para agentes apropriados
   - Rastreia fluxo de processamento (útil para `AgentFlowVisualizer`)

3. **Agentes Especializados:**
   - `CoderAgentService`: Gera/modifica código
   - `TestAgentService`: Gera testes automatizados
   - `SecurityAgentService`: Analisa problemas de segurança
   - `ProductAgentService`: Analisa requisitos
   - Todos implementam `AgentInterface` com método `handle()`

4. **LLM Service:**
   - Abstração para diferentes provedores de LLM
   - Carrega prompts usando `PromptLoaderService`
   - Gerencia conversas e parseia respostas JSON estruturadas

5. **Persistência:**
   - PostgreSQL com TypeORM
   - Entidades: `SessionEntity`, `ChatMessageEntity`
   - Suporte a feedback (rating, correction) para refinamento

6. **WebSocket:**
   - Atualização em tempo real de mensagens e estado
   - Notificações de triggers e eventos do orquestrador

### 🖥️ DESKTOP SHELL

- **Electron**: Aplicação nativa multiplataforma
- **IPC**: Comunicação segura entre processos main e renderer
- **File System**: Acesso nativo ao sistema de arquivos
- **Comunicação**: Gerencia processos do backend e frontend

## 🚦 STATUS ATUAL DO PROJETO

### ✅ FASES CONCLUÍDAS

1. **Fase 1 - Setup e Configuração:** ✅ CONCLUÍDA
   - Monorepo configurado
   - Estrutura básica do backend em NestJS
   - Frontend React/Vite com Tailwind
   - Integração Electron inicial

2. **Fase 2 - Core do Backend:** ✅ CONCLUÍDA
   - Serviço Orquestrador
   - Implementação dos Agentes
   - LLM Service e prompts
   - API REST e endpoints básicos

3. **Fase 3 - Layout Frontend:** ✅ CONCLUÍDA
   - AppLayout completo
   - Sistema de painéis e abas
   - Sidebar e navegação 
   - Componentes básicos

4. **Fase 4 - Styling:** ✅ CONCLUÍDA
   - Temas claro/escuro
   - Sistemas de cores consistentes
   - Componentes estilizados
   - Micro-interações

5. **Fase 5 - Editor e Chat:** ✅ CONCLUÍDA
   - CodeViewer editável
   - DiffViewer implementado
   - Chat com suporte a múltiplas sessões
   - Estado 'dirty' para arquivos modificados

6. **Fase 6 - UX Improvements:** ✅ CONCLUÍDA
   - Indicadores de carregamento
   - Painel de problemas
   - Animações e transições
   - Placeholders e estados vazios

7. **Fase 7 - Funcionalidades Avançadas:** ✅ CONCLUÍDA
   - Visualizador de Fluxo de Agentes
   - Histórico de sessões
   - Renomeação e exclusão de sessões
   - Persistência de estado

8. **Fase 8 - Ferramentas:** ✅ CONCLUÍDA
   - Paleta de Comandos
   - Otimização de estado (Context Splitting, Compound Reducers)
   - Suporte a atalhos de teclado
   - Memoização de componentes para melhor performance

### 🔜 PRÓXIMAS FASES (PRIORIDADES)

#### 🔴 Prioridade 1: Conectividade e Funcionalidade Essencial
*Objetivo: Estabelecer comunicação completa entre frontend e backend, exibindo dados reais e habilitando interações principais.*

1. **[PENDING] Conectar Serviços UI:** Ligar componentes da UI aos hooks de serviço (`useAgentApiService`, `useFileSystemService`, etc.)
2. **[PENDING] WebSocket:** Implementar comunicação em tempo real 
3. **[PENDING] Árvore de Arquivos Real:** Popular sidebar com arquivos reais via `FileSystemService`
4. **[PENDING] Lógica da Sidebar:** Implementar interações de arquivos (abrir ao clicar, etc.)
5. **[PENDING] Dados Reais:** Substituir dados placeholder no chat e fluxo

#### 🟠 Prioridade 2: Refinamento da Inteligência e Feedback
*Objetivo: Melhorar qualidade das respostas e feedback ao usuário*

1. **[PENDING] Refinar Prompts:** Aprimorar prompts e lógica de agentes
2. **[PENDING] Logging/Feedback UI:** Adicionar feedback visual detalhado

#### 🟡 Prioridade 3: Testes e Qualidade
*Objetivo: Garantir estabilidade e robustez*

1. **[PENDING] Testes Unitários:** Desenvolver testes para componentes isolados
2. **[PENDING] Testes de Integração:** Testar interação entre módulos
3. **[PENDING] Testes E2E:** Validar fluxos completos

## 🔍 DETALHES TÉCNICOS IMPORTANTES

### 📦 Otimização de Estado

Recentemente implementamos dois padrões importantes:

1. **Context Splitting:** Dividir contextos em subcontextos específicos:
   ```
   UIState (monolítico) → SidebarUIContext + EditorUIContext + PanelUIContext
                        → Coordenados pelo UIContextManager
   ```
   Benefícios: Re-renderizações localizadas, melhor organização do código

2. **Compound Reducers:** Dividir lógica de reducer por domínio:
   ```
   agentReducer (monolítico) → sessionReducer + modelReducer + errorReducer + triggerReducer
                             → Combinados pelo rootReducer
   ```
   Benefícios: Lógica mais fácil de entender e manter, código menos complexo

### 🧩 Padrões Arquiteturais

- **Adapter Pattern:** Mantendo compatibilidade com código existente
- **Observer Pattern:** Comunicação entre contextos via eventos
- **Command Pattern:** Implementado na Paleta de Comandos
- **Composite Pattern:** Estrutura de componentes UI aninhados

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Tarefa Imediata:** Conectar `FileTreeView` da Sidebar ao `FileSystemService` para exibir árvore real
2. **Em seguida:** Implementar funcionalidade de abertura de arquivos ao clicar na árvore
3. **Depois:** Corrigir problemas de conexão WebSocket para atualizações em tempo real

## 📚 RECURSOS E REFERÊNCIAS

- **Repositório:** Monorepo com estrutura de pastas para backend, frontend, desktop-shell
- **Documentação:** Em `docs/` e arquivos README específicos
- **Progresso:** Detalhado em `progress.md` e `progress/*.md`
- **Regras:** Definidas em `.cursor/rules/`

---

**⚠️ IMPORTANTE:** Este documento deve ser mantido atualizado após cada sessão de desenvolvimento. 