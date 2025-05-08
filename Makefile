.PHONY: setup dev build lint test clean docker-build docker-up docker-down services-up services-down services-status dev-with-services

# Configurações
SHELL := /bin/bash
APP_NAME := vibe-forge-ide

# Cores para output
COLOR_RESET = \033[0m
COLOR_GREEN = \033[32m
COLOR_YELLOW = \033[33m
COLOR_CYAN = \033[36m

# Comandos principais
setup:
	@echo -e "$(COLOR_CYAN)Instalando dependências do projeto...$(COLOR_RESET)"
	npm install
	@echo -e "$(COLOR_GREEN)Dependências instaladas com sucesso!$(COLOR_RESET)"
	@echo -e "$(COLOR_YELLOW)Configure o arquivo .env antes de iniciar:$(COLOR_RESET)"
	@echo -e "$(COLOR_YELLOW)cp env.template .env$(COLOR_RESET)"

dev:
	@echo -e "$(COLOR_CYAN)Iniciando ambiente de desenvolvimento...$(COLOR_RESET)"
	npm run start-dev

build:
	@echo -e "$(COLOR_CYAN)Gerando build de produção...$(COLOR_RESET)"
	npm run build

lint:
	@echo -e "$(COLOR_CYAN)Executando linter...$(COLOR_RESET)"
	npm run lint

test:
	@echo -e "$(COLOR_CYAN)Executando testes...$(COLOR_RESET)"
	npm run test

clean:
	@echo -e "$(COLOR_CYAN)Limpando arquivos temporários...$(COLOR_RESET)"
	rm -rf node_modules
	rm -rf **/node_modules
	rm -rf **/dist
	rm -rf **/build
	rm -rf **/out
	@echo -e "$(COLOR_GREEN)Limpeza concluída!$(COLOR_RESET)"

# Docker
docker-build:
	@echo -e "$(COLOR_CYAN)Construindo imagens Docker...$(COLOR_RESET)"
	docker-compose build

docker-up:
	@echo -e "$(COLOR_CYAN)Iniciando contêineres Docker...$(COLOR_RESET)"
	docker-compose up -d

docker-down:
	@echo -e "$(COLOR_CYAN)Parando contêineres Docker...$(COLOR_RESET)"
	docker-compose down

# Serviços VibeForge
services-up:
	@echo -e "$(COLOR_CYAN)Iniciando serviços externos do VibeForge IDE...$(COLOR_RESET)"
	@if [ "$(OS)" = "Windows_NT" ]; then \
		powershell -ExecutionPolicy Bypass -File ./infra/start-services.ps1; \
	else \
		chmod +x ./infra/start-services.sh && ./infra/start-services.sh; \
	fi

services-down:
	@echo -e "$(COLOR_CYAN)Parando serviços externos do VibeForge IDE...$(COLOR_RESET)"
	docker-compose down

services-status:
	@echo -e "$(COLOR_CYAN)Verificando status dos serviços externos do VibeForge IDE...$(COLOR_RESET)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "vibeforge-"

# Desenvolvimento completo
dev-with-services:
	@echo -e "$(COLOR_CYAN)Iniciando ambiente de desenvolvimento completo...$(COLOR_RESET)"
	@$(MAKE) services-up
	@$(MAKE) dev

# Ajuda
help:
	@echo -e "$(COLOR_CYAN)Comandos disponíveis:$(COLOR_RESET)"
	@echo -e "  $(COLOR_GREEN)setup$(COLOR_RESET)              - Instala todas as dependências do projeto"
	@echo -e "  $(COLOR_GREEN)dev$(COLOR_RESET)                - Inicia o ambiente de desenvolvimento"
	@echo -e "  $(COLOR_GREEN)dev-with-services$(COLOR_RESET)  - Inicia os serviços Docker e o ambiente de desenvolvimento"
	@echo -e "  $(COLOR_GREEN)build$(COLOR_RESET)              - Gera build de produção"
	@echo -e "  $(COLOR_GREEN)lint$(COLOR_RESET)               - Executa o linter em todo o código"
	@echo -e "  $(COLOR_GREEN)test$(COLOR_RESET)               - Executa os testes"
	@echo -e "  $(COLOR_GREEN)clean$(COLOR_RESET)              - Remove arquivos temporários e builds"
	@echo -e "  $(COLOR_GREEN)services-up$(COLOR_RESET)        - Inicia os serviços externos (Ollama, ChromaDB)"
	@echo -e "  $(COLOR_GREEN)services-down$(COLOR_RESET)      - Para os serviços externos"
	@echo -e "  $(COLOR_GREEN)services-status$(COLOR_RESET)    - Verifica o status dos serviços externos"
	@echo -e "  $(COLOR_GREEN)docker-build$(COLOR_RESET)       - Constrói as imagens Docker"
	@echo -e "  $(COLOR_GREEN)docker-up$(COLOR_RESET)          - Inicia os contêineres Docker"
	@echo -e "  $(COLOR_GREEN)docker-down$(COLOR_RESET)        - Para os contêineres Docker"

# Comando padrão
default: help 