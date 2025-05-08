# Script PowerShell para iniciar serviços Docker do VibeForge IDE

Write-Host "Iniciando serviços do VibeForge IDE..." -ForegroundColor Yellow

# Verificar se o Docker está instalado
try {
    $dockerVersion = docker --version
    Write-Host "Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker não encontrado. Por favor, instale o Docker Desktop para Windows para continuar." -ForegroundColor Red
    exit 1
}

# Verificar se o Docker está rodando
try {
    $dockerInfo = docker info
    if (!$dockerInfo) {
        throw "Docker info vazio"
    }
} catch {
    Write-Host "Docker não está em execução. Por favor, inicie o Docker Desktop para continuar." -ForegroundColor Red
    exit 1
}

# Iniciar os serviços
Write-Host "Iniciando contêineres..." -ForegroundColor Yellow
try {
    docker-compose up -d
} catch {
    Write-Host "Erro ao usar docker-compose. Tentando com 'docker compose'..." -ForegroundColor Yellow
    try {
        docker compose up -d
    } catch {
        Write-Host "Falha ao iniciar os contêineres. Verifique o log para mais detalhes." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Contêineres iniciados com sucesso!" -ForegroundColor Green

# Função para verificar a disponibilidade de um serviço
function Check-Service {
    param (
        [string]$service,
        [string]$url
    )
    
    Write-Host "Verificando disponibilidade do serviço $service..." -ForegroundColor Yellow
    
    $maxRetries = 30
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "Serviço $service está disponível!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Serviço ainda não disponível
        }
        
        $retryCount++
        Write-Host "Aguardando serviço $service... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    
    Write-Host "Serviço $service não ficou disponível após $maxRetries tentativas." -ForegroundColor Red
    return $false
}

# Verificar disponibilidade dos serviços
$ollamaOk = Check-Service -service "Ollama" -url "http://localhost:11434/api/version"
$chromadbOk = Check-Service -service "ChromaDB" -url "http://localhost:8000/api/v1/heartbeat"

if ($ollamaOk -and $chromadbOk) {
    Write-Host "Todos os serviços estão disponíveis!" -ForegroundColor Green
    Write-Host "Ambiente de desenvolvimento VibeForge pronto para uso." -ForegroundColor Green
} else {
    Write-Host "Alguns serviços não estão disponíveis. Verifique os logs dos contêineres para mais detalhes." -ForegroundColor Red
} 