import React, { useState } from 'react';
import axios from 'axios';

const DOCUMENT_TYPES = [
  { value: 'RESCISAO', label: 'Rescisão' },
  { value: 'HOMOLOGACAO', label: 'Homologação' },
  { value: 'CTPS', label: 'CTPS' },
  { value: 'RG', label: 'RG' },
  { value: 'CPF', label: 'CPF' },
  { value: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço' },
  { value: 'CARTA_AVISO', label: 'Carta de Aviso' },
  { value: 'EXAME_DEMISSAO', label: 'Exame Demissional' },
  { value: 'FICHA_REGISTRO', label: 'Ficha de Registro' },
  { value: 'EXTRATO_FGTS', label: 'Extrato FGTS' },
  { value: 'GUIA_GRRF', label: 'Guia GRRF' },
  { value: 'GUIA_MULTA_FGTS', label: 'Guia Multa FGTS' },
  { value: 'GUIA_INSS', label: 'Guia INSS' },
  { value: 'COMPROVANTE_PAGAMENTO', label: 'Comprovante de Pagamento' },
  { value: 'TERMO_QUITAÇÃO', label: 'Termo de Quitação' },
  { value: 'TERMO_HOMOLOGACAO', label: 'Termo de Homologação' },
  { value: 'OUTROS', label: 'Outros' },
  { value: 'ATESTADO_SINDICATO', label: 'Atestado Sindicato' },
];

const OBRIGATORIOS = ['RESCISAO', 'HOMOLOGACAO', 'CTPS', 'RG', 'CPF']; // exemplo

export default function Agendamento() {
  const [sindicato, setSindicato] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [arquivos, setArquivos] = useState({});
  const [employeeId, setEmployeeId] = useState(''); // Simulação
  const [erros, setErros] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFileChange(tipo, file) {
    setArquivos(prev => ({ ...prev, [tipo]: file }));
  }

  function isValid() {
    return OBRIGATORIOS.every(tipo => arquivos[tipo]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErros('');
    if (!isValid()) {
      setErros('Preencha todos os documentos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      // Envia documentos
      const formData = new FormData();
      formData.append('employee', employeeId);
      const files = [];
      const types = [];
      DOCUMENT_TYPES.forEach(doc => {
        if (arquivos[doc.value]) {
          files.push(arquivos[doc.value]);
          types.push(doc.value);
        }
      });
      files.forEach(f => formData.append('documents', f));
      types.forEach(t => formData.append('types', t));
      await axios.post('http://localhost:8000/api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Documentos enviados com sucesso!');
    } catch (err) {
      setErros('Erro ao enviar documentos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-primary mb-4">Novo Agendamento</h2>
        {erros && <div className="bg-error text-white px-3 py-2 rounded mb-4">{erros}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Sindicato</label>
          <select value={sindicato} onChange={e => setSindicato(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2">
            <option value="">Selecione</option>
            <option value="1">Sindicato X</option>
            <option value="2">Sindicato Y</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Horário</label>
          <input type="time" value={horario} onChange={e => setHorario(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutralDark mb-2 mt-4">Documentos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.map(doc => (
              <div key={doc.value}>
                <label className="block text-sm font-medium text-gray-700">{doc.label}{OBRIGATORIOS.includes(doc.value) && <span className="text-error"> *</span>}</label>
                <input type="file" onChange={e => handleFileChange(doc.value, e.target.files[0])} className="mt-1 block w-full" />
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition" disabled={!isValid() || loading}>
          {loading ? 'Enviando...' : 'Avançar'}
        </button>
      </form>
    </div>
  );
} 