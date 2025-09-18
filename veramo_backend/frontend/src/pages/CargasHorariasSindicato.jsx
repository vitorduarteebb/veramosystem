import React, { useEffect, useState } from 'react';
import { getToken } from '../services/auth';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[90vw]">
        {children}
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-[#23281a] font-bold">Cancelar</button>
      </div>
    </div>
  );
}

export default function CargasHorariasSindicato() {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ usuario_id: '', weekdays: [1], start_time: '08:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', duration_minutes: 30 });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    async function fetchCargas() {
      setLoading(true);
      const tokens = getToken();
      try {
        const resp = await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}?union=${tokens.union}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
        if (!resp.ok) throw new Error('Erro ao buscar cargas horárias');
        {
          const data = await resp.json();
          setCargas(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
        }
      } catch (err) {
        setError('Erro ao buscar cargas horárias.');
      } finally {
        setLoading(false);
      }
    }
    async function fetchUsuarios() {
      const tokens = getToken();
      const resp = await fetch(`${API_ENDPOINTS.USERS}?union=${tokens.union}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      {
        const data = await resp.json();
        setUsuarios(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
      }
    }
    fetchCargas();
    fetchUsuarios();
  }, []);

  function openModal(c = null) {
    if (c) {
      setForm({
        usuario_id: c.usuario_id,
        weekdays: [c.weekday],
        start_time: c.start_time,
        end_time: c.end_time,
        break_start: c.break_start || '12:00',
        break_end: c.break_end || '13:00',
        duration_minutes: c.duration_minutes,
      });
      setEditId(c.id);
    } else {
      setForm({ usuario_id: '', weekdays: [1], start_time: '08:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', duration_minutes: 30 });
      setEditId(null);
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.usuario_id || isNaN(form.usuario_id) || form.usuario_id <= 0) {
      alert('Selecione um usuário válido!');
      return;
    }
    const tokens = getToken();
    const method = editId ? 'PUT' : 'POST';
    function calcBreakMinutes(start, end) {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      return (h2 * 60 + m2) - (h1 * 60 + m1);
    }
    const break_minutes = calcBreakMinutes(form.break_start, form.break_end);
    if (!editId) {
      for (const wd of form.weekdays) {
        const body = {
          union_user: form.usuario_id,
          weekday: wd,
          start_time: form.start_time,
          end_time: form.end_time,
          duration_minutes: form.duration_minutes,
          break_minutes: break_minutes,
        };
        console.log('Payload enviado:', body);
        const resp = await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const err = await resp.text();
          alert('Erro ao salvar: ' + err);
          return;
        }
      }
    } else {
      const body = {
        union_user: form.usuario_id,
        weekday: form.weekdays[0],
        start_time: form.start_time,
        end_time: form.end_time,
        duration_minutes: form.duration_minutes,
        break_minutes: break_minutes,
      };
      console.log('Payload enviado:', body);
      const resp = await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}${editId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.text();
        alert('Erro ao salvar: ' + err);
        return;
      }
    }
    setModalOpen(false);
    setEditId(null);
    setForm({ usuario_id: '', weekdays: [1], start_time: '08:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', duration_minutes: 30 });
    const cargasResp = await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}?union=${tokens.union}`, {
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    {
      const data = await cargasResp.json();
      setCargas(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta carga horária?')) return;
    const tokens = getToken();
    await fetch(`${API_ENDPOINTS.SCHEDULE_CONFIG}${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    });
    setCargas(cargas => cargas.filter(c => c.id !== id));
  }

  // Agrupa as cargas horárias por usuário
  const cargasPorUsuario = cargas.reduce((acc, c) => {
    if (!acc[c.usuario_id]) acc[c.usuario_id] = { nome: c.usuario_nome, cargas: [] };
    acc[c.usuario_id].cargas.push(c);
    return acc;
  }, {});

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-8 max-w-3xl mx-auto flex-1 ml-0 md:ml-64">
        <h1 className="text-2xl font-bold mb-6 text-[#23281a]">Cargas Horárias da Equipe</h1>
        <button className="mb-4 bg-[#bfa15a] text-white px-6 py-2 rounded font-bold hover:bg-[#23281a] transition" onClick={() => openModal()}>Nova Carga Horária</button>
        {loading ? <div>Carregando...</div> : error ? <div className="text-red-500">{error}</div> : (
          <div>
            {Object.keys(cargasPorUsuario).length === 0 && <div className="text-center text-[#bfa15a]">Nenhuma carga horária cadastrada</div>}
            {Object.entries(cargasPorUsuario).map(([usuarioId, { nome, cargas }]) => {
              // Busca usuário na lista de usuarios
              const usuario = usuarios.find(u => u.id === Number(usuarioId));
              const nomeExibir = nome || (usuario ? usuario.name : 'Usuário desconhecido');
              const emailExibir = usuario ? usuario.email : '';
              return (
                <div key={usuarioId} className="mb-8">
                  <div className="bg-[#f7f6f2] border-l-4 border-[#bfa15a] px-4 py-2 mb-2 rounded">
                    <div className="font-bold text-xl text-[#23281a]">{nomeExibir}</div>
                    {emailExibir && <div className="text-[#bfa15a] text-sm">{emailExibir}</div>}
                  </div>
                  <table className="w-full bg-white rounded-xl shadow">
                    <thead>
                      <tr className="bg-[#bfa15a]/20">
                        <th className="p-2 text-left">Dia da Semana</th>
                        <th className="p-2 text-left">Início</th>
                        <th className="p-2 text-left">Fim</th>
                        <th className="p-2 text-left">Duração (min)</th>
                        <th className="p-2 text-left">Intervalo</th>
                        <th className="p-2 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cargas.map(c => (
                        <tr key={c.id} className="border-b">
                          <td className="p-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][c.weekday]}</td>
                          <td className="p-2">{c.start_time}</td>
                          <td className="p-2">{c.end_time}</td>
                          <td className="p-2">{c.duration_minutes}</td>
                          <td className="p-2">{c.break_start ? `${c.break_start} - ${c.break_end}` : ''}</td>
                          <td className="p-2">
                            <button className="text-blue-600 hover:underline mr-2" onClick={() => openModal(c)}>Editar</button>
                            <button className="text-red-600 hover:underline" onClick={() => handleDelete(c.id)}>Remover</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4 text-[#23281a]">{editId ? 'Editar' : 'Nova'} Carga Horária</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-semibold mb-1">Usuário</label>
              <select className="border rounded p-2 w-full" value={form.usuario_id} onChange={e => setForm(f => ({ ...f, usuario_id: Number(e.target.value) }))} required>
                <option value="">Selecione o usuário</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Dias da Semana</label>
              <div className="flex flex-wrap gap-2">
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
                  <label key={i} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.weekdays.includes(i)} onChange={e => {
                      setForm(f => e.target.checked ? { ...f, weekdays: [...f.weekdays, i] } : { ...f, weekdays: f.weekdays.filter(wd => wd !== i) });
                    }} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Início</label>
                <input type="time" className="border rounded p-2 w-full" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Fim</label>
                <input type="time" className="border rounded p-2 w-full" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Intervalo Início</label>
                <input type="time" className="border rounded p-2 w-full" value={form.break_start} onChange={e => setForm(f => ({ ...f, break_start: e.target.value }))} required />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Intervalo Fim</label>
                <input type="time" className="border rounded p-2 w-full" value={form.break_end} onChange={e => setForm(f => ({ ...f, break_end: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Duração (min)</label>
              <input type="number" className="border rounded p-2 w-full" value={form.duration_minutes} min={10} max={180} step={5} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} required />
            </div>
            <button type="submit" className="bg-[#bfa15a] text-white px-6 py-2 rounded font-bold hover:bg-[#23281a] transition w-full">Salvar</button>
          </form>
        </Modal>
      </div>
    </div>
  );
} 