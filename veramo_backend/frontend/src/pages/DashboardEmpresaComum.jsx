import React, { useEffect, useState } from 'react';
import { getUserInfo } from '../services/auth';
import { FaCalendarAlt, FaCheckCircle, FaEye, FaDownload, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';
import EmpresaSidebar from '../components/EmpresaSidebar';
import TopMenu from '../components/TopMenu';
import SimpleChart from '../components/SimpleChart';
import RecentActivity from '../components/RecentActivity';

export default function DashboardEmpresaComum() {
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
      const user = getUserInfo();
      const companyId = user?.company;
      
      if (!companyId) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;

      const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}?company=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const finalizadas = data.filter(p => p.status === 'finalizado');
        
        // Gerar dados simulados para usuário comum
        const mockStats = {
          agendamentosHoje: 2,
          agendamentosHojeTrend: 0,
          agendamentosHojeTrendValue: 0,
          totalFuncionarios: 0, // Usuário comum não vê estatísticas de funcionários
          funcionariosTrend: 0,
          funcionariosTrendValue: 0,
          homologacoesFinalizadas: finalizadas.length,
          homologacoesTrend: 0,
          homologacoesTrendValue: 0,
          pendencias: 1,
          pendenciasTrend: 0,
          pendenciasTrendValue: 0,
          taxaSucesso: Math.round((finalizadas.length / Math.max(data.length, 1)) * 100),
          taxaSucessoTrend: 0,
          taxaSucessoTrendValue: 0,
          tempoMedio: 5,
          tempoMedioTrend: 0,
          tempoMedioTrendValue: 0,
        };

        const mockChartData = {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          values: [3, 5, 2, 4, 3, 2]
        };

        const mockActivities = [
          {
            type: 'homologacao_finalizada',
            message: 'Sua homologação foi finalizada com sucesso',
            time: '1 dia atrás'
          },
          {
            type: 'agendamento_criado',
            message: 'Novo agendamento criado para você',
            time: '3 dias atrás'
          }
        ];

        setDashboardData({
          stats: mockStats,
          homologacoesFinalizadas: finalizadas.slice(0, 3),
          agendamentosProximos: [],
          atividades: mockActivities,
          chartData: mockChartData
        });
      }
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
            Aqui está um resumo das suas atividades
          </p>
        </div>

        {/* Estatísticas principais (limitadas para usuário comum) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-[#1a2a1a]">{dashboardData.stats.agendamentosHoje || 0}</h3>
              <p className="text-[#23281a] font-medium">Agendamentos Hoje</p>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-[#1a2a1a]">{dashboardData.stats.homologacoesFinalizadas || 0}</h3>
              <p className="text-[#23281a] font-medium">Homologações Finalizadas</p>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-[#1a2a1a]">{dashboardData.stats.pendencias || 0}</h3>
              <p className="text-[#23281a] font-medium">Pendências</p>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-[#1a2a1a]">{dashboardData.stats.taxaSucesso || 0}%</h3>
              <p className="text-[#23281a] font-medium">Taxa de Sucesso</p>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gráfico de atividade */}
          <div className="lg:col-span-2">
            <SimpleChart 
              data={dashboardData.chartData} 
              title="Suas Atividades por Mês" 
            />
          </div>

          {/* Atividade recente */}
          <div>
            <RecentActivity activities={dashboardData.atividades} />
          </div>
        </div>

        {/* Seção de homologações finalizadas */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-[#1a2a1a]">Suas Homologações Finalizadas</h3>
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

        {/* Ações rápidas */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-[#1a2a1a] mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Homologações Finalizadas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
