import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { FaFilePdf, FaArrowLeft, FaUser, FaCalendarAlt, FaFileAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const documentosObrigatorios = [
  'Termo de Rescisão de Contrato de Trabalho',
  'Termo de Homologação de Contrato de Trabalho',
  'Carta de Preposição',
  'Carta de Aviso Prévio ou Pedido de Demissão',
  'Exame Demissional',
  'Chave de Identificação',
  'Extrato FGTS',
  'GFD – Guia do FGTS DIGITAL',
  'Comprovante de pagamento da Multa',
  'Detalhe da guia emitida',
  'Comprovante de Depósito Bancário ou PIX (ou cópia do cheque)',
  'Último holerite',
  'Perfil Profissiográfico Previdenciário (P.P.P)',
  'Carteira Profissional (CTPS) atualizada ou ficha de atualização',
  'Ficha de Registro ou Livro de Registro',
  'Guia de Requerimento do Seguro desemprego',
  'Vendedor Comissionista (VAREJO) – Demonstrativo de médias de comissão (4 últimos meses)',
  'Vendedor Comissionista (CONCESSIONÁRIAS) – Demonstrativo de média de Comissão (6 últimos meses)',
];

const motivos = [
  'Pedido de Demissão',
  'Dispensa sem Justa Causa',
  'Dispensa com Justa Causa',
  'Término de Contrato',
  'Acordo entre as partes',
];

const VALOR_PAGAMENTO = 150.00;

function QrCodePagamento({ onPagar, status }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      <h2 className="text-xl font-bold text-[#23281a]">Pagamento da Homologação</h2>
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-2">
        <span className="text-[#bfa15a] font-bold text-lg">Valor: R$ {VALOR_PAGAMENTO.toFixed(2)}</span>
        {/* QR Code fictício */}
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=pagamento-ficticio" alt="QR Code" className="w-44 h-44 my-2" />
        <span className="text-[#23281a] text-sm">Escaneie para pagar ou clique no botão abaixo para simular o pagamento.</span>
        <button
          className="mt-4 py-2 px-8 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:scale-105 transition"
          onClick={onPagar}
          disabled={status === 'pago'}
        >
          {status === 'pago' ? 'Pago' : 'Pagar'}
        </button>
      </div>
      {status === 'pago' && (
        <div className="text-green-700 font-bold text-lg mt-4">Pagamento confirmado! Aguarde a análise da documentação.</div>
      )}
    </div>
  );
}

