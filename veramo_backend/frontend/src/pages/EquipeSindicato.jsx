import React, { useEffect, useState } from 'react';
import { getToken } from '../services/auth';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { API_ENDPOINTS } from '../config/api';

export default function EquipeSindicato() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'union_common' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchEquipe() {
      setLoading(true);
      const tokens = getToken();
      try {
        const resp = await fetch(`${API_ENDPOINTS.USERS}?union=${tokens.union}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) throw new Error('Erro ao buscar equipe');
         const data = await resp.json();
         setUsuarios(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
      } catch (err) {
        setError('Erro ao buscar equipe.');
      } finally {
        setLoading(false);
      }
    }
    fetchEquipe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const tokens = getToken();
    const body = {
      name: form.name,
      email: form.email,
      username: form.email,
      password: form.password,
      role: form.role,
      union: tokens.union,
    };
    const resp = await fetch(`${API_ENDPOINTS.USERS}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (resp.ok) {
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'union_common' });
      // Atualiza lista
      const equipeResp = await fetch(`${API_ENDPOINTS.USERS}?union=${tokens.union}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      const dataEq = await equipeResp.json();
      setUsuarios(Array.isArray(dataEq) ? dataEq : (Array.isArray(dataEq?.results) ? dataEq.results : []));
    } else {
      const err = await resp.json();
      alert('Erro ao cadastrar: ' + JSON.stringify(err));
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-8 max-w-3xl mx-auto flex-1 ml-0 md:ml-64">
        <h1 className="text-2xl font-bold mb-6 text-[#23281a]">Equipe do Sindicato</h1>
        <button className="mb-4 bg-[#bfa15a] text-white px-6 py-2 rounded font-bold hover:bg-[#23281a] transition" onClick={() => setModalOpen(true)}>Novo Usuário</button>
        {loading ? <div>Carregando...</div> : error ? <div className="text-red-500">{error}</div> : (
          <table className="w-full bg-white rounded-xl shadow">
            <thead>
              <tr className="bg-[#bfa15a]/20">
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">E-mail</th>
                <th className="p-2 text-left">Cargo</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">
                    <button className="text-blue-600 hover:underline mr-2">Editar</button>
                    <button className="text-red-600 hover:underline">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4 text-[#23281a]">Novo Usuário da Equipe</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">Nome</label>
            <input className="border rounded p-2 w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-semibold mb-1">E-mail</label>
            <input type="email" className="border rounded p-2 w-full" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-semibold mb-1">Senha</label>
            <input type="password" className="border rounded p-2 w-full" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-semibold mb-1">Cargo</label>
            <select className="border rounded p-2 w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
              <option value="union_common">Sindicalista</option>
            </select>
          </div>
          <button type="submit" className="bg-[#bfa15a] text-white px-6 py-2 rounded font-bold hover:bg-[#23281a] transition w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </form>
      </Modal>
    </div>
  );
} 