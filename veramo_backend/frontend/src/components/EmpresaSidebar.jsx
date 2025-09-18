import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserInfo } from '../services/auth';

export default function EmpresaSidebar({ open = true, setOpen }) {
  const user = getUserInfo();
  const isCompanyMaster = user?.role === 'company_master';
  
  // Menu unificado para todas as páginas da empresa
  const menu = [
    { label: 'Dashboard', path: '/empresa/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
    ) },
    { label: 'Agendamentos', path: '/empresa/agendamentos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ) },
    { label: 'Homologações Finalizadas', path: '/empresa/homologacoes-finalizadas', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    ) },
  ];
  
  // Adicionar "Funcionários" apenas para company_master
  if (isCompanyMaster) {
    menu.push({
      label: 'Funcionários', 
      path: '/empresa/usuarios', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    });
  }
  
  return (
    <aside className={`h-screen bg-[#1a2a1a] text-[#bfa15a] shadow-lg flex flex-col transition-all duration-300 fixed left-0 top-0 z-30 ${open ? 'w-64' : 'w-20'}`}>
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
          {menu.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-[#bfa15a]/10 ${
                  window.location.pathname === item.path ? 'bg-[#bfa15a]/20 text-[#bfa15a]' : 'text-[#bfa15a]/80'
                }`}
              >
                {item.icon}
                {open && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Rodapé: Usuário */}
      <div className="p-4 border-t border-[#bfa15a]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#bfa15a] rounded-full flex items-center justify-center text-[#1a2a1a] font-bold text-sm">
            {user?.name?.[0] || user?.email?.[0] || 'U'}
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#bfa15a] truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-[#bfa15a]/60 truncate">
                {isCompanyMaster ? 'Master' : 'Usuário Comum'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
