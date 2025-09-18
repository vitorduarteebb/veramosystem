// Configuração de URLs da API
const getApiBaseUrl = () => {
  // Em qualquer ambiente, preferir same-origin via Nginx proxy
  // Assim evitamos CORS e problemas de http/https
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// URLs específicas
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: API_BASE_URL,
  
  // Autenticação
  LOGIN: `${API_BASE_URL}/auth/jwt/create/`,
  REFRESH: `${API_BASE_URL}/auth/jwt/refresh/`,
  USER_INFO: `${API_BASE_URL}/auth/users/me/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/users/set_password/`,
  
  // Empresas
  COMPANIES: `${API_BASE_URL}/api/companies/`,
  COMPANY_UNIONS: `${API_BASE_URL}/api/company-unions/`,
  
  // Processos de demissão
  DEMISSAO_PROCESSES: `${API_BASE_URL}/api/demissao-processes/`,
  
  // Agendamentos
  SCHEDULES: `${API_BASE_URL}/api/schedules/`,
  SCHEDULE_CONFIG: `${API_BASE_URL}/api/schedule-configs/`,
  
  // Usuários
  USERS: `${API_BASE_URL}/api/users/`,
  
  // Sindicatos
  UNIONS: `${API_BASE_URL}/api/unions/`,
  
  // Documentos
  DOCUMENTS: `${API_BASE_URL}/api/documents/`,
  
  // Logs
  LOGS: `${API_BASE_URL}/api/logs/`,
  
  // Assinatura Eletrônica
  SIGNING: `${API_BASE_URL}/api/signing/`,
};

console.log('🔧 Configuração API carregada:', {
  hostname: window.location.hostname,
  apiBase: API_BASE_URL,
  isLocal: window.location.hostname === 'localhost',
  porta: window.location.hostname === 'localhost' ? '8000' : '443'
});
