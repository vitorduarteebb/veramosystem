import React from 'react';
import { useNavigate } from 'react-router-dom';

const SindicatoCard = ({ sindicato }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
      {/* Header do Card */}
      <div className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{sindicato.name}</h3>
              <p className="text-[#f5ecd7] text-sm">Sindicato</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#f5ecd7]">ID</div>
            <div className="text-sm font-semibold">#{sindicato.id}</div>
          </div>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-6">
        <div className="space-y-4">
          {/* CNPJ */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#f5ecd7] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#23281a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">CNPJ</div>
              <div className="font-semibold text-[#23281a]">{sindicato.cnpj || 'Não informado'}</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold text-green-600">Ativo</div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => navigate(`/admin/sindicatos/${sindicato.id}`)}
            className="flex-1 bg-[#23281a] hover:bg-[#1a1f15] text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Ver Detalhes</span>
          </button>
          <button
            onClick={() => navigate(`/admin/sindicatos/${sindicato.id}/empresas`)}
            className="bg-[#f5ecd7] hover:bg-[#e6d9c1] text-[#23281a] font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>Empresas</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SindicatoCard;
