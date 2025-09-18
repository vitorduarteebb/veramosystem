import React, { useState } from 'react';
import axios from 'axios';

export default function Videoconferencia({ scheduleId, status, videoLink }) {
  const [ressalvas, setRessalvas] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRessalva() {
    setLoading(true);
    setMsg('');
    try {
      await axios.post(`http://localhost:8000/api/schedule/${scheduleId}/ressalva/`, { ressalvas });
      setMsg('Ressalva gravada com sucesso!');
    } catch {
      setMsg('Erro ao gravar ressalva.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-primary mb-4">Videoconferência</h2>
        <div className="mb-4">
          <span className="font-medium">Status da Homologação:</span> {status}
        </div>
        <a href={videoLink} target="_blank" rel="noopener noreferrer" className="block w-full py-2 px-4 bg-secondary text-white text-center rounded-lg hover:bg-primary transition mb-4">Acessar Videoconferência</a>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ressalvas</label>
          <textarea value={ressalvas} onChange={e => setRessalvas(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" rows={4} />
        </div>
        <button onClick={handleRessalva} className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition" disabled={loading}>
          {loading ? 'Gravando...' : 'Gravar Ressalva'}
        </button>
        {msg && <div className="mt-2 text-center text-success">{msg}</div>}
      </div>
    </div>
  );
} 