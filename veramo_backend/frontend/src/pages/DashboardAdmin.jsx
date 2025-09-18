import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import QuickActions from '../components/QuickActions';
import StatCard from '../components/StatCard';
import ActivityChart from '../components/ActivityChart';
import RecentActivity from '../components/RecentActivity';
import QuickStats from '../components/QuickStats';

export default function DashboardAdmin() {
  const [dashboardData, setDashboardData] = useState({
    empresas: 0,
    sindicatos: 0,
    agendamentos: 0,
    usuarios: 0,
    logs: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento de dados
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados simulados (substitua por chamadas reais da API)
      setDashboardData({
        empresas: 3,
        sindicatos: 3,
        agendamentos: 12,
        usuarios: 11,
        logs: 47
      });
      
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  // Dados para gráficos
  const activityData = [
    { label: 'Jan', value: 65 },
    { label: 'Fev', value: 78 },
    { label: 'Mar', value: 85 },
    { label: 'Abr', value: 92 },
    { label: 'Mai', value: 88 },
    { label: 'Jun', value: 95 },
    { label: 'Jul', value: 98 }
  ];

  const userGrowthData = [
    { label: 'Jan', value: 45 },
    { label: 'Fev', value: 52 },
    { label: 'Mar', value: 68 },
    { label: 'Abr', value: 75 },
    { label: 'Mai', value: 82 },
    { label: 'Jun', value: 89 },
    { label: 'Jul', value: 95 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
        <Sidebar />
        <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 rounded-xl shadow p-6">
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
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
            Painel do Administrador
          </h1>
          <p className="text-gray-600">
            Bem-vindo de volta! Aqui está um resumo da atividade do sistema.
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={{
          totalUsers: dashboardData.usuarios,
          activeToday: Math.floor(dashboardData.usuarios * 0.3),
          pendingApprovals: Math.floor(dashboardData.agendamentos * 0.2),
          systemHealth: 99.8
        }} />

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Empresas Cadastradas"
            value={dashboardData.empresas}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            trend="up"
            trendValue="+2"
            color="blue"
            delay={0}
          />
          
          <StatCard
            title="Sindicatos Ativos"
            value={dashboardData.sindicatos}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            trend="up"
            trendValue="+1"
            color="green"
            delay={100}
          />
          
          <StatCard
            title="Agendamentos"
            value={dashboardData.agendamentos}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            trend="up"
            trendValue="+5"
            color="purple"
            delay={200}
          />
          
          <StatCard
            title="Usuários Totais"
            value={dashboardData.usuarios}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            trend="up"
            trendValue="+3"
            color="orange"
            delay={300}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ActivityChart 
              data={activityData}
              title="Atividade do Sistema"
              color="#3B82F6"
            />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="mb-8">
          <ActivityChart 
            data={userGrowthData}
            title="Crescimento de Usuários"
            color="#10B981"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <QuickActions />
        </div>
      </main>
    </div>
  );
} 