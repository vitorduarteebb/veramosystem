import React, { useEffect, useState } from 'react';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { FaPlus, FaVideo, FaExternalLinkAlt, FaCalendarAlt, FaUsers, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import EmpresaSidebar from '../components/EmpresaSidebar';
import TopMenu from '../components/TopMenu';
import AgendamentoCard from '../components/AgendamentoCard';
import AgendamentoStats from '../components/AgendamentoStats';
import SearchAndFilter from '../components/SearchAndFilter';

export default function AgendamentosEmpresa() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('data_desc');
  
  const userInfo = getUserInfo();
  const navigate = useNavigate();

  // Verificar se o usuário tem empresa vinculada
  if (!userInfo || !userInfo.company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-white/20">
          <h2 className="text-2xl font-bold text-[#1a2a1a] mb-4">Erro de Configuração</h2>
          <p className="text-[#23281a] mb-4">Seu usuário não está vinculado a uma empresa.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-[#bfa15a] to-[#a68b4a] text-white rounded-lg hover:from-[#a68b4a] hover:to-[#8b6f3a] transition-all duration-300 font-medium"
          >
            Fazer Login Novamente
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  useEffect(() => {
    filterAndSortAgendamentos();
  }, [agendamentos, searchTerm, statusFilter, sortBy]);

  const fetchAgendamentos = async () => {
    const tokens = getToken();
    
    try {
      const apiUrl = `${API_ENDPOINTS.DEMISSAO_PROCESSES}?empresa=${userInfo.company}`;
      
      let resp = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          resp = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Erro ${resp.status}: ${errorText}`);
      }
      
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      setAgendamentos(items);
      setLoading(false);
    } catch (err) {
      if (err.message === '401') {
        logout();
        window.location.href = '/login';
      } else {
        setError(`Erro ao buscar agendamentos: ${err.message}`);
      }
      setLoading(false);
    }
  };

  const filterAndSortAgendamentos = () => {
    let filtered = [...agendamentos];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(agendamento =>
        agendamento.nome_funcionario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agendamento.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agendamento.exame?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(agendamento => agendamento.status === statusFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'data_desc':
          return new Date(b.data_inicio || 0) - new Date(a.data_inicio || 0);
        case 'data_asc':
          return new Date(a.data_inicio || 0) - new Date(b.data_inicio || 0);
        case 'nome_asc':
          return (a.nome_funcionario || '').localeCompare(b.nome_funcionario || '');
        case 'nome_desc':
          return (b.nome_funcionario || '').localeCompare(a.nome_funcionario || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    setFilteredAgendamentos(filtered);
  };

  const handleCardClick = (agendamentoId) => {
    navigate(`/empresa/agendamentos/${agendamentoId}`);
  };

  const handleVideoClick = (e, agendamento) => {
    e.stopPropagation();
    if (agendamento.video_link) {
      const link = agendamento.video_link.startsWith('http') 
        ? agendamento.video_link 
        : `https://${agendamento.video_link.replace(/^\/+/, '')}`;
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const agendados = agendamentos.filter(a => a.status === 'agendado');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 md:p-8`}>
        <TopMenu sidebarOpen={sidebarOpen} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#1a2a1a] mb-2">
                Agendamentos da Empresa 📅
              </h1>
              <p className="text-lg text-[#23281a]/80">
                Gerencie todos os agendamentos e homologações da sua empresa
              </p>
            </div>
            <button
              onClick={() => navigate('/empresa/agendamentos/novo')}
              className="bg-gradient-to-r from-[#bfa15a] to-[#a68b4a] hover:from-[#a68b4a] hover:to-[#8b6f3a] text-white px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 hover:shadow-lg transform hover:-translate-y-1"
            >
              <FaPlus className="w-5 h-5" />
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <AgendamentoStats agendamentos={agendamentos} />

        {/* Agendamentos Ativos - Destaque */}
        {!loading && agendados.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500 rounded-full p-3">
                <FaVideo className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">
                  Homologações Agendadas
                  <span className="ml-3 bg-green-500 text-white px-3 py-1 rounded-full text-lg">
                    {agendados.length}
                  </span>
                </h2>
                <p className="text-green-600">Acesse rapidamente suas videoconferências agendadas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agendados.slice(0, 6).map((agendamento) => (
                <AgendamentoCard
                  key={agendamento.id}
                  agendamento={agendamento}
                  onClick={handleCardClick}
                  onVideoClick={handleVideoClick}
                />
              ))}
            </div>
            
            {agendados.length > 6 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setStatusFilter('agendado')}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Ver todos os {agendados.length} agendamentos →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filtros e Busca */}
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Lista de Agendamentos */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1a2a1a]">
              Todos os Agendamentos
              {filteredAgendamentos.length !== agendamentos.length && (
                <span className="ml-2 text-sm text-gray-600">
                  ({filteredAgendamentos.length} de {agendamentos.length})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaChartBar className="w-4 h-4" />
              <span>Total: {agendamentos.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
              <p className="text-[#1a2a1a] text-lg">Carregando agendamentos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : filteredAgendamentos.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento encontrado'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece criando seu primeiro agendamento'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => navigate('/empresa/agendamentos/novo')}
                  className="bg-gradient-to-r from-[#bfa15a] to-[#a68b4a] hover:from-[#a68b4a] hover:to-[#8b6f3a] text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <FaPlus className="w-4 h-4" />
                  Criar Primeiro Agendamento
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgendamentos.map((agendamento) => (
                <AgendamentoCard
                  key={agendamento.id}
                  agendamento={agendamento}
                  onClick={handleCardClick}
                  onVideoClick={handleVideoClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botão de ação rápida no rodapé */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/empresa/agendamentos/novo')}
            className="bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] hover:from-[#a68b4a] hover:via-[#1a1a1a] hover:to-[#0f0f0f] text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
          >
            <FaPlus className="w-5 h-5" />
            Iniciar Novo Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
