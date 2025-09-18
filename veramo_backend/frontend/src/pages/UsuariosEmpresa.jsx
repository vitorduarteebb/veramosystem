import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

function Badge({ children, color = 'bg-[#bfa15a]/80', text = 'text-white' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color} ${text} mr-1`}>{children}</span>
  );
}

export default function UsuariosEmpresa() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalEdit, setModalEdit] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  async function fetchUsuarios() {
    const tokens = getToken();
    try {
      let resp = await fetch(`${API_ENDPOINTS.USERS}?company=${userInfo.company}` , {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          resp = await fetch(`${API_ENDPOINTS.USERS}?company=${userInfo.company}` , {
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) throw new Error('Erro ao buscar usuários');
      {
        const data = await resp.json();
        setUsuarios(Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
      }
      setLoading(false);
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      } else {
        setError('Erro ao buscar usuários.');
      }
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, []);

  function handleEdit(user) {
    setEditForm(user);
    setModalEdit(user.id);
    setEditError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    const tokens = getToken();
    try {
      let resp = await fetch(`${API_ENDPOINTS.USERS}${editForm.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          resp = await fetch(`${API_ENDPOINTS.USERS}${editForm.id}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(editForm),
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) throw new Error('Erro ao editar usuário');
      setModalEdit(null);
      fetchUsuarios();
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      } else {
        setEditError('Erro ao editar usuário.');
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    const tokens = getToken();
    try {
      let resp = await fetch(`${API_ENDPOINTS.USERS}${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          resp = await fetch(`${API_ENDPOINTS.USERS}${id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) throw new Error('Erro ao excluir usuário');
      fetchUsuarios();
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      } else {
        setError('Erro ao excluir usuário.');
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] p-8">
      <div className="w-full max-w-4xl bg-white/90 rounded-3xl shadow-2xl p-8 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a2a1a]">Usuários da Empresa</h1>
          <button onClick={() => navigate('/empresa/usuarios/novo')} className="bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold px-6 py-2 rounded-full shadow hover:scale-105 transition flex items-center gap-2"><FaPlus /> Novo Usuário</button>
        </div>
        {loading ? (
          <div className="text-[#bfa15a] text-lg">Carregando...</div>
        ) : error ? (
          <div className="text-red-500 text-lg">{error}</div>
        ) : usuarios.length === 0 ? (
          <div className="text-[#bfa15a] text-lg">Nenhum usuário cadastrado.</div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[#23281a] font-bold">
                <th className="p-2">Nome</th>
                <th className="p-2">E-mail</th>
                <th className="p-2">Papel</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="bg-[#f5ecd7] rounded-xl shadow border border-[#bfa15a]/20">
                  <td className="p-2 rounded-l-xl font-semibold">{u.name || u.username}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2"><Badge>{u.role}</Badge></td>
                  <td className="p-2 rounded-r-xl flex gap-2">
                    <button className="text-[#bfa15a] font-bold hover:underline flex items-center gap-1" onClick={() => handleEdit(u)}><FaEdit /> Editar</button>
                    <button className="text-red-500 font-bold hover:underline flex items-center gap-1" onClick={() => handleDelete(u.id)}><FaTrash /> Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal de edição */}
      {modalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] animate-slideIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#23281a]">Editar Usuário</h2>
              <button onClick={() => setModalEdit(null)} className="text-[#bfa15a] text-2xl font-bold hover:text-red-500 transition">&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <input type="text" className="border rounded p-2" placeholder="Nome" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              <input type="email" className="border rounded p-2" placeholder="E-mail" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
              <select className="border rounded p-2" value={editForm.role || 'employee'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">Funcionário</option>
                <option value="company_common">Usuário comum</option>
              </select>
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setModalEdit(null)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-[#23281a] font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-[#bfa15a] hover:bg-[#23281a] text-white font-bold" disabled={editLoading}>{editLoading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 