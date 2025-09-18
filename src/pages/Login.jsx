import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setUserInfo } from '../services/auth';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      // Login: obtém access/refresh
      const { access } = await login(email, senha);
      // Busca dados do usuário logado
      const res = await axios.get('http://localhost:8000/auth/users/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });
      const user = res.data; // espera-se { id, email, role, ... }
      setUserInfo(user);
      // Redireciona conforme o papel
      if (user.role === 'superadmin') navigate('/admin', { replace: true });
      else if (user.role === 'union_master' || user.role === 'union_common') navigate('/sindicato', { replace: true });
      else if (user.role === 'company_master' || user.role === 'company_common') navigate('/empresa', { replace: true });
      else navigate('/');
    } catch (err) {
      setErro('E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-semibold text-primary mb-6 text-center">Entrar</h2>
        {erro && (
          <div className="bg-error text-white text-sm px-3 py-2 rounded-md mb-4 text-center">{erro}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition"
              placeholder="seu@exemplo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
} 