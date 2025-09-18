import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, fetchUserInfo } from '../services/auth.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const user = await fetchUserInfo();
      setLoading(false);
      if (!user || !user.role) {
        setError('Não foi possível identificar o tipo de usuário.');
        return;
      }
      if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin/dashboard');
      else if (user.role === 'company_master') navigate('/empresa/dashboard');
      else if (user.role === 'company_common') navigate('/empresa/agendamentos');
      else if (user.role === 'union_master') navigate('/sindicato/dashboard');
      else if (user.role === 'union_common') navigate('/sindicato/hoje');
      else navigate('/');
    } catch (err) {
      setLoading(false);
      setError('E-mail ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] relative overflow-hidden">
      {/* Bolas desfocadas decorativas */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#bfa15a] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse z-0" />
      <div className="absolute -bottom-24 right-0 w-96 h-96 bg-[#23281a] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse z-0" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-[#f5ecd7] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse z-0" style={{transform: 'translate(-50%, -50%)'}} />
      {/* Card principal */}
      <div className="relative z-20 w-full max-w-xl flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden bg-white/80 backdrop-blur-lg border border-[#bfa15a]/30 mt-32 md:mt-0">
        {/* Painel Esquerdo - Boas-vindas (com logo e fundo verde escuro) */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-10 bg-[#1a2a1a]">
          <div className='mb-4 flex flex-col items-center'>
            <img src="/veramo_logo.png" alt="Logo Veramo" className="w-32 h-32 object-contain mb-2" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white tracking-wide">BEM VINDO</h2>
          <span className="text-xl font-semibold text-[#bfa15a] mb-6">Acesse sua conta</span>
        </div>
        {/* Painel Direito - Login */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-10 bg-gradient-to-br from-[#23281a]/10 via-[#bfa15a]/10 to-[#f5ecd7]/30">
          <div className="w-full max-w-xs">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#23281a] tracking-wide">FAÇA LOGIN</h2>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bfa15a]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.75 20.25a8.25 8.25 0 1114.5 0v.41a2.34 2.34 0 01-2.34 2.34H7.09a2.34 2.34 0 01-2.34-2.34v-.41z" />
                  </svg>
                </span>
                <input type="text" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-full bg-[#f5ecd7]/80 border border-[#bfa15a]/40 focus:outline-none focus:ring-2 focus:ring-[#bfa15a] text-[#23281a] placeholder-[#bfa15a] font-medium shadow" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bfa15a]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 014.5 10.5m12 0v2.25a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 017.5 12.75V10.5m9 0H4.5" />
                  </svg>
                </span>
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-full bg-[#f5ecd7]/80 border border-[#bfa15a]/40 focus:outline-none focus:ring-2 focus:ring-[#bfa15a] text-[#23281a] placeholder-[#bfa15a] font-medium shadow" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#23281a]">
                  <input type="checkbox" className="accent-[#bfa15a] rounded" />
                  Lembrar
                </label>
                <a href="#" className="text-[#bfa15a] hover:underline">Esqueceu senha?</a>
              </div>
              {error && <div className="text-red-500 text-xs min-h-[20px]" aria-live="assertive">{error}</div>}
              <button type="submit" className="w-full py-3 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:scale-105 transition" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 