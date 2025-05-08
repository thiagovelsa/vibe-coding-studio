#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando serviços do VibeForge IDE...${NC}"

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker para continuar.${NC}"
    exit 1
fi

# Verificar se o Docker está rodando
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker não está em execução. Por favor, inicie o serviço Docker para continuar.${NC}"
    exit 1
fi

# Verificar se o docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}docker-compose não encontrado. Tentando usar 'docker compose' (Docker CLI plugin)...${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Iniciar os serviços
echo -e "${YELLOW}Iniciando contêineres...${NC}"
$DOCKER_COMPOSE up -d

# Verificar se os contêineres foram iniciados
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao iniciar os contêineres. Verifique o log para mais detalhes.${NC}"
    exit 1
fi

echo -e "${GREEN}Contêineres iniciados com sucesso!${NC}"

# Função para verificar a disponibilidade de um serviço
check_service() {
    local service=$1
    local url=$2
    local max_retries=30
    local retry_count=0
    
    echo -e "${YELLOW}Verificando disponibilidade do serviço $service...${NC}"
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -f $url &> /dev/null; then
            echo -e "${GREEN}Serviço $service está disponível!${NC}"
            return 0
        fi
        
        retry_count=$((retry_count+1))
        echo -e "${YELLOW}Aguardando serviço $service... ($retry_count/$max_retries)${NC}"
        sleep 2
    done
    
    echo -e "${RED}Serviço $service não ficou disponível após $max_retries tentativas.${NC}"
    return 1
}

# Verificar disponibilidade dos serviços
check_service "Ollama" "http://localhost:11434/api/version"
check_service "ChromaDB" "http://localhost:8000/api/v1/heartbeat"

echo -e "${GREEN}Todos os serviços estão disponíveis!${NC}"
echo -e "${GREEN}Ambiente de desenvolvimento VibeForge pronto para uso.${NC}" 