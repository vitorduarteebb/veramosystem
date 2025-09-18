import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCalendar, FaClock, FaArrowLeft, FaCheckCircle, FaVideo, FaCalendarPlus, FaBuilding, FaUserTie } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';

export default function AgendamentoSindicato() {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function fetchProcesso() {
      setLoading(true);
      try {
        const token = localStorage.getItem('@veramo_auth')
          ? JSON.parse(localStorage.getItem('@veramo_auth')).access
          : null;
        const resp = await fetch(`https://veramo.com.br/api/demissao-processes/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) throw new Error('Erro ao buscar processo');
        setProcesso(await resp.json());
      } catch (err) {
        setError('Erro ao buscar detalhes do processo.');
      } finally {
        setLoading(false);
      }
    }
    fetchProcesso();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  async function fetchAvailableSlots(date) {
    try {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;
      
      // Buscar o ID do sindicato do usuário logado
      const userInfo = JSON.parse(localStorage.getItem('@veramo_auth'));
      const unionId = userInfo.union_id;
      
      const resp = await fetch(`https://veramo.com.br/api/schedule-config/available-slots/?union=${unionId}&date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (resp.ok) {
        const slots = await resp.json();
        // Formatar os slots para exibição
        const formattedSlots = slots.map(slot => ({
          ...slot,
          displayTime: `${new Date(slot.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          user_name: slot.user_name,
          duration: slot.duration_minutes || 60
        }));
        setAvailableSlots(formattedSlots);
      }
    } catch (err) {
      console.error('Erro ao buscar horários disponíveis:', err);
    }
  }

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

      // Gerar link do Google Meet
      const meetLink = generateMeetLink(selectedDate, selectedTime);
      
      const resp = await fetch(`https://veramo.com.br/api/demissao-processes/${id}/agendar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          start: selectedTime.start,
          end: selectedTime.end,
          user_id: selectedTime.user_id,
          video_link: meetLink
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao agendar');
      }

      // Redirecionar para o painel com mensagem de sucesso
      navigate('/sindicato/hoje', { 
        state: { message: 'Homologação agendada com sucesso! Google Meet público configurado.' }
      });
    } catch (err) {
      setError(`Erro ao agendar: ${err.message}`);
    } finally {
      setAgendando(false);
    }
  };

  // Função para gerar link do Google Meet
  const generateMeetLink = (date, timeSlot) => {
    // O backend irá gerar o link automaticamente
    return null;
  };

  const getNextWeekDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Pular finais de semana
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-[#bfa15a] text-lg animate-pulse text-center py-8">
            Carregando processo...
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
          <div className="text-red-500 text-lg text-center py-8">{error}</div>
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-red-500 text-lg text-center py-8">Processo não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <Sidebar />
      <div className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#bfa15a] hover:text-[#23281a] transition mb-4"
            >
              <FaArrowLeft />
              Voltar
            </button>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-3">
              <FaCalendar className="text-[#bfa15a]" />
              Agendar Homologação
            </h1>
            <p className="text-[#23281a] text-lg">
              Escolha uma data e horário para realizar a homologação.
            </p>
          </div>

          {/* Mensagem de sucesso */}
          {location.state?.message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                <span className="text-green-800 font-semibold">{location.state.message}</span>
              </div>
            </div>
          )}

          {/* Informações do Processo */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
              <FaCalendar className="text-[#bfa15a]" />
              Dados do Processo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Funcionário:</strong> {processo.nome_funcionario}</p>
                <p><strong>Empresa:</strong> {processo.empresa_nome}</p>
                <p><strong>Sindicato:</strong> {processo.sindicato_nome}</p>
              </div>
              <div>
                <p><strong>Status:</strong> {processo.status}</p>
                <p><strong>Data de Criação:</strong> {new Date(processo.created_at).toLocaleDateString('pt-BR')}</p>
                <p><strong>Motivo:</strong> {processo.motivo}</p>
              </div>
            </div>
          </div>

          {/* Seção de Agendamento Já Realizado */}
          {processo.status === 'agendado' && processo.data_inicio && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                Agendamento Confirmado
              </h2>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FaCalendar className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Data Agendada</p>
                      <p className="font-bold text-green-800">{new Date(processo.data_inicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaClock className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Horário</p>
                      <p className="font-bold text-green-800">{new Date(processo.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBuilding className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="font-bold text-green-800">{processo.empresa_nome || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaUserTie className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Homologador</p>
                      <p className="font-bold text-green-800">{processo.sindicato_nome || 'Sindicato Unidade 2'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-3">
                {/* Botão do Google Calendar */}
                <button
                  onClick={() => {
                    const startDate = new Date(processo.data_inicio);
                    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutos depois
                    
                    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Homologação - ${processo.nome_funcionario}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Homologação de demissão para ${processo.nome_funcionario} da empresa ${processo.empresa_nome}&location=${processo.video_link || 'Google Meet'}`;
                    
                    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FaCalendarPlus />
                  <span>Definir Link</span>
                </button>

                {/* Botão do Google Meet */}
                {processo.video_link && processo.video_link !== 'https://meet.google.com' && (
                  <button
                    onClick={() => {
                      const link = processo.video_link.startsWith('http') 
                        ? processo.video_link 
                        : `https://${processo.video_link.replace(/^\/+/, '')}`;
                      window.open(link, '_blank', 'noopener,noreferrer');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaVideo />
                    <span>Iniciar</span>
                  </button>
                )}

                {/* Botão Finalizar - Assinatura Eletrônica */}
                {processo.status === 'agendado' && (
                  <button
                    onClick={() => {
                      // Buscar o agendamento relacionado para obter o schedule_id
                      navigate(`/sindicato/assinatura/${id}`);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaCheckCircle />
                    <span>Finalizar</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Seleção de Data - Só mostra se não estiver agendado */}
          {processo.status !== 'agendado' && (
            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
              <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
                <FaCalendar className="text-[#bfa15a]" />
                Escolha uma Data
              </h2>
              
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
          )}

          {/* Seleção de Horário - Só mostra se não estiver agendado */}
          {processo.status !== 'agendado' && selectedDate && (
            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
              <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
                <FaClock className="text-[#bfa15a]" />
                Escolha um Horário
              </h2>
              
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
                        Homologador: {slot.user_name} • Duração: {slot.duration} min
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaClock className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>Nenhum horário disponível para esta data.</p>
                  <p className="text-sm">Verifique se há homologadores configurados na carga horária.</p>
                </div>
              )}
            </div>
          )}

          {/* Botão de Agendamento - Só mostra se não estiver agendado */}
          {processo.status !== 'agendado' && selectedDate && selectedTime && (
            <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
              <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-[#bfa15a]" />
                Confirmar Agendamento
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-800 mb-2">Resumo do Agendamento:</h3>
                <p className="text-green-700">
                  <strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}<br />
                  <strong>Horário:</strong> {selectedTime.displayTime}<br />
                  <strong>Homologador:</strong> {selectedTime.user_name}<br />
                  <strong>Funcionário:</strong> {processo.nome_funcionario}<br />
                  <strong>Empresa:</strong> {processo.empresa_nome}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Videoconferência:</h3>
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
      </div>
    </div>
  );
} 