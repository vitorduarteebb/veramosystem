import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getUserInfo } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { FaPlus, FaUsers, FaChartLine, FaExclamationTriangle, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaUserCheck, FaUserTimes, FaBell, FaCog, FaEye, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaFilter, FaSearch, FaDownload } from 'react-icons/fa';

// Função para gerenciar tokens e refresh automático
async function getValidToken() {
  const authData = localStorage.getItem('@veramo_auth');
  if (!authData) {
    console.error('❌ Usuário não autenticado - redirecionando para login');
    window.location.href = '/login';
    throw new Error('Usuário não autenticado');
  }
  
  const { access, refresh } = JSON.parse(authData);
  
  if (!access || !refresh) {
    console.error('❌ Tokens inválidos - redirecionando para login');
    localStorage.removeItem('@veramo_auth');
    window.location.href = '/login';
    throw new Error('Tokens inválidos');
  }
  
  return { access, refresh };
}

// Função para verificar se o usuário tem permissões adequadas
async function checkUserPermissions() {
  try {
    const response = await makeAuthenticatedRequest(API_ENDPOINTS.USER_INFO);
    const userInfo = await response.json();
    console.log('👤 Usuário autenticado:', userInfo.email);
    return userInfo;
  } catch (error) {
    console.error('❌ Erro ao verificar permissões do usuário:', error);
    throw error;
  }
}

async function refreshToken(refreshToken) {
  try {
    console.log('🔄 Tentando renovar token...');
    const response = await fetch(`${API_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao renovar token:', response.status, errorText);
      throw new Error(`Falha ao renovar token: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Token renovado com sucesso');
    return data.access;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    throw error;
  }
}

async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const { access, refresh } = await getValidToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Se token expirou, tentar refresh
    if (response.status === 401) {
      console.log('Token expirado, tentando renovar...');
      try {
        const newAccessToken = await refreshToken(refresh);
        
        // Atualizar token no localStorage
        const authData = JSON.parse(localStorage.getItem('@veramo_auth'));
        authData.access = newAccessToken;
        localStorage.setItem('@veramo_auth', JSON.stringify(authData));
        
        // Tentar novamente com o novo token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          // Se ainda falhar após refresh, pode ser problema de permissão
          if (retryResponse.status === 403) {
            console.warn(`Acesso negado para ${url} - pode ser problema de permissão`);
            throw new Error(`Acesso negado (403) - verifique permissões`);
          }
          throw new Error(`Erro na API após refresh: ${retryResponse.status}`);
        }
        
        return retryResponse;
      } catch (refreshError) {
        console.error('Falha ao renovar token:', refreshError);
        // Se refresh falhar, redirecionar para login
        localStorage.removeItem('@veramo_auth');
        window.location.href = '/login';
        throw new Error('Sessão expirada - faça login novamente');
      }
    }
    
    // Se for 403, pode ser problema de permissão específico
    if (response.status === 403) {
      // Log mais discreto para erros 403 comuns
      if (url.includes('/api/companies/')) {
        console.log(`ℹ️ Acesso restrito a empresa específica: ${url.split('/').pop()}`);
      } else {
        console.warn(`Acesso negado para ${url} - pode ser problema de permissão`);
      }
      throw new Error(`Acesso negado (403) - verifique permissões`);
    }
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Erro na requisição autenticada:', error);
    throw error;
  }
}

// Funções de fetch reaproveitadas de SindicatoDetalhes.jsx
async function fetchHomologacoes(unionId) {
  // Verificar se unionId é válido (número)
  if (!unionId || isNaN(unionId)) {
    console.error('ID do sindicato inválido:', unionId);
    return [];
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.SCHEDULES}?union=${unionId}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar homologações:', error);
    return [];
  }
}

async function fetchDemissaoProcessos(unionId) {
  // Verificar se unionId é válido (número)
  if (!unionId || isNaN(unionId)) {
    return [];
  }
  
  const url = `${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${unionId}`;
  
  try {
    const response = await makeAuthenticatedRequest(url);
    const data = await response.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  } catch (error) {
    console.error('Erro ao buscar processos de demissão:', error);
    return [];
  }
}

async function fetchUsuarios(unionId) {
  // Verificar se unionId é válido (número)
  if (!unionId || isNaN(unionId)) {
    return [];
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.USERS}?union=${unionId}`);
    const data = await response.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

async function fetchEmpresas(unionId) {
  // Verificar se unionId é válido (número)
  if (!unionId || isNaN(unionId)) {
    console.error('ID do sindicato inválido:', unionId);
    return [];
  }
  
  try {
    const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.COMPANY_UNIONS}?union=${unionId}`);
    const dataV = await response.json();
    const vinculos = Array.isArray(dataV) ? dataV : (Array.isArray(dataV?.results) ? dataV.results : []);
    const empresas = [];
    
    console.log(`📊 Encontrados ${vinculos.length} vínculos de empresas`);
    
    for (const v of vinculos) {
      try {
        const resp = await makeAuthenticatedRequest(`${API_ENDPOINTS.COMPANIES}${v.company}/`);
        const empresaData = await resp.json();
        empresas.push(empresaData);
        console.log(`✅ Empresa ${v.company} carregada com sucesso`);
      } catch (error) {
        // Log mais discreto para erros 403 de empresas
        if (error.message.includes('403')) {
          console.log(`ℹ️ Empresa ${v.company} não acessível (permissão restrita)`);
        } else {
          console.warn(`⚠️ Erro ao carregar empresa ${v.company}:`, error.message);
        }
        // Continuar mesmo se uma empresa falhar
      }
    }
    
    console.log(`📊 Total de empresas carregadas: ${empresas.length}`);
    return empresas;
  } catch (error) {
    console.error('Erro ao buscar vínculos de empresas:', error);
    return [];
  }
}

