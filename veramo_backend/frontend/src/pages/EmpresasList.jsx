import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout, refreshToken } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import Sidebar from '../components/Sidebar';
import CompanyCard from '../components/CompanyCard';
import SearchAndFilter from '../components/SearchAndFilter';

async function fetchEmpresas() {
  let token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  console.log('[DEBUG] Token usado para buscar empresas:', token);
  try {
    let response = await fetch(API_ENDPOINTS.COMPANIES, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('[DEBUG] Resposta fetch empresas:', response.status);
    if (response.status === 401) {
      // tenta renovar o token
      const newAccess = await refreshToken();
      console.log('[DEBUG] Novo access token após refresh:', newAccess);
      if (newAccess) {
        response = await fetch(API_ENDPOINTS.COMPANIES, {
          headers: {
            'Authorization': `Bearer ${newAccess}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('[DEBUG] Resposta fetch empresas após refresh:', response.status);
        if (response.status === 401) throw new Error('401');
      } else {
        throw new Error('401');
      }
    }
    if (!response.ok) throw new Error('Erro ao buscar empresas');
    const data = await response.json();
    // Trata tanto lista simples quanto resposta paginada { results: [...] }
    const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
    return items;
  } catch (err) {
    console.error('[DEBUG] Erro ao buscar empresas:', err);
    throw err;
  }
}

export default function EmpresasList() {
  console.log('[DEBUG] Render EmpresasList. Token:', getToken && getToken());
  const [empresas, setEmpresas] = useState([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = getToken();
    console.log('[DEBUG] Tokens no useEffect EmpresasList:', tokens);
    if (!tokens?.access) {
      navigate('/login');
      return;
    }
    fetchEmpresas()
      .then(items => {
        setEmpresas(items);
        setFilteredEmpresas(items);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === '401') {
          logout();
          navigate('/login');
        } else {
          setError('Erro ao buscar empresas.');
        }
        setLoading(false);
      });
  }, [navigate]);

  // Função de busca
  const handleSearch = (term) => {
    setSearchTerm(term);
    filterEmpresas(term, filterStatus);
  };

  // Função de filtro
  const handleFilter = (status) => {
    setFilterStatus(status);
    filterEmpresas(searchTerm, status);
  };

  // Função combinada de busca e filtro
  const filterEmpresas = (search, status) => {
    let filtered = empresas;

    // Aplicar busca
    if (search) {
      filtered = filtered.filter(empresa =>
        empresa.name.toLowerCase().includes(search.toLowerCase()) ||
        empresa.cnpj.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
      );
    }

    // Aplicar filtro de status (simulado)
    if (status !== 'all') {
      filtered = filtered.filter(empresa => {
        // Simular status baseado no ID (para demonstração)
        const isActive = empresa.id % 2 === 1;
        return status === 'active' ? isActive : !isActive;
      });
    }

    setFilteredEmpresas(filtered);
  };

  // Função para editar empresa
  const handleEdit = (company) => {
    navigate(`/admin/empresas/${company.id}/editar`);
  };

  // Função para excluir empresa
  const handleDelete = (company) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      // Aqui você implementaria a chamada para a API de exclusão
      console.log('Excluir empresa:', company.id);
      // Atualizar a lista após exclusão
      setEmpresas(empresas.filter(e => e.id !== company.id));
      setFilteredEmpresas(filteredEmpresas.filter(e => e.id !== company.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2">
                Empresas Cadastradas
              </h1>
              <p className="text-gray-600">
                Gerencie todas as empresas do sistema
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/empresas/nova')}
              className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] hover:from-[#1a1f15] hover:to-[#a68f4a] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nova Empresa</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          totalCount={filteredEmpresas.length}
        />

        {/* Content */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar empresas</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca para encontrar empresas.'
                : 'Comece cadastrando a primeira empresa do sistema.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/admin/empresas/nova')}
              className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] hover:from-[#1a1f15] hover:to-[#a68f4a] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
                Cadastrar Primeira Empresa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmpresas.map((empresa, index) => (
              <div
                key={empresa.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
              >
                <CompanyCard
                  company={empresa}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {filteredEmpresas.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#23281a]">{empresas.length}</div>
                <div className="text-sm text-gray-600">Total de Empresas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#bfa15a]">
                  {empresas.filter(e => e.id % 2 === 1).length}
                </div>
                <div className="text-sm text-gray-600">Empresas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8b7355]">
                  {empresas.filter(e => e.id % 2 === 0).length}
                </div>
                <div className="text-sm text-gray-600">Empresas Inativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#23281a]">
                  {filteredEmpresas.length}
                </div>
                <div className="text-sm text-gray-600">Mostrando</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}