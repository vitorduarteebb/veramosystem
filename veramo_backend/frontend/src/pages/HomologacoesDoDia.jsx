import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getUserInfo, getToken } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { 
  FaCalendarAlt, 
  FaVideo, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaBell,
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaSync,
  FaSearch,
  FaPlus,
  FaArrowRight,
  FaCalendarCheck,
  FaUserClock,
  FaClipboardList,
  FaTasks,
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
  FaDownload,
  FaShare,
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaExclamationCircle,
  FaQuestionCircle,
  FaCalendarPlus,
  FaUserTie,
  FaSignature
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Função para buscar homologações do dia
async function fetchHomologacoesHoje(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
    
  if (!unionId || isNaN(unionId)) {
    console.error('ID do sindicato inválido:', unionId);
    return [];
  }
  
  const response = await fetch(`${API_ENDPOINTS.SCHEDULES}?union=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const dataResp = await response.json();
  const agendamentos = Array.isArray(dataResp) ? dataResp : (Array.isArray(dataResp?.results) ? dataResp.results : []);
  
  // Filtrar apenas os de hoje
  const hoje = new Date().toDateString();
  return agendamentos.filter(h => new Date(h.date).toDateString() === hoje);
}

// Função para buscar processos de demissão pendentes
async function fetchProcessosPendentes(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  
  if (!unionId || isNaN(unionId)) {
    console.error('ID do sindicato inválido:', unionId);
    return [];
  }
  
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const dataProc = await response.json();
  const processos = Array.isArray(dataProc) ? dataProc : (Array.isArray(dataProc?.results) ? dataProc.results : []);
  
  // Filtrar apenas os pendentes (incluindo aguardando_aprovacao)
  return processos.filter(p => 
    p.status === 'aguardando_aprovacao' || 
    p.status === 'pendente_documentacao' ||
    p.status === 'aguardando_analise_documentacao'
  );
}

// Função para buscar todos os agendamentos (não apenas de hoje)
async function fetchTodosAgendamentos(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
    
  if (!unionId || isNaN(unionId)) {
    console.error('ID do sindicato inválido:', unionId);
    return [];
  }
  
  const response = await fetch(`${API_ENDPOINTS.SCHEDULES}?union=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    console.error('[DEBUG] fetchTodosAgendamentos - erro na resposta:', response.status, response.statusText);
    return [];
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

export default function HomologacoesDoDia() {
  const [homologacoes, setHomologacoes] = useState([]);
  const [processosPendentes, setProcessosPendentes] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('hoje');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [meetSaving, setMeetSaving] = useState(false);
  const [meetLinkValue, setMeetLinkValue] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [finalizandoReuniao, setFinalizandoReuniao] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const user = getUserInfo();
        const unionId = user?.union;
        
        if (!unionId || isNaN(unionId)) {
          setError('Usuário não possui um sindicato válido vinculado.');
          setLoading(false);
          return;
        }
        
        const [h, p, todos] = await Promise.all([
          fetchHomologacoesHoje(unionId),
          fetchProcessosPendentes(unionId),
          fetchTodosAgendamentos(unionId),
        ]);
        
        setHomologacoes(h);
        setProcessosPendentes(p);
        setTodosAgendamentos(todos);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao buscar dados do sindicato.');
      }
      setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };


  
  // Função para obter status visual
  const getStatusBadge = (status) => {
    switch (status) {
      case 'aguardando_aprovacao':
        return <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">Aguardando</span>;
      case 'aguardando_analise_documentacao':
        return <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Aguardando Análise</span>;
      case 'pendente_documentacao':
        return <span className="inline-block px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">Pendente Documentação</span>;
      case 'rejeitado_falta_documentacao':
        return <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Rejeitado</span>;
      case 'em_videoconferencia':
        return <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Videoconferência</span>;
      case 'assinatura_pendente':
        return <span className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">Assinatura</span>;
      case 'finalizado':
        return <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Finalizado</span>;
      default:
        return <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">{status}</span>;
    }
  };

  // Função para formatar hora
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Pega apenas HH:MM
  };

  // Função para filtrar dados
  const filteredData = () => {
    let data = activeTab === 'hoje' ? homologacoes : processosPendentes;
    
    if (searchTerm) {
      data = data.filter(item => 
        (item.employee_name || item.nome_funcionario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.empresa_nome || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'todos') {
      data = data.filter(item => item.status === filterStatus);
    }
    
    return data;
  };

  // Função para obter estatísticas
  const getStats = () => {
    const hoje = homologacoes.length;
    const pendentes = processosPendentes.length;
    const totalAgendamentos = todosAgendamentos.length;
    const emAndamento = homologacoes.filter(h => h.status === 'agendado').length;
    
    return { hoje, pendentes, totalAgendamentos, emAndamento };
  };

  const stats = getStats();

  const isValidMeetLink = (url) => {
    if (!url) return false;
    try {
      const u = String(url).trim();
      if (!u.startsWith('http')) return false;
      if (u === 'https://meet.google.com') return false; // placeholder
      return true;
    } catch (_) {
      return false;
    }
  };

  const openMeetModal = (schedule) => {
    setSelectedSchedule(schedule);
    setMeetLinkValue(schedule?.video_link || '');
    setMeetModalOpen(true);
  };

  const saveMeetLink = async () => {
    if (!selectedSchedule) return;
    try {
      setMeetSaving(true);
      const auth = JSON.parse(localStorage.getItem('@veramo_auth') || '{}');
      const token = auth?.access;
      const body = { video_link: meetLinkValue?.trim() };
      const resp = await fetch(`${API_ENDPOINTS.SCHEDULES}${selectedSchedule.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('Falha ao salvar link');
      setMeetModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Não foi possível salvar o link do Meet.');
    } finally {
      setMeetSaving(false);
    }
  };

  // Função para finalizar reunião
  async function finalizarReuniao(scheduleId) {
    console.log('🔧 [HOJE] Iniciando finalização da reunião para agendamento:', scheduleId);
    
    if (!confirm('Confirmar que a reunião foi finalizada? O processo passará para a etapa de assinatura dos documentos.')) {
      console.log('❌ [HOJE] Usuário cancelou a finalização');
      return;
    }

    console.log('✅ [HOJE] Usuário confirmou, iniciando processo...');
    setFinalizandoReuniao(scheduleId);
    
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      // Primeiro, buscar o agendamento para obter informações do funcionário
      const scheduleResponse = await fetch(`${API_ENDPOINTS.SCHEDULES}${scheduleId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!scheduleResponse.ok) {
        throw new Error('Erro ao buscar agendamento');
      }

      const schedule = await scheduleResponse.json();
      console.log('📋 [HOJE] Agendamento encontrado:', schedule);

      // Buscar o processo de demissão relacionado
      const userInfo = getUserInfo();
      const unionId = userInfo?.union;
      
      const processosResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${unionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!processosResponse.ok) {
        throw new Error('Erro ao buscar processos de demissão');
      }

      const processosData = await processosResponse.json();
      const processos = Array.isArray(processosData) ? processosData : (Array.isArray(processosData?.results) ? processosData.results : []);
      
      console.log('📊 [HOJE] Total de processos encontrados:', processos.length);
      console.log('👤 [HOJE] Nome do funcionário no agendamento:', schedule.employee_name);
      console.log('📋 [HOJE] Processos disponíveis:', processos.map(p => ({
        id: p.id,
        nome_funcionario: p.nome_funcionario,
        status: p.status
      })));
      
      // Encontrar o processo relacionado ao funcionário
      // Aceitar 'agendado', 'documentos_aprovados' e 'assinatura_pendente'
      const processoRelacionado = processos.find(p => 
        p.nome_funcionario === schedule.employee_name && 
        (p.status === 'agendado' || p.status === 'documentos_aprovados' || p.status === 'assinatura_pendente')
      );

      if (!processoRelacionado) {
        // Tentar encontrar por outros critérios
        const processoAlternativo = processos.find(p => 
          p.nome_funcionario === schedule.employee_name
        );
        
        if (processoAlternativo) {
          console.log('⚠️ [HOJE] Processo encontrado mas com status diferente:', processoAlternativo.status);
          throw new Error(`Processo encontrado mas com status '${processoAlternativo.status}'. Status válidos: 'agendado', 'documentos_aprovados' ou 'assinatura_pendente'`);
        } else {
          console.log('❌ [HOJE] Nenhum processo encontrado para este funcionário');
          throw new Error('Processo de demissão não encontrado para este funcionário');
        }
      }

      console.log('🔍 [HOJE] Processo relacionado encontrado:', processoRelacionado.id);
      console.log('📊 [HOJE] Status do processo:', processoRelacionado.status);

      // Se o processo já está em assinatura_pendente, redirecionar para assinatura
      if (processoRelacionado.status === 'assinatura_pendente') {
        console.log('📝 [HOJE] Processo já finalizado, redirecionando para assinatura...');
        navigate(`/sindicato/assinatura/${scheduleId}`);
        return;
      }

      console.log('🌐 [HOJE] URL da requisição:', `${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoRelacionado.id}/finalizar-reuniao/`);

      const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoRelacionado.id}/finalizar-reuniao/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [HOJE] Resposta recebida:', response.status, response.statusText);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <Sidebar />
      <div className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Melhorado */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-[#bfa15a] rounded-2xl">
                    <FaCalendarCheck className="text-white text-2xl" />
                  </div>
                  Painel do Sindicato
            </h1>
                <p className="text-[#23281a] text-xl font-medium">
                  Bem-vindo! Gerencie suas homologações e processos de forma eficiente.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-3 bg-white/90 hover:bg-white rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  <FaSync className={`text-[#bfa15a] text-xl ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="text-right">
                  <p className="text-[#23281a] font-semibold">
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-[#bfa15a] text-sm font-medium">
                    {new Date().toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas Melhorados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-xl border border-[#bfa15a]/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#23281a] text-sm font-semibold mb-1">Hoje</p>
                  <p className="text-4xl font-extrabold text-[#1a2a1a]">{stats.hoje}</p>
                  <p className="text-[#bfa15a] text-sm font-medium">Homologações</p>
                </div>
                <div className="p-4 bg-[#bfa15a]/20 rounded-2xl">
                  <FaCalendarAlt className="text-[#bfa15a] text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-xl border border-[#bfa15a]/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#23281a] text-sm font-semibold mb-1">Pendentes</p>
                  <p className="text-4xl font-extrabold text-[#1a2a1a]">{stats.pendentes}</p>
                  <p className="text-[#bfa15a] text-sm font-medium">Processos</p>
                </div>
                <div className="p-4 bg-red-100 rounded-2xl">
                  <FaClipboardList className="text-red-500 text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-xl border border-[#bfa15a]/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#23281a] text-sm font-semibold mb-1">Em Andamento</p>
                  <p className="text-4xl font-extrabold text-[#1a2a1a]">{stats.emAndamento}</p>
                  <p className="text-[#bfa15a] text-sm font-medium">Ativos</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <FaUserClock className="text-blue-500 text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-xl border border-[#bfa15a]/30 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#23281a] text-sm font-semibold mb-1">Total</p>
                  <p className="text-4xl font-extrabold text-[#1a2a1a]">{stats.totalAgendamentos}</p>
                  <p className="text-[#bfa15a] text-sm font-medium">Agendamentos</p>
                </div>
                <div className="p-4 bg-green-100 rounded-2xl">
                  <FaChartLine className="text-green-500 text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Navegação e Filtros */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Tabs */}
              <div className="flex bg-[#f5ecd7] rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('hoje')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'hoje' 
                      ? 'bg-[#bfa15a] text-white shadow-lg' 
                      : 'text-[#23281a] hover:bg-white/50'
                  }`}
                >
                  <FaCalendarAlt />
                  Hoje ({stats.hoje})
                </button>
                <button
                  onClick={() => setActiveTab('pendentes')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'pendentes' 
                      ? 'bg-[#bfa15a] text-white shadow-lg' 
                      : 'text-[#23281a] hover:bg-white/50'
                  }`}
                >
                  <FaClipboardList />
                  Pendentes ({stats.pendentes})
                </button>
          </div>

              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#bfa15a]" />
                  <input
                    type="text"
                    placeholder="Buscar funcionário ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-[#bfa15a]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  />
            </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-[#bfa15a]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                >
                  <option value="todos">Todos os status</option>
                  <option value="agendado">Agendado</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="aguardando_analise_documentacao">Aguardando Análise</option>
                  <option value="pendente_documentacao">Pendente Documentação</option>
                </select>
            </div>
            </div>
          </div>

          {/* Loading/Error */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-[#bfa15a] text-xl">
                <FaSync className="animate-spin" />
              Carregando dados...
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <FaExclamationCircle className="text-red-500 text-4xl mx-auto mb-4" />
              <p className="text-red-700 text-lg font-semibold">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lista de Itens */}
              {filteredData().length === 0 ? (
                <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-12 text-center">
                  <div className="text-[#bfa15a] text-6xl mb-4">
                    {activeTab === 'hoje' ? <FaCalendarAlt /> : <FaClipboardList />}
                </div>
                  <h3 className="text-2xl font-bold text-[#23281a] mb-2">
                    {activeTab === 'hoje' ? 'Nenhuma homologação hoje' : 'Nenhum processo pendente'}
                  </h3>
                  <p className="text-[#23281a] text-lg mb-6">
                    {activeTab === 'hoje' 
                      ? 'Aproveite para revisar processos pendentes' 
                      : 'Todos os processos estão em dia!'
                    }
                  </p>
                  <button
                    onClick={() => navigate('/sindicato/agendamentos')}
                    className="px-6 py-3 bg-[#bfa15a] hover:bg-[#23281a] text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <FaPlus />
                    Ver Todos os Agendamentos
                  </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredData().map((item, index) => (
                    <div key={index} className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                          <div className="p-3 bg-[#bfa15a]/20 rounded-xl">
                            {activeTab === 'hoje' ? (
                              <FaVideo className="text-[#bfa15a] text-xl" />
                            ) : (
                              <FaFileAlt className="text-[#bfa15a] text-xl" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#23281a] text-lg">
                              {item.employee_name || item.nome_funcionario || 'Funcionário'}
                            </h3>
                            {activeTab === 'hoje' && (
                              <p className="text-[#bfa15a] font-semibold">
                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                              </p>
                            )}
                        </div>
                      </div>
                        {getStatusBadge(item.status)}
                  </div>

                      {/* Informações de agendamento destacadas para hoje */}
                      {activeTab === 'hoje' && item.date && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                            <FaCalendarAlt className="text-green-600" />
                            <span className="font-bold">AGENDADO PELA EMPRESA</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-green-600" />
                              <span className="font-medium">Data:</span>
                              <span className="font-bold">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaClock className="text-green-600" />
                              <span className="font-medium">Hora:</span>
                              <span className="font-bold">{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <FaBuilding className="text-green-600" />
                            <span className="font-medium">Empresa:</span>
                            <span className="font-bold">{item.empresa_nome || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <FaUserTie className="text-green-600" />
                            <span className="font-medium">Homologador:</span>
                            <span className="font-bold">{item.homologador_nome || 'Sindicato Unidade 2'}</span>
                          </div>
                        </div>
                      )}

                      {/* Informações básicas para outros status */}
                      {activeTab !== 'hoje' && (
                        <div className="space-y-2 mb-4">
                          <p className="text-[#23281a]">
                            <strong>Empresa:</strong> {item.empresa_nome || 'N/A'}
                          </p>
                          {item.motivo && (
                            <p className="text-[#23281a]">
                              <strong>Motivo:</strong> {item.motivo}
                            </p>
                          )}
                          {item.homologador_nome && (
                            <p className="text-[#23281a]">
                              <strong>Homologador:</strong> 
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold ml-2">
                                {item.homologador_nome}
                              </span>
                            </p>
                          )}
                          {item.date && (
                            <p className="text-[#23281a]">
                              <strong>Data:</strong> {new Date(item.date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {activeTab === 'hoje' ? (
                          <>
                            {/* Botões só aparecem se NÃO estiver finalizado */}
                            {item.status !== 'finalizado' && (
                              <>
                                {/* Botão do Google Calendar */}
                                <button
                                  onClick={() => {
                                    const startDate = new Date(`${item.date}T${item.start_time}`);
                                    const endDate = new Date(`${item.date}T${item.end_time}`);
                                    
                                    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Homologação - ${item.employee_name || item.nome_funcionario}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Homologação de demissão para ${item.employee_name || item.nome_funcionario} da empresa ${item.empresa_nome}&location=${item.video_link || 'Google Meet'}`;
                                    
                                    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                  title="Adicionar ao Google Calendar"
                                >
                                  <FaCalendarPlus />
                                  <span>Definir Link</span>
                                </button>

                                <button className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2">
                                  <FaPlay />
                                  Iniciar
                                </button>
                                {isValidMeetLink(item.video_link) ? (
                                  <a
                                    href={item.video_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                  >
                                    <FaVideo />
                                    <span>Iniciar</span>
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => openMeetModal(item)}
                                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                  >
                                    <FaVideo />
                                    Definir link
                                  </button>
                                )}
                                {/* Botão Finalizar */}
                                <button 
                                  onClick={() => {
                                    console.log('🖱️ [HOJE] Botão Finalizar clicado para processo:', item.id);
                                    finalizarReuniao(item.id);
                                  }}
                                  disabled={finalizandoReuniao === item.id}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                >
                                  {finalizandoReuniao === item.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Finalizando...
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle />
                                      Finalizar
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                            
                            {/* Se estiver finalizado, mostrar botão para assinatura */}
                            {item.status === 'finalizado' && (
                              <button 
                                onClick={() => {
                                  console.log('📝 [HOJE] Redirecionando para assinatura do processo:', item.id);
                                  navigate(`/sindicato/assinatura/${item.id}`);
                                }}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                              >
                                <FaSignature />
                                Assinar Documento
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                          <button 
                              onClick={() => navigate(`/sindicato/analise/${item.id}`)}
                              className="px-4 py-2 bg-[#bfa15a] hover:bg-[#23281a] text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                          >
                              <FaEye />
                            Analisar
                          </button>
                            <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2">
                              <FaFileAlt />
                              Documentos
                            </button>
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2">
                              <FaInfoCircle />
                              Detalhes
                            </button>
                          </>
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Definir link do Meet */}
      {meetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#23281a] flex items-center gap-2">
                <FaVideo className="text-[#bfa15a]" />
                Definir link do Google Meet
              </h3>
              <button
                onClick={() => setMeetModalOpen(false)}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#23281a]">URL do Meet</label>
              <input
                type="url"
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                value={meetLinkValue}
                onChange={(e) => setMeetLinkValue(e.target.value)}
                className="w-full border border-[#bfa15a]/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
              />
              <p className="text-sm text-gray-500">
                Dica: crie o evento no Google Calendar com Google Meet e cole aqui o link gerado.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setMeetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={saveMeetLink}
                disabled={meetSaving || !meetLinkValue}
                className="px-4 py-2 rounded-lg bg-[#bfa15a] hover:bg-[#23281a] text-white disabled:opacity-50"
              >
                {meetSaving ? 'Salvando...' : 'Salvar link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 