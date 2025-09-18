import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FaCalendarAlt, FaUserTie, FaBuilding, FaVideo, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

export default function AgendamentosAdmin() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos');
      }

      const data = await response.json();
      console.log('🔍 Debug - Agendamentos recebidos:', data);
      setAgendamentos(data.results || data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setError(`Erro ao buscar agendamentos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'agendado':
        return { 
          text: 'Agendado', 
          color: 'text-green-600', 
          bgColor: 'bg-green-100',
          icon: <FaCheckCircle className="text-green-600" />
        };
      case 'em_videoconferencia':
        return { 
          text: 'Em Videoconferência', 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-100',
          icon: <FaVideo className="text-blue-600" />
        };
      case 'documentos_aprovados':
        return { 
          text: 'Documentos Aprovados', 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100',
          icon: <FaExclamationTriangle className="text-yellow-600" />
        };
      case 'documentos_recusados':
        return { 
          text: 'Documentos Recusados', 
          color: 'text-red-600', 
          bgColor: 'bg-red-100',
          icon: <FaExclamationTriangle className="text-red-600" />
        };
      default:
        return { 
          text: status, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100',
          icon: <FaClock className="text-gray-600" />
        };
    }
  };

  const handleCardClick = (agendamentoId) => {
    navigate(`/admin/agendamentos/${agendamentoId}`);
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
          <h1 className="text-4xl font-bold text-[#23281a] mb-2">
            Agendamentos - Visão Administrativa
          </h1>
          <p className="text-gray-600">
            Visualize todos os agendamentos do sistema
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Agendamentos</p>
                <p className="text-3xl font-bold text-[#23281a]">{agendamentos.length}</p>
              </div>
              <FaCalendarAlt className="text-4xl text-[#bfa15a]" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendados</p>
                <p className="text-3xl font-bold text-green-600">
                  {agendamentos.filter(a => a.status === 'agendado').length}
                </p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Videoconferência</p>
                <p className="text-3xl font-bold text-blue-600">
                  {agendamentos.filter(a => a.status === 'em_videoconferencia').length}
                </p>
              </div>
              <FaVideo className="text-4xl text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documentos Aprovados</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {agendamentos.filter(a => a.status === 'documentos_aprovados').length}
                </p>
              </div>
              <FaExclamationTriangle className="text-4xl text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#23281a] mb-6">Todos os Agendamentos</h2>
          
          {agendamentos.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agendamentos.map((agendamento) => {
                const statusInfo = getStatusInfo(agendamento.status);
                
                return (
                  <div
                    key={agendamento.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => handleCardClick(agendamento.id)}
                  >
                    {/* Header com Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <div className="flex items-center gap-2">
                          {statusInfo.icon}
                          {statusInfo.text}
                        </div>
                      </div>
                    </div>

                    {/* Informações do Funcionário */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUserTie className="text-[#bfa15a] text-lg" />
                        <span className="font-bold text-lg text-[#23281a]">
                          {agendamento.nome_funcionario || 'Nome não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <FaBuilding className="text-[#bfa15a] text-sm" />
                        <span className="text-gray-600 text-sm">
                          {agendamento.empresa?.nome || 'Empresa não informada'}
                        </span>
                      </div>
                    </div>

                    {/* Data e Hora */}
                    {agendamento.data_inicio && (
                      <div className="flex items-center gap-3 mb-4">
                        <FaClock className="text-[#bfa15a] text-sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(agendamento.data_inicio).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Motivo */}
                    {agendamento.motivo && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Motivo:</span> {agendamento.motivo}
                        </p>
                      </div>
                    )}

                    {/* Link da Videoconferência */}
                    {agendamento.video_link && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <a
                          href={agendamento.video_link.startsWith('http') ? agendamento.video_link : `https://${agendamento.video_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaVideo className="text-sm" />
                          Acessar Videoconferência
                        </a>
                      </div>
                    )}
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
