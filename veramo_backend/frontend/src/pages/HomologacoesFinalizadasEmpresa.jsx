import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaEye, FaCalendarAlt, FaBuilding, FaUser, FaCheckCircle } from 'react-icons/fa';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';

function EmpresaSidebar({ open, setOpen }) {
  const user = getUserInfo();
  const isCompanyMaster = user?.role === 'company_master';
  
  const menu = [
    { label: 'Dashboard', path: '/empresa/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
    ) },
    { label: 'Agendamentos', path: '/empresa/agendamentos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ) },
    { label: 'Homologações Finalizadas', path: '/empresa/homologacoes-finalizadas', icon: (
      <svg className="w-5 h-5" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    ) },
  ];
  
  // Adicionar "Funcionários" apenas para company_master
  if (isCompanyMaster) {
    menu.push({
      label: 'Funcionários', 
      path: '/empresa/usuarios', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    });
  }
  
  return (
    <aside className={`h-screen bg-[#1a2a1a] text-[#bfa15a] shadow-lg flex flex-col transition-all duration-300 fixed left-0 top-0 z-30 ${open ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#bfa15a]/20">
        <div className="flex items-center gap-2">
          <img src="/veramo_logo.png" alt="Logo Veramo" className={`transition-all duration-300 ${open ? 'w-12 h-12' : 'w-8 h-8'} object-contain`} />
          {open && <span className="text-base font-medium">VERAMO</span>}
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-[#bfa15a] focus:outline-none ml-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {menu.map(item => (
            <li key={item.label}>
              <a href={item.path} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#bfa15a]/10 transition-colors group">
                <span className="text-[#bfa15a]">{item.icon}</span>
                {open && <span className="text-base font-medium">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default function HomologacoesFinalizadasEmpresa() {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFuncionario, setFilterFuncionario] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchHomologacoesFinalizadas();
  }, []);

  const fetchHomologacoesFinalizadas = async () => {
    setLoading(true);
    try {
      const user = getUserInfo();
      const companyId = user?.company;
      
      if (!companyId) {
        setError('Usuário não possui empresa vinculada');
        setLoading(false);
        return;
      }

      const tokens = getToken();
      const access = tokens?.access;

      // Aceitar tanto ?empresa quanto ?company (compat)
      const url1 = `${API_ENDPOINTS.DEMISSAO_PROCESSES}?empresa=${companyId}`;
      const url2 = `${API_ENDPOINTS.DEMISSAO_PROCESSES}?company=${companyId}`;

      let response = await fetch(url1, {
        headers: {
          'Authorization': `Bearer ${access}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        response = await fetch(url2, {
          headers: {
            'Authorization': `Bearer ${access}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Tenta refresh se 401
      if (response.status === 401) {
        const newAccess = await refreshToken();
        if (!newAccess) {
          logout();
          throw new Error('Sessão expirada');
        }
        response = await fetch(url1, {
          headers: {
            'Authorization': `Bearer ${newAccess}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          response = await fetch(url2, {
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
          });
        }
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar processos');
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      // Filtrar apenas processos finalizados
      const finalizados = items.filter(p => p.status === 'finalizado');
      setProcessos(finalizados);
    } catch (err) {
      setError('Erro ao carregar homologações finalizadas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar processos baseado nos filtros
  const filteredProcessos = processos.filter(processo => {
    const matchesSearch = processo.nome_funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         processo.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFuncionario = !filterFuncionario || processo.nome_funcionario.toLowerCase().includes(filterFuncionario.toLowerCase());
    
    const matchesDate = !filterDate || new Date(processo.data_termino).toLocaleDateString('pt-BR').includes(filterDate);
    
    return matchesSearch && matchesFuncionario && matchesDate;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleConsultar = (processoId) => {
    navigate(`/empresa/agendamentos/${processoId}`);
  };

  const handleAbrirNovaAba = (processoId) => {
    window.open(`/empresa/agendamentos/${processoId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando homologações finalizadas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <EmpresaSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 md:p-8`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1a2a1a] mb-2">Homologações Finalizadas</h1>
              <p className="text-gray-600">Consulta de processos de demissão finalizados da empresa</p>
            </div>
            <button
              onClick={() => navigate('/empresa/dashboard')}
              className="px-4 py-2 bg-gray-200 text-[#23281a] rounded-lg font-bold hover:bg-gray-300 transition"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/90 rounded-xl shadow-sm p-6 mb-6">
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
                  placeholder="Funcionário ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
              <input
                type="text"
                placeholder="Filtrar por funcionário..."
                value={filterFuncionario}
                onChange={(e) => setFilterFuncionario(e.target.value)}
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
          <div className="bg-white/90 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Finalizadas</p>
                <p className="text-2xl font-bold text-[#23281a]">{processos.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-sm p-6">
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
          
          <div className="bg-white/90 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionários Únicos</p>
                <p className="text-2xl font-bold text-[#23281a]">
                  {new Set(processos.map(p => p.nome_funcionario)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FaUser className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-[#23281a]">
                  {processos.length > 0 ? '100%' : '0%'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FaCheckCircle className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Processos */}
        <div className="bg-white/90 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#23281a]">
              Homologações Finalizadas ({filteredProcessos.length})
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
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">Nenhuma homologação finalizada encontrada</p>
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
  );
} 