const TABS = [
  { key: 'homologacoes', label: 'Homologações' },
  { key: 'documentos', label: 'Documentações' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'colaboradores', label: 'Colaboradores' },
  { key: 'finalizados', label: 'Processos Finalizados' },
];

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] animate-slideIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#23281a]">{title}</h2>
          <button onClick={onClose} className="text-[#bfa15a] text-2xl font-bold hover:text-red-500 transition">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PainelSindicatoMaster() {
  const [tab, setTab] = useState('homologacoes');
  const [loading, setLoading] = useState(true);
  const [homologacoes, setHomologacoes] = useState([]);
  const [processosDemissao, setProcessosDemissao] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [novoColaborador, setNovoColaborador] = useState({ username: '', email: '', cpf: '', phone: '', password: '', role: 'union_common' });
  const [novoColaboradorError, setNovoColaboradorError] = useState('');
  const [finalizandoReuniao, setFinalizandoReuniao] = useState(null);
  
  // Estados para melhorias de UX
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHomologador, setFilterHomologador] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Debug: Log dos valores iniciais dos filtros
  console.log('🔧 Estados iniciais dos filtros:', {
    searchTerm,
    filterStatus,
    filterHomologador,
    sortBy,
    showOnlyToday,
    currentPage,
    itemsPerPage
  });
  
  // Estados para funcionalidades master
  const [selectedHomologacoes, setSelectedHomologacoes] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showHomologadorManagement, setShowHomologadorManagement] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        console.log('🔄 Iniciando carregamento de dados...');
        
        // Verificar permissões do usuário primeiro
        const userInfo = await checkUserPermissions();
        const unionId = userInfo.union;
        
        // Verificar se o ID do sindicato é válido
        if (!unionId || isNaN(unionId)) {
          setError('Usuário não possui um sindicato válido vinculado.');
          setLoading(false);
          return;
        }
        
        console.log(`📊 Carregando dados para sindicato ID: ${unionId}`);
        
        // Buscar dados em paralelo para melhor performance
        const [processosData, usuariosData, empresasData, homologacoesData] = await Promise.allSettled([
          fetchDemissaoProcessos(unionId),
          fetchUsuarios(unionId),
          fetchEmpresas(unionId),
          fetchHomologacoes(unionId)
        ]);
        
        // Processar resultados
        setProcessosDemissao(processosData.status === 'fulfilled' ? processosData.value : []);
        setUsuarios(usuariosData.status === 'fulfilled' ? usuariosData.value : []);
        setEmpresas(empresasData.status === 'fulfilled' ? empresasData.value : []);
        setHomologacoes(homologacoesData.status === 'fulfilled' ? homologacoesData.value : []);
        
        // Log de resultados
        console.log('✅ Dados carregados:', {
          processos: processosData.status === 'fulfilled' ? processosData.value.length : 'erro',
          usuarios: usuariosData.status === 'fulfilled' ? usuariosData.value.length : 'erro',
          empresas: empresasData.status === 'fulfilled' ? empresasData.value.length : 'erro',
          homologacoes: homologacoesData.status === 'fulfilled' ? homologacoesData.value.length : 'erro'
        });
        
        // Verificar se houve erros críticos
        const errors = [processosData, usuariosData, empresasData, homologacoesData]
          .filter(result => result.status === 'rejected')
          .map(result => result.reason.message);
        
        if (errors.length > 0) {
          console.warn('⚠️ Alguns dados não puderam ser carregados:', errors);
        }
        
      } catch (err) {
        console.error('❌ Erro crítico ao carregar dados:', err);
        setError('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtros e contadores reais
  const processosHoje = processosDemissao.filter(p => new Date(p.data_inicio).toDateString() === new Date().toDateString());
  const pendentesDoc = processosDemissao.filter(p => p.status === 'aguardando_aprovacao' || p.status === 'pendente_documentacao');
  const homologacoesAgendadas = processosDemissao.filter(p => p.status === 'agendado');
  const processosFinalizados = processosDemissao.filter(p => p.status === 'finalizado');
  const colaboradores = usuarios.filter(u => u.role === 'union_common');

  // Função para filtrar e ordenar homologações agendadas
  const getFilteredHomologacoes = () => {
    // Verificar se os dados estão carregados
    if (!Array.isArray(homologacoesAgendadas)) {
      console.log('🔍 homologacoesAgendadas não é array:', homologacoesAgendadas);
      return [];
    }
    
    console.log('🔍 Iniciando filtros:', {
      total: homologacoesAgendadas.length,
      searchTerm,
      filterHomologador,
      filterStatus,
      showOnlyToday,
      dados: homologacoesAgendadas.map(p => ({ 
        id: p.id, 
        nome: p.nome_funcionario, 
        status: p.status,
        homologador: p.homologador_nome 
      }))
    });
    
    let filtered = [...homologacoesAgendadas];
    console.log('🔍 Após cópia:', filtered.length);

    // Filtro por busca
    if (searchTerm) {
      const before = filtered.length;
      filtered = filtered.filter(processo =>
        processo.nome_funcionario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processo.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processo.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`🔍 Após busca "${searchTerm}":`, before, '->', filtered.length);
    }

    // Filtro por homologador
    if (filterHomologador !== 'all') {
      const before = filtered.length;
      filtered = filtered.filter(processo => processo.homologador_nome === filterHomologador);
      console.log(`🔍 Após filtro homologador "${filterHomologador}":`, before, '->', filtered.length);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      const before = filtered.length;
      filtered = filtered.filter(processo => processo.status === filterStatus);
      console.log(`🔍 Após filtro status "${filterStatus}":`, before, '->', filtered.length);
    }

    // Filtro por hoje
    if (showOnlyToday) {
      const before = filtered.length;
      const hoje = new Date().toDateString();
      filtered = filtered.filter(processo => {
        // Buscar agendamento relacionado para verificar data
        const schedule = homologacoes.find(h => 
          h.employee_name === processo.nome_funcionario && 
          h.company_name === processo.empresa_nome
        );
        const isToday = schedule && new Date(schedule.date).toDateString() === hoje;
        console.log(`🔍 Verificando hoje para ${processo.nome_funcionario}:`, {
          schedule: !!schedule,
          scheduleDate: schedule?.date,
          hoje,
          isToday
        });
        return isToday;
      });
      console.log(`🔍 Após filtro "Só Hoje":`, before, '->', filtered.length);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.data_inicio) - new Date(b.data_inicio);
        case 'date_desc':
          return new Date(b.data_inicio) - new Date(a.data_inicio);
        case 'nome_asc':
          return (a.nome_funcionario || '').localeCompare(b.nome_funcionario || '');
        case 'nome_desc':
          return (b.nome_funcionario || '').localeCompare(a.nome_funcionario || '');
        case 'empresa_asc':
          return (a.empresa_nome || '').localeCompare(b.empresa_nome || '');
        case 'empresa_desc':
          return (b.empresa_nome || '').localeCompare(a.empresa_nome || '');
        default:
          return 0;
      }
    });

    console.log('🔍 Resultado final dos filtros:', {
      total: homologacoesAgendadas.length,
      filtrado: filtered.length,
      paginado: Math.min(filtered.length, itemsPerPage)
    });

    return filtered;
  };

  // Paginação
  const filteredHomologacoes = getFilteredHomologacoes();
  const totalPages = Math.ceil(filteredHomologacoes.length / itemsPerPage);
  const paginatedHomologacoes = filteredHomologacoes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Debug: Log dos valores para exibição
  console.log('📊 Valores para exibição:', {
    homologacoesAgendadas: homologacoesAgendadas.length,
    filteredHomologacoes: filteredHomologacoes.length,
    paginatedHomologacoes: paginatedHomologacoes.length,
    searchTerm,
    filterHomologador,
    filterStatus,
    showOnlyToday
  });

  // Lista única de homologadores
  const homologadoresUnicos = Array.isArray(homologacoesAgendadas) 
    ? [...new Set(homologacoesAgendadas.map(p => p.homologador_nome).filter(Boolean))]
    : [];

  // Métricas e estatísticas para o master
  const getHomologadorStats = () => {
    const stats = {};
    
    // Verificar se os dados estão carregados
    if (!Array.isArray(homologacoesAgendadas) || !Array.isArray(homologacoes) || !Array.isArray(homologadoresUnicos)) {
      return stats;
    }
    
    homologadoresUnicos.forEach(homologador => {
      const processos = homologacoesAgendadas.filter(p => p.homologador_nome === homologador);
      stats[homologador] = {
        total: processos.length,
        hoje: processos.filter(p => {
          const schedule = homologacoes.find(h => 
            h.employee_name === p.nome_funcionario && 
            h.company_name === p.empresa_nome
          );
          return schedule && new Date(schedule.date).toDateString() === new Date().toDateString();
        }).length,
        comMeet: processos.filter(p => p.video_link && p.video_link !== 'https://meet.google.com').length,
        semMeet: processos.filter(p => !p.video_link || p.video_link === 'https://meet.google.com').length
      };
    });
    return stats;
  };

  const homologadorStats = getHomologadorStats();

  // Alertas importantes
  const getAlerts = () => {
    const alerts = [];
    
    // Verificar se os dados estão carregados
    if (!Array.isArray(homologacoesAgendadas) || !Array.isArray(homologacoes)) {
      return alerts;
    }
    
    // Homologações sem Meet
    const semMeet = homologacoesAgendadas.filter(p => !p.video_link || p.video_link === 'https://meet.google.com');
    if (semMeet.length > 0) {
      alerts.push({
        type: 'warning',
        icon: FaExclamationTriangle,
        title: `${semMeet.length} homologações sem Meet`,
        message: `${semMeet.length} agendamentos precisam de link do Google Meet`,
        count: semMeet.length
      });
    }

    // Homologações hoje sem Meet
    const hojeSemMeet = homologacoesAgendadas.filter(p => {
      const schedule = homologacoes.find(h => 
        h.employee_name === p.nome_funcionario && 
        h.company_name === p.empresa_nome
      );
      return schedule && 
             new Date(schedule.date).toDateString() === new Date().toDateString() &&
             (!p.video_link || p.video_link === 'https://meet.google.com');
    });
    if (hojeSemMeet.length > 0) {
      alerts.push({
        type: 'error',
        icon: FaTimesCircle,
        title: `${hojeSemMeet.length} homologações HOJE sem Meet`,
        message: 'URGENTE: Homologações de hoje precisam de link do Meet',
        count: hojeSemMeet.length
      });
    }

    // Homologadores sobrecarregados
    if (homologadorStats && typeof homologadorStats === 'object') {
      Object.entries(homologadorStats).forEach(([nome, stats]) => {
        if (stats.hoje > 5) {
          alerts.push({
            type: 'warning',
            icon: FaUserCheck,
            title: `${nome} sobrecarregado`,
            message: `${stats.hoje} homologações hoje - considere redistribuir`,
            count: stats.hoje
          });
        }
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Recarregar dados automaticamente
      loadData();
    }, 30000);
    setRefreshInterval(interval);
    return () => clearInterval(interval);
  }, []);

  // Função para carregar dados (extraída do useEffect)
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const userInfo = await getUserInfo();
      const unionId = userInfo.union;
      
      const [homologacoesData, processosData, usuariosData, empresasData] = await Promise.all([
        fetchHomologacoes(unionId),
        fetchDemissaoProcessos(unionId),
        fetchUsuarios(unionId),
        fetchEmpresas(unionId)
      ]);
      
      setHomologacoes(homologacoesData);
      setProcessosDemissao(processosData);
      setUsuarios(usuariosData);
      setEmpresas(empresasData);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para finalizar reunião
  async function finalizarReuniao(processoId) {
    console.log('🔧 Iniciando finalização da reunião para processo:', processoId);
    
    if (!confirm('Confirmar que a reunião foi finalizada? O processo passará para a etapa de assinatura dos documentos.')) {
      console.log('❌ Usuário cancelou a finalização');
      return;
    }

    console.log('✅ Usuário confirmou, iniciando processo...');
    setFinalizandoReuniao(processoId);
    
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não');
      console.log('🌐 URL da requisição:', `${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/finalizar-reuniao/`);

      const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/finalizar-reuniao/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao finalizar reunião');
      }

      // Recarregar dados
      await loadData();
      alert('Reunião finalizada com sucesso! O processo passou para a etapa de assinatura dos documentos.');
      
    } catch (error) {
      alert(`Erro ao finalizar reunião: ${error.message}`);
    } finally {
      setFinalizandoReuniao(null);
    }
  }

  // Funções para gestão master
  const handleSelectHomologacao = (processoId) => {
    setSelectedHomologacoes(prev => 
      prev.includes(processoId) 
        ? prev.filter(id => id !== processoId)
        : [...prev, processoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedHomologacoes.length === paginatedHomologacoes.length) {
      setSelectedHomologacoes([]);
    } else {
      setSelectedHomologacoes(paginatedHomologacoes.map(p => p.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedHomologacoes.length === 0) return;
    
    const confirmMessage = `Confirmar ação "${bulkAction}" em ${selectedHomologacoes.length} homologação(ões)?`;
    if (!confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      // Implementar ações em lote aqui
      switch (bulkAction) {
        case 'finalizar':
          for (const id of selectedHomologacoes) {
            await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/finalizar-reuniao/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
          break;
        case 'cancelar':
          for (const id of selectedHomologacoes) {
            await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/cancelar/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
          break;
      }

      await loadData();
      setSelectedHomologacoes([]);
      setBulkAction('');
      alert(`Ação "${bulkAction}" executada com sucesso!`);
    } catch (error) {
      alert('Erro ao executar ação em lote: ' + error.message);
    }
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      total_homologacoes: homologacoesAgendadas.length,
      homologadores_stats: homologadorStats,
      processos: homologacoesAgendadas.map(p => ({
        id: p.id,
        funcionario: p.nome_funcionario,
        empresa: p.empresa_nome,
        motivo: p.motivo,
        homologador: p.homologador_nome,
        status: p.status,
        tem_meet: p.video_link && p.video_link !== 'https://meet.google.com'
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_homologacoes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  async function handleSaveColaborador(e) {
    e.preventDefault();
    setNovoColaboradorError('');
    const user = getUserInfo();
    const unionId = user?.union;
    const tokens = localStorage.getItem('@veramo_auth') ? JSON.parse(localStorage.getItem('@veramo_auth')).access : null;
    const payload = {
      username: novoColaborador.email,
      email: novoColaborador.email,
      cpf: novoColaborador.cpf,
      phone: novoColaborador.phone,
      password: novoColaborador.password,
      role: 'union_common',
      union: unionId,
    };
    fetch(API_ENDPOINTS.USERS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async resp => {
        if (!resp.ok) {
          const data = await resp.json();
          const msg = Object.values(data).flat().join(' | ');
          setNovoColaboradorError(msg || 'Erro ao criar colaborador.');
          throw new Error('Erro ao criar colaborador');
        }
        setModalOpen(false);
        setNovoColaborador({ username: '', email: '', cpf: '', phone: '', password: '', role: 'union_common' });
        // Atualizar lista de colaboradores
        const user = getUserInfo();
        const unionId = user?.union;
        fetchUsuarios(unionId).then(setUsuarios);
      })
      .catch(() => {});
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-6xl bg-white/95 rounded-3xl shadow-2xl px-4 py-8 md:px-12 md:py-12 mt-6 flex flex-col gap-6 md:gap-10 animate-fadeIn">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-3">
              Painel Master do Sindicato
            </h1>
            <p className="text-[#23281a] text-lg mb-4">Bem-vindo! Aqui você gerencia homologações, documentos, agenda e equipe sindical.</p>
          </div>

        </div>
        
        {/* Barra de Status e Controles Master */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-lg border-2 border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaClock className="text-gray-600" />
                <span className="text-sm text-gray-600">
                  Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Auto-refresh ativo</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  showAlerts 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white text-red-600 border border-red-300'
                }`}
              >
                <FaBell />
                Alertas ({alerts.length})
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  showAnalytics 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-blue-600 border border-blue-300'
                }`}
              >
                <FaChartLine />
                Analytics
              </button>
              <button
                onClick={() => setShowHomologadorManagement(!showHomologadorManagement)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  showHomologadorManagement 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-green-600 border border-green-300'
                }`}
              >
                <FaUsers />
                Gestão Equipe
              </button>
              <button
                onClick={exportData}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <FaDownload />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {showAlerts && alerts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg border-2 border-red-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-red-500 text-xl" />
              <h2 className="text-xl font-bold text-red-800">Alertas Críticos</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' 
                    ? 'bg-red-100 border-red-500' 
                    : 'bg-yellow-100 border-yellow-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <alert.icon className={`text-lg ${
                        alert.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-gray-800">{alert.title}</h3>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      alert.type === 'error' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {alert.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics e Métricas */}
        {showAnalytics && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FaChartLine className="text-blue-500 text-xl" />
              <h2 className="text-xl font-bold text-blue-800">Analytics e Performance</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estatísticas Gerais */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <h3 className="font-bold text-gray-800 mb-3">Resumo Geral</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Agendadas:</span>
                    <span className="font-semibold">{homologacoesAgendadas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hoje:</span>
                    <span className="font-semibold">{processosHoje.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Com Meet:</span>
                    <span className="font-semibold text-green-600">
                      {homologacoesAgendadas.filter(p => p.video_link && p.video_link !== 'https://meet.google.com').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sem Meet:</span>
                    <span className="font-semibold text-red-600">
                      {homologacoesAgendadas.filter(p => !p.video_link || p.video_link === 'https://meet.google.com').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance por Homologador */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <h3 className="font-bold text-gray-800 mb-3">Performance por Homologador</h3>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {Object.entries(homologadorStats).map(([nome, stats]) => (
                    <div key={nome} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{nome}</span>
                      <div className="flex gap-2">
                        <span className="text-green-600">{stats.hoje} hoje</span>
                        <span className="text-blue-600">{stats.total} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribuição por Status */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <h3 className="font-bold text-gray-800 mb-3">Distribuição por Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Agendado:</span>
                    <span className="font-semibold text-green-600">{homologacoesAgendadas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendente Doc:</span>
                    <span className="font-semibold text-yellow-600">{pendentesDoc.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Finalizado:</span>
                    <span className="font-semibold text-blue-600">{processosFinalizados.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hoje:</span>
                    <span className="font-semibold text-purple-600">{processosHoje.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gestão de Homologadores */}
        {showHomologadorManagement && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FaUsers className="text-green-500 text-xl" />
              <h2 className="text-xl font-bold text-green-800">Gestão da Equipe de Homologadores</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(homologadorStats).map(([nome, stats]) => (
                <div key={nome} className="bg-white rounded-xl shadow-md border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-green-800">{nome}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      stats.hoje > 5 ? 'bg-red-500 text-white' : 
                      stats.hoje > 3 ? 'bg-yellow-500 text-white' : 
                      'bg-green-500 text-white'
                    }`}>
                      {stats.hoje > 5 ? 'Sobrecarga' : stats.hoje > 3 ? 'Alto' : 'Normal'}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Hoje:</span>
                      <span className="font-semibold">{stats.hoje}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Com Meet:</span>
                      <span className="font-semibold text-green-600">{stats.comMeet}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sem Meet:</span>
                      <span className="font-semibold text-red-600">{stats.semMeet}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors">
                      Ver Agenda
                    </button>
                    <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors">
                      Redistribuir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#f5ecd7] rounded-2xl shadow-lg border border-[#bfa15a]/30 px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-[#1a2a1a]">{processosHoje.length}</span>
            <span className="text-[#23281a] mt-2 font-semibold">Processos hoje</span>
          </div>
          <div className="bg-[#f5ecd7] rounded-2xl shadow-lg border border-[#bfa15a]/30 px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-[#1a2a1a]">{pendentesDoc.length}</span>
            <span className="text-[#23281a] mt-2 font-semibold">Pendentes de documentação</span>
          </div>
          <div className="bg-green-100 rounded-2xl shadow-lg border border-green-300 px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-green-700">{homologacoesAgendadas.length}</span>
            <span className="text-green-700 mt-2 font-semibold">Homologações agendadas</span>
          </div>
          <div className="bg-[#f5ecd7] rounded-2xl shadow-lg border border-[#bfa15a]/30 px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-[#1a2a1a]">{colaboradores.length}</span>
            <span className="text-[#23281a] mt-2 font-semibold">Colaboradores ativos</span>
          </div>
          <div className="bg-[#f5ecd7] rounded-2xl shadow-lg border border-[#bfa15a]/30 px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-[#1a2a1a]">{empresas.length}</span>
            <span className="text-[#23281a] mt-2 font-semibold">Empresas vinculadas</span>
            {empresas.length === 0 && (
              <span className="text-xs text-gray-500 mt-1 text-center">
                Algumas empresas podem ter acesso restrito
              </span>
            )}
          </div>
        </div>

                {/* Seção de Homologações Agendadas - Versão Melhorada */}
        {homologacoesAgendadas.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800">Homologações Agendadas</h2>
                  <p className="text-green-600 text-sm">
                    {filteredHomologacoes.length} de {homologacoesAgendadas.length} agendadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🔍 Clicando em "Só Hoje":', { 
                      atual: showOnlyToday, 
                      novo: !showOnlyToday 
                    });
                    setShowOnlyToday(!showOnlyToday);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                    showOnlyToday 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white text-green-600 border border-green-300'
                  }`}
                >
                  Só Hoje
                </button>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {homologacoesAgendadas.length} total
                </div>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar funcionário, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterHomologador}
                onChange={(e) => setFilterHomologador(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todos os homologadores</option>
                {homologadoresUnicos.map(homologador => (
                  <option key={homologador} value={homologador}>{homologador}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="date_desc">Data (mais recente)</option>
                <option value="date_asc">Data (mais antiga)</option>
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="nome_desc">Nome (Z-A)</option>
                <option value="empresa_asc">Empresa (A-Z)</option>
                <option value="empresa_desc">Empresa (Z-A)</option>
              </select>
              
              <button
                onClick={() => {
                  console.log('🔍 Limpando filtros...');
                  setSearchTerm('');
                  setFilterHomologador('all');
                  setFilterStatus('all');
                  setSortBy('date_desc');
                  setShowOnlyToday(false);
                  setCurrentPage(1);
                  console.log('🔍 Filtros limpos!');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Limpar Filtros
              </button>
            </div>

            {/* Controles Master - Seleção em Lote */}
            {selectedHomologacoes.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-blue-500" />
                    <span className="font-semibold text-blue-800">
                      {selectedHomologacoes.length} homologação(ões) selecionada(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="px-3 py-1 border border-blue-300 rounded-lg text-sm"
                    >
                      <option value="">Selecionar ação...</option>
                      <option value="finalizar">Finalizar Reuniões</option>
                      <option value="cancelar">Cancelar Agendamentos</option>
                      <option value="reatribuir">Reatribuir Homologador</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Executar
                    </button>
                    <button
                      onClick={() => setSelectedHomologacoes([])}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Homologações */}
            <div className="space-y-3 mb-6">
              {/* Cabeçalho com seleção */}
              {paginatedHomologacoes.length > 0 && (
                <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedHomologacoes.length === paginatedHomologacoes.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Selecionar todos ({paginatedHomologacoes.length})
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedHomologacoes.length} selecionado(s)
                  </div>
                </div>
              )}

              {(() => {
                console.log('🔍 Renderizando lista:', {
                  paginatedHomologacoes: paginatedHomologacoes.length,
                  filteredHomologacoes: filteredHomologacoes.length,
                  homologacoesAgendadas: homologacoesAgendadas.length,
                  currentPage,
                  itemsPerPage,
                  totalPages
                });
                return null;
              })()}
              {paginatedHomologacoes.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <p className="text-lg font-semibold">Nenhuma homologação encontrada</p>
                  <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
                  <div className="mt-4 text-xs text-gray-500">
                    Debug: {filteredHomologacoes.length} filtradas, {homologacoesAgendadas.length} agendadas
                  </div>
                </div>
              ) : (
                paginatedHomologacoes.map((processo) => (
                  <div key={processo.id} className={`bg-white rounded-xl shadow-md border p-4 hover:shadow-lg transition-shadow ${
                    selectedHomologacoes.includes(processo.id) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedHomologacoes.includes(processo.id)}
                          onChange={() => handleSelectHomologacao(processo.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <h3 className="font-bold text-green-800 text-lg">{processo.nome_funcionario}</h3>
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          AGENDADO
                        </span>
                        {(!processo.video_link || processo.video_link === 'https://meet.google.com') && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            SEM MEET
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {processo.video_link && processo.video_link !== 'https://meet.google.com' && (
                          <a 
                            href={processo.video_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Acessar Meet
                          </a>
                        )}
                        <button
                          onClick={() => window.location.href = `/sindicato/documentacoes/${processo.id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => {
                            console.log('🖱️ Botão Finalizar clicado para processo:', processo.id);
                            finalizarReuniao(processo.id);
                          }}
                          disabled={finalizandoReuniao === processo.id}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          {finalizandoReuniao === processo.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Finalizando...
                            </>
                          ) : (
                            'Finalizar'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div>
                        <p><strong>Empresa:</strong> {processo.empresa_nome}</p>
                        <p><strong>Motivo:</strong> {processo.motivo}</p>
                      </div>
                      <div>
                        <p><strong>Homologador:</strong></p>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {processo.homologador_nome || 'Não designado'}
                        </span>
                      </div>
                      <div>
                        <p><strong>Data:</strong> {new Date(processo.data_inicio).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Status:</strong> {processo.status}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-green-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredHomologacoes.length)} de {filteredHomologacoes.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-green-300 text-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 transition-colors"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === page
                              ? 'bg-green-500 text-white'
                              : 'bg-white border border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-green-300 text-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Abas de navegação */}
        <div className="flex gap-2 mb-6 border-b border-[#bfa15a]/30">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`px-6 py-2 font-bold rounded-t-lg transition-colors duration-200 ${tab === t.key ? 'bg-[#bfa15a]/90 text-white shadow' : 'bg-[#f5ecd7] text-[#23281a] hover:bg-[#bfa15a]/30'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Loading/Error */}
        {loading ? (
          <div className="text-[#bfa15a] text-lg animate-pulse">Carregando dados...</div>
        ) : error ? (
          <div className="text-red-500 text-lg">{error}</div>
        ) : (
          <>
            {tab === 'homologacoes' && (
              <section>
                <h2 className="text-xl font-bold text-[#23281a] mb-4">Processos de Demissão</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20 text-[#23281a]">
                        <th className="px-4 py-2">Funcionário</th>
                        <th className="px-4 py-2">Empresa</th>
                        <th className="px-4 py-2">Motivo</th>
                        <th className="px-4 py-2">Data</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processosDemissao.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-[#bfa15a] py-4">Nenhum processo de demissão encontrado.</td></tr>
                      ) : (
                        processosDemissao.map(p => (
                          <tr key={p.id} className="border-b">
                            <td className="px-4 py-2">{p.nome_funcionario}</td>
                            <td className="px-4 py-2">{p.empresa_nome}</td>
                            <td className="px-4 py-2">{p.motivo}</td>
                            <td className="px-4 py-2">{new Date(p.data_inicio).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                p.status === 'aguardando_aprovacao' ? 'bg-yellow-100 text-yellow-700' :
                                p.status === 'aguardando_analise_documentacao' ? 'bg-blue-100 text-blue-700' :
                                p.status === 'pendente_documentacao' ? 'bg-purple-100 text-purple-700' :
                                p.status === 'rejeitado_falta_documentacao' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {p.status === 'aguardando_aprovacao' ? 'Aguardando' :
                                 p.status === 'aguardando_analise_documentacao' ? 'Aguardando Análise' :
                                 p.status === 'pendente_documentacao' ? 'Pendente Documentação' :
                                 p.status === 'rejeitado_falta_documentacao' ? 'Rejeitado' :
                                 p.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 flex gap-2">
                              <button 
                                onClick={() => window.location.href = `/sindicato/analise/${p.id}`}
                                className="px-3 py-1 rounded bg-[#bfa15a]/80 text-white font-bold hover:bg-[#bfa15a]"
                              >
                                Detalhes
                              </button>
                              {p.status === 'aguardando_aprovacao' && (
                                <button 
                                  onClick={() => window.location.href = `/sindicato/analise/${p.id}`}
                                  className="px-3 py-1 rounded bg-green-600/80 text-white font-bold hover:bg-green-700"
                                >
                                  Analisar
                                </button>
                              )}
                              {p.status === 'documentos_aprovados' && (
                                <span className="px-3 py-1 rounded bg-green-600/80 text-white font-bold text-xs">
                                  Aguardando Empresa
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-[#bfa15a] mt-2">Processos de demissão aguardando análise e aprovação.</div>
              </section>
            )}
            {tab === 'documentos' && (
              <section>
                <h2 className="text-xl font-bold text-[#23281a] mb-4">Documentações Pendentes</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20 text-[#23281a]">
                        <th className="px-4 py-2">Funcionário</th>
                        <th className="px-4 py-2">Empresa</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendentesDoc.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-[#bfa15a] py-4">Nenhuma homologação pendente de documentação.</td></tr>
                      ) : (
                        pendentesDoc.map(p => (
                          <tr key={p.id} className="border-b">
                            <td className="px-4 py-2">{p.nome_funcionario || '-'}</td>
                            <td className="px-4 py-2">{p.empresa_nome || p.empresa || '-'}</td>
                            <td className="px-4 py-2">{p.status}</td>
                            <td className="px-4 py-2 flex gap-2">
                              <a href={`/sindicato/documentacoes`} className="px-3 py-1 rounded bg-[#bfa15a]/80 text-white font-bold hover:bg-[#bfa15a]">
                                Ver Detalhes
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-[#bfa15a] mt-2">A aprovação libera o agendamento para a empresa.</div>
              </section>
            )}
            {tab === 'agenda' && (
              <section>
                <h2 className="text-xl font-bold text-[#23281a] mb-4">Agenda da Unidade Sindical</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20 text-[#23281a]">
                        <th className="px-4 py-2">Atendente</th>
                        <th className="px-4 py-2">Dia</th>
                        <th className="px-4 py-2">Horário</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Exemplo: slots de agenda */}
                      <tr className="border-b">
                        <td className="px-4 py-2">-</td>
                        <td className="px-4 py-2">-</td>
                        <td className="px-4 py-2">-</td>
                        <td className="px-4 py-2">-</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button className="px-3 py-1 rounded bg-[#bfa15a]/80 text-white font-bold hover:bg-[#bfa15a]">Editar</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-[#bfa15a] mt-2">Configure a agenda dos colaboradores para liberar horários às empresas.</div>
              </section>
            )}
            {tab === 'colaboradores' && (
              <section>
                <h2 className="text-xl font-bold text-[#23281a] mb-4">Equipe Sindical</h2>
                <div className="flex justify-end mb-2">
                  <button className="px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-bold flex items-center gap-2" onClick={() => setModalOpen(true)}><FaPlus /> Novo colaborador</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20 text-[#23281a]">
                        <th className="px-4 py-2">Nome</th>
                        <th className="px-4 py-2">E-mail</th>
                        <th className="px-4 py-2">CPF</th>
                        <th className="px-4 py-2">Telefone</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradores.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-[#bfa15a] py-4">Nenhum colaborador cadastrado.</td></tr>
                      ) : (
                        colaboradores.map(u => (
                          <tr key={u.id} className="border-b">
                            <td className="px-4 py-2">{u.username}</td>
                            <td className="px-4 py-2">{u.email}</td>
                            <td className="px-4 py-2">{u.cpf || '-'}</td>
                            <td className="px-4 py-2">{u.phone || '-'}</td>
                            <td className="px-4 py-2">Ativo</td>
                            <td className="px-4 py-2 flex gap-2">
                              <button className="px-3 py-1 rounded bg-[#bfa15a]/80 text-white font-bold hover:bg-[#bfa15a]">Editar</button>
                              <button className="px-3 py-1 rounded bg-red-600/80 text-white font-bold hover:bg-red-700">Desativar</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-[#bfa15a] mt-2">Configure horários e permissões de cada colaborador.</div>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo colaborador">
                  <form onSubmit={handleSaveColaborador} className="flex flex-col gap-4">
                    <input type="email" className="border rounded p-2" placeholder="E-mail" value={novoColaborador.email} onChange={e => setNovoColaborador({ ...novoColaborador, email: e.target.value })} required />
                    <input type="text" className="border rounded p-2" placeholder="CPF" value={novoColaborador.cpf} onChange={e => setNovoColaborador({ ...novoColaborador, cpf: e.target.value })} required />
                    <input type="text" className="border rounded p-2" placeholder="Telefone" value={novoColaborador.phone} onChange={e => setNovoColaborador({ ...novoColaborador, phone: e.target.value })} required />
                    <input type="password" className="border rounded p-2" placeholder="Senha" value={novoColaborador.password} onChange={e => setNovoColaborador({ ...novoColaborador, password: e.target.value })} required />
                    {novoColaboradorError && <div className="text-red-500 text-sm text-center">{novoColaboradorError}</div>}
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-[#23281a] font-bold">Cancelar</button>
                      <button type="submit" className="px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-bold">Salvar</button>
                    </div>
                  </form>
                </Modal>
              </section>
            )}
            {tab === 'finalizados' && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#23281a]">Processos Finalizados</h2>
                  <button 
                    onClick={() => window.location.href = '/sindicato/processos-finalizados'}
                    className="px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-bold flex items-center gap-2"
                  >
                    Ver Todos
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20 text-[#23281a]">
                        <th className="px-4 py-2">Funcionário</th>
                        <th className="px-4 py-2">Empresa</th>
                        <th className="px-4 py-2">Motivo</th>
                        <th className="px-4 py-2">Data Início</th>
                        <th className="px-4 py-2">Data Finalização</th>
                        <th className="px-4 py-2">Assinaturas</th>
                        <th className="px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processosFinalizados.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-[#bfa15a] py-4">Nenhum processo finalizado encontrado.</td></tr>
                      ) : (
                        processosFinalizados.map(p => (
                          <tr key={p.id} className="border-b">
                            <td className="px-4 py-2">{p.nome_funcionario}</td>
                            <td className="px-4 py-2">{p.empresa_nome}</td>
                            <td className="px-4 py-2">{p.motivo}</td>
                            <td className="px-4 py-2">{new Date(p.data_inicio).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-2">
                              {p.data_termino ? new Date(p.data_termino).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs ${p.assinado_empresa ? 'text-green-600' : 'text-gray-400'}`}>
                                  {p.assinado_empresa ? '✅ Empresa' : '⏳ Empresa'}
                                </span>
                                <span className={`text-xs ${p.assinado_sindicato ? 'text-green-600' : 'text-gray-400'}`}>
                                  {p.assinado_sindicato ? '✅ Sindicato' : '⏳ Sindicato'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2 flex gap-2">
                              <button 
                                onClick={() => window.location.href = `/sindicato/documentacoes/${p.id}`}
                                className="px-3 py-1 rounded bg-[#bfa15a]/80 text-white font-bold hover:bg-[#bfa15a]"
                              >
                                Consultar
                              </button>
                              <button 
                                onClick={() => window.open(`/sindicato/documentacoes/${p.id}`, '_blank')}
                                className="px-3 py-1 rounded bg-blue-600/80 text-white font-bold hover:bg-blue-700"
                              >
                                Abrir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-[#bfa15a] mt-2">
                  Processos finalizados com sucesso. Clique em "Consultar" para ver detalhes completos.
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.7s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </AdminLayout>
  );
} 