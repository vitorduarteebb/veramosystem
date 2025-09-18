import React, { useEffect, useState } from 'react';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { getUserInfo } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';

export default function PerfilUsuario() {
  const user = getUserInfo();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({ name: '', email: '' });
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user?.id, user?.name, user?.email]);

  async function handleSalvar(e) {
    e.preventDefault();
    setMsg('');
    if (!senhaAtual) {
      setMsg('Informe sua senha atual para confirmar.');
      return;
    }
    setSalvando(true);
    try {
      const token = user?.access || JSON.parse(localStorage.getItem('@veramo_auth')).access;
      const payload = {
        name: form.name,
        email: form.email,
        // backend aceita "password" opcional para atualizar senha
        ...(novaSenha ? { password: novaSenha } : {}),
      };
      const resp = await fetch(`${API_ENDPOINTS.USERS}${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err || 'Erro ao salvar');
      }
      setMsg('Dados atualizados com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      setMsg('Falha ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 md:p-8`}>
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="text-4xl font-bold mb-2 text-[#1a2a1a]">Meu Perfil</h1>
          <p className="text-lg text-[#23281a]/80 mb-8">
            Gerencie suas informações pessoais e configurações de conta
          </p>
          
          {msg && (
            <div className={`mb-6 p-4 rounded-lg ${msg.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg}
            </div>
          )}
          
          <form onSubmit={handleSalvar} className="space-y-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent transition-colors" 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                required 
                placeholder="Digite seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input 
                type="email" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent transition-colors" 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                required 
                placeholder="seu@email.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
              <input 
                type="password" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent transition-colors" 
                value={senhaAtual} 
                onChange={e => setSenhaAtual(e.target.value)} 
                required 
                placeholder="Digite sua senha atual"
                autoComplete="current-password"
              />
                <p className="text-xs text-gray-500 mt-2">Por segurança, confirme sua senha atual para salvar alterações.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha (opcional)</label>
              <input 
                type="password" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent transition-colors" 
                value={novaSenha} 
                onChange={e => setNovaSenha(e.target.value)} 
                placeholder="Deixe em branco para manter a senha atual"
                autoComplete="new-password"
              />
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={salvando} 
                className="w-full px-6 py-3 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