export default function AgendamentoNovo() {
  const [form, setForm] = useState({
    funcionario: '',
    email_funcionario: '',
    telefone_funcionario: '',
    motivo: '',
    exame: '',
    documentos: Array(documentosObrigatorios.length).fill(null),
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [etapa, setEtapa] = useState('form'); // form | pagamento | aguardando
  const [pagamentoStatus, setPagamentoStatus] = useState('pendente'); // pendente | pago
  const [sindicatoId, setSindicatoId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = getToken();
    fetch(`${API_ENDPOINTS.COMPANY_UNIONS}?company=${tokens.company}`, {
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async r => {
        const data = await r.json().catch(() => []);
        const items = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        if (items.length > 0) setSindicatoId(items[0].union || items[0].union_id || items[0].unionId);
      })
      .catch(() => {});
  }, []);

  function handleFileChange(idx, file) {
    setForm(f => {
      const docs = [...f.documentos];
      docs[idx] = file;
      return { ...f, documentos: docs };
    });
  }

  function validate() {
    const e = {};
    if (!form.funcionario) e.funcionario = 'Obrigatório';
    if (!form.email_funcionario) e.email_funcionario = 'Obrigatório';
    if (!form.telefone_funcionario) e.telefone_funcionario = 'Obrigatório';
    if (!form.motivo) e.motivo = 'Obrigatório';
    if (!form.exame) e.exame = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const tokens = getToken();
      
      if (!tokens || !tokens.company) {
        throw new Error('Usuário não está vinculado a uma empresa');
      }
      
      console.log('Buscando sindicato para a empresa:', tokens.company);
      
      // Obter o sindicato vinculado à empresa
      const sindicatoResp = await fetch(`${API_ENDPOINTS.COMPANY_UNIONS}?company=${tokens.company}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!sindicatoResp.ok) {
        console.error('Erro ao buscar sindicato:', sindicatoResp.status);
        throw new Error('Erro ao buscar sindicato vinculado à empresa');
      }
      
      const sindicatosJson = await sindicatoResp.json();
      const sindicatos = Array.isArray(sindicatosJson) ? sindicatosJson : (Array.isArray(sindicatosJson?.results) ? sindicatosJson.results : []);
      if (sindicatos.length === 0) {
        throw new Error('Empresa não possui sindicato vinculado. Entre em contato com o administrador.');
      }
      
      const sindicatoId = sindicatos[0].union || sindicatos[0].union_id || sindicatos[0].unionId;
      
      if (!sindicatoId || isNaN(sindicatoId)) {
        console.error('ID do sindicato inválido:', sindicatoId);
        throw new Error('Sindicato vinculado inválido. Entre em contato com o administrador.');
      }
      
      console.log('Sindicato vinculado:', sindicatoId);
      
      const payload = {
        nome_funcionario: form.funcionario,
        email_funcionario: form.email_funcionario,
        telefone_funcionario: form.telefone_funcionario,
        motivo: form.motivo,
        exame: form.exame,
        empresa: tokens.company,
        sindicato: sindicatoId,
        status: 'aguardando_aprovacao',
      };
      
      console.log('Enviando payload:', payload);
      
      const resp = await fetch(API_ENDPOINTS.DEMISSAO_PROCESSES, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        console.error('Erro do backend:', errorData);
        throw new Error('Erro ao criar processo de demissão');
      }
      
      const result = await resp.json();
      console.log('Processo criado com sucesso:', result);

      // Upload de documentos anexados (se houver)
      try {
        const formData = new FormData();
        const mapDocType = (label) => {
          const map = {
            'Termo de Rescisão de Contrato de Trabalho': 'RESCISAO',
            'Termo de Homologação de Contrato de Trabalho': 'TERMO_HOMOLOGACAO',
            'Carta de Preposição': 'OUTROS',
            'Carta de Aviso Prévio ou Pedido de Demissão': 'CARTA_AVISO',
            'Exame Demissional': 'EXAME_DEMISSAO',
            'Chave de Identificação': 'OUTROS',
            'Extrato FGTS': 'EXTRATO_FGTS',
            'GFD – Guia do FGTS DIGITAL': 'OUTROS',
            'Comprovante de pagamento da Multa': 'COMPROVANTE_PAGAMENTO',
            'Detalhe da guia emitida': 'OUTROS',
            'Comprovante de Depósito Bancário ou PIX (ou cópia do cheque)': 'COMPROVANTE_PAGAMENTO',
            'Último holerite': 'OUTROS',
            'Perfil Profissiográfico Previdenciário (P.P.P)': 'OUTROS',
            'Carteira Profissional (CTPS) atualizada ou ficha de atualização': 'CTPS',
            'Ficha de Registro ou Livro de Registro': 'FICHA_REGISTRO',
            'Guia de Requerimento do Seguro desemprego': 'OUTROS',
            'Vendedor Comissionista (VAREJO) – Demonstrativo de médias de comissão (4 últimos meses)': 'OUTROS',
            'Vendedor Comissionista (CONCESSIONÁRIAS) – Demonstrativo de média de Comissão (6 últimos meses)': 'OUTROS'
          };
          return map[label] || 'OUTROS';
        };
        form.documentos.forEach((file, idx) => {
          if (file) {
            formData.append('documents', file);
            formData.append('types', mapDocType(documentosObrigatorios[idx]));
          }
        });
        if ([...formData.keys()].length > 0) {
          const up = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${result.id}/upload-documents/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokens.access}` },
            body: formData,
          });
          let debugResp; try { debugResp = await up.json(); } catch { debugResp = await up.text(); }
          console.log('[DEBUG] Upload documentos:', up.status, debugResp);
        }
      } catch (eUp) {
        console.warn('Falha no upload de documentos (prosseguindo mesmo assim):', eUp);
      }
      
      navigate('/empresa/agendamentos');
    } catch (err) {
      console.error('Erro no agendamento:', err);
      setError(err.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  function handlePagar() {
    setPagamentoStatus('pago');
    const tokens = getToken();
    const payload = {
      nome_funcionario: form.funcionario,
      email_funcionario: form.email_funcionario,
      telefone_funcionario: form.telefone_funcionario,
      motivo: form.motivo,
      exame: form.exame,
      empresa: tokens.company,
      sindicato: sindicatoId,
      status: 'aguardando_aprovacao',
    };
    console.log('[DEBUG] Tokens:', tokens);
    console.log('[DEBUG] Sindicato vinculado:', sindicatoId);
    console.log('[DEBUG] Payload:', payload);
    fetch(API_ENDPOINTS.DEMISSAO_PROCESSES, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async r => {
        let respData;
        try { respData = await r.json(); } catch { respData = await r.text(); }
        console.log('[DEBUG] Resposta do backend /api/demissao-processes/:', r.status, respData);
        if (!r.ok) alert('Erro ao criar processo: ' + JSON.stringify(respData));
      })
      .catch(e => console.log('[DEBUG] Erro ao criar processo de demissão:', e));
    setTimeout(() => {
      navigate('/empresa/agendamentos');
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl px-4 py-8 md:px-12 md:py-12 mt-6 flex flex-col gap-8 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-[#bfa15a] font-bold hover:text-[#23281a] transition-colors text-lg flex items-center gap-2 group"
          >
            <FaArrowLeft className="transform group-hover:-translate-x-1 transition-transform" /> 
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#bfa15a] animate-pulse"></div>
            <span className="text-sm text-[#23281a]/70">Novo Agendamento</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a2a1a] mb-2">Novo Agendamento</h1>
          <p className="text-[#23281a]/70">Preencha os dados abaixo para iniciar o processo de agendamento</p>
        </div>

        {etapa === 'form' && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
            {/* Dados do Funcionário */}
            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 flex flex-col gap-6 min-h-[320px] transform hover:scale-[1.01] transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#bfa15a]/20 rounded-full p-3">
                  <FaUser className="text-[#bfa15a] text-xl" />
                </div>
                <h2 className="text-xl font-bold text-[#23281a]">Dados do Funcionário</h2>
              </div>
              
              <div className="space-y-4">
                <div className="group">
                  <label className="block font-semibold text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">Nome do Funcionário *</label>
                  <input 
                    type="text" 
                    name="funcionario" 
                    value={form.funcionario} 
                    onChange={e => setForm(f => ({ ...f, funcionario: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] focus:ring-2 focus:ring-[#bfa15a]/30 focus:border-[#bfa15a] outline-none transition-all"
                    placeholder="Digite o nome completo"
                  />
                  {errors.funcionario && (
                    <span className="text-red-500 text-sm mt-1 block">{errors.funcionario}</span>
                  )}
                </div>

                <div className="group">
                  <label className="block font-semibold text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">Email do Funcionário *</label>
                  <input 
                    type="email" 
                    name="email_funcionario" 
                    value={form.email_funcionario} 
                    onChange={e => setForm(f => ({ ...f, email_funcionario: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] focus:ring-2 focus:ring-[#bfa15a]/30 focus:border-[#bfa15a] outline-none transition-all"
                    placeholder="exemplo@email.com"
                  />
                  {errors.email_funcionario && (
                    <span className="text-red-500 text-sm mt-1 block">{errors.email_funcionario}</span>
                  )}
                </div>

                <div className="group">
                  <label className="block font-semibold text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">Telefone do Funcionário *</label>
                  <input 
                    type="tel" 
                    name="telefone_funcionario" 
                    value={form.telefone_funcionario} 
                    onChange={e => setForm(f => ({ ...f, telefone_funcionario: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] focus:ring-2 focus:ring-[#bfa15a]/30 focus:border-[#bfa15a] outline-none transition-all"
                    placeholder="(XX) XXXXX-XXXX"
                  />
                  {errors.telefone_funcionario && (
                    <span className="text-red-500 text-sm mt-1 block">{errors.telefone_funcionario}</span>
                  )}
                </div>

                <div className="group">
                  <label className="block font-semibold text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">Motivo da Demissão *</label>
                  <select 
                    value={form.motivo} 
                    onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] focus:ring-2 focus:ring-[#bfa15a]/30 focus:border-[#bfa15a] outline-none transition-all"
                  >
                    <option value="">Selecione o motivo</option>
                    {motivos.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {errors.motivo && (
                    <span className="text-red-500 text-sm mt-1 block">{errors.motivo}</span>
                  )}
                </div>

                <div className="group">
                  <label className="block font-semibold text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">Exame Demissional *</label>
                  <select 
                    value={form.exame} 
                    onChange={e => setForm(f => ({ ...f, exame: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] focus:ring-2 focus:ring-[#bfa15a]/30 focus:border-[#bfa15a] outline-none transition-all"
                  >
                    <option value="">Selecione o exame</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                  {errors.exame && (
                    <span className="text-red-500 text-sm mt-1 block">{errors.exame}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-lg border border-[#bfa15a]/30 p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#bfa15a]/20 rounded-full p-3">
                  <FaFileAlt className="text-[#bfa15a] text-xl" />
                </div>
                <h2 className="text-xl font-bold text-[#23281a]">Documentos Necessários</h2>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {documentosObrigatorios.map((doc, idx) => (
                  <div key={idx} className="group">
                    <label className="block font-medium text-[#23281a] mb-2 group-hover:text-[#bfa15a] transition-colors">
                      {doc}
                      <span className="text-[#bfa15a] ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={e => handleFileChange(idx, e.target.files[0])}
                        className="hidden"
                        id={`file-${idx}`}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <label
                        htmlFor={`file-${idx}`}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#bfa15a]/40 bg-white/80 text-[#23281a] cursor-pointer hover:bg-[#bfa15a]/10 transition-all group"
                      >
                        <FaFilePdf className="text-[#bfa15a] group-hover:scale-110 transition-transform" />
                        <span className="flex-1 truncate">
                          {form.documentos[idx]?.name || 'Selecione um arquivo'}
                        </span>
                        <span className="text-sm text-[#bfa15a] group-hover:underline">Escolher</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 group"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Continuar
                    <FaArrowLeft className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {etapa === 'pagamento' && (
          <div className="flex flex-col items-center justify-center gap-8 py-10">
            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-lg border border-[#bfa15a]/30 p-8 max-w-md w-full text-center">
              <div className="bg-[#bfa15a]/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FaCalendarAlt className="text-[#bfa15a] text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-[#23281a] mb-4">Pagamento do Agendamento</h2>
              <p className="text-[#23281a]/70 mb-6">
                Para prosseguir com o agendamento, é necessário realizar o pagamento da taxa de serviço.
              </p>
              <div className="bg-white rounded-xl p-4 mb-6 border border-[#bfa15a]/30">
                <div className="text-sm text-[#23281a]/70 mb-1">Valor a pagar</div>
                <div className="text-3xl font-bold text-[#23281a]">R$ {VALOR_PAGAMENTO.toFixed(2)}</div>
              </div>
              <button
                onClick={handlePagar}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                disabled={loading || pagamentoStatus === 'pago'}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processando...
                  </>
                ) : pagamentoStatus === 'pago' ? (
                  <>
                    <FaCheckCircle />
                    Pagamento Confirmado
                  </>
                ) : (
                  'Realizar Pagamento'
                )}
              </button>
            </div>
          </div>
        )}

        {etapa === 'aguardando' && (
          <div className="flex flex-col items-center justify-center gap-8 py-10">
            <div className="bg-gradient-to-br from-[#f5ecd7] to-white rounded-2xl shadow-lg border border-[#bfa15a]/30 p-8 max-w-md w-full text-center">
              <div className="bg-[#bfa15a]/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FaCheckCircle className="text-[#bfa15a] text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-[#23281a] mb-4">Aguardando Análise</h2>
              <p className="text-[#23281a]/70 mb-6">
                Seu pagamento foi confirmado! O sindicato irá analisar os documentos enviados.
                Você será notificado para escolher uma data assim que a análise for concluída.
              </p>
              <button
                onClick={() => navigate('/empresa/agendamentos')}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
              >
                Voltar para Agendamentos
                <FaArrowLeft className="transform rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5ecd7;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #bfa15a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #23281a;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
} 