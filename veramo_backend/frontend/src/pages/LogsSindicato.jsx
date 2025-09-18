import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function LogsSindicato() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de logs
    setTimeout(() => {
      setLogs([
        { id: 1, action: 'Processo aprovado', user: 'João Silva', date: '2025-07-18 10:30', type: 'success' },
        { id: 2, action: 'Documento rejeitado', user: 'Maria Santos', date: '2025-07-18 09:15', type: 'warning' },
        { id: 3, action: 'Agendamento criado', user: 'Pedro Costa', date: '2025-07-18 08:45', type: 'info' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5dc]">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1a2a1a] mb-2 flex items-center gap-3">
              <svg className="w-8 h-8 text-[#bfa15a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" />
              </svg>
              Logs do Sistema
            </h1>
            <p className="text-[#666]">Acompanhe todas as atividades do sindicato</p>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Logs</p>
                  <p className="text-2xl font-bold text-[#1a2a1a]">{logs.length}</p>
                </div>
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoje</p>
                  <p className="text-2xl font-bold text-[#1a2a1a]">{logs.filter(log => log.date.includes('2025-07-18')).length}</p>
                </div>
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ações Pendentes</p>
                  <p className="text-2xl font-bold text-[#1a2a1a]">0</p>
                </div>
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Lista de Logs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#1a2a1a]">Histórico de Atividades</h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bfa15a]"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" />
                  </svg>
                  <p className="text-gray-500">Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type === 'success' && 'Sucesso'}
                          {log.type === 'warning' && 'Aviso'}
                          {log.type === 'error' && 'Erro'}
                          {log.type === 'info' && 'Info'}
                        </div>
                        <div>
                          <p className="font-medium text-[#1a2a1a]">{log.action}</p>
                          <p className="text-sm text-gray-600">por {log.user}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.date).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 