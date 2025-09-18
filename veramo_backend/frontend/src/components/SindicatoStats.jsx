import React from 'react';

const SindicatoStats = ({ sindicatos }) => {
  const stats = {
    total: sindicatos.length,
    ativos: sindicatos.filter(s => s.status === 'ativo' || !s.status).length,
    inativos: sindicatos.filter(s => s.status === 'inativo').length,
    pendentes: sindicatos.filter(s => s.status === 'pendente').length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Sindicatos */}
      <div className="bg-gradient-to-br from-[#f5ecd7] to-[#e6d9c1] rounded-xl p-6 border border-[#bfa15a]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#23281a]">Total de Sindicatos</p>
            <p className="text-3xl font-bold text-[#23281a]">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-[#23281a] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-green-600 font-semibold">+{Math.floor(stats.total * 0.1)}</span>
          <span className="text-gray-600 ml-1">este mês</span>
        </div>
      </div>

      {/* Sindicatos Ativos */}
      <div className="bg-gradient-to-br from-[#bfa15a] to-[#a68f4a] rounded-xl p-6 border border-[#bfa15a]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sindicatos Ativos</p>
            <p className="text-3xl font-bold text-white">{stats.ativos}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-white/80 font-semibold">{Math.round((stats.ativos / stats.total) * 100)}%</span>
          <span className="text-white/60 ml-1">do total</span>
        </div>
      </div>

      {/* Sindicatos Inativos */}
      <div className="bg-gradient-to-br from-[#8b7355] to-[#6b5a42] rounded-xl p-6 border border-[#8b7355]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sindicatos Inativos</p>
            <p className="text-3xl font-bold text-white">{stats.inativos}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-white/80 font-semibold">{Math.round((stats.inativos / stats.total) * 100)}%</span>
          <span className="text-white/60 ml-1">do total</span>
        </div>
      </div>

      {/* Sindicatos Pendentes */}
      <div className="bg-gradient-to-br from-[#bfa15a] to-[#8b7355] rounded-xl p-6 border border-[#bfa15a]/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sindicatos Pendentes</p>
            <p className="text-3xl font-bold text-white">{stats.pendentes}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-white/80 font-semibold">{Math.round((stats.pendentes / stats.total) * 100)}%</span>
          <span className="text-white/60 ml-1">do total</span>
        </div>
      </div>
    </div>
  );
};

export default SindicatoStats;
