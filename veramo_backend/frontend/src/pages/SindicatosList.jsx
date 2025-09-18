import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../services/auth';
import Sidebar from '../components/Sidebar';
import SindicatoCard from '../components/SindicatoCard';
import SindicatoSearchFilter from '../components/SindicatoSearchFilter';
import SindicatoStats from '../components/SindicatoStats';
import { API_ENDPOINTS } from '../config/api';

// Busca real dos sindicatos do backend, agora com JWT
async function fetchSindicatos() {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
  try {
    const response = await fetch(API_ENDPOINTS.UNIONS, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.status === 401) throw new Error('401');
    if (!response.ok) throw new Error('Erro ao buscar sindicatos');
    const data = await response.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
  } catch (err) {
    throw err;
  }
}

export default function SindicatosList() {
  const [sindicatos, setSindicatos] = useState([]);
  const [filteredSindicatos, setFilteredSindicatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se está autenticado
    const tokens = getToken();
    if (!tokens?.access) {
      navigate('/login');
      return;
    }
    fetchSindicatos()
      .then(data => {
        setSindicatos(data);
        setFilteredSindicatos(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === '401') {
          logout();
          navigate('/login');
        } else {
          setError('Erro ao buscar sindicatos.');
        }
        setLoading(false);
      });
  }, [navigate]);

  // Filtro e busca
  useEffect(() => {
    let filtered = sindicatos;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(sindicato =>
        sindicato.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sindicato.cnpj && sindicato.cnpj.includes(searchTerm))
      );
    }

    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(sindicato => {
        if (filterStatus === 'ativo') return !sindicato.status || sindicato.status === 'ativo';
        if (filterStatus === 'inativo') return sindicato.status === 'inativo';
        if (filterStatus === 'pendente') return sindicato.status === 'pendente';
        return true;
      });
    }

    setFilteredSindicatos(filtered);
  }, [sindicatos, searchTerm, filterStatus]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2">
                Sindicatos Cadastrados
              </h1>
              <p className="text-gray-600">
                Gerencie todos os sindicatos do sistema
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/sindicatos/novo')}
              className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] hover:from-[#1a1f15] hover:to-[#a68f4a] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Novo Sindicato</span>
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {!loading && !error && sindicatos.length > 0 && (
          <SindicatoStats sindicatos={sindicatos} />
        )}

        {/* Busca e Filtros */}
        {!loading && !error && sindicatos.length > 0 && (
          <SindicatoSearchFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filterStatus={filterStatus}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#bfa15a] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#bfa15a] text-lg font-semibold">Carregando sindicatos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar sindicatos</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#bfa15a] hover:bg-[#a68f4a] text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : sindicatos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#f5ecd7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#bfa15a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum sindicato cadastrado</h3>
                <p className="text-gray-600 mb-4">Comece criando o primeiro sindicato do sistema</p>
                <button
                  onClick={() => navigate('/admin/sindicatos/novo')}
                  className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] hover:from-[#1a1f15] hover:to-[#a68f4a] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Criar Primeiro Sindicato</span>
                </button>
              </div>
            </div>
          ) : filteredSindicatos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600 mb-4">Tente ajustar os filtros de busca</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Resultados da Busca */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#23281a]">
                    {filteredSindicatos.length} de {sindicatos.length} sindicatos
                  </h2>
                  <div className="text-sm text-gray-600">
                    {searchTerm || filterStatus ? 'Resultados filtrados' : 'Todos os sindicatos'}
                  </div>
                </div>
              </div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSindicatos.map(sindicato => (
                  <SindicatoCard key={sindicato.id} sindicato={sindicato} />
                ))}
              </div>

              {/* Footer com Estatísticas */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Mostrando {filteredSindicatos.length} de {sindicatos.length} sindicatos
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Ativos: {sindicatos.filter(s => !s.status || s.status === 'ativo').length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Inativos: {sindicatos.filter(s => s.status === 'inativo').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}