import React from 'react';
import { FaSearch, FaFilter, FaCalendarAlt, FaSort } from 'react-icons/fa';

export default function SearchAndFilter({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  sortBy, 
  onSortChange 
}) {
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'agendado', label: 'Agendados' },
    { value: 'documentos_aprovados', label: 'Aprovados' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'documentos_recusados', label: 'Recusados' }
  ];

  const sortOptions = [
    { value: 'data_desc', label: 'Data (Mais Recente)' },
    { value: 'data_asc', label: 'Data (Mais Antigo)' },
    { value: 'nome_asc', label: 'Nome (A-Z)' },
    { value: 'nome_desc', label: 'Nome (Z-A)' },
    { value: 'status', label: 'Status' }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por funcionário..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent outline-none"
          />
        </div>

        {/* Filtro por Status */}
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent outline-none appearance-none bg-white"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div className="relative">
          <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent outline-none appearance-none bg-white"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de Limpar Filtros */}
        <button
          onClick={() => {
            onSearchChange('');
            onStatusFilterChange('all');
            onSortChange('data_desc');
          }}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <FaCalendarAlt className="w-4 h-4" />
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}