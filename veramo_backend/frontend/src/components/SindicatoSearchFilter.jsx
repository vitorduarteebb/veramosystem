import React from 'react';

const SindicatoSearchFilter = ({ searchTerm, onSearchChange, filterStatus, onFilterChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar sindicatos por nome ou CNPJ..."
            value={searchTerm}
            onChange={onSearchChange}
            className="block w-full pl-10 pr-3 py-3 border border-[#bfa15a]/30 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#bfa15a] focus:border-[#bfa15a] transition-all duration-200"
          />
        </div>

        {/* Filtro de Status */}
        <div className="lg:w-48">
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-[#bfa15a]/30 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#bfa15a] focus:border-[#bfa15a] w-full"
          >
            <option value="">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>

        {/* Botão de Limpar */}
        {(searchTerm || filterStatus) && (
          <button
            onClick={() => {
              onSearchChange({ target: { value: '' } });
              onFilterChange('');
            }}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Resultados da Busca */}
      {(searchTerm || filterStatus) && (
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-semibold">Filtros ativos:</span>
          {searchTerm && <span className="ml-2 px-2 py-1 bg-[#bfa15a]/20 text-[#23281a] rounded-lg">Busca: "{searchTerm}"</span>}
          {filterStatus && <span className="ml-2 px-2 py-1 bg-[#bfa15a]/20 text-[#23281a] rounded-lg">Status: {filterStatus}</span>}
        </div>
      )}
    </div>
  );
};

export default SindicatoSearchFilter;
