import React, { useEffect, useState } from 'react';
import { getUserInfo } from '../services/auth';
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaClock, FaPlus, FaEye, FaDownload } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';
import EmpresaSidebar from '../components/EmpresaSidebar';
import TopMenu from '../components/TopMenu';
import QuickStats from '../components/QuickStats';
import SimpleChart from '../components/SimpleChart';
import RecentActivity from '../components/RecentActivity';

export default function DashboardEmpresaMaster() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    homologacoesFinalizadas: [],
    agendamentosProximos: [],
    atividades: [],
    chartData: {}
  });
  const user = getUserInfo();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const companyId = user?.company;
      
      if (!companyId) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      // Buscar dados de homologações
      const homologacoesResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?company=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Buscar dados de agendamentos
      const agendamentosResponse = await fetch(`${API_ENDPOINTS.SCHEDULES}?company=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let homologacoesData = [];
      let agendamentosData = [];

      if (homologacoesResponse.ok) {
        homologacoesData = await homologacoesResponse.json();
      }

      if (agendamentosResponse.ok) {
        agendamentosData = await agendamentosResponse.json();
      }

      // Processar dados para o dashboard
      const finalizadas = homologacoesData.filter(p => p.status === 'finalizado');
      const pendentes = homologacoesData.filter(p => p.status === 'pendente');
      const agendamentosHoje = agendamentosData.filter(a => {
        const hoje = new Date().toDateString();
        const dataAgendamento = new Date(a.data_agendamento).toDateString();
        return dataAgendamento === hoje;
      });

      // Gerar dados simulados para demonstração
      const mockStats = {
        agendamentosHoje: agendamentosHoje.length,
        agendamentosHojeTrend: 15,
        agendamentosHojeTrendValue: 15,
        totalFuncionarios: 45,
        funcionariosTrend: 8,
        funcionariosTrendValue: 8,
        homologacoesFinalizadas: finalizadas.length,
        homologacoesTrend: 12,
        homologacoesTrendValue: 12,
        pendencias: pendentes.length,
        pendenciasTrend: -5,
        pendenciasTrendValue: 5,
        taxaSucesso: Math.round((finalizadas.length / Math.max(homologacoesData.length, 1)) * 100),
        taxaSucessoTrend: 3,
        taxaSucessoTrendValue: 3,
        tempoMedio: 7,
        tempoMedioTrend: -2,
        tempoMedioTrendValue: 2,
      };

      const mockChartData = {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        values: [8, 12, 6, 15, 9, 11]
      };

      const mockActivities = [
        {
          type: 'homologacao_finalizada',
          message: 'Homologação de João Silva finalizada com sucesso',
          time: '2 horas atrás'
        },
        {
          type: 'agendamento_criado',
          message: 'Novo agendamento criado para Maria Santos',
          time: '4 horas atrás'
        },
        {
          type: 'funcionario_adicionado',
          message: 'Novo funcionário Pedro Costa adicionado',
          time: '1 dia atrás'
        },
        {
          type: 'agendamento_pendente',
          message: 'Agendamento de Ana Lima aguardando documentos',
          time: '2 dias atrás'
        }
      ];

      setDashboardData({
        stats: mockStats,
        homologacoesFinalizadas: finalizadas.slice(0, 5),
        agendamentosProximos: agendamentosData.slice(0, 3),
        atividades: mockActivities,
        chartData: mockChartData
      });

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 md:p-8`}>
        <TopMenu sidebarOpen={sidebarOpen} />
        
        {/* Header com saudação */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1a2a1a] mb-2">
            Olá, {user?.name || 'Usuário'}! 👋
          </h1>
          <p className="text-lg text-[#23281a]/80">
            Aqui está um resumo da sua empresa hoje
          </p>
        </div>

        {/* Estatísticas principais */}
        <QuickStats stats={dashboardData.stats} />

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gráfico de atividade */}
          <div className="lg:col-span-2">
            <SimpleChart 
              data={dashboardData.chartData} 
              title="Homologações por Mês" 
            />
          </div>

          {/* Atividade recente */}
          <div>
            <RecentActivity activities={dashboardData.atividades} />
          </div>
        </div>

        {/* Seções inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Homologações finalizadas */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#1a2a1a]">Homologações Finalizadas</h3>
              <a 
                href="/empresa/homologacoes-finalizadas"
                className="text-[#bfa15a] hover:text-[#23281a] font-medium text-sm transition-colors flex items-center gap-1"
              >
                <FaEye className="w-4 h-4" />
                Ver todas
              </a>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bfa15a] mx-auto"></div>
                <p className="text-[#1a2a1a] mt-2">Carregando...</p>
              </div>
            ) : dashboardData.homologacoesFinalizadas.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.homologacoesFinalizadas.map((homologacao, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1a2a1a]">{homologacao.employee?.name || 'Funcionário'}</h4>
                        <p className="text-sm text-gray-600">
                          Finalizada em: {new Date(homologacao.data_finalizacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Concluída
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCheckCircle className="text-gray-400 text-4xl mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma homologação finalizada ainda</p>
              </div>
            )}
          </div>

          {/* Próximos agendamentos */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#1a2a1a]">Próximos Agendamentos</h3>
              <a 
                href="/empresa/agendamentos"
                className="text-[#bfa15a] hover:text-[#23281a] font-medium text-sm transition-colors flex items-center gap-1"
              >
                <FaEye className="w-4 h-4" />
                Ver todos
              </a>
            </div>
            
            <div className="space-y-4">
              {dashboardData.agendamentosProximos.length > 0 ? (
                dashboardData.agendamentosProximos.map((agendamento, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaCalendarAlt className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1a2a1a]">{agendamento.employee?.name || 'Funcionário'}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')} às {agendamento.hora_agendamento}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Agendado
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FaCalendarAlt className="text-gray-400 text-4xl mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum agendamento próximo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-[#1a2a1a] mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/empresa/agendamentos"
              className="bg-gradient-to-r from-[#bfa15a] to-[#a68b4a] hover:from-[#a68b4a] hover:to-[#8b6f3a] text-white px-6 py-4 rounded-lg font-medium transition-all duration-300 flex items-center gap-3 hover:shadow-lg transform hover:-translate-y-1"
            >
              <FaCalendarAlt className="w-5 h-5" />
              Ver Agendamentos
            </a>
            <a
              href="/empresa/homologacoes-finalizadas"
              className="bg-gradient-to-r from-[#23281a] to-[#1a1a1a] hover:from-[#1a1a1a] hover:to-[#0f0f0f] text-white px-6 py-4 rounded-lg font-medium transition-all duration-300 flex items-center gap-3 hover:shadow-lg transform hover:-translate-y-1"
            >
              <FaCheckCircle className="w-5 h-5" />
              Homologações
            </a>
            <a
              href="/empresa/usuarios"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-medium transition-all duration-300 flex items-center gap-3 hover:shadow-lg transform hover:-translate-y-1"
            >
              <FaUsers className="w-5 h-5" />
              Funcionários
            </a>
            <a
              href="/empresa/relatorios"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-medium transition-all duration-300 flex items-center gap-3 hover:shadow-lg transform hover:-translate-y-1"
            >
              <FaDownload className="w-5 h-5" />
              Relatórios
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}