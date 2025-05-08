# VibeForge IDE

![VibeForge Logo](docs/images/logo.png)

> Uma IDE inteligente de próxima geração para desenvolvimento moderno.

## Visão Geral

O VibeForge é um ambiente de desenvolvimento integrado (IDE) projetado para aumentar a produtividade do desenvolvedor através de recursos de inteligência artificial, análise de código em tempo real e uma interface de usuário altamente personalizável.

## Recursos Principais

- **Assistentes de IA Integrados**: Ajuda contextual, sugestões de código e refatorações inteligentes
- **Análise de Código em Tempo Real**: Detecção de erros, otimizações e melhores práticas
- **Interface Personalizável**: Temas, atalhos e extensões
- **Multi-plataforma**: Suporte para Windows, macOS e Linux
- **Integrações Nativas**: Git, Docker, e ferramentas de CI/CD
- **Extensível**: Ecossistema de plugins para adicionar novas funcionalidades

## Estrutura do Projeto

```
vibe-forge-ide/
├── backend/          # Serviços NestJS
├── desktop-shell/    # Aplicativo Electron
├── frontend/         # Interface React + Vite
├── config/           # Configurações compartilhadas
├── docs/             # Documentação
├── infra/            # Docker e configurações de infraestrutura
├── prompts/          # Templates para agentes IA
├── tests/            # Testes E2E e integração
└── sandbox/          # Scripts de validação
```

## Iniciando

### Pré-requisitos

- Node.js >= 16
- npm >= 8
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/yourusername/vibe-forge-ide.git
cd vibe-forge-ide

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.template .env
# Edite o arquivo .env conforme necessário

# Inicie o ambiente de desenvolvimento
npm run start-dev
```

## Scripts Disponíveis

- `npm run start-dev`: Inicia todos os componentes no modo de desenvolvimento
- `npm run build`: Cria builds de produção para todos os componentes
- `npm run lint`: Executa o linter em todo o código
- `npm run test`: Executa os testes em todos os componentes

## Contribuindo

Por favor, leia o [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Equipe

- [Nome do Criador](https://github.com/username)
- [Contribuidores](https://github.com/yourusername/vibe-forge-ide/contributors)

---

Desenvolvido com ❤️ pelo time VibeForge 