import React from 'react';
import { FaUserTie, FaFileAlt, FaCalendarAlt, FaClock, FaVideo, FaCheckCircle, FaExclamationTriangle, FaEye, FaExternalLinkAlt, FaBuilding, FaCalendarPlus } from 'react-icons/fa';

export default function AgendamentoCard({ agendamento, onClick, onVideoClick }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'agendado':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <FaVideo className="text-green-600" />,
          text: 'Agendado',
          badge: 'bg-green-500 text-white',
          ring: 'ring-2 ring-green-200'
        };
      case 'documentos_aprovados':
      case 'aceito':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <FaCheckCircle className="text-blue-600" />,
          text: 'Aprovado',
          badge: 'bg-blue-500 text-white',
          ring: ''
        };
      case 'documentos_recusados':
      case 'recusado':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <FaExclamationTriangle className="text-red-600" />,
          text: 'Recusado',
          badge: 'bg-red-500 text-white',
          ring: ''
        };
      default:
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <FaClock className="text-yellow-600" />,
          text: 'Pendente',
          badge: 'bg-yellow-500 text-white',
          ring: ''
        };
    }
  };

  const statusConfig = getStatusConfig(agendamento.status);
  const dataInicio = agendamento.data_inicio ? new Date(agendamento.data_inicio) : null;

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg border ${statusConfig.borderColor} p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group ${statusConfig.ring} hover:scale-[1.02]`}
      onClick={() => onClick(agendamento.id)}
    >
      {/* Header com status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
            <FaUserTie className={`text-xl ${statusConfig.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#1a2a1a]">{agendamento.nome_funcionario}</h3>
            <p className="text-sm text-gray-600">{agendamento.motivo}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.badge}`}>
          {statusConfig.text.toUpperCase()}
        </span>
      </div>

      {/* Informações principais */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <FaFileAlt className="text-[#bfa15a]" />
          <span className="font-medium">Exame:</span>
          <span>{agendamento.exame || 'Não especificado'}</span>
        </div>
        
        {/* Informações de agendamento destacadas */}
        {agendamento.status === 'agendado' && dataInicio && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
              <FaCalendarAlt className="text-green-600" />
              <span className="font-bold">AGENDADO PELA EMPRESA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-green-600" />
                <span className="font-medium">Data:</span>
                <span className="font-bold">{dataInicio.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-green-600" />
                <span className="font-medium">Hora:</span>
                <span className="font-bold">{dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <FaBuilding className="text-green-600" />
              <span className="font-medium">Empresa:</span>
              <span className="font-bold">{agendamento.empresa_nome || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <FaUserTie className="text-green-600" />
              <span className="font-medium">Homologador:</span>
              <span className="font-bold">{agendamento.sindicato_nome || 'Sindicato Unidade 2'}</span>
            </div>
          </div>
        )}
        
        {/* Informações básicas para outros status */}
        {agendamento.status !== 'agendado' && dataInicio && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FaCalendarAlt className="text-[#bfa15a]" />
              <span className="font-medium">Data:</span>
              <span>{dataInicio.toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FaClock className="text-[#bfa15a]" />
              <span className="font-medium">Hora:</span>
              <span>{dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </>
        )}

        {/* Link do Google Meet */}
        {agendamento.video_link && agendamento.video_link !== 'https://meet.google.com' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
              <FaVideo className="text-blue-600" />
              <span className="font-medium">Sala do Google Meet:</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={agendamento.video_link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline truncate flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                {agendamento.video_link}
              </a>
              <FaExternalLinkAlt className="text-blue-600 text-xs" />
            </div>
          </div>
        )}
      </div>

      {/* Status com ícone */}
      <div className={`flex items-center gap-2 text-sm font-medium ${statusConfig.color} mb-4`}>
        {statusConfig.icon}
        <span>Status: {statusConfig.text}</span>
      </div>

      {/* Footer com ações */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-[#bfa15a] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <FaEye className="text-sm" />
          <span>Ver detalhes</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão do Google Calendar */}
          {agendamento.status === 'agendado' && dataInicio && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const startDate = new Date(dataInicio);
                const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutos depois
                
                const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Homologação - ${agendamento.nome_funcionario}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Homologação de demissão para ${agendamento.nome_funcionario} da empresa ${agendamento.empresa_nome}&location=${agendamento.video_link || 'Google Meet'}`;
                
                window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              title="Adicionar ao Google Calendar"
            >
              <FaCalendarPlus className="text-sm" />
              <span>Agendar</span>
            </button>
          )}
          
          {/* Botão do Google Meet */}
          {agendamento.status === 'agendado' && agendamento.video_link && agendamento.video_link !== 'https://meet.google.com' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVideoClick(e, agendamento);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaVideo className="text-sm" />
              <span>Iniciar</span>
              <FaExternalLinkAlt className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
