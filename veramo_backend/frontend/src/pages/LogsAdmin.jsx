import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FaFileAlt, FaExclamationTriangle, FaInfoCircle, FaBug, FaCheckCircle, FaTimesCircle, FaFilter, FaDownload } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

export default function LogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, [filterLevel, filterDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Construir parâmetros de query
      const params = new URLSearchParams();
      if (filterLevel !== 'all') {
        params.append('level', filterLevel);
      }
      if (filterDate) {
        params.append('date_from', filterDate);
        // Adicionar data final como fim do dia
        const endDate = new Date(filterDate);
        endDate.setHours(23, 59, 59, 999);
        params.append('date_to', endDate.toISOString());
      }

      const queryString = params.toString();
      const url = `${API_ENDPOINTS.LOGS}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(`Erro ao buscar logs: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.results || data);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
      setError(`Erro ao buscar logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level) => {
    switch (level) {
      case 'ERROR':
        return { 
          text: 'Erro', 
          color: 'text-red-600', 
          bgColor: 'bg-red-100',
          icon: <FaTimesCircle className="text-red-600" />
        };
      case 'WARNING':
        return { 
          text: 'Aviso', 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100',
          icon: <FaExclamationTriangle className="text-yellow-600" />
        };
      case 'INFO':
        return { 
          text: 'Info', 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100',
          icon: <FaInfoCircle className="text-blue-600" />
        };
      case 'SUCCESS':
        return { 
          text: 'Sucesso', 
          color: 'text-green-600', 
          bgColor: 'bg-green-100',
          icon: <FaCheckCircle className="text-green-600" />
        };
      case 'DEBUG':
        return { 
          text: 'Debug', 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-100',
          icon: <FaBug className="text-purple-600" />
        };
      default:
        return { 
          text: level, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100',
          icon: <FaFileAlt className="text-gray-600" />
        };
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {});

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'User', 'Action', 'IP Address', 'User Agent'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        log.user_email || log.user_name || 'Sistema',
        log.action || '',
        log.ip_address || '',
        log.user_agent || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl shadow p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
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
                Logs do Sistema
              </h1>
              <p className="text-gray-600">
                Monitore todas as atividades e eventos do sistema
              </p>
            </div>
            <button
              onClick={exportLogs}
              className="bg-[#bfa15a] hover:bg-[#a68b4a] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <FaDownload className="text-lg" />
              Exportar CSV
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
              <p className="text-2xl font-bold text-[#23281a]">{logs.length}</p>
            </div>
          </div>
          
          {Object.entries(levelCounts).map(([level, count]) => {
            const levelInfo = getLevelInfo(level);
            return (
              <div key={level} className="bg-white/90 rounded-xl shadow-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">{levelInfo.text}</p>
                  <p className={`text-2xl font-bold ${levelInfo.color}`}>{count}</p>
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
                Buscar nos logs
              </label>
              <input
                type="text"
                placeholder="Digite mensagem, usuário ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
              >
                <option value="all">Todos os níveis</option>
                <option value="ERROR">Erro</option>
                <option value="WARNING">Aviso</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Sucesso</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#23281a] mb-6">
            Logs Recentes ({filteredLogs.length})
          </h2>
          
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const levelInfo = getLevelInfo(log.level);
                
                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${levelInfo.bgColor} ${levelInfo.color}`}>
                          <div className="flex items-center gap-2">
                            {levelInfo.icon}
                            {levelInfo.text}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        IP: {log.ip_address || 'N/A'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-800 font-medium mb-2">
                        {log.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">Usuário:</span> {log.user_email || log.user_name || 'Sistema'}
                        </span>
                        {log.action && (
                          <span>
                            <span className="font-medium">Ação:</span> {log.action}
                          </span>
                        )}
                        {log.company && (
                          <span>
                            <span className="font-medium">Empresa:</span> {log.company.name}
                          </span>
                        )}
                        {log.union && (
                          <span>
                            <span className="font-medium">Sindicato:</span> {log.union.name}
                          </span>
                        )}
                      </div>
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
