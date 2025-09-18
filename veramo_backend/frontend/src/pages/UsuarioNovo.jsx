import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { IMaskInput } from 'react-imask';

const initialState = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  password: '',
  role: 'company_common',
};

export default function UsuarioNovo() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  function validate() {
    const e = {};
    if (!form.name) e.name = 'Obrigatório';
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'E-mail inválido';
    if (!form.cpf || form.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF inválido';
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefone inválido';
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    let tokens = getToken();
    try {
      const isUnion = !!userInfo.union;
      const payload = {
        name: form.name,
        email: form.email,
        username: form.email,
        cpf: form.cpf,
        phone: form.phone,
        password: form.password,
        role: form.role,
      };
      if (isUnion) payload.union = userInfo.union;
      else payload.company = userInfo.company;
      let resp = await fetch('https://veramo.com.br/api/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          tokens = getToken();
          resp = await fetch('https://veramo.com.br/api/users/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) {
        const data = await resp.json();
        console.log('[DEBUG] Erro detalhado do backend:', data);
        throw new Error('Erro ao criar usuário');
      }
      setSuccess(true);
      setTimeout(() => navigate(isUnion ? '/sindicato/dashboard' : '/empresa/usuarios'), 1500);
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      } else {
        setError('Erro ao criar usuário.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] p-6">
      <div className="bg-white/90 rounded-3xl shadow-2xl p-10 w-full max-w-xl flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a2a1a] mb-6">Cadastrar Usuário</h1>
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold text-[#23281a]">Nome completo *</label>
            <input type="text" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full" />
            {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
          </div>
          <div>
            <label className="font-semibold text-[#23281a]">E-mail *</label>
            <input type="email" name="email" value={form.email} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full" />
            {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
          </div>
          <div>
            <label className="font-semibold text-[#23281a]">CPF *</label>
            <IMaskInput
              mask="000.000.000-00"
              value={form.cpf}
              onAccept={value => setForm(f => ({ ...f, cpf: value }))}
              onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
              name="cpf"
              placeholder="000.000.000-00"
              className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full"
            />
            {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf}</span>}
          </div>
          <div>
            <label className="font-semibold text-[#23281a]">Telefone *</label>
            <IMaskInput
              mask="(00) 00000-0000"
              value={form.phone}
              onAccept={value => setForm(f => ({ ...f, phone: value }))}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              name="phone"
              placeholder="(11) 99999-9999"
              className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full"
            />
            {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
          </div>
          <div>
            <label className="font-semibold text-[#23281a]">Senha *</label>
            <input type="password" name="password" value={form.password} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full" />
            {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
          </div>
          <div>
            <label className="font-semibold text-[#23281a]">Papel *</label>
            <select name="role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] w-full">
              {userInfo.union ? (
                <>
                  <option value="union_master">Sindicato Master</option>
                  <option value="union_common">Sindicato Comum</option>
                </>
              ) : (
                <>
                  <option value="company_master">Master da Empresa</option>
                  <option value="company_common">Usuário comum</option>
                </>
              )}
            </select>
          </div>
          {error && <div className="text-red-500 text-center text-sm">{error}</div>}
          {success && <div className="text-green-600 text-center text-lg font-bold">Usuário criado com sucesso!</div>}
          <div className="flex gap-4 mt-4">
            <button type="button" className="py-2 px-6 rounded-full bg-[#bfa15a]/80 text-white font-bold shadow hover:scale-105 transition" onClick={() => navigate(-1)} disabled={loading}>Voltar</button>
            <button type="submit" className="py-2 px-6 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:scale-105 transition" disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar Usuário'}</button>
          </div>
        </form>
      </div>
    </div>
  );
} 