import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCalendar, FaClock, FaArrowLeft, FaCheckCircle, FaVideo, FaExternalLinkAlt, FaCopy, FaUser, FaBuilding, FaUsers, FaFileAlt, FaExclamationTriangle, FaCalendarAlt, FaHistory, FaDownload, FaEdit, FaTrash, FaBell, FaShare, FaUpload, FaEye, FaTimesCircle, FaInfoCircle, FaSync, FaSignature } from 'react-icons/fa';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { API_ENDPOINTS } from '../config/api';
import { getToken, getUserInfo, refreshToken, logout } from '../services/auth';

function TopMenu({ sidebarOpen }) {
  const user = getUserInfo();
  
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
  const [uploadModal, setUploadModal] = useState(false);
  const [docModal, setDocModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});

  useEffect(() => {
    fetchProcesso();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const syncVideoLink = async () => {
    try {
      console.log('[DEBUG] syncVideoLink: iniciando sincronização...');
      console.log('[DEBUG] syncVideoLink: processo atual:', processo);
      
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/sync-video-link/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[DEBUG] syncVideoLink: resposta recebida:', resp.status);

      if (resp.ok) {
        const data = await resp.json();
        console.log('[DEBUG] syncVideoLink: success:', data);
        // Recarregar os dados do processo
        await fetchProcesso();
        setSuccessMessage(`Link sincronizado! Novo link: ${data.video_link}`);
      } else {
        const errorData = await resp.json();
        console.error('[DEBUG] syncVideoLink: error:', errorData);
        setError(`Erro ao sincronizar: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao sincronizar link:', err);
      setError('Erro ao sincronizar link da videoconferência');
    }
  };

  const fetchProcesso = async () => {
    setLoading(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (resp.status === 401) {
        // Tentar renovar o token
        const newToken = await refreshToken();
        if (newToken) {
          const retryResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (!retryResp.ok) throw new Error('Erro ao buscar processo após renovação do token');
          const processoData = await retryResp.json();
          setProcesso(processoData);
        } else {
          logout();
          navigate('/login');
        }
      } else if (!resp.ok) {
        throw new Error('Erro ao buscar processo');
      } else {
        const processoData = await resp.json();
        console.log('[DEBUG] fetchProcesso: received data:', processoData);
        console.log('[DEBUG] fetchProcesso: video_link:', processoData.video_link);
        console.log('[DEBUG] fetchProcesso: video_link type:', typeof processoData.video_link);
        console.log('[DEBUG] fetchProcesso: video_link length:', processoData.video_link ? processoData.video_link.length : 'null');
        console.log('[DEBUG] fetchProcesso: data_inicio:', processoData.data_inicio);
        console.log('[DEBUG] fetchProcesso: status:', processoData.status);
        setProcesso(processoData);
      }
    } catch (err) {
      console.error('Erro ao buscar processo:', err);
      setError('Erro ao buscar detalhes do processo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const tokens = getToken();
      if (!tokens?.access) return;
      
      const unionId = processo.sindicato;
      const url = `${API_ENDPOINTS.SCHEDULE_CONFIG}available-slots/?union=${unionId}&date=${date}`;
      
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (resp.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResp = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (retryResp.ok) {
            const slots = await retryResp.json();
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
        }
      } else if (resp.ok) {
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
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/agendar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          start: selectedTime.start,
          end: selectedTime.end,
          meet_link: null
        }),
      });

      if (resp.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/agendar/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: selectedDate,
              start: selectedTime.start,
              end: selectedTime.end,
              meet_link: null
            }),
          });
          if (retryResp.ok) {
            setSuccessMessage('Agendamento realizado com sucesso!');
            await fetchProcesso(); // Recarregar dados
            setActiveTab('overview');
          } else {
            throw new Error('Erro ao agendar após renovação do token');
          }
        } else {
          logout();
          navigate('/login');
        }
      } else if (resp.ok) {
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

  // Função para upload de documentos
  const handleUploadDocuments = async () => {
    setUploading(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Adicionar arquivos e tipos
      Object.entries(selectedFiles).forEach(([type, file]) => {
        if (file) {
          formData.append('files', file);
          formData.append('types', type);
        }
      });

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/upload-documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: formData,
      });

      if (resp.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/upload-documents/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
            body: formData,
          });
          if (retryResp.ok) {
            setSuccessMessage('Documentos enviados com sucesso!');
            await fetchProcesso(); // Recarregar dados
            setUploadModal(false);
            setSelectedFiles({});
          }
        }
      } else if (resp.ok) {
        setSuccessMessage('Documentos enviados com sucesso!');
        await fetchProcesso(); // Recarregar dados
        setUploadModal(false);
        setSelectedFiles({});
      } else {
        throw new Error('Erro ao enviar documentos');
      }
    } catch (err) {
      setError('Erro ao enviar documentos');
    } finally {
      setUploading(false);
    }
  };

  // Função para reenvio de documento recusado
  const handleReuploadDocument = (doc) => {
    setDocModal(doc);
    setUploadModal(true);
  };

  // Função para seleção de arquivo
  const handleFileSelect = (docType, file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [docType]: file
    }));
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

  // Função para validar se o link de videoconferência é válido (Google Meet ou Google Calendar)
  const isValidMeetLink = (url) => {
    if (!url) {
      console.log('[DEBUG] isValidMeetLink: url is empty');
      return false;
    }
    
    const u = String(url).trim();
    console.log('[DEBUG] isValidMeetLink: checking url:', u);
    
    // Se não é um link HTTP, não é válido
    if (!u.startsWith('http')) {
      console.log('[DEBUG] isValidMeetLink: not starting with http');
      return false;
    }
    
    // Rejeitar URLs básicas do Google Meet (placeholders)
    if (u === 'https://meet.google.com' || 
        u === 'https://meet.google.com/' ||
        u === 'https://meet.google.com/new' ||
        u.includes('meet.google.com/new')) {
      console.log('[DEBUG] isValidMeetLink: is placeholder URL');
      return false;
    }
    
    // Aceitar links do Google Meet com código específico
    if (u.includes('meet.google.com') && u.includes('/')) {
      const parts = u.split('/');
      const meetingCode = parts[parts.length - 1];
      // Verificar se tem código de meeting (geralmente tem hífens)
      if (meetingCode && meetingCode.includes('-') && meetingCode.length > 10) {
        console.log('[DEBUG] isValidMeetLink: valid meet link with code:', meetingCode);
        return true;
      }
    }
    
    // Aceitar links do Google Calendar (que podem conter videoconferência)
    if (u.includes('calendar.app.google') && u.includes('/')) {
      console.log('[DEBUG] isValidMeetLink: valid Google Calendar link');
      return true;
    }
    
    console.log('[DEBUG] isValidMeetLink: not a valid videoconference link');
    return false;
  };

  const getStatusConfig = (status, processo) => {
    // Se tem agendamento com data e video_link válido, considera como agendado
    if (processo?.data_inicio && isValidMeetLink(processo?.video_link)) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <FaVideo className="text-green-600" />,
        text: 'Agendado',
        badge: 'bg-green-500 text-white'
      };
    }

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
      case 'assinatura_pendente':
        return {
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: <FaSignature className="text-purple-600" />,
          text: 'Aguardando Assinatura',
          badge: 'bg-purple-500 text-white'
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

  const statusConfig = getStatusConfig(processo.status, processo);

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
                {((processo.status === 'agendado' || (processo.data_inicio && isValidMeetLink(processo.video_link)) || (processo.video_link && processo.video_link.includes('meet.google.com'))) && (isValidMeetLink(processo.video_link) || (processo.video_link && processo.video_link.includes('meet.google.com')))) && (
                  <button
                    onClick={() => window.open(processo.video_link, '_blank')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaVideo className="w-4 h-4" />
                    Acessar Videoconferência
                  </button>
                )}
                {processo.status === 'assinatura_pendente' && (
                  <button
                    onClick={() => {
                      // Redirecionar para a página de assinatura da empresa
                      navigate(`/empresa/assinatura/${id}`);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FaSignature className="w-4 h-4" />
                    Assinar Documentos
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
                  // Só mostra a aba de agendamento se o processo foi aprovado pelo sindicato ou já tem agendamento
                  ...(processo.status === 'documentos_aprovados' || processo.status === 'aceito' || processo.status === 'agendado' || (processo.data_inicio && isValidMeetLink(processo.video_link)) || (processo.video_link && processo.video_link.includes('meet.google.com'))
                    ? [{ id: 'schedule', label: 'Agendamento', icon: <FaClock /> }] 
                    : []),
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
                          <p className="text-blue-600 font-medium">{processo.nome_funcionario}</p>
                        </div>
                      </div>
                      
                      {/* Informações de contato do funcionário */}
                      <div className="mt-4 space-y-2">
                        {processo.email_funcionario && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-700 font-medium">Email:</span>
                            <span className="text-blue-600">{processo.email_funcionario}</span>
                          </div>
                        )}
                        {processo.telefone_funcionario && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-700 font-medium">Telefone:</span>
                            <span className="text-blue-600">{processo.telefone_funcionario}</span>
                          </div>
                        )}
                        {!processo.email_funcionario && !processo.telefone_funcionario && (
                          <div className="text-sm text-blue-500 italic">
                            Informações de contato não disponíveis
                          </div>
                        )}
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

                  {/* Informações de Contato do Funcionário */}
                  {(processo.email_funcionario || processo.telefone_funcionario) && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
                        <FaUser className="text-[#bfa15a]" />
                        Informações de Contato do Funcionário
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {processo.email_funcionario && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="text-gray-900">{processo.email_funcionario}</span>
                            </div>
                          </div>
                        )}
                        {processo.telefone_funcionario && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Telefone:</span>
                              <span className="text-gray-900">{processo.telefone_funcionario}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status e Próximos Passos */}
                  {processo.status !== 'documentos_aprovados' && processo.status !== 'aceito' && processo.status !== 'agendado' && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-lg border-2 border-yellow-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-500 rounded-full p-3">
                          <FaClock className="text-white text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-yellow-800">Aguardando Aprovação do Sindicato</h3>
                          <p className="text-yellow-600">O processo está em análise</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              <strong>Status atual:</strong> {statusConfig.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              <strong>Próximo passo:</strong> Após aprovação do sindicato, você poderá agendar a videoconferência
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">
                              <strong>Quando aprovado:</strong> A aba "Agendamento" será disponibilizada
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Videoconferência */}
                  {(processo.status === 'agendado' || processo.status === 'aguardando_sala' || (processo.data_inicio && isValidMeetLink(processo.video_link)) || (processo.video_link && processo.video_link.includes('meet.google.com'))) && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500 rounded-full p-3">
                          <FaVideo className="text-white text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800">Videoconferência Agendada</h3>
                          <p className="text-green-600">
                            {(isValidMeetLink(processo.video_link) || (processo.video_link && processo.video_link.includes('meet.google.com'))) ? 'Link de videoconferência disponível' : 'Gerando link de videoconferência...'}
                          </p>
                        </div>
                      </div>
                      
                      {(isValidMeetLink(processo.video_link) || (processo.video_link && processo.video_link.includes('meet.google.com'))) ? (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-1">Link de videoconferência:</p>
                              <p className="font-mono text-sm break-all">{processo.video_link}</p>
                              <div className="text-xs text-gray-500 mt-2">
                                Debug: isValidMeetLink = {isValidMeetLink(processo.video_link) ? 'true' : 'false'} | 
                                Length = {processo.video_link?.length || 0}
                              </div>
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
                              <button
                                onClick={syncVideoLink}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                              >
                                <FaSync className="text-xs" />
                                Sync
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <FaClock className="text-yellow-600" />
                              <span className="text-yellow-800 font-medium">Aguardando link do sindicato</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">
                              O link do Google Meet será gerado pelo sindicato e aparecerá aqui automaticamente.
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={syncVideoLink}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                              >
                                <FaSync />
                                Sincronizar Link
                              </button>
                              <div className="text-xs text-gray-500 text-center">
                                Debug: video_link = "{processo?.video_link}"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Agendamento */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {(() => {
                    const isAgendado = processo.status === 'agendado';
                    const hasDataAndLink = processo.data_inicio && isValidMeetLink(processo.video_link);
                    const hasAnyMeetLink = processo.video_link && processo.video_link.includes('meet.google.com');
                    const shouldShowAgendado = isAgendado || hasDataAndLink || hasAnyMeetLink;
                    
                    console.log('[DEBUG] Tab Agendamento:');
                    console.log('  - processo.status:', processo.status);
                    console.log('  - processo.data_inicio:', processo.data_inicio);
                    console.log('  - processo.video_link:', processo.video_link);
                    console.log('  - isAgendado:', isAgendado);
                    console.log('  - hasDataAndLink:', hasDataAndLink);
                    console.log('  - hasAnyMeetLink:', hasAnyMeetLink);
                    console.log('  - shouldShowAgendado:', shouldShowAgendado);
                    
                    return shouldShowAgendado;
                  })() ? (
                    <div className="text-center py-12">
                      <div className="text-green-500 text-6xl mb-4">✅</div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">Videoconferência Agendada</h3>
                      <p className="text-green-600 mb-4">
                        Sua videoconferência está agendada para {new Date(processo.data_inicio).toLocaleDateString('pt-BR')} às {new Date(processo.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {(isValidMeetLink(processo.video_link) || (processo.video_link && processo.video_link.includes('meet.google.com'))) && (
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
                <div className="space-y-6">
                  {/* Header da seção de documentos */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a2a1a] mb-2">Documentos do Processo</h3>
                      <p className="text-gray-600">Gerencie os documentos necessários para a homologação</p>
                    </div>
                    <button 
                      onClick={() => setUploadModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors"
                    >
                      <FaUpload className="w-4 h-4" />
                      Enviar Documentos
                    </button>
                  </div>

                  {/* Lista de documentos */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-[#1a2a1a] mb-4">Documentos Enviados</h4>
                      
                      {processo.documents && processo.documents.length > 0 ? (
                        <div className="space-y-3">
                          {processo.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#bfa15a] rounded-lg">
                                  <FaFileAlt className="text-white text-lg" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">{doc.type || doc.name || 'Documento'}</h5>
                                  <p className="text-sm text-gray-600">
                                    Enviado em {new Date(doc.created_at || doc.uploaded_at).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Status do documento */}
                                <div className="flex items-center gap-2">
                                  {doc.status === 'APROVADO' && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      ✓ Aprovado
                                    </span>
                                  )}
                                  {doc.status === 'PENDENTE' && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                      ⏳ Pendente
                                    </span>
                                  )}
                                  {doc.status === 'RECUSADO' && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                      ✗ Recusado
                                    </span>
                                  )}
                                </div>
                                
                                {/* Motivo da recusa */}
                                {doc.status === 'RECUSADO' && doc.motivo_recusa && (
                                  <div className="text-sm text-red-600 max-w-xs">
                                    <p className="font-medium">Motivo:</p>
                                    <p className="truncate" title={doc.motivo_recusa}>{doc.motivo_recusa}</p>
                                  </div>
                                )}
                                
                                {/* Ações */}
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setDocModal(doc)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Visualizar"
                                  >
                                    <FaEye className="w-4 h-4" />
                                  </button>
                                  <a 
                                    href={doc.file} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Baixar"
                                  >
                                    <FaDownload className="w-4 h-4" />
                                  </a>
                                  {doc.status === 'RECUSADO' && (
                                    <button 
                                      onClick={() => handleReuploadDocument(doc)}
                                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Reenviar"
                                    >
                                      <FaUpload className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-3">📄</div>
                          <h4 className="text-lg font-medium text-gray-600 mb-2">Nenhum documento enviado</h4>
                          <p className="text-gray-500 mb-4">Envie os documentos necessários para iniciar o processo</p>
                          <button 
                            onClick={() => setUploadModal(true)}
                            className="px-4 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors"
                          >
                            Enviar Primeiro Documento
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documentos solicitados pelo sindicato */}
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5" />
                      Documentos Necessários
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'Rescisão de Contrato',
                        'CTPS',
                        'RG',
                        'CPF',
                        'Comprovante de Endereço',
                        'Exame Demissional',
                        'Extrato FGTS',
                        'Guia GRRF'
                      ].map((docType, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{docType}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Histórico */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Header da seção de histórico */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a2a1a] mb-2">Histórico do Processo</h3>
                      <p className="text-gray-600">Acompanhe todas as etapas e eventos do processo de homologação</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <FaHistory className="w-4 h-4" />
                      Timeline Completa
                    </div>
                  </div>

                  {/* Timeline de Eventos */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-[#1a2a1a] mb-6">Cronologia de Eventos</h4>
                      
                      <div className="relative">
                        {/* Linha vertical da timeline */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-6">
                          {/* Evento: Criação do Processo */}
                          <div className="relative flex items-start gap-4">
                            <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg">
                              <FaCalendar className="text-white text-lg" />
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-gray-900">Processo Criado</h5>
                                <span className="text-sm text-gray-500">
                                  {new Date(processo.created_at).toLocaleDateString('pt-BR')} às {new Date(processo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                Processo de homologação iniciado para <strong>{processo.nome_funcionario}</strong>
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Empresa: {processo.empresa_nome}</span>
                                <span>Sindicato: {processo.sindicato_nome}</span>
                                <span>Motivo: {processo.motivo}</span>
                              </div>
                            </div>
                          </div>

                          {/* Evento: Documentos Enviados */}
                          {processo.documents && processo.documents.length > 0 && (
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg">
                                <FaUpload className="text-white text-lg" />
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">Documentos Enviados</h5>
                                  <span className="text-sm text-gray-500">
                                    {processo.documents.length} documento(s)
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                  Documentos necessários foram enviados para análise do sindicato
                                </p>
                                <div className="space-y-2">
                                  {processo.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white rounded p-2 border border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <FaFileAlt className="text-gray-400 text-sm" />
                                        <span className="text-sm text-gray-700">{doc.type || doc.name || 'Documento'}</span>
                                      </div>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        doc.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                                        doc.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {doc.status === 'APROVADO' ? '✓ Aprovado' :
                                         doc.status === 'PENDENTE' ? '⏳ Pendente' :
                                         '✗ Recusado'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Evento: Aprovação do Sindicato */}
                          {(processo.status === 'documentos_aprovados' || processo.status === 'aceito' || processo.status === 'agendado') && (
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-full border-4 border-white shadow-lg">
                                <FaCheckCircle className="text-white text-lg" />
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">Aprovado pelo Sindicato</h5>
                                  <span className="text-sm text-gray-500">
                                    {processo.status === 'agendado' && processo.data_inicio ? 
                                      new Date(processo.data_inicio).toLocaleDateString('pt-BR') : 
                                      'Data não disponível'
                                    }
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                  Todos os documentos foram aprovados pelo sindicato. Processo liberado para agendamento.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                  <FaCheckCircle className="w-4 h-4" />
                                  <span>Status: {statusConfig.text}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Evento: Agendamento */}
                          {(processo.status === 'agendado' || (processo.data_inicio && isValidMeetLink(processo.video_link)) || (processo.video_link && processo.video_link.includes('meet.google.com'))) && processo.data_inicio && (
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full border-4 border-white shadow-lg">
                                <FaVideo className="text-white text-lg" />
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">Videoconferência Agendada</h5>
                                  <span className="text-sm text-gray-500">
                                    {new Date(processo.data_inicio).toLocaleDateString('pt-BR')} às {new Date(processo.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                  Videoconferência agendada com sucesso para homologação do processo
                                </p>
                                {(isValidMeetLink(processo.video_link) || (processo.video_link && processo.video_link.includes('meet.google.com'))) && (
                                  <div className="bg-white rounded p-3 border border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FaVideo className="text-purple-500 text-sm" />
                                        <span className="text-sm text-gray-700">Google Meet</span>
                                      </div>
                                      <button
                                        onClick={() => window.open(processo.video_link, '_blank')}
                                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                      >
                                        Acessar Link
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Evento: Processo Finalizado */}
                          {processo.status === 'finalizado' && (
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-green-600 rounded-full border-4 border-white shadow-lg">
                                <FaCheckCircle className="text-white text-lg" />
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">Processo Finalizado</h5>
                                  <span className="text-sm text-gray-500">
                                    Homologação concluída
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                  Processo de homologação foi concluído com sucesso
                                </p>
                                <div className="flex items-center gap-2 text-sm text-green-700">
                                  <FaCheckCircle className="w-4 h-4" />
                                  <span>Status: Finalizado</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Evento: Recusa */}
                          {(processo.status === 'recusado' || processo.status === 'documentos_recusados') && (
                            <div className="relative flex items-start gap-4">
                              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-lg">
                                <FaExclamationTriangle className="text-white text-lg" />
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">Processo Recusado</h5>
                                  <span className="text-sm text-gray-500">
                                    Requer atenção
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                  Processo foi recusado pelo sindicato. Verifique os motivos e tome as ações necessárias.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-red-700">
                                  <FaExclamationTriangle className="w-4 h-4" />
                                  <span>Status: {statusConfig.text}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumo do Status Atual */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5" />
                      Resumo do Status Atual
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${statusConfig.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                          <span className="font-medium text-gray-900">Status Atual</span>
                        </div>
                        <p className="text-sm text-gray-600">{statusConfig.text}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCalendar className="text-blue-500 w-4 h-4" />
                          <span className="font-medium text-gray-900">Data de Criação</span>
                        </div>
                        <p className="text-sm text-gray-600">{new Date(processo.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FaFileAlt className="text-blue-500 w-4 h-4" />
                          <span className="font-medium text-gray-900">Documentos</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {processo.documents ? processo.documents.length : 0} enviado(s)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Upload de Documentos */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1a2a1a]">Enviar Documentos</h3>
                <button 
                  onClick={() => {
                    setUploadModal(false);
                    setSelectedFiles({});
                    setDocModal(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { value: 'RESCISAO', label: 'Rescisão de Contrato' },
                  { value: 'CTPS', label: 'CTPS' },
                  { value: 'RG', label: 'RG' },
                  { value: 'CPF', label: 'CPF' },
                  { value: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço' },
                  { value: 'EXAME_DEMISSAO', label: 'Exame Demissional' },
                  { value: 'EXTRATO_FGTS', label: 'Extrato FGTS' },
                  { value: 'GUIA_GRRF', label: 'Guia GRRF' },
                  { value: 'OUTROS', label: 'Outros' }
                ].map((docType) => {
                  const existingDoc = processo.documents?.find(doc => doc.type === docType.value);
                  const canUpload = !existingDoc || existingDoc.status === 'RECUSADO';
                  
                  return (
                    <div key={docType.value} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{docType.label}</h4>
                        {existingDoc && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            existingDoc.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                            existingDoc.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {existingDoc.status === 'APROVADO' ? '✓ Aprovado' :
                             existingDoc.status === 'PENDENTE' ? '⏳ Pendente' :
                             '✗ Recusado'}
                          </span>
                        )}
                      </div>
                      
                      {canUpload ? (
                        <>
                          <input
                            type="file"
                            onChange={(e) => handleFileSelect(docType.value, e.target.files[0])}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          {selectedFiles[docType.value] && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ {selectedFiles[docType.value].name}
                            </p>
                          )}
                          {existingDoc && existingDoc.status === 'RECUSADO' && (
                            <p className="text-sm text-blue-600 mt-1">
                              ⚠️ Documento será substituído
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="p-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                          {existingDoc?.status === 'PENDENTE' && 'Documento enviado, aguardando análise'}
                          {existingDoc?.status === 'APROVADO' && 'Documento aprovado, não pode ser alterado'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setUploadModal(false);
                    setSelectedFiles({});
                    setDocModal(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadDocuments}
                  disabled={uploading || Object.keys(selectedFiles).length === 0}
                  className="flex-1 px-4 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FaUpload className="w-4 h-4" />
                      Enviar Documentos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Documento */}
      {docModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1a2a1a]">Visualizar Documento</h3>
                <button 
                  onClick={() => setDocModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{docModal.type || docModal.name || 'Documento'}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        docModal.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                        docModal.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {docModal.status === 'APROVADO' ? '✓ Aprovado' :
                         docModal.status === 'PENDENTE' ? '⏳ Pendente' :
                         '✗ Recusado'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Enviado em:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(docModal.created_at || docModal.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {docModal.motivo_recusa && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="font-medium text-red-800">Motivo da recusa:</span>
                      <p className="text-red-700 mt-1">{docModal.motivo_recusa}</p>
                    </div>
                  )}
                </div>

                {docModal.file && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      src={docModal.file}
                      className="w-full h-96"
                      title="Visualização do documento"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDocModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                {docModal.file && (
                  <a
                    href={docModal.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaDownload className="w-4 h-4" />
                    Baixar Documento
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
