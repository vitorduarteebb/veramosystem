import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
import { getToken } from '../services/auth';

async function fetchSlotsDisponiveis(unionId, date) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
    
  const response = await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}available-slots/?union=${unionId}&date=${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) throw new Error('Erro ao buscar slots disponíveis');
  return await response.json();
}

async function agendarHomologacao(processoId, slotData) {
  const token = localStorage.getItem('@veramo_auth')
    ? JSON.parse(localStorage.getItem('@veramo_auth')).access
    : null;
    
  // Remover user_id dos dados enviados - será selecionado automaticamente pelo backend
  const { user_id, ...dataToSend } = slotData;
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/agendar/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });
  
  if (!response.ok) throw new Error('Erro ao agendar homologação');
  return await response.json();
}

export default function AgendamentoHomologacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listMode = !id; // quando rota é /sindicato/agendamentos (sem :id)
  const [processo, setProcesso] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agendando, setAgendando] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados para modo lista (sem id)
  const [processos, setProcessos] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    async function loadProcesso() {
      try {
        if (!id) return; // modo lista não carrega processo

        const auth = JSON.parse(localStorage.getItem('@veramo_auth') || '{}');
        const token = auth?.access;
        const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) throw new Error('Erro ao carregar processo');
        const data = await response.json();
        setProcesso(data);
        
        // Definir data inicial como hoje
        const hoje = new Date().toISOString().split('T')[0];
        setSelectedDate(hoje);
        
      } catch (err) {
        setError('Erro ao carregar processo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProcesso();
  }, [id, navigate]);

  // Carrega dados no modo lista: processos aprovados e agendamentos marcados
  useEffect(() => {
    if (!listMode) return;
    setLoading(true);
    const tokens = getToken();
    (async () => {
      try {
        // Processos do sindicato
        const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?sindicato=${tokens.union}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await resp.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        setProcessos(items);

        // Agendamentos do sindicato
        const respSch = await fetch(`${API_ENDPOINTS.SCHEDULES}?union=${tokens.union}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
        const dataSch = await respSch.json();
        const itemsSch = Array.isArray(dataSch) ? dataSch : (Array.isArray(dataSch?.results) ? dataSch.results : []);
        setSchedules(itemsSch);
      } catch (e) {
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, [listMode]);

  const processosAprovados = useMemo(() => (
    processos.filter(p => ['documentos_aprovados', 'aguardando_agendamento'].includes(p.status))
  ), [processos]);

  const listaFiltrada = useMemo(() => {
    const busca = search.toLowerCase();
    const emp = empresaFiltro.toLowerCase();
    return processosAprovados.filter(p => {
      const nome = (p.nome_funcionario || p.employee_name || '').toLowerCase();
      const empresa = (p.empresa_nome || p.company_name || '').toLowerCase();
      const okBusca = !busca || nome.includes(busca) || empresa.includes(busca);
      const okEmp = !emp || empresa.includes(emp);
      return okBusca && okEmp;
    });
  }, [processosAprovados, search, empresaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / porPagina));
  const paginaCorrigida = Math.min(pagina, totalPaginas);
  const itensPaginados = useMemo(() => (
    listaFiltrada.slice((paginaCorrigida - 1) * porPagina, paginaCorrigida * porPagina)
  ), [listaFiltrada, paginaCorrigida]);

  useEffect(() => {
    if (selectedDate && processo) {
      fetchSlotsDisponiveis(processo.sindicato, selectedDate)
        .then(setSlots)
        .catch(err => {
          console.error('Erro ao buscar slots:', err);
          setSlots([]);
        });
    }
  }, [selectedDate, processo]);

  const handleAgendar = async (slot) => {
    setAgendando(true);
    try {
      if (!id) throw new Error('Processo não informado');
      const data = await agendarHomologacao(id, {
        start: slot.start,
        end: slot.end,
        date: selectedDate
        // user_id removido - será selecionado automaticamente pelo backend
      });
      // Atualiza a tela atual para mostrar o link imediatamente, caso precise permanecer na página
      setProcesso(prev => ({
        ...prev,
        status: 'agendado',
        video_link: data?.video_link || prev?.video_link || 'https://meet.google.com'
      }));
      // Redireciona com mensagem
      navigate('/sindicato/hoje', { state: { message: 'Homologação agendada com sucesso! Link do Meet disponível.' } });
      
    } catch (err) {
      setError('Erro ao agendar homologação');
      console.error(err);
    } finally {
      setAgendando(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(11, 16); // Pega apenas HH:MM
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-[#bfa15a] text-lg animate-pulse text-center py-8">
            Carregando...
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

  // Modo LISTA (sem id): módulo de agendamentos
  if (listMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight">Agendamentos</h1>
              <p className="text-[#23281a]">Selecione um processo aprovado para agendar a homologação ou consulte os horários marcados.</p>
            </div>

            {/* Filtros */}
            <div className="bg-white/95 rounded-2xl shadow border border-[#bfa15a]/20 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPagina(1); }}
                  placeholder="Buscar por funcionário ou empresa"
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                />
                <input
                  value={empresaFiltro}
                  onChange={e => { setEmpresaFiltro(e.target.value); setPagina(1); }}
                  placeholder="Filtrar por empresa"
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                />
                {(search || empresaFiltro) && (
                  <button
                    onClick={() => { setSearch(''); setEmpresaFiltro(''); setPagina(1); }}
                    className="px-3 py-2 bg-gray-200 rounded-lg"
                  >Limpar filtros</button>
                )}
              </div>
            </div>

            {/* Prontos para agendar */}
            <div className="bg-white/95 rounded-2xl shadow border border-[#bfa15a]/30 overflow-hidden mb-8">
              <div className="px-4 py-3 border-b font-bold text-[#23281a] bg-[#bfa15a]/10">Prontos para Agendar ({listaFiltrada.length})</div>
              {listaFiltrada.length === 0 ? (
                <div className="p-6 text-center text-[#bfa15a]">Nenhum processo aprovado encontrado</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="p-3">Funcionário</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Criado em</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensPaginados.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">{p.nome_funcionario || '-'}</td>
                        <td className="p-3">{p.empresa_nome || '-'}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">{p.status?.replaceAll('_', ' ')}</span>
                        </td>
                        <td className="p-3">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-[#bfa15a] text-white rounded text-sm" onClick={() => navigate(`/sindicato/analise/${p.id}`)}>Analisar</button>
                            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => navigate(`/sindicato/agendar/${p.id}`)}>Agendar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* paginação */}
              {listaFiltrada.length > 0 && (
                <div className="flex items-center justify-between p-3 text-sm text-gray-600">
                  <div>{listaFiltrada.length} registros • Página {paginaCorrigida} de {totalPaginas}</div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaCorrigida===1} onClick={() => setPagina(p=>Math.max(1,p-1))}>Anterior</button>
                    <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={paginaCorrigida===totalPaginas} onClick={() => setPagina(p=>Math.min(totalPaginas,p+1))}>Próxima</button>
                  </div>
                </div>
              )}
            </div>

            {/* Agendamentos marcados */}
            <div className="bg-white/95 rounded-2xl shadow border border-[#bfa15a]/30 overflow-hidden">
              <div className="px-4 py-3 border-b font-bold text-[#23281a] bg-[#bfa15a]/10">Agendamentos Marcados ({schedules.length})</div>
              {schedules.length === 0 ? (
                <div className="p-6 text-center text-[#23281a]">Nenhum agendamento encontrado</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="p-3">Data</th>
                      <th className="p-3">Horário</th>
                      <th className="p-3">Homologador</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Funcionário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{s.date ? new Date(s.date).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="p-3">{(s.start||'').substring(11,16)} - {(s.end||'').substring(11,16)}</td>
                        <td className="p-3">{s.user_name || s.user || '-'}</td>
                        <td className="p-3">{s.empresa_nome || s.company_name || '-'}</td>
                        <td className="p-3">{s.nome_funcionario || s.employee_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
              onClick={() => navigate('/sindicato/hoje')}
              className="flex items-center gap-2 text-[#bfa15a] hover:text-[#23281a] transition mb-4"
            >
              <FaArrowLeft />
              Voltar ao Painel
            </button>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-3">
              <FaCalendarAlt className="text-[#bfa15a]" />
              Agendar Homologação
            </h1>
            <p className="text-[#23281a] text-lg">
              Escolha uma data e horário disponível para a homologação.
            </p>
          </div>

          {/* Informações do Processo */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Processo Aprovado
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Funcionário:</strong> {processo.nome_funcionario}</p>
                <p><strong>Empresa:</strong> {processo.empresa_nome}</p>
                <p><strong>Sindicato:</strong> {processo.sindicato_nome}</p>
              </div>
              <div>
                <p><strong>Status:</strong> {processo.status}</p>
                <p><strong>Motivo:</strong> {processo.motivo}</p>
                <p><strong>Data de Criação:</strong> {new Date(processo.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Seleção de Data */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#23281a] mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-[#bfa15a]" />
              Escolher Data
            </h2>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-[#bfa15a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
            />
            
            {selectedDate && (
              <p className="text-[#23281a] mt-2">
                <strong>Data selecionada:</strong> {formatDate(selectedDate)}
              </p>
            )}
          </div>

          {/* Slots Disponíveis */}
          <div className="bg-white/95 rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6">
            <h2 className="text-xl font-bold text-[#23281a] mb-6 flex items-center gap-2">
              <FaClock className="text-[#bfa15a]" />
              Horários Disponíveis
            </h2>
            
            {slots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot, index) => (
                  <div key={index} className="bg-[#f5ecd7] rounded-xl p-4 border border-[#bfa15a]/20">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#bfa15a] mb-3">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">Duração: {slot.duration_minutes || 60} min</p>
                      <button
                        onClick={() => handleAgendar(slot)}
                        disabled={agendando}
                        className="w-full px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-medium transition disabled:opacity-50"
                      >
                        {agendando ? 'Agendando...' : 'Agendar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#23281a]">
                <FaCalendarAlt className="text-[#bfa15a] text-4xl mx-auto mb-4" />
                <p className="text-lg font-semibold">Nenhum horário disponível</p>
                <p className="text-sm text-gray-600 mt-2">
                  Tente selecionar outra data ou entre em contato com o sindicato
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 