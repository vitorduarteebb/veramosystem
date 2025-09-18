import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FaUser, FaUserTie, FaBuilding, FaShieldAlt, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_ENDPOINTS.USERS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }

      const data = await response.json();
      console.log('🔍 Debug - Usuários recebidos:', data);
      setUsuarios(data.results || data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(`Erro ao buscar usuários: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'superadmin':
        return { 
          text: 'Super Admin', 
          color: 'text-red-600', 
          bgColor: 'bg-red-100',
          icon: <FaShieldAlt className="text-red-600" />
        };
      case 'admin':
        return { 
          text: 'Administrador', 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-100',
          icon: <FaShieldAlt className="text-purple-600" />
        };
      case 'union_master':
        return { 
          text: 'Mestre Sindicato', 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100',
          icon: <FaUserTie className="text-blue-600" />
        };
      case 'union_common':
        return { 
          text: 'Sindicato', 
          color: 'text-cyan-600', 
          bgColor: 'bg-cyan-100',
          icon: <FaUserTie className="text-cyan-600" />
        };
      case 'company_master':
        return { 
          text: 'Mestre Empresa', 
          color: 'text-green-600', 
          bgColor: 'bg-green-100',
          icon: <FaBuilding className="text-green-600" />
        };
      case 'company_common':
        return { 
          text: 'Empresa', 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-100',
          icon: <FaBuilding className="text-orange-600" />
        };
      default:
        return { 
          text: role, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100',
          icon: <FaUser className="text-gray-600" />
        };
    }
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || usuario.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleCounts = usuarios.reduce((acc, usuario) => {
    acc[usuario.role] = (acc[usuario.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl shadow p-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2">
                Usuários do Sistema
              </h1>
              <p className="text-gray-600">
                Gerencie todos os usuários cadastrados no sistema
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/usuarios/novo')}
              className="bg-[#bfa15a] hover:bg-[#a68b4a] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <FaPlus className="text-lg" />
              Novo Usuário
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/90 rounded-xl shadow-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-[#23281a]">{usuarios.length}</p>
            </div>
          </div>
          
          {Object.entries(roleCounts).map(([role, count]) => {
            const roleInfo = getRoleInfo(role);
            return (
              <div key={role} className="bg-white/90 rounded-xl shadow-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">{roleInfo.text}</p>
                  <p className={`text-2xl font-bold ${roleInfo.color}`}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="bg-white/90 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar usuário
              </label>
              <input
                type="text"
                placeholder="Digite nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por tipo
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Administrador</option>
                <option value="union_master">Mestre Sindicato</option>
                <option value="union_common">Sindicato</option>
                <option value="company_master">Mestre Empresa</option>
                <option value="company_common">Empresa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#23281a] mb-6">
            Lista de Usuários ({filteredUsuarios.length})
          </h2>
          
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsuarios.map((usuario) => {
                const roleInfo = getRoleInfo(usuario.role);
                
                return (
                  <div
                    key={usuario.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Header com Role */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                        <div className="flex items-center gap-2">
                          {roleInfo.icon}
                          {roleInfo.text}
                        </div>
                      </div>
                    </div>

                    {/* Informações do Usuário */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUser className="text-[#bfa15a] text-lg" />
                        <span className="font-bold text-lg text-[#23281a]">
                          {usuario.first_name} {usuario.last_name}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {usuario.email}
                        </p>
                      </div>

                      {usuario.company && (
                        <div className="flex items-center gap-3 mb-2">
                          <FaBuilding className="text-[#bfa15a] text-sm" />
                          <span className="text-gray-600 text-sm">
                            {usuario.company.nome || 'Empresa não informada'}
                          </span>
                        </div>
                      )}

                      {usuario.union && (
                        <div className="flex items-center gap-3 mb-2">
                          <FaUserTie className="text-[#bfa15a] text-sm" />
                          <span className="text-gray-600 text-sm">
                            {usuario.union.nome || 'Sindicato não informado'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Data de Criação */}
                    {usuario.date_joined && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">
                          Cadastrado em: {new Date(usuario.date_joined).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEye className="text-sm" />
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/admin/usuarios/${usuario.id}/edit`)}
                        className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FaEdit className="text-sm" />
                        Editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
