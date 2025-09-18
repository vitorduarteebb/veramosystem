import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AceiteTermos({ scheduleId }) {
  const [concordo, setConcordo] = useState(false);
  const [cpf, setCpf] = useState('');
  const [ip, setIp] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('https://api.ipify.org/?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip));
  }, []);

  async function handleAceite() {
    setLoading(true);
    setMsg('');
    try {
      await axios.post(`http://localhost:8000/api/schedule/${scheduleId}/aceite/`, {
        aceite: true,
        cpf_assinatura: cpf,
        ip_assinatura: ip,
        data_aceite: new Date().toISOString(),
      });
      setMsg('Aceite registrado com sucesso!');
    } catch {
      setMsg('Erro ao registrar aceite.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-primary mb-4">Aceite Digital de Termos</h2>
        <div className="mb-4 text-gray-700">
          <p>Ao assinar digitalmente, você concorda com os termos legais da homologação.</p>
        </div>
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={concordo} onChange={e => setConcordo(e.target.checked)} className="mr-2" id="concordo" />
          <label htmlFor="concordo" className="text-sm">Concordo com os termos</label>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">CPF do Homologador</label>
          <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="000.000.000-00" />
        </div>
        <div className="mb-2 text-sm text-gray-500">Seu IP: {ip}</div>
        <button onClick={handleAceite} disabled={!concordo || !cpf || loading} className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition">
          {loading ? 'Assinando...' : 'Assinar digitalmente'}
        </button>
        {msg && <div className="mt-2 text-center text-success">{msg}</div>}
      </div>
    </div>
  );
} 