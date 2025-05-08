/**
 * Configuração de ambiente centralizada
 * Este arquivo simplifica o acesso às variáveis de ambiente com valores padrão
 * e validação de tipos para evitar erros em runtime.
 */

// Função utilitária para acessar variáveis de ambiente com valores padrão seguros
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[`VITE_${key}`] || defaultValue;
  return value;
};

// Obtém variáveis de ambiente com valores padrão
const apiUrl = getEnvVar('API_URL', 'http://localhost:3000');
const wsUrl = getEnvVar('WS_URL', 'ws://localhost:3000');
const apiTimeout = parseInt(getEnvVar('API_TIMEOUT', '30000'), 10);
const environment = getEnvVar('NODE_ENV', 'development');
const isDevelopment = environment === 'development';
const isProduction = environment === 'production';
const isTest = environment === 'test';
const debugEnabled = getEnvVar('DEBUG', isDevelopment ? 'true' : 'false') === 'true';
const sentryDsn = getEnvVar('SENTRY_DSN', '');
const electronEnabled = getEnvVar('ELECTRON_ENABLED', 'false') === 'true';

// Exporta variáveis e configurações
export const env = {
  apiUrl,
  wsUrl,
  apiTimeout,
  environment,
  isDevelopment,
  isProduction,
  isTest,
  debugEnabled,
  sentryDsn,
  electronEnabled,
};

// Exporta a função utilitária para uso em outros módulos
export { getEnvVar }; 