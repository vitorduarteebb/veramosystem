import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarCheck, 
  FaClipboardCheck, 
  FaSearch, 
  FaTimes, 
  FaEye, 
  FaDownload, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaClock,
  FaFileAlt,
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaFilter,
  FaSort,
  FaSync
} from 'react-icons/fa';

export default function DocumentacoesSindicato() {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI/UX States
  const [tab, setTab] = useState('todos'); // 'todos' | 'aprovados' | 'pendentes' | 'rejeitados'
  const [search, setSearch] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [pagina, setPagina] = useState(1);
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const porPagina = 12;

  // Modals
  const [selectedProcesso, setSelectedProcesso] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [modalRecusa, setModalRecusa] = useState(false);

  // Auto-refresh
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchProcessos();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchProcessos();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchProcessos() {
    setLoading(true);
    const tokens = getToken();
    try {
      if (!tokens.union || isNaN(tokens.union)) {
        setError('Usuário não possui um sindicato válido vinculado.');
        setLoading(false);
        return;
      }
      
      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${tokens.union}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!resp.ok) throw new Error('Erro ao buscar processos');
      
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      setProcessos(items);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Erro ao buscar solicitações.');
    } finally {
      setLoading(false);
    }
  }

  // Categorização dos processos
  const processosCategorizados = useMemo(() => {
    const aprovados = processos.filter(p => ['documentos_aprovados', 'aguardando_agendamento'].includes(p.status));
    const pendentes = processos.filter(p => ['aguardando_aprovacao', 'pendente_documentacao', 'analise_documentacao'].includes(p.status));
    const rejeitados = processos.filter(p => ['documentacao_rejeitada'].includes(p.status));
    const agendados = processos.filter(p => ['agendado', 'em_videoconferencia'].includes(p.status));
    const finalizados = processos.filter(p => ['finalizado', 'assinado'].includes(p.status));

    return {
      todos: processos,
      aprovados,
      pendentes,
      rejeitados,
      agendados,
      finalizados
    };
  }, [processos]);

  // Filtros e busca
  const listaFiltrada = useMemo(() => {
    let base = processosCategorizados[tab];
    
    // Filtro por busca
    if (search) {
      base = base.filter(p => {
        const nome = (p.nome_funcionario || p.employee_name || '').toLowerCase();
        const empresa = (p.empresa_nome || p.company_name || '').toLowerCase();
        const motivo = (p.motivo || '').toLowerCase();
        const busca = search.toLowerCase();
        return nome.includes(busca) || empresa.includes(busca) || motivo.includes(busca);
      });
    }

    // Filtro por empresa
    if (empresaFiltro) {
      base = base.filter(p => {
        const empresa = (p.empresa_nome || p.company_name || '').toLowerCase();
        return empresa.includes(empresaFiltro.toLowerCase());
      });
    }

    // Filtro por status
    if (statusFiltro !== 'all') {
      base = base.filter(p => p.status === statusFiltro);
    }

    // Filtro por hoje
    if (showOnlyToday) {
      const hoje = new Date().toDateString();
      base = base.filter(p => {
        const dataProcesso = new Date(p.created_at || p.updated_at).toDateString();
        return dataProcesso === hoje;
      });
    }

    // Ordenação
    base.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
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

    return base;
  }, [processosCategorizados, tab, search, empresaFiltro, statusFiltro, showOnlyToday, sortBy]);

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / porPagina));
  const paginaCorrigida = Math.min(pagina, totalPaginas);
  const itensPaginados = useMemo(() => 
    listaFiltrada.slice((paginaCorrigida - 1) * porPagina, paginaCorrigida * porPagina),
    [listaFiltrada, paginaCorrigida]
  );

  // Função para obter badge de status
  const getStatusBadge = (status) => {
    const statusMap = {
      'aguardando_aprovacao': { color: 'bg-yellow-100 text-yellow-800', label: 'Aguardando Aprovação', icon: FaClock },
      'pendente_documentacao': { color: 'bg-orange-100 text-orange-800', label: 'Pendente Documentação', icon: FaFileAlt },
      'analise_documentacao': { color: 'bg-blue-100 text-blue-800', label: 'Em Análise', icon: FaEye },
      'documentos_aprovados': { color: 'bg-green-100 text-green-800', label: 'Documentos Aprovados', icon: FaCheckCircle },
      'aguardando_agendamento': { color: 'bg-purple-100 text-purple-800', label: 'Aguardando Agendamento', icon: FaCalendarAlt },
      'agendado': { color: 'bg-indigo-100 text-indigo-800', label: 'Agendado', icon: FaCalendarCheck },
      'em_videoconferencia': { color: 'bg-cyan-100 text-cyan-800', label: 'Em Videoconferência', icon: FaCalendarCheck },
      'documentacao_rejeitada': { color: 'bg-red-100 text-red-800', label: 'Documentação Rejeitada', icon: FaExclamationTriangle },
      'finalizado': { color: 'bg-gray-100 text-gray-800', label: 'Finalizado', icon: FaCheckCircle },
      'assinado': { color: 'bg-green-100 text-green-800', label: 'Assinado', icon: FaCheckCircle }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: FaFileAlt };
    const IconComponent = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        <IconComponent className="w-3 h-3" />
        {statusInfo.label}
      </span>
    );
  };

  // Função para obter prioridade
  const getPriority = (processo) => {
    const hoje = new Date();
    const dataProcesso = new Date(processo.created_at);
    const diasDiff = Math.floor((hoje - dataProcesso) / (1000 * 60 * 60 * 24));
    
    if (diasDiff > 7) return { level: 'high', label: 'Alta', color: 'text-red-600' };
    if (diasDiff > 3) return { level: 'medium', label: 'Média', color: 'text-yellow-600' };
    return { level: 'low', label: 'Baixa', color: 'text-green-600' };
  };

  // Ações
  const handleVerDetalhes = (processo) => {
    setSelectedProcesso(processo);
    setShowDetailsModal(true);
  };

  const handleAnalisar = (id) => navigate(`/sindicato/analise/${id}`);
  const handleAgendar = (id) => navigate(`/sindicato/agendar/${id}`);

  const clearFilters = () => {
    setSearch('');
    setEmpresaFiltro('');
    setStatusFiltro('all');
    setShowOnlyToday(false);
    setPagina(1);
  };

  const tabs = [
    { key: 'todos', label: 'Todos', count: processosCategorizados.todos.length, color: 'bg-gray-500' },
    { key: 'pendentes', label: 'Pendentes', count: processosCategorizados.pendentes.length, color: 'bg-yellow-500' },
    { key: 'aprovados', label: 'Aprovados', count: processosCategorizados.aprovados.length, color: 'bg-green-500' },
    { key: 'rejeitados', label: 'Rejeitados', count: processosCategorizados.rejeitados.length, color: 'bg-red-500' },
    { key: 'agendados', label: 'Agendados', count: processosCategorizados.agendados.length, color: 'bg-blue-500' },
    { key: 'finalizados', label: 'Finalizados', count: processosCategorizados.finalizados.length, color: 'bg-gray-600' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 max-w-7xl mx-auto ml-0 md:ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentações de Homologações</h1>
            <p className="text-gray-600 mt-2">Gerencie e analise as documentações dos processos de homologação</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <FaSync className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-xs text-gray-500">
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {tabs.map(tabInfo => (
            <div key={tabInfo.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{tabInfo.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{tabInfo.count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${tabInfo.color}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
            {tabs.map(tabInfo => (
              <button
                key={tabInfo.key}
                onClick={() => { setTab(tabInfo.key); setPagina(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === tabInfo.key 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tabInfo.label} ({tabInfo.count})
              </button>
            ))}
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPagina(1); }}
                  placeholder="Buscar por funcionário, empresa ou motivo..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <input
                value={empresaFiltro}
                onChange={e => { setEmpresaFiltro(e.target.value); setPagina(1); }}
                placeholder="Filtrar por empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <select
                value={statusFiltro}
                onChange={e => { setStatusFiltro(e.target.value); setPagina(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                <option value="pendente_documentacao">Pendente Documentação</option>
                <option value="analise_documentacao">Em Análise</option>
                <option value="documentos_aprovados">Documentos Aprovados</option>
                <option value="aguardando_agendamento">Aguardando Agendamento</option>
                <option value="agendado">Agendado</option>
                <option value="em_videoconferencia">Em Videoconferência</option>
                <option value="documentacao_rejeitada">Documentação Rejeitada</option>
                <option value="finalizado">Finalizado</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowOnlyToday(!showOnlyToday)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showOnlyToday 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  Só Hoje
                </button>
                {(search || empresaFiltro || statusFiltro !== 'all' || showOnlyToday) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <FaSort className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Ordenar por:</span>
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="date_desc">Data (mais recente)</option>
                <option value="date_asc">Data (mais antiga)</option>
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="nome_desc">Nome (Z-A)</option>
                <option value="empresa_asc">Empresa (A-Z)</option>
                <option value="empresa_desc">Empresa (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Processos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando processos...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FaExclamationTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : itensPaginados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaFileAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum processo encontrado</h3>
            <p className="text-gray-600 mb-4">Ajuste os filtros para ver mais resultados</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itensPaginados.map(processo => {
              const priority = getPriority(processo);
              return (
                <div key={processo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FaUser className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900 truncate">
                            {processo.nome_funcionario || processo.employee_name || 'Nome não informado'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaBuilding className="w-4 h-4" />
                          <span className="truncate">
                            {processo.empresa_nome || processo.company_name || 'Empresa não informada'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(processo.status)}
                        <span className={`text-xs font-medium ${priority.color}`}>
                          Prioridade: {priority.label}
                        </span>
                      </div>
                    </div>

                    {/* Informações do Processo */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Criado em: {new Date(processo.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {processo.motivo && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Motivo:</span> {processo.motivo}
                        </div>
                      )}
                      {processo.cargo_funcionario && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Cargo:</span> {processo.cargo_funcionario}
                        </div>
                      )}
                    </div>

                    {/* Documentos */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaFileAlt className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Documentos</span>
                        <span className="text-xs text-gray-500">
                          ({processo.documents?.length || 0} enviados)
                        </span>
                      </div>
                      {processo.documents && processo.documents.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {processo.documents.slice(0, 3).map((doc, index) => (
                            <span
                              key={index}
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                doc.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                                doc.status === 'RECUSADO' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {doc.type || 'Documento'}
                            </span>
                          ))}
                          {processo.documents.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{processo.documents.length - 3} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerDetalhes(processo)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <FaEye className="w-4 h-4 inline mr-1" />
                        Ver Detalhes
                      </button>
                      
                      {['aguardando_aprovacao', 'pendente_documentacao', 'analise_documentacao'].includes(processo.status) && (
                        <button
                          onClick={() => handleAnalisar(processo.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Analisar
                        </button>
                      )}
                      
                      {['documentos_aprovados', 'aguardando_agendamento'].includes(processo.status) && (
                        <button
                          onClick={() => handleAgendar(processo.id)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          Agendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {itensPaginados.length > 0 && (
          <div className="flex items-center justify-between mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">
              Mostrando {((paginaCorrigida - 1) * porPagina) + 1} a {Math.min(paginaCorrigida * porPagina, listaFiltrada.length)} de {listaFiltrada.length} processos
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={paginaCorrigida === 1}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Página {paginaCorrigida} de {totalPaginas}
              </span>
              <button
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={paginaCorrigida === totalPaginas}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              >
                Próxima
              </button>
            </div>
          </div>
        )}

        {/* Modal de Detalhes */}
        <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
          {selectedProcesso && (
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Processo</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informações Básicas</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Funcionário:</span> {selectedProcesso.nome_funcionario}</div>
                    <div><span className="font-medium">Empresa:</span> {selectedProcesso.empresa_nome}</div>
                    <div><span className="font-medium">Cargo:</span> {selectedProcesso.cargo_funcionario || 'Não informado'}</div>
                    <div><span className="font-medium">Motivo:</span> {selectedProcesso.motivo}</div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedProcesso.status)}</div>
                    <div><span className="font-medium">Criado em:</span> {new Date(selectedProcesso.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>

                {/* Documentos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Documentos Enviados</h3>
                  {selectedProcesso.documents && selectedProcesso.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProcesso.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FaFileAlt className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{doc.type || 'Documento'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaDownload className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhum documento enviado</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleVerDetalhes(selectedProcesso);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Ver Processo Completo
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}