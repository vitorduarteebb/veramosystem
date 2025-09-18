import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaEye, FaCalendarAlt, FaBuilding, FaUser } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { getUserInfo } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';

export default function ProcessosFinalizados() {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchProcessosFinalizados();
  }, []);

  const fetchProcessosFinalizados = async () => {
    setLoading(true);
    try {
      const user = getUserInfo();
      const unionId = user?.union;
      
      if (!unionId) {
        setError('Usuário não possui sindicato vinculado');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${unionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar processos');
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      // Filtrar apenas processos finalizados
      const finalizados = items.filter(p => p.status === 'finalizado');
      setProcessos(finalizados);
    } catch (err) {
      setError('Erro ao carregar processos finalizados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar processos baseado nos filtros
  const filteredProcessos = processos.filter(processo => {
    const matchesSearch = processo.nome_funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         processo.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         processo.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEmpresa = !filterEmpresa || processo.empresa_nome.toLowerCase().includes(filterEmpresa.toLowerCase());
    
    const matchesDate = !filterDate || new Date(processo.data_termino).toLocaleDateString('pt-BR').includes(filterDate);
    
    return matchesSearch && matchesEmpresa && matchesDate;
  });

  const getStatusBadge = (status) => {
    return (
      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
        Finalizado
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleConsultar = (processoId) => {
    navigate(`/sindicato/documentacoes/${processoId}`);
  };

  const handleAbrirNovaAba = (processoId) => {
    window.open(`/sindicato/documentacoes/${processoId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando processos finalizados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#23281a] mb-2">Processos Finalizados</h1>
                <p className="text-gray-600">Consulta de processos de demissão finalizados</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 text-[#23281a] rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Voltar
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#23281a] mb-4 flex items-center gap-2">
              <FaFilter className="text-[#bfa15a]" />
              Filtros e Busca
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Funcionário, empresa ou motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <input
                  type="text"
                  placeholder="Filtrar por empresa..."
                  value={filterEmpresa}
                  onChange={(e) => setFilterEmpresa(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Finalização</label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA..."
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Finalizados</p>
                  <p className="text-2xl font-bold text-[#23281a]">{processos.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FaCalendarAlt className="text-green-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold text-[#23281a]">
                    {processos.filter(p => {
                      const hoje = new Date();
                      const dataProcesso = new Date(p.data_termino);
                      return dataProcesso.getMonth() === hoje.getMonth() && 
                             dataProcesso.getFullYear() === hoje.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaCalendarAlt className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Empresas Únicas</p>
                  <p className="text-2xl font-bold text-[#23281a]">
                    {new Set(processos.map(p => p.empresa_nome)).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FaBuilding className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Funcionários</p>
                  <p className="text-2xl font-bold text-[#23281a]">
                    {new Set(processos.map(p => p.nome_funcionario)).size}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FaUser className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Processos */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#23281a]">
                Processos Finalizados ({filteredProcessos.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Início
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Finalização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assinaturas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProcessos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium">Nenhum processo finalizado encontrado</p>
                          <p className="text-sm">Tente ajustar os filtros de busca</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProcessos.map((processo) => (
                      <tr key={processo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#bfa15a] flex items-center justify-center">
                                <FaUser className="text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {processo.nome_funcionario}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{processo.empresa_nome}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{processo.motivo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(processo.data_inicio)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(processo.data_termino)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs ${processo.assinado_empresa ? 'text-green-600' : 'text-gray-400'}`}>
                              {processo.assinado_empresa ? '✅ Empresa' : '⏳ Empresa'}
                            </span>
                            <span className={`text-xs ${processo.assinado_sindicato ? 'text-green-600' : 'text-gray-400'}`}>
                              {processo.assinado_sindicato ? '✅ Sindicato' : '⏳ Sindicato'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConsultar(processo.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-[#bfa15a] hover:bg-[#23281a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bfa15a]"
                            >
                              <FaEye className="mr-1" />
                              Consultar
                            </button>
                            <button
                              onClick={() => handleAbrirNovaAba(processo.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <FaDownload className="mr-1" />
                              Abrir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 