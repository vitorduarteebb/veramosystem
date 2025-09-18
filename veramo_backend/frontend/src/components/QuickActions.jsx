import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultActions = [
  {
    label: 'Criar sindicato',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 4v16m0 0c-4.418 0-8-1.79-8-4V8c0-2.21 3.582-4 8-4s8 1.79 8 4v8c0 2.21-3.582 4-8 4z" /></svg>
    ),
    action: (navigate) => navigate('/admin/sindicatos/novo'),
  },
  {
    label: 'Criar empresa',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3m-7-5v12m-4-4h8" /></svg>
    ),
    action: (navigate) => navigate('/admin/empresas/nova'),
  },
  {
    label: 'Vincular empresa ↔ sindicato',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17l4-4m0 0l-4-4m4 4H7m6 4v1m0-9V7" /></svg>
    ),
    action: (navigate) => navigate('/admin/vincular'),
  },
  {
    label: 'Criar usuários',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
    action: (navigate) => navigate('/admin/usuarios/novo'),
  },
  {
    label: 'Ver logs do sistema',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" /></svg>
    ),
    action: (navigate) => navigate('/admin/logs'),
  },
  {
    label: 'Listar Empresas',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3m-7-5v12m-4-4h8" /></svg>
    ),
    action: (navigate) => navigate('/admin/empresas'),
  },
  {
    label: 'Nova Empresa',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
    ),
    action: (navigate) => navigate('/admin/empresas/nova'),
  },
];

export default function QuickActions() {
  const [actions, setActions] = useState(() => {
    const saved = localStorage.getItem('quick_actions');
    return saved ? JSON.parse(saved) : defaultActions;
  });
  const navigate = useNavigate();

  function removeAction(idx) {
    const newActions = actions.filter((_, i) => i !== idx);
    setActions(newActions);
    localStorage.setItem('quick_actions', JSON.stringify(newActions));
  }

  function addAction() {
    // Exemplo: prompt simples, pode ser substituído por modal customizado
    const label = prompt('Nome da nova ação:');
    if (!label) return;
    const path = prompt('URL de destino (ex: /admin/rota):');
    if (!path) return;
    const newActions = [...actions, {
      label,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" /></svg>
      ),
      action: (navigate) => navigate(path),
    }];
    setActions(newActions);
    localStorage.setItem('quick_actions', JSON.stringify(newActions));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#23281a]">Ações rápidas</h2>
        <button onClick={addAction} className="flex items-center gap-1 px-3 py-1 rounded bg-[#bfa15a]/20 hover:bg-[#bfa15a]/40 text-[#23281a] font-bold text-sm transition">
          <svg className="w-5 h-5" fill="none" stroke="#23281a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          Adicionar ação
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((a, idx) => (
          <div key={a.label} className="relative group bg-white/90 rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition cursor-pointer border border-[#bfa15a]/10">
            <button onClick={() => a.action(navigate)} className="flex items-center gap-4 flex-1">
              <span className="bg-[#1a2a1a] rounded-xl p-2 flex items-center justify-center">{a.icon}</span>
              <span className="text-lg font-medium text-[#23281a]">{a.label}</span>
            </button>
            <button onClick={() => removeAction(idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[#bfa15a] hover:text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 