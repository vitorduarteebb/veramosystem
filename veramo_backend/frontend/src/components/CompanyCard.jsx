import React from 'react';
import { useNavigate } from 'react-router-dom';

const CompanyCard = ({ company, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return 'N/A';
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    // Aplica máscara do CNPJ
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-[#23281a] to-[#bfa15a] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {getInitials(company.name)}
            </div>
            <div>
              <h3 className="font-bold text-lg truncate">{company.name}</h3>
              <p className="text-[#f5ecd7] text-sm">Empresa</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(company)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
              title="Editar empresa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(company)}
              className="p-2 bg-white/20 hover:bg-red-500/80 rounded-lg transition-colors duration-200"
              title="Excluir empresa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        <div className="space-y-4">
          {/* CNPJ */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">CNPJ</p>
              <p className="font-semibold text-gray-900">{formatCNPJ(company.cnpj)}</p>
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
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="font-semibold text-gray-900">Ativa</p>
              </div>
            </div>
          </div>

          {/* Data de cadastro */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cadastrada em</p>
              <p className="font-semibold text-gray-900">
                {company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/admin/empresas/${company.id}`)}
              className="flex-1 bg-[#23281a] hover:bg-[#1a1f15] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Ver Detalhes</span>
            </button>
            <button
              onClick={() => navigate(`/admin/empresas/${company.id}/usuarios`)}
              className="bg-[#f5ecd7] hover:bg-[#e6d9c1] text-[#23281a] font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>Usuários</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
