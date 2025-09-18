import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUsers, FaBuilding, FaClipboardList, FaHistory, FaIdCard, FaLink, FaUnlink, FaPlus, FaUserPlus, FaTimes, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaChartLine, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaUserTie, FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload } from 'react-icons/fa';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

async function fetchEmpresa(id) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.COMPANIES}${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erro ao buscar empresa');
  return await response.json();
}

async function fetchUsuarios(companyId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.USERS}?company=${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

async function fetchSindicatos(companyId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.COMPANY_UNIONS}?company=${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const dataV = await response.json();
  const vinculos = Array.isArray(dataV) ? dataV : (Array.isArray(dataV?.results) ? dataV.results : []);
  // Buscar dados dos sindicatos
  const sindicatos = [];
  for (const v of vinculos) {
    const resp = await fetch(`${API_ENDPOINTS.UNIONS}${v.union}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (resp.ok) sindicatos.push(await resp.json());
  }
  return sindicatos;
}

async function fetchHomologacoes(companyId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.SCHEDULES}?company=${companyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

async function fetchAllSindicatos() {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(API_ENDPOINTS.UNIONS, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

async function criarUsuario(companyId, userData) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(API_ENDPOINTS.USERS, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...userData,
      company: companyId,
      role: 'company_common'
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.email || errorData.username || errorData.non_field_errors || 'Erro ao criar usuário';
    throw new Error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
  }
  return await response.json();
}

function Badge({ children, color = 'bg-[#bfa15a]/80', text = 'text-white' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color} ${text} mr-1`}>{children}</span>
  );
}

export default function EmpresaDetalhes() {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [sindicatos, setSindicatos] = useState([]);
  const [homologacoes, setHomologacoes] = useState([]);
  const [allSindicatos, setAllSindicatos] = useState([]);
  const [sindicatoParaVincular, setSindicatoParaVincular] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [desvinculando, setDesvinculando] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formUsuario, setFormUsuario] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchEmpresa(id),
      fetchUsuarios(id),
      fetchSindicatos(id),
      fetchHomologacoes(id),
      fetchAllSindicatos(),
    ])
      .then(([e, u, s, h, allS]) => {
        setEmpresa(e);
        setUsuarios(u);
        setSindicatos(s);
        setHomologacoes(h);
        setAllSindicatos(allS);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar dados da empresa.');
        setLoading(false);
      });
  }, [id]);

  // Gráfico de homologações por mês
  function getHomologacoesPorMes(homologacoes) {
    const meses = {};
    homologacoes.forEach(h => {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses[key] = (meses[key] || 0) + 1;
    });
    const labels = Object.keys(meses).sort();
    const data = labels.map(l => meses[l]);
    return { labels, data };
  }
  const { labels, data } = getHomologacoesPorMes(homologacoes);
  const chartData = {
    labels: labels.map(l => l.replace('-', '/')),
    datasets: [
      {
        label: 'Homologações',
        data,
        backgroundColor: '#bfa15a',
        borderRadius: 8,
      },
    ],
  };
  const chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { stepSize: 1 } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  async function handleVincularSindicato() {
    if (!sindicatoParaVincular) return;
    setVinculando(true);
    const token = localStorage.getItem('@veramo_auth')
      ? JSON.parse(localStorage.getItem('@veramo_auth')).access
      : null;
    try {
      const resp = await fetch(API_ENDPOINTS.COMPANY_UNIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: id, union: sindicatoParaVincular }),
      });
      if (!resp.ok) throw new Error('Erro ao vincular sindicato');
      // Atualizar lista de sindicatos
      const novosSindicatos = await fetchSindicatos(id);
      setSindicatos(novosSindicatos);
      setSindicatoParaVincular('');
    } catch {
      alert('Erro ao vincular sindicato');
    } finally {
      setVinculando(false);
    }
  }

  async function handleDesvincularSindicato(sindicatoId) {
    setDesvinculando(sindicatoId);
    const token = localStorage.getItem('@veramo_auth')
      ? JSON.parse(localStorage.getItem('@veramo_auth')).access
      : null;
    try {
      // Descobrir o id do vínculo (company-union) para deletar
      const resp = await fetch(`${API_ENDPOINTS.COMPANY_UNIONS}?company=${id}&union=${sindicatoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) throw new Error('Erro ao buscar vínculo');
      const data = await resp.json();
      const vinculos = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      if (vinculos.length === 0) throw new Error('Vínculo não encontrado');
      const vinculoId = vinculos[0].id;
      const delResp = await fetch(`${API_ENDPOINTS.COMPANY_UNIONS}${vinculoId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!delResp.ok) throw new Error('Erro ao desvincular sindicato');
      // Atualizar lista de sindicatos
      const novosSindicatos = await fetchSindicatos(id);
      setSindicatos(novosSindicatos);
    } catch {
      alert('Erro ao desvincular sindicato');
    } finally {
      setDesvinculando('');
    }
  }

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    if (!formUsuario.username || !formUsuario.email || !formUsuario.password || !formUsuario.first_name || !formUsuario.last_name) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    // Validar formato do username (apenas letras, números e @/./+/-/_)
    const usernameRegex = /^[a-zA-Z0-9@.+\-_]+$/;
    if (!usernameRegex.test(formUsuario.username)) {
      setError('Nome de usuário pode conter apenas letras, números e os caracteres @/./+/-/_');
      return;
    }
    
    setCriandoUsuario(true);
    try {
      await criarUsuario(id, formUsuario);
      // Recarregar lista de usuários
      const novosUsuarios = await fetchUsuarios(id);
      setUsuarios(novosUsuarios);
      // Limpar formulário e fechar modal
      setFormUsuario({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: ''
      });
      setShowModalUsuario(false);
      setError('');
    } catch (err) {
      setError('Erro ao criar usuário: ' + err.message);
    } finally {
      setCriandoUsuario(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormUsuario(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl shadow p-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="text-center py-12">
            <FaBuilding className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Empresa não encontrada</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/admin/empresas')} 
                className="text-[#bfa15a] hover:text-[#23281a] font-medium flex items-center gap-2 mb-4 transition-colors"
              >
                <FaTimes className="rotate-45" />
                Voltar para Empresas
              </button>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2 flex items-center gap-3">
                <FaBuilding className="text-[#bfa15a]" />
                {empresa.name}
              </h1>
              <p className="text-gray-600">CNPJ: {empresa.cnpj}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/admin/empresas/${id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <FaEdit />
                Editar
              </button>
              <button
                onClick={() => {/* Implementar exportação */}}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <FaDownload />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold text-[#23281a]">{usuarios.length}</p>
              </div>
              <FaUsers className="text-4xl text-[#bfa15a]" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sindicatos Vinculados</p>
                <p className="text-3xl font-bold text-blue-600">{sindicatos.length}</p>
              </div>
              <FaUserTie className="text-4xl text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Homologações</p>
                <p className="text-3xl font-bold text-green-600">{homologacoes.length}</p>
              </div>
              <FaClipboardList className="text-4xl text-green-600" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-green-600">Ativa</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="bg-white/90 rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Visão Geral', icon: <FaEye /> },
                { id: 'users', label: 'Usuários', icon: <FaUsers /> },
                { id: 'unions', label: 'Sindicatos', icon: <FaUserTie /> },
                { id: 'homologations', label: 'Homologações', icon: <FaClipboardList /> },
                { id: 'analytics', label: 'Analytics', icon: <FaChartLine /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#bfa15a] text-[#bfa15a]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informações da Empresa */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#23281a] mb-4 flex items-center gap-2">
                      <FaIdCard className="text-[#bfa15a]" />
                      Informações da Empresa
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaBuilding className="text-gray-500" />
                        <span className="text-gray-700"><strong>Nome:</strong> {empresa.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaIdCard className="text-gray-500" />
                        <span className="text-gray-700"><strong>CNPJ:</strong> {empresa.cnpj}</span>
                      </div>
                      {empresa.email && (
                        <div className="flex items-center gap-3">
                          <FaEnvelope className="text-gray-500" />
                          <span className="text-gray-700"><strong>Email:</strong> {empresa.email}</span>
                        </div>
                      )}
                      {empresa.phone && (
                        <div className="flex items-center gap-3">
                          <FaPhone className="text-gray-500" />
                          <span className="text-gray-700"><strong>Telefone:</strong> {empresa.phone}</span>
                        </div>
                      )}
                      {empresa.address && (
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-gray-500" />
                          <span className="text-gray-700"><strong>Endereço:</strong> {empresa.address}</span>
                        </div>
                      )}
                      {empresa.website && (
                        <div className="flex items-center gap-3">
                          <FaGlobe className="text-gray-500" />
                          <span className="text-gray-700"><strong>Website:</strong> 
                            <a href={empresa.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {empresa.website}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gráfico de Homologações */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#23281a] mb-4 flex items-center gap-2">
                      <FaChartLine className="text-[#bfa15a]" />
                      Homologações por Mês
                    </h3>
                    <div className="h-64">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Resumo de Atividades */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#23281a] mb-4 flex items-center gap-2">
                    <FaHistory className="text-[#bfa15a]" />
                    Resumo de Atividades
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <FaUsers className="text-3xl text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#23281a]">{usuarios.length}</p>
                      <p className="text-gray-600">Usuários Ativos</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <FaUserTie className="text-3xl text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#23281a]">{sindicatos.length}</p>
                      <p className="text-gray-600">Sindicatos Vinculados</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <FaClipboardList className="text-3xl text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#23281a]">{homologacoes.length}</p>
                      <p className="text-gray-600">Homologações Realizadas</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Usuários */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#23281a]">Usuários da Empresa</h3>
                  <button
                    onClick={() => setShowModalUsuario(true)}
                    className="bg-[#bfa15a] hover:bg-[#a68b4a] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <FaUserPlus />
                    Novo Usuário
                  </button>
                </div>

                {usuarios.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhum usuário cadastrado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usuarios.map(usuario => (
                      <div key={usuario.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#bfa15a] rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {usuario.first_name?.[0]}{usuario.last_name?.[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#23281a]">{usuario.first_name} {usuario.last_name}</h4>
                              <p className="text-sm text-gray-600">{usuario.email}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            usuario.role === 'company_master' ? 'bg-blue-100 text-blue-800' :
                            usuario.role === 'company_common' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {usuario.role === 'company_master' ? 'Mestre' : 'Comum'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaEye />
                            Ver
                          </button>
                          <button className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaEdit />
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Sindicatos */}
            {activeTab === 'unions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#23281a]">Sindicatos Vinculados</h3>
                  <button
                    onClick={() => navigate('/admin/sindicatos/nova')}
                    className="bg-[#bfa15a] hover:bg-[#a68b4a] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <FaPlus />
                    Novo Sindicato
                  </button>
                </div>

                {sindicatos.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUserTie className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhum sindicato vinculado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sindicatos.map(sindicato => (
                      <div key={sindicato.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              <FaUserTie />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#23281a]">{sindicato.name}</h4>
                              <p className="text-sm text-gray-600">CNPJ: {sindicato.cnpj}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDesvincularSindicato(sindicato.id)}
                            disabled={desvinculando === sindicato.id}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                            title="Desvincular sindicato"
                          >
                            {desvinculando === sindicato.id ? (
                              <span className="animate-spin"><FaUnlink /></span>
                            ) : (
                              <FaUnlink />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaEye />
                            Ver Detalhes
                          </button>
                          <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaCalendarAlt />
                            Agendamentos
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vincular Novo Sindicato */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-[#23281a] mb-4">Vincular Novo Sindicato</h4>
                  <div className="flex gap-3">
                    <select
                      value={sindicatoParaVincular}
                      onChange={e => setSindicatoParaVincular(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                    >
                      <option value="">Selecionar sindicato para vincular</option>
                      {allSindicatos
                        .filter(s => !sindicatos.some(v => v.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} - {s.cnpj}</option>
                        ))}
                    </select>
                    <button
                      onClick={handleVincularSindicato}
                      disabled={!sindicatoParaVincular || vinculando}
                      className="px-6 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#a68b4a] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {vinculando ? (
                        <span className="animate-spin"><FaLink /></span>
                      ) : (
                        <>
                          <FaLink />
                          Vincular
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Homologações */}
            {activeTab === 'homologations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#23281a]">Histórico de Homologações</h3>
                
                {homologacoes.length === 0 ? (
                  <div className="text-center py-12">
                    <FaClipboardList className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhuma homologação realizada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {homologacoes.map(homologacao => (
                      <div key={homologacao.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              <FaClipboardList />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#23281a]">Homologação #{homologacao.id}</h4>
                              <p className="text-sm text-gray-600">
                                {homologacao.date ? new Date(homologacao.date).toLocaleDateString('pt-BR') : 'Data não informada'}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            homologacao.status === 'completed' ? 'bg-green-100 text-green-800' :
                            homologacao.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {homologacao.status === 'completed' ? 'Concluída' :
                             homologacao.status === 'pending' ? 'Pendente' : homologacao.status}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaEye />
                            Ver Detalhes
                          </button>
                          <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaDownload />
                            Baixar Relatório
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Analytics */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[#23281a]">Analytics da Empresa</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Homologações */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-[#23281a] mb-4">Homologações por Mês</h4>
                    <div className="h-64">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>

                  {/* Estatísticas de Usuários */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-[#23281a] mb-4">Distribuição de Usuários</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Mestres</span>
                        <span className="font-semibold text-[#23281a]">
                          {usuarios.filter(u => u.role === 'company_master').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Comuns</span>
                        <span className="font-semibold text-[#23281a]">
                          {usuarios.filter(u => u.role === 'company_common').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold text-[#23281a]">{usuarios.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Criação de Usuário */}
      {showModalUsuario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#23281a] flex items-center gap-2">
                <FaUserPlus className="text-[#bfa15a]" />
                Criar Usuário
              </h2>
              <button
                onClick={() => setShowModalUsuario(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <FaTimes />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleCriarUsuario} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#23281a] mb-1">
                  Nome de usuário *
                </label>
                <input
                  type="text"
                  value={formUsuario.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent ${
                    formUsuario.username && !/^[a-zA-Z0-9@.+\-_]+$/.test(formUsuario.username)
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-[#bfa15a]/40'
                  }`}
                  placeholder="Ex: joao.silva ou joao@empresa.com"
                  required
                />
                {formUsuario.username && !/^[a-zA-Z0-9@.+\-_]+$/.test(formUsuario.username) && (
                  <p className="text-red-500 text-sm mt-1">
                    Nome de usuário pode conter apenas letras, números e os caracteres @/./+/-/_
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#23281a] mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formUsuario.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-[#bfa15a]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="Digite o e-mail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#23281a] mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formUsuario.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full p-3 border border-[#bfa15a]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="Digite o nome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#23281a] mb-1">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  value={formUsuario.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full p-3 border border-[#bfa15a]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="Digite o sobrenome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#23281a] mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  value={formUsuario.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full p-3 border border-[#bfa15a]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="Digite a senha"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalUsuario(false)}
                  className="flex-1 px-4 py-3 border border-[#bfa15a] text-[#bfa15a] rounded-lg font-medium hover:bg-[#bfa15a] hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criandoUsuario || (formUsuario.username && !/^[a-zA-Z0-9@.+\-_]+$/.test(formUsuario.username))}
                  className="flex-1 px-4 py-3 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition disabled:opacity-50"
                >
                  {criandoUsuario ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
} 