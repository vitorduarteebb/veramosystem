import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCalendar, FaClock, FaArrowLeft, FaCheckCircle, FaVideo, FaExternalLinkAlt, FaCopy, FaUser, FaBuilding, FaUsers, FaFileAlt, FaExclamationTriangle, FaCalendarAlt, FaHistory, FaDownload, FaEdit, FaTrash, FaBell, FaShare } from 'react-icons/fa';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { API_ENDPOINTS } from '../config/api';

function TopMenu({ sidebarOpen }) {
  const user = JSON.parse(localStorage.getItem('@veramo_auth') || '{}');
  
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <button className="text-[#bfa15a] hover:text-[#1a2a1a] transition-colors relative">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">1</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#1a2a1a]">Bem-vindo, {user?.name || user?.email}</span>
        <div className="w-8 h-8 bg-[#bfa15a] rounded-full flex items-center justify-center text-[#1a2a1a] font-bold text-sm">
          {user?.name?.[0] || user?.email?.[0] || 'U'}
        </div>
      </div>
    </div>
  );
}

export default function AgendamentoEmpresa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [processo, setProcesso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [agendando, setAgendando] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProcesso();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchProcesso = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;
      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) throw new Error('Erro ao buscar processo');
      const processoData = await resp.json();
      setProcesso(processoData);
    } catch (err) {
      setError('Erro ao buscar detalhes do processo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;
      
      const unionId = processo.sindicato;
      const url = `${API_ENDPOINTS.SCHEDULE_CONFIG}available-slots/?union=${unionId}&date=${date}`;
      
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (resp.ok) {
        const slots = await resp.json();
        const formattedSlots = slots.map(slot => ({
          ...slot,
          displayTime: `${new Date(slot.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          user_name: slot.user_name,
          duration: slot.duration_minutes || 60,
          available_vacancies: slot.available_vacancies || 1,
          total_homologadores: slot.total_homologadores || 1
        }));
        setAvailableSlots(formattedSlots);
      }
    } catch (err) {
      console.error('Erro ao buscar horários disponíveis:', err);
    }
  };

  const handleAgendar = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Selecione uma data e horário');
      return;
    }

    setAgendando(true);
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/agendar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          start: selectedTime.start,
          end: selectedTime.end,
          meet_link: null
        }),
      });

      if (resp.ok) {
        setSuccessMessage('Agendamento realizado com sucesso!');
        await fetchProcesso(); // Recarregar dados
        setActiveTab('overview');
      } else {
        throw new Error('Erro ao agendar');
      }
    } catch (err) {
      setError('Erro ao realizar agendamento');
    } finally {
      setAgendando(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Aqui você poderia adicionar uma notificação de sucesso
  };

  const getNextWeekDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        days.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })
        });
      }
    }
    
    return days;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'agendado':
      case 'aguardando_sala':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <FaVideo className="text-green-600" />,
          text: 'Agendado',
          badge: 'bg-green-500 text-white'
        };
      case 'documentos_aprovados':
      case 'aceito':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <FaCheckCircle className="text-blue-600" />,
          text: 'Aprovado',
          badge: 'bg-blue-500 text-white'
        };
      case 'documentos_recusados':
      case 'recusado':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <FaExclamationTriangle className="text-red-600" />,
          text: 'Recusado',
          badge: 'bg-red-500 text-white'
        };
      default:
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <FaClock className="text-yellow-600" />,
          text: 'Pendente',
          badge: 'bg-yellow-500 text-white'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <EmpresaSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
            <p className="text-[#1a2a1a] text-lg">Carregando detalhes do agendamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <EmpresaSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={() => navigate('/empresa/agendamentos')}
              className="mt-4 px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors"
            >
              Voltar para Agendamentos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <EmpresaSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">Agendamento não encontrado</p>
            <button
              onClick={() => navigate('/empresa/agendamentos')}
              className="mt-4 px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors"
            >
              Voltar para Agendamentos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(processo.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar />
      <div className="flex-1 p-8 ml-64">
        <TopMenu sidebarOpen={true} />
        
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/empresa/agendamentos')}
              className="flex items-center gap-2 text-[#bfa15a] hover:text-[#1a2a1a] transition mb-4"
            >
              <FaArrowLeft />
              Voltar para Agendamentos
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#1a2a1a] mb-2 flex items-center gap-3">
                  {statusConfig.icon}
                  Agendamento #{id}
                </h1>
                <p className="text-lg text-[#23281a]/80">
                  Detalhes completos do processo de homologação
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusConfig.badge}`}>
                  {statusConfig.text.toUpperCase()}
                </span>
                {processo.status === 'agendado' && processo.video_link && (
                  <button
                    onClick={() => window.open(processo.video_link, '_blank')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaVideo className="w-4 h-4" />
                    Acessar Videoconferência
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mensagem de sucesso */}
          {(location.state?.message || successMessage) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                <span className="text-green-800 font-semibold">{successMessage || location.state.message}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: <FaCalendarAlt /> },
                  { id: 'schedule', label: 'Agendamento', icon: <FaClock /> },
                  { id: 'documents', label: 'Documentos', icon: <FaFileAlt /> },
                  { id: 'history', label: 'Histórico', icon: <FaHistory /> }
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
                  {/* Informações Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-500 rounded-full">
                          <FaUser className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-blue-800">Funcionário</h3>
                          <p className="text-blue-600">{processo.nome_funcionario}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-500 rounded-full">
                          <FaBuilding className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-purple-800">Empresa</h3>
                          <p className="text-purple-600">{processo.empresa_nome}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-emerald-500 rounded-full">
                          <FaUsers className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-emerald-800">Sindicato</h3>
                          <p className="text-emerald-600">{processo.sindicato_nome}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Processo */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-[#1a2a1a] mb-4">Detalhes do Processo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`font-semibold ${statusConfig.color}`}>{statusConfig.text}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Motivo:</span>
                          <span className="text-gray-900">{processo.motivo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Exame:</span>
                          <span className="text-gray-900">{processo.exame || 'Não especificado'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Data de Criação:</span>
                          <span className="text-gray-900">{new Date(processo.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {processo.data_inicio && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Data Agendada:</span>
                            <span className="text-gray-900">{new Date(processo.data_inicio).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {processo.data_inicio && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Horário:</span>
                            <span className="text-gray-900">{new Date(processo.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Videoconferência */}
                  {processo.status === 'agendado' && processo.video_link && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500 rounded-full p-3">
                          <FaVideo className="text-white text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800">Videoconferência Agendada</h3>
                          <p className="text-green-600">Link do Google Meet disponível</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Link do Google Meet:</p>
                            <p className="font-mono text-sm break-all">{processo.video_link}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(processo.video_link)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                            >
                              <FaCopy className="text-xs" />
                              Copiar
                            </button>
                            <a
                              href={processo.video_link.startsWith('http') ? processo.video_link : `https://${processo.video_link.replace(/^\/+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                              Acessar
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Agendamento */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {processo.status === 'agendado' ? (
                    <div className="text-center py-12">
                      <div className="text-green-500 text-6xl mb-4">✅</div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">Videoconferência Agendada</h3>
                      <p className="text-green-600 mb-4">
                        Sua videoconferência está agendada para {new Date(processo.data_inicio).toLocaleDateString('pt-BR')} às {new Date(processo.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {processo.video_link && (
                        <button
                          onClick={() => window.open(processo.video_link, '_blank')}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                        >
                          <FaVideo className="w-4 h-4" />
                          Acessar Videoconferência
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Seleção de Data */}
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
                          <FaCalendar className="text-[#bfa15a]" />
                          Escolha uma Data
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {getNextWeekDays().map((day) => (
                            <button
                              key={day.date}
                              onClick={() => setSelectedDate(day.date)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedDate === day.date
                                  ? 'border-[#bfa15a] bg-[#bfa15a]/10 text-[#23281a]'
                                  : 'border-gray-200 hover:border-[#bfa15a]/50 text-gray-700'
                              }`}
                            >
                              <div className="text-sm font-semibold">{day.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Seleção de Horário */}
                      {selectedDate && (
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                          <h3 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
                            <FaClock className="text-[#bfa15a]" />
                            Escolha um Horário
                          </h3>
                          
                          {availableSlots.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {availableSlots.map((slot, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedTime(slot)}
                                  className={`p-4 rounded-lg border-2 transition-all ${
                                    selectedTime?.start === slot.start
                                      ? 'border-[#bfa15a] bg-[#bfa15a]/10 text-[#23281a]'
                                      : 'border-gray-200 hover:border-[#bfa15a]/50 text-gray-700'
                                  }`}
                                >
                                  <div className="text-sm font-semibold">{slot.displayTime}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Duração: {slot.duration} min
                                  </div>
                                  {slot.available_vacancies > 1 && (
                                    <div className="text-xs text-blue-600 mt-1 font-medium">
                                      {slot.available_vacancies} vagas disponíveis
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <FaClock className="text-4xl mx-auto mb-4 text-gray-300" />
                              <p>Nenhum horário disponível para esta data.</p>
                              <p className="text-sm">Tente selecionar outra data ou aguarde o sindicato configurar a agenda.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirmação */}
                      {selectedDate && selectedTime && (
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                          <h3 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
                            <FaCheckCircle className="text-[#bfa15a]" />
                            Confirmar Agendamento
                          </h3>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-green-800 mb-2">Resumo do Agendamento:</h4>
                            <p className="text-green-700">
                              <strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}<br />
                              <strong>Horário:</strong> {selectedTime.displayTime}<br />
                              <strong>Funcionário:</strong> {processo.nome_funcionario}<br />
                              <strong>Empresa:</strong> {processo.empresa_nome}
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-800 mb-2">Videoconferência:</h4>
                            <p className="text-blue-700 text-sm mb-2">
                              A videoconferência será realizada através do Google Meet público.
                            </p>
                            <div className="bg-green-100 p-2 rounded text-xs">
                              ✅ Google Meet público - sempre disponível
                            </div>
                          </div>
                          
                          <button
                            onClick={handleAgendar}
                            disabled={agendando}
                            className="w-full px-6 py-3 bg-[#bfa15a] text-white rounded-lg font-bold text-lg hover:bg-[#23281a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {agendando ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Agendando...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle />
                                Confirmar Agendamento
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Documentos */}
              {activeTab === 'documents' && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">Documentos</h3>
                  <p className="text-gray-500">Funcionalidade de documentos em desenvolvimento</p>
                </div>
              )}

              {/* Tab: Histórico */}
              {activeTab === 'history' && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">Histórico</h3>
                  <p className="text-gray-500">Funcionalidade de histórico em desenvolvimento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
