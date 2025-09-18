import React from 'react';
import { FaCalendarAlt, FaVideo, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

export default function AgendamentoStats({ agendamentos }) {
  const stats = {
    total: agendamentos.length,
    agendados: agendamentos.filter(a => a.status === 'agendado').length,
    aprovados: agendamentos.filter(a => a.status === 'documentos_aprovados' || a.status === 'aceito').length,
    pendentes: agendamentos.filter(a => !['agendado', 'documentos_aprovados', 'aceito', 'documentos_recusados', 'recusado'].includes(a.status)).length,
    recusados: agendamentos.filter(a => a.status === 'documentos_recusados' || a.status === 'recusado').length,
  };

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: <FaCalendarAlt className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Agendados',
      value: stats.agendados,
      icon: <FaVideo className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Aprovados',
      value: stats.aprovados,
      icon: <FaCheckCircle className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Pendentes',
      value: stats.pendentes,
      icon: <FaClock className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Recusados',
      value: stats.recusados,
      icon: <FaExclamationTriangle className="w-6 h-6 text-white" />,
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/20 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
            <div className={`w-3 h-3 rounded-full ${stat.bgColor}`}></div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-[#1a2a1a]">{stat.value}</h3>
            <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
