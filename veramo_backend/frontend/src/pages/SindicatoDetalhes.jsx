import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUsers, FaBuilding, FaClipboardList, FaHistory, FaIdCard, FaPlus, FaEdit, FaLink, FaUserTie, FaEye, FaTrash, FaCalendarAlt, FaChartLine, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGlobe, FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaTimes, FaUserPlus } from 'react-icons/fa';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
import { getToken, refreshToken, logout } from '../services/auth';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);

async function fetchSindicato(id) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.UNIONS}${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Erro ao buscar sindicato');
  return await response.json();
}

async function fetchUsuarios(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.USERS}?union=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

async function fetchEmpresas(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.COMPANY_UNIONS}?union=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const dataV = await response.json();
  const vinculos = Array.isArray(dataV) ? dataV : (Array.isArray(dataV?.results) ? dataV.results : []);
  // Buscar dados das empresas
  const empresas = [];
  for (const v of vinculos) {
    const resp = await fetch(`${API_ENDPOINTS.COMPANIES}${v.company}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (resp.ok) empresas.push(await resp.json());
  }
  return empresas;
}

async function fetchHomologacoes(unionId) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  const response = await fetch(`${API_ENDPOINTS.SCHEDULES}?union=${unionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
}

function Badge({ children, color = 'bg-[#bfa15a]/80', text = 'text-white' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color} ${text} mr-1`}>{children}</span>
  );
}

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

function getHomologacoesPorMes(homologacoes) {
  // Agrupa por mês/ano
  const meses = {};
  homologacoes.forEach(h => {
    const d = new Date(h.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    meses[key] = (meses[key] || 0) + 1;
  });
  // Ordena por data
  const labels = Object.keys(meses).sort();
  const data = labels.map(l => meses[l]);
  return { labels, data };
}

export default function SindicatoDetalhes() {
  const { id } = useParams();
  const [sindicato, setSindicato] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [homologacoes, setHomologacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditUser, setModalEditUser] = useState(null);
  const [novoUsuario, setNovoUsuario] = useState({ name: '', username: '', email: '', role: 'union_master', password: '' });
  const [novoUsuarioError, setNovoUsuarioError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSindicato(id),
      fetchUsuarios(id),
      fetchEmpresas(id),
      fetchHomologacoes(id),
    ])
      .then(([s, u, e, h]) => {
        setSindicato(s);
        setUsuarios(u);
        setEmpresas(e);
        setHomologacoes(h);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao buscar dados do sindicato.');
        setLoading(false);
      });
  }, [id]);

  // Gráfico de homologações por mês
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
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { stepSize: 1 } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Quick actions
  function handleNovoUsuario() {
    setNovoUsuario({ name: '', username: '', email: '', role: 'union_master', password: '' });
    setModalOpen(true);
  }
  function handleEditUser(user) {
    setNovoUsuario({
      name: user?.name ?? '',
      username: user?.username ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'union_master',
      password: ''
    });
    setModalEditUser(user);
  }
  async function handleSaveUser(e) {
    e.preventDefault();
    setNovoUsuarioError('');
    let tokens = getToken();
    const isEdit = !!modalEditUser;
    // Monta payload conforme operação
    const basePayloadCreate = {
      name: novoUsuario.name,
      email: novoUsuario.email,
      username: novoUsuario.email, // username = email apenas na criação
      role: novoUsuario.role,
      union: id,
      password: novoUsuario.password,
    };
    const basePayloadEdit = {
      name: novoUsuario.name,
      email: novoUsuario.email,
      role: novoUsuario.role,
      union: id,
      ...(novoUsuario.password ? { password: novoUsuario.password } : {}),
    };
    try {
      let resp = await fetch(isEdit ? `${API_ENDPOINTS.USERS}${modalEditUser.id}/` : API_ENDPOINTS.USERS, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEdit ? basePayloadEdit : basePayloadCreate),
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          tokens = getToken();
          resp = await fetch(isEdit ? `${API_ENDPOINTS.USERS}${modalEditUser.id}/` : API_ENDPOINTS.USERS, {
            method: isEdit ? 'PATCH' : 'POST',
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(isEdit ? basePayloadEdit : basePayloadCreate),
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) {
        const data = await resp.json();
        console.log('[DEBUG] Erro detalhado do backend:', data);
        const pickMsg = (obj) => {
          const firstKey = obj && typeof obj === 'object' ? Object.keys(obj)[0] : null;
          if (firstKey && obj[firstKey]) {
            const v = obj[firstKey];
            return Array.isArray(v) ? v[0] : String(v);
          }
          return null;
        };
        const msg = pickMsg(data) || (isEdit ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.');
        setNovoUsuarioError(msg);
        throw new Error(isEdit ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário');
      }
      setModalOpen(false);
      setModalEditUser(null);
      // Atualizar lista de usuários
      return fetchUsuarios(id).then(setUsuarios);
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      }
      // O erro já foi tratado acima
    }
  }

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

  if (!sindicato) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="text-center py-12">
            <FaUserTie className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Sindicato não encontrado</p>
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
                onClick={() => navigate('/admin/sindicatos')} 
                className="text-[#bfa15a] hover:text-[#23281a] font-medium flex items-center gap-2 mb-4 transition-colors"
              >
                <FaTimes className="rotate-45" />
                Voltar para Sindicatos
              </button>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2 flex items-center gap-3">
                <FaUserTie className="text-[#bfa15a]" />
                {sindicato.name}
              </h1>
              <p className="text-gray-600">CNPJ: {sindicato.cnpj}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/admin/sindicatos/${id}/edit`)}
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
                <p className="text-sm font-medium text-gray-600">Empresas Vinculadas</p>
                <p className="text-3xl font-bold text-blue-600">{empresas.length}</p>
              </div>
              <FaBuilding className="text-4xl text-blue-600" />
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
                <p className="text-lg font-bold text-green-600">Ativo</p>
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
                { id: 'companies', label: 'Empresas', icon: <FaBuilding /> },
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
                  {/* Informações do Sindicato */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#23281a] mb-4 flex items-center gap-2">
                      <FaIdCard className="text-[#bfa15a]" />
                      Informações do Sindicato
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaUserTie className="text-gray-500" />
                        <span className="text-gray-700"><strong>Nome:</strong> {sindicato.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaIdCard className="text-gray-500" />
                        <span className="text-gray-700"><strong>CNPJ:</strong> {sindicato.cnpj}</span>
                      </div>
                      {sindicato.email && (
                        <div className="flex items-center gap-3">
                          <FaEnvelope className="text-gray-500" />
                          <span className="text-gray-700"><strong>Email:</strong> {sindicato.email}</span>
                        </div>
                      )}
                      {sindicato.phone && (
                        <div className="flex items-center gap-3">
                          <FaPhone className="text-gray-500" />
                          <span className="text-gray-700"><strong>Telefone:</strong> {sindicato.phone}</span>
                        </div>
                      )}
                      {sindicato.address && (
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-gray-500" />
                          <span className="text-gray-700"><strong>Endereço:</strong> {sindicato.address}</span>
                        </div>
                      )}
                      {sindicato.website && (
                        <div className="flex items-center gap-3">
                          <FaGlobe className="text-gray-500" />
                          <span className="text-gray-700"><strong>Website:</strong> 
                            <a href={sindicato.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {sindicato.website}
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
                      <FaBuilding className="text-3xl text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-[#23281a]">{empresas.length}</p>
                      <p className="text-gray-600">Empresas Vinculadas</p>
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
                  <h3 className="text-lg font-semibold text-[#23281a]">Usuários do Sindicato</h3>
                  <button
                    onClick={handleNovoUsuario}
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
                              {usuario.name?.[0] || usuario.username?.[0] || 'U'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#23281a]">{usuario.name || usuario.username}</h4>
                              <p className="text-sm text-gray-600">{usuario.email}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            usuario.role === 'union_master' ? 'bg-blue-100 text-blue-800' :
                            usuario.role === 'union_common' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {usuario.role === 'union_master' ? 'Mestre' : 'Comum'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditUser(usuario)}
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FaEdit />
                            Editar
                          </button>
                          <button className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <FaTrash />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Empresas */}
            {activeTab === 'companies' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#23281a]">Empresas Vinculadas</h3>
                  <button
                    onClick={() => navigate('/admin/empresas/nova')}
                    className="bg-[#bfa15a] hover:bg-[#a68b4a] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <FaPlus />
                    Vincular Empresa
                  </button>
                </div>

                {empresas.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBuilding className="text-6xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Nenhuma empresa vinculada</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {empresas.map(empresa => (
                      <div key={empresa.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              <FaBuilding />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#23281a]">{empresa.name}</h4>
                              <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/admin/empresas/${empresa.id}`)}
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
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
                <h3 className="text-lg font-semibold text-[#23281a]">Analytics do Sindicato</h3>
                
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
                          {usuarios.filter(u => u.role === 'union_master').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Comuns</span>
                        <span className="font-semibold text-[#23281a]">
                          {usuarios.filter(u => u.role === 'union_common').length}
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

      {/* Modal de novo/editar usuário */}
      <Modal open={modalOpen || modalEditUser} onClose={() => { setModalOpen(false); setModalEditUser(null); }} title={modalEditUser ? 'Editar usuário' : 'Novo usuário'}>
        <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
          <input type="text" className="border rounded p-2" placeholder="Nome completo" value={novoUsuario.name ?? ''} onChange={e => setNovoUsuario({ ...novoUsuario, name: e.target.value })} required />
          <input type="text" className="border rounded p-2" placeholder="Nome de usuário" value={novoUsuario.username ?? ''} onChange={e => setNovoUsuario({ ...novoUsuario, username: e.target.value })} disabled={!!modalEditUser} required={!modalEditUser} />
          <input type="email" className="border rounded p-2" placeholder="E-mail" value={novoUsuario.email ?? ''} onChange={e => setNovoUsuario({ ...novoUsuario, email: e.target.value })} required />
          <input type="password" className="border rounded p-2" placeholder={modalEditUser ? 'Nova senha (opcional)' : 'Senha'} value={novoUsuario.password ?? ''} onChange={e => setNovoUsuario({ ...novoUsuario, password: e.target.value })} required={!modalEditUser} />
          {novoUsuarioError && <div className="text-red-500 text-sm text-center">{novoUsuarioError}</div>}
          <select className="border rounded p-2" value={novoUsuario.role} onChange={e => setNovoUsuario({ ...novoUsuario, role: e.target.value })}>
            <option value="union_master">Sindicato Master</option>
            <option value="union_common">Sindicato Comum</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setModalOpen(false); setModalEditUser(null); }} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-[#23281a] font-bold">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-bold">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 