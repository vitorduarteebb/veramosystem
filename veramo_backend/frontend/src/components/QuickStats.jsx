import React from 'react';
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaClock, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';

export default function QuickStats({ stats }) {
  const statCards = [
    {
      title: 'Agendamentos Hoje',
      value: stats?.agendamentosHoje || 0,
      icon: <FaCalendarAlt className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      trend: stats?.agendamentosHojeTrend || 0,
      trendValue: stats?.agendamentosHojeTrendValue || 0,
    },
    {
      title: 'Total de Funcionários',
      value: stats?.totalFuncionarios || 0,
      icon: <FaUsers className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      trend: stats?.funcionariosTrend || 0,
      trendValue: stats?.funcionariosTrendValue || 0,
    },
    {
      title: 'Homologações Finalizadas',
      value: stats?.homologacoesFinalizadas || 0,
      icon: <FaCheckCircle className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      trend: stats?.homologacoesTrend || 0,
      trendValue: stats?.homologacoesTrendValue || 0,
    },
    {
      title: 'Pendências',
      value: stats?.pendencias || 0,
      icon: <FaExclamationTriangle className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      trend: stats?.pendenciasTrend || 0,
      trendValue: stats?.pendenciasTrendValue || 0,
    },
    {
      title: 'Taxa de Sucesso',
      value: `${stats?.taxaSucesso || 0}%`,
      icon: <FaChartLine className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      trend: stats?.taxaSucessoTrend || 0,
      trendValue: stats?.taxaSucessoTrendValue || 0,
    },
    {
      title: 'Tempo Médio',
      value: `${stats?.tempoMedio || 0} dias`,
      icon: <FaClock className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      trend: stats?.tempoMedioTrend || 0,
      trendValue: stats?.tempoMedioTrendValue || 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20 group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
            {stat.trend !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.trend > 0 ? "M7 17l9.2-9.2M17 17V7H7" : "M17 7l-9.2 9.2M7 7v10h10"} />
                </svg>
                <span>{Math.abs(stat.trendValue)}%</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-3xl font-bold text-[#1a2a1a] group-hover:text-[#bfa15a] transition-colors duration-300">
              {stat.value}
            </h3>
            <p className="text-[#23281a] font-medium">{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}