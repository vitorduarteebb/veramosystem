import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo, logout } from '../services/auth';

const menu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
  ) },
  { label: 'Empresas', path: '/admin/empresas', icon: (
    <svg className="w-6 h-6" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3m-7-5v12m-4-4h8" /></svg>
  ) },
  { label: 'Nova Empresa', path: '/admin/empresas/nova', icon: (
    <svg className="w-6 h-6" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ) },
  { label: 'Sindicatos', path: '/admin/sindicatos', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 4v16m0 0c-4.418 0-8-1.79-8-4V8c0-2.21 3.582-4 8-4s8 1.79 8 4v8c0 2.21-3.582 4-8 4z" /></svg>
  ) },
  { label: 'Agendamentos', path: '/admin/agendamentos', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ) },
  { label: 'Usuários', path: '/admin/usuarios', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { label: 'Logs', path: '/admin/logs', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7a4 4 0 00-4-4H7a4 4 0 00-4 4v10a4 4 0 004 4h4" /></svg>
  ) },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const user = getUserInfo();
  const role = user?.role;
  


  // Menus dinâmicos conforme o tipo de usuário
  let menuToShow = [];
  if (role === 'superadmin' || role === 'admin') {
    menuToShow = [
      { label: 'Dashboard', path: '/admin/dashboard', icon: menu[0].icon },
      { label: 'Empresas', path: '/admin/empresas', icon: menu[1].icon },
      { label: 'Nova Empresa', path: '/admin/empresas/nova', icon: menu[2].icon },
      { label: 'Sindicatos', path: '/admin/sindicatos', icon: menu[3].icon },
      { label: 'Agendamentos', path: '/admin/agendamentos', icon: menu[4].icon },
      { label: 'Usuários', path: '/admin/usuarios', icon: menu[5].icon },
      { label: 'Logs', path: '/admin/logs', icon: menu[6].icon },
    ];
  } else if (role === 'union_master' || role === 'union_common') {
    menuToShow = [
      { label: 'Dashboard', path: '/sindicato/dashboard', icon: menu[0].icon },
      { label: 'Homologações Hoje', path: '/sindicato/hoje', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      ) },
      { label: 'Agendamentos', path: '/sindicato/agendamentos', icon: menu[4].icon },
      { label: 'Documentações', path: '/sindicato/documentacoes', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      ) },
      { label: 'Processos Finalizados', path: '/sindicato/processos-finalizados', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
      ) },
    ];
    
    // Adicionar opções específicas para union_master
    if (user && user.role === 'union_master') {
      menuToShow.push(
        { label: 'Usuários',
          path: '/sindicato/usuarios/equipe',
          icon: menu[5].icon,
          submenu: [
            { label: 'Equipe do Sindicato', path: '/sindicato/usuarios/equipe' },
            { label: 'Cargas Horárias', path: '/sindicato/usuarios/cargas-horarias' },
          ]
        },
        { label: 'Agenda', path: '/sindicato/agendamentos/escala', icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        ) },
        { label: 'Logs', path: '/sindicato/logs', icon: menu[6].icon }
      );
    }
  } else if (role === 'company_master' || role === 'company_common') {
    menuToShow = [
      { label: 'Dashboard', path: '/empresa/dashboard', icon: menu[0].icon },
      { label: 'Agendamentos', path: '/empresa/agendamentos', icon: menu[4].icon },
      { label: 'Novo Processo', path: '/empresa/processo/novo', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      ) },
    ];
  } else {
    // fallback: mostra só dashboard
    menuToShow = [
      { label: 'Dashboard', path: '/dashboard', icon: menu[0].icon },
    ];
  }

  return (
    <aside className={`h-screen bg-[#1a2a1a] text-[#bfa15a] shadow-lg flex flex-col transition-all duration-300 ${open ? 'w-64' : 'w-20'} fixed left-0 top-0 z-30`}>
      {/* Topo: Logo e botão retrátil */}
      <div className="flex items-center justify-between p-4 border-b border-[#bfa15a]/20">
        <div className="flex items-center gap-2">
          <img src="/veramo_logo.png" alt="Logo Veramo" className={`transition-all duration-300 ${open ? 'w-12 h-12' : 'w-8 h-8'} object-contain`} />
          {open && <span className="font-bold text-lg tracking-wide">VERAMO</span>}
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-[#bfa15a] focus:outline-none ml-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Menu */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {menuToShow.map(item => (
            <li key={item.label}>
              {item.submenu ? (
                <>
                  <Link to={item.path} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#bfa15a]/10 transition-colors group">
                    <span className="text-[#bfa15a]">{item.icon}</span>
                    {open && <span className="text-base font-medium">{item.label}</span>}
                  </Link>
                  <ul className="ml-8 space-y-1">
                    {item.submenu.map(sub => (
                      <li key={sub.label}>
                        <Link to={sub.path} className="block px-4 py-2 rounded-lg hover:bg-[#bfa15a]/10 text-sm text-[#bfa15a]">{sub.label}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link to={item.path} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#bfa15a]/10 transition-colors group">
                  <span className="text-[#bfa15a]">{item.icon}</span>
                  {open && <span className="text-base font-medium">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {/* Rodapé: Perfil e Sair */}
      <div className="mt-auto p-4 border-t border-[#bfa15a]/20">
        <Link to="/perfil" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#bfa15a]/10 text-sm">
          <span className="text-[#bfa15a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          {open && <span>Meu Perfil</span>}
        </Link>
        <button onClick={() => { logout(); window.location.href = '/login'; }} className="mt-2 w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-[#bfa15a]/10 text-sm">
          <span className="text-[#bfa15a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
          </span>
          {open && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
} 