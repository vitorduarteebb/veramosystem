import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PainelSindicato({ unionId, userRole }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAgendamentos() {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/schedule/union/${unionId}/`);
      setAgendamentos(res.data);
      setLoading(false);
    }
    fetchAgendamentos();
  }, [unionId]);

  if (loading) return <div className="p-8">Carregando...</div>;

  if (detalhe) {
    return (
      <div className="p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Detalhe do Agendamento</h2>
        <div className="mb-2">Status: {detalhe.status}</div>
        <div className="mb-2">Ressalvas: {detalhe.ressalvas || 'Nenhuma'}</div>
        <div className="mb-2">Aceite: {detalhe.aceite ? 'Sim' : 'Não'}</div>
        <div className="mb-2">CPF Assinatura: {detalhe.cpf_assinatura || '-'}</div>
        <div className="mb-2">IP Assinatura: {detalhe.ip_assinatura || '-'}</div>
        <div className="mb-2">Data Aceite: {detalhe.data_aceite || '-'}</div>
        <div className="mb-2">Link Videoconferência: <a href={detalhe.video_link} className="text-secondary underline">Acessar</a></div>
        <div className="mb-2">Documentos:</div>
        <ul className="list-disc ml-6">
          {(detalhe.documents || []).map(doc => (
            <li key={doc.id}><a href={doc.file} className="text-primary underline">{doc.type}</a></li>
          ))}
        </ul>
        <button onClick={() => setDetalhe(null)} className="mt-6 bg-secondary text-white px-4 py-2 rounded-lg">Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Agendamentos das Empresas Vinculadas</h2>
      <table className="min-w-full bg-white rounded-2xl shadow-lg">
        <thead className="bg-neutralLight">
          <tr>
            <th className="px-4 py-2 text-left">Empresa</th>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map(ag => (
            <tr key={ag.id} className="hover:bg-neutralLight transition">
              <td className="px-4 py-2">{ag.company}</td>
              <td className="px-4 py-2">{ag.date}</td>
              <td className="px-4 py-2">{ag.status}</td>
              <td className="px-4 py-2">
                <button onClick={() => setDetalhe(ag)} className="bg-primary text-white px-3 py-1 rounded-lg">Detalhar</button>
                {userRole === 'union_master' && (
                  <button className="ml-2 bg-error text-white px-3 py-1 rounded-lg">Editar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 