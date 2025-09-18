import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight, 
  FaClock, 
  FaUser, 
  FaBuilding, 
  FaVideo, 
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaCrown,
  FaUserTie
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
import { getToken, getUserInfo } from '../services/auth';

export default function EscalaSindicato() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHomologador, setSelectedHomologador] = useState('all');
  const [homologadores, setHomologadores] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados para modal de detalhes
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Estados para controle de visualização
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnlyMySchedules, setShowOnlyMySchedules] = useState(false);

  // Estados para modal de alteração de responsável
  const [showChangeResponsibleModal, setShowChangeResponsibleModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewResponsible, setSelectedNewResponsible] = useState('');
  const [changingResponsible, setChangingResponsible] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    // Obter informações do usuário atual
    const userInfo = getUserInfo();
    setCurrentUser(userInfo);
  }, []);

  // Função para carregar usuários disponíveis para o agendamento específico
  const loadAvailableUsers = async (scheduleId) => {
    try {
      const tokens = getToken();
      if (!tokens?.access) return;

      const response = await fetch(`${API_ENDPOINTS.SCHEDULES}${scheduleId}/available-responsibles/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.available_users || []);
        console.log(`[DEBUG] Usuários disponíveis para o agendamento ${scheduleId}:`, data.available_users);
        console.log(`[DEBUG] Total de usuários disponíveis: ${data.total_available}`);
      } else {
        console.error('Erro ao carregar usuários disponíveis:', response.status);
        setAvailableUsers([]);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários disponíveis:', err);
      setAvailableUsers([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        navigate('/login');
        return;
      }

      // Carregar agendamentos do mês atual
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const schedulesResp = await fetch(
        `${API_ENDPOINTS.SCHEDULES}?union=${tokens.union}&date_start=${startOfMonth.toISOString().split('T')[0]}&date_end=${endOfMonth.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (schedulesResp.ok) {
        const schedulesData = await schedulesResp.json();
        const schedulesArray = Array.isArray(schedulesData) ? schedulesData : (Array.isArray(schedulesData?.results) ? schedulesData.results : []);
        setSchedules(schedulesArray);
      }

      // Carregar processos do sindicato
      const processosResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${tokens.union}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (processosResp.ok) {
        const processosData = await processosResp.json();
        const processosArray = Array.isArray(processosData) ? processosData : (Array.isArray(processosData?.results) ? processosData.results : []);
        setProcessos(processosArray);
      }

      // Carregar lista de homologadores únicos
      const uniqueHomologadores = [...new Set(schedules.map(s => s.homologador_nome || s.user_name || s.user).filter(Boolean))];
      setHomologadores(uniqueHomologadores);

    } catch (err) {
      setError('Erro ao carregar dados da escala');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Função para navegar entre meses
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Função para obter os dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Função para obter agendamentos de um dia específico
  const getSchedulesForDay = (date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => {
      const scheduleDate = schedule.date || schedule.start_time?.split('T')[0];
      return scheduleDate === dateStr;
    });
  };

  // Função para filtrar agendamentos por homologador
  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    
    // Filtro por homologador específico
    if (selectedHomologador !== 'all') {
      filtered = filtered.filter(schedule => 
        (schedule.homologador_nome || schedule.user_name || schedule.user) === selectedHomologador
      );
    }
    
    // Filtro para mostrar apenas agendamentos próprios (se ativado)
    if (showOnlyMySchedules && currentUser) {
      filtered = filtered.filter(schedule => {
        const scheduleUser = schedule.homologador_nome || schedule.user_name || schedule.user;
        const currentUserName = currentUser.name || currentUser.username || currentUser.email;
        return scheduleUser === currentUserName;
      });
    }
    
    return filtered;
  }, [schedules, selectedHomologador, showOnlyMySchedules, currentUser]);

  // Função para obter cor do agendamento baseado no status e se é próprio
  const getScheduleColor = (schedule) => {
    const status = schedule.status || 'agendado';
    const isMySchedule = currentUser && (schedule.homologador_nome || schedule.user_name || schedule.user) === (currentUser.name || currentUser.username || currentUser.email);
    
    // Cores baseadas no status
    let baseColor = '';
    switch (status) {
      case 'agendado':
        baseColor = 'bg-blue-100 border-blue-300 text-blue-800';
        break;
      case 'concluido':
        baseColor = 'bg-green-100 border-green-300 text-green-800';
        break;
      case 'cancelado':
        baseColor = 'bg-red-100 border-red-300 text-red-800';
        break;
      default:
        baseColor = 'bg-gray-100 border-gray-300 text-gray-800';
    }
    
    // Se for um agendamento próprio, adicionar destaque
    if (isMySchedule) {
      return baseColor + ' ring-2 ring-[#bfa15a] ring-opacity-50';
    }
    
    return baseColor;
  };

  // Função para formatar horário
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const time = new Date(timeStr);
      if (isNaN(time.getTime())) {
        // Se não conseguir fazer parse da data, tentar extrair apenas o horário
        const timeMatch = timeStr.match(/(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : 'N/A';
      }
      return time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('[DEBUG] Erro ao formatar horário:', timeStr, error);
      return 'N/A';
    }
  };

  // Função para obter nome do mês
  const getMonthName = () => {
    return currentDate.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Função para verificar se é hoje
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Função para abrir modal de detalhes
  const openDetailsModal = (schedule) => {
    console.log('[DEBUG] Abrindo modal com dados do agendamento:', schedule);
    console.log('[DEBUG] Campos disponíveis:', Object.keys(schedule));
    console.log('[DEBUG] user_name:', schedule.user_name);
    console.log('[DEBUG] user:', schedule.user);
    console.log('[DEBUG] start_time:', schedule.start_time);
    console.log('[DEBUG] start:', schedule.start);
    console.log('[DEBUG] end_time:', schedule.end_time);
    console.log('[DEBUG] end:', schedule.end);
    setSelectedSchedule(schedule);
    setShowDetailsModal(true);
  };

  // Função para abrir modal de alteração de responsável
  const openChangeResponsibleModal = (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedNewResponsible('');
    setShowChangeResponsibleModal(true);
    loadAvailableUsers(schedule.id);
  };

  // Função para alterar o responsável (sem verificação manual - já filtrado)
  const changeResponsible = async () => {
    if (!selectedNewResponsible || !selectedSchedule) return;

    setChangingResponsible(true);
    try {
      const tokens = getToken();
      
      const response = await fetch(`${API_ENDPOINTS.SCHEDULES}${selectedSchedule.id}/change-responsible/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_user_id: parseInt(selectedNewResponsible)
        }),
      });

      if (response.ok) {
        // Recarregar dados
        await loadData();
        setShowChangeResponsibleModal(false);
        setShowDetailsModal(false);
        alert('Responsável alterado com sucesso!');
      } else {
        const errorData = await response.json();
        alert(`Erro ao alterar responsável: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      alert('Erro ao alterar responsável');
      console.error(err);
    } finally {
      setChangingResponsible(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
            <p className="text-[#1a2a1a] text-lg">Carregando escala...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <Sidebar />
      <div className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-3">
              <FaCalendarAlt className="text-[#bfa15a]" />
              Escala de Homologações
            </h1>
            <p className="text-[#23281a] text-lg">
              Visualize todos os agendamentos do mês em formato de agenda
            </p>
          </div>

          {/* Controles */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Navegação do mês */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg bg-[#bfa15a] text-white hover:bg-[#a68b4a] transition-colors"
                >
                  <FaChevronLeft />
                </button>
                <h2 className="text-2xl font-bold text-[#23281a] capitalize">
                  {getMonthName()}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg bg-[#bfa15a] text-white hover:bg-[#a68b4a] transition-colors"
                >
                  <FaChevronRight />
                </button>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-[#bfa15a]" />
                  <select
                    value={selectedHomologador}
                    onChange={(e) => setSelectedHomologador(e.target.value)}
                    className="px-3 py-2 border border-[#bfa15a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                  >
                    <option value="all">Todos os homologadores</option>
                    {homologadores.map(homologador => (
                      <option key={homologador} value={homologador}>
                        {homologador}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filtro para mostrar apenas agendamentos próprios */}
                {currentUser && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOnlyMySchedules}
                        onChange={(e) => setShowOnlyMySchedules(e.target.checked)}
                        className="rounded border-[#bfa15a] text-[#bfa15a] focus:ring-[#bfa15a]"
                      />
                      <span className="text-sm text-[#23281a] flex items-center gap-1">
                        <FaCrown className="text-[#bfa15a]" />
                        Apenas meus agendamentos
                      </span>
                    </label>
                  </div>
                )}
                
                <button
                  onClick={() => navigate('/sindicato/agendamentos')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FaPlus />
                  Novo Agendamento
                </button>
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 overflow-hidden">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 bg-[#bfa15a]/10">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-4 text-center font-bold text-[#23281a] border-r border-[#bfa15a]/20 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((date, index) => {
                const daySchedules = getSchedulesForDay(date);
                const filteredDaySchedules = daySchedules.filter(schedule => 
                  selectedHomologador === 'all' || (schedule.user_name || schedule.user) === selectedHomologador
                );

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b border-[#bfa15a]/20 last:border-r-0 p-2 ${
                      date ? 'bg-white' : 'bg-gray-50'
                    } ${isToday(date) ? 'bg-[#bfa15a]/10' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-bold mb-2 ${isToday(date) ? 'text-[#bfa15a]' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                        
                        {/* Agendamentos do dia */}
                        <div className="space-y-1">
                          {filteredDaySchedules.slice(0, 3).map((schedule, scheduleIndex) => {
                            const isMySchedule = currentUser && (schedule.homologador_nome || schedule.user_name || schedule.user) === (currentUser.name || currentUser.username || currentUser.email);
                            
                            return (
                              <div
                                key={scheduleIndex}
                                onClick={() => openDetailsModal(schedule)}
                                className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getScheduleColor(schedule)}`}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <FaClock className="text-xs" />
                                  <span className="font-medium">
                                    {formatTime(schedule.start_time || schedule.start)}
                                  </span>
                                  {isMySchedule && (
                                    <FaCrown className="text-xs text-[#bfa15a]" title="Meu agendamento" />
                                  )}
                                </div>
                                <div className="truncate">
                                  {schedule.nome_funcionario || schedule.employee_name || 'Funcionário'}
                                </div>
                                <div className="truncate text-xs opacity-75">
                                  {schedule.empresa_nome || schedule.company_name || 'Empresa'}
                                </div>
                                <div className="truncate text-xs opacity-60">
                                  {schedule.homologador_nome || schedule.user_name || schedule.user || 'Homologador'}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Indicador de mais agendamentos */}
                          {filteredDaySchedules.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              +{filteredDaySchedules.length - 3} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          {currentUser && (
            <div className="mt-8 bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
              <h3 className="text-lg font-bold text-[#23281a] mb-4 flex items-center gap-2">
                <FaUserTie className="text-[#bfa15a]" />
                Legenda da Agenda
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded ring-2 ring-[#bfa15a] ring-opacity-50"></div>
                  <span className="text-sm text-gray-700">Meus agendamentos (com destaque dourado)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm text-gray-700">Agendamentos de outros homologadores</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCrown className="text-[#bfa15a]" />
                  <span className="text-sm text-gray-700">Ícone de coroa indica agendamento próprio</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm text-gray-700">Agendamentos concluídos</span>
                </div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaCalendarAlt className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#23281a]">Total de Agendamentos</h3>
                  <p className="text-2xl font-bold text-blue-600">{filteredSchedules.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaUser className="text-green-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#23281a]">Homologadores Ativos</h3>
                  <p className="text-2xl font-bold text-green-600">{homologadores.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaBuilding className="text-purple-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#23281a]">Empresas Únicas</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(filteredSchedules.map(s => s.empresa_nome || s.company_name)).size}
                  </p>
                </div>
              </div>
            </div>

            {/* Estatística específica do usuário atual */}
            {currentUser && (
              <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#bfa15a]/20 rounded-lg">
                    <FaCrown className="text-[#bfa15a] text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#23281a]">Meus Agendamentos</h3>
                    <p className="text-2xl font-bold text-[#bfa15a]">
                      {filteredSchedules.filter(schedule => {
                        const scheduleUser = schedule.homologador_nome || schedule.user_name || schedule.user;
                        const currentUserName = currentUser.name || currentUser.username || currentUser.email;
                        return scheduleUser === currentUserName;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#23281a]">Detalhes do Agendamento</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-700 mb-2">Data e Horário</h4>
                    <p className="text-gray-600">
                      {selectedSchedule.date ? new Date(selectedSchedule.date).toLocaleDateString('pt-BR') : 
                       selectedSchedule.start_time ? new Date(selectedSchedule.start_time).toLocaleDateString('pt-BR') :
                       selectedSchedule.start ? new Date(selectedSchedule.start).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      {formatTime(selectedSchedule.start_time || selectedSchedule.start)} - {formatTime(selectedSchedule.end_time || selectedSchedule.end)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-700 mb-2">Homologador</h4>
                    <p className="text-gray-600">
                      {selectedSchedule.homologador_nome || selectedSchedule.user_name || selectedSchedule.user || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-700 mb-2">Funcionário</h4>
                    <p className="text-gray-600">
                      {selectedSchedule.nome_funcionario || selectedSchedule.employee_name || selectedSchedule.funcionario_name || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-700 mb-2">Empresa</h4>
                    <p className="text-gray-600">
                      {selectedSchedule.empresa_nome || selectedSchedule.company_name || selectedSchedule.empresa_name || 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedSchedule.video_link && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-700 mb-2">Link de Videoconferência</h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedSchedule.video_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline truncate"
                      >
                        {selectedSchedule.video_link}
                      </a>
                      <FaVideo className="text-blue-600" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/sindicato/agendar/${selectedSchedule.process_id || selectedSchedule.id}`);
                    }}
                    className="px-4 py-2 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors flex items-center gap-2"
                  >
                    <FaEdit />
                    Editar Agendamento
                  </button>
                  
                  {/* Botão para alterar responsável - apenas para usuários master */}
                  {currentUser && currentUser.role === 'union_master' && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openChangeResponsibleModal(selectedSchedule);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <FaUserTie />
                      Alterar Responsável
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Alterar Responsável */}
      {showChangeResponsibleModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#23281a] flex items-center gap-2">
                  <FaUserTie className="text-purple-600" />
                  Alterar Responsável
                </h3>
                <button
                  onClick={() => setShowChangeResponsibleModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações do agendamento atual */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-700 mb-3">Agendamento Atual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Data:</span> {selectedSchedule.date ? new Date(selectedSchedule.date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Horário:</span> {formatTime(selectedSchedule.start_time || selectedSchedule.start)} - {formatTime(selectedSchedule.end_time || selectedSchedule.end)}
                    </div>
                    <div>
                      <span className="font-medium">Responsável Atual:</span> {selectedSchedule.homologador_nome || selectedSchedule.user_name || selectedSchedule.user || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Funcionário:</span> {selectedSchedule.nome_funcionario || selectedSchedule.employee_name || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Seleção do novo responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo Responsável (apenas usuários disponíveis)
                  </label>
                  <select
                    value={selectedNewResponsible}
                    onChange={(e) => setSelectedNewResponsible(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione um responsável disponível</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                  
                  {/* Informação sobre disponibilidade */}
                  <div className="mt-2 text-sm text-gray-600">
                    {availableUsers.length > 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FaCheckCircle />
                        {availableUsers.length} usuário(s) disponível(is) para este horário
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <FaTimesCircle />
                        Nenhum usuário disponível para este horário
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={changeResponsible}
                    disabled={!selectedNewResponsible || availableUsers.length === 0 || changingResponsible}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingResponsible ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Alterando...
                      </>
                    ) : (
                      <>
                        <FaUserTie />
                        Confirmar Alteração
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowChangeResponsibleModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
