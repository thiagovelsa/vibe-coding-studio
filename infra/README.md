# Infraestrutura VibeForge IDE

Este diretório contém arquivos relacionados à infraestrutura do VibeForge IDE, incluindo configurações Docker, scripts de inicialização e schemas de banco de dados.

## Serviços Docker

O VibeForge IDE utiliza os seguintes serviços externos via Docker:

### Ollama

- **Função**: Execução de modelos de IA locais
- **Porto**: 11434
- **Volume**: ollama-data (persistência de modelos)
- **URL API**: http://localhost:11434/api

### ChromaDB

- **Função**: Banco de dados vetorial para armazenamento de embeddings
- **Porto**: 8000
- **Volume**: chroma-data (persistência de dados)
- **URL API**: http://localhost:8000/api/v1

## Inicializando os Serviços

### Windows

```powershell
# Abra o PowerShell como administrador
cd caminho/para/vibeforge
.\infra\start-services.ps1
```

### Linux/Mac

```bash
# Abra o terminal
cd caminho/para/vibeforge
chmod +x ./infra/start-services.sh
./infra/start-services.sh
```

## Banco de Dados

O schema inicial do banco de dados está definido em `infra/db/schema.sql`. Este arquivo contém a definição de:

- **run_history**: Armazena o histórico de execuções de modelos
- **agent_interactions**: Registra interações com agentes de IA

## Solução de Problemas

### Verificando o Status dos Contêineres

```bash
docker ps
```

### Visualizando Logs dos Contêineres

```bash
# Logs do Ollama
docker logs vibeforge-ollama

# Logs do ChromaDB
docker logs vibeforge-chromadb
```

### Reiniciando os Serviços

```bash
docker-compose restart
```

### Parando os Serviços

```bash
docker-compose down
```

## Requisitos

- Docker e Docker Compose instalados
- Portas 11434 e 8000 disponíveis no host 