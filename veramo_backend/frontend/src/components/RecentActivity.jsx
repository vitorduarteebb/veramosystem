import React from 'react';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaUser, FaCalendarAlt } from 'react-icons/fa';

export default function RecentActivity({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'homologacao_finalizada':
        return <FaCheckCircle className="text-green-500" />;
      case 'agendamento_criado':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'agendamento_pendente':
        return <FaClock className="text-yellow-500" />;
      case 'funcionario_adicionado':
        return <FaUser className="text-purple-500" />;
      case 'problema':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaCheckCircle className="text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'homologacao_finalizada':
        return 'bg-green-50 border-green-200';
      case 'agendamento_criado':
        return 'bg-blue-50 border-blue-200';
      case 'agendamento_pendente':
        return 'bg-yellow-50 border-yellow-200';
      case 'funcionario_adicionado':
        return 'bg-purple-50 border-purple-200';
      case 'problema':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-[#1a2a1a] mb-4">Atividade Recente</h3>
      <div className="space-y-3">
        {activities?.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a2a1a]">{activity.message}</p>
                <p className="text-xs text-gray-600">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
}