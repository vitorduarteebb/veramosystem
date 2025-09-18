import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Funções utilitárias simples para máscara
function maskCNPJ(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18);
}
function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}
function maskPhone(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

const initialState = {
  organization_id: '',
  organization_name: '',
  organization_cnpj: '',
  union_name: '',
  union_cnpj: '',
  union_email: '',
  union_phone: '',
  union_cep: '',
  union_address: '',
  user_name: '',
  user_email: '',
  user_cpf: '',
  user_phone: '',
  user_password: '',
};

const steps = [
  { label: 'Organização', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 4v16m0 0c-4.418 0-8-1.79-8-4V8c0-2.21 3.582-4 8-4s8 1.79 8 4v8c0 2.21-3.582 4-8 4z" /></svg>
  ) },
  { label: 'Unidade', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3m-7-5v12m-4-4h8" /></svg>
  ) },
  { label: 'Usuário Master', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ) },
  { label: 'Finalização', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  ) },
];

export default function SindicatoNovo() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [orgs, setOrgs] = useState([
    { id: 1, name: 'Sindicato dos Comerciários' },
    { id: 2, name: 'Sindicato dos Metalúrgicos' },
  ]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState([]);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        navigate('/admin/sindicatos');
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Buscar empresas já cadastradas
    async function fetchEmpresas() {
      const token = localStorage.getItem('@veramo_auth')
        ? JSON.parse(localStorage.getItem('@veramo_auth')).access
        : null;
      try {
        let response = await fetch('https://veramo.com.br/api/companies/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.status === 401) {
          // tenta renovar o token
          // ... (pode adicionar lógica de refresh se necessário) ...
        }
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        setEmpresas(await response.json());
      } catch (err) {
        setEmpresas([]);
      }
    }
    fetchEmpresas();
  }, [step, navigate]);

  function validateStep(s) {
    const e = {};
    if (s === 0) {
      if (!form.organization_id && (!form.organization_name || !form.organization_cnpj)) {
        e.organization = 'Selecione ou crie uma organização.';
      }
    }
    if (s === 1) {
      if (!form.union_name) e.union_name = 'Obrigatório';
      if (!form.union_cnpj || form.union_cnpj.replace(/\D/g, '').length !== 14) e.union_cnpj = 'CNPJ inválido';
      if (!form.union_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.union_email)) e.union_email = 'E-mail inválido';
      if (!form.union_phone || form.union_phone.replace(/\D/g, '').length < 10) e.union_phone = 'Telefone inválido';
      if (!form.union_cep) e.union_cep = 'Obrigatório';
      if (!form.union_address) e.union_address = 'Obrigatório';
    }
    if (s === 2) {
      if (!form.user_name) e.user_name = 'Obrigatório';
      if (!form.user_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.user_email)) e.user_email = 'E-mail inválido';
      if (!form.user_cpf || form.user_cpf.replace(/\D/g, '').length !== 11) e.user_cpf = 'CPF inválido';
      if (!form.user_phone || form.user_phone.replace(/\D/g, '').length < 10) e.user_phone = 'Telefone inválido';
      if (!form.user_password || form.user_password.length < 6) e.user_password = 'Mínimo 6 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let v = value;
    if (name === 'organization_cnpj' || name === 'union_cnpj') v = maskCNPJ(value);
    if (name === 'user_cpf') v = maskCPF(value);
    if (name === 'union_phone' || name === 'user_phone') v = maskPhone(value);
    setForm(f => ({ ...f, [name]: v }));
  }

  function handleNext() {
    if (validateStep(step)) setStep(s => s + 1);
  }
  function handleBack() {
    setStep(s => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validateStep(2)) return;
    setLoading(true);
    // Montar payload
    const unionPayload = {
      name: form.union_name,
      cnpj: form.union_cnpj,
      empresas: empresasSelecionadas,
    };
    const token = localStorage.getItem('@veramo_auth')
      ? JSON.parse(localStorage.getItem('@veramo_auth')).access
      : null;
    try {
      // POST real para criar sindicato
      const resp = await fetch('https://veramo.com.br/api/unions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unionPayload),
      });
      if (!resp.ok) throw new Error('Erro ao criar sindicato');
      // Aqui você pode criar o usuário master, etc, se quiser
      setLoading(false);
      setSuccess(true);
      setStep(3);
    } catch (err) {
      setLoading(false);
      setError('Erro ao criar sindicato.');
    }
  }

  function handleCreateOrg() {
    if (!form.organization_name || !form.organization_cnpj) return;
    // Simular POST /organizations/ (substitua por fetch real)
    setOrgs([...orgs, { id: Date.now(), name: form.organization_name }]);
    setForm(f => ({ ...f, organization_id: Date.now().toString() }));
    setShowOrgModal(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] p-6">
      <div className="bg-white/90 rounded-3xl shadow-2xl p-10 w-full max-w-2xl flex flex-col items-center">
        {/* Barra de progresso */}
        <div className="flex items-center justify-center gap-4 mb-8 w-full">
          {steps.map((s, idx) => (
            <React.Fragment key={s.label}>
              <div className={`flex flex-col items-center ${step === idx ? 'text-[#1a2a1a]' : step > idx ? 'text-green-600' : 'text-[#bfa15a]'}`}>
                <div className={`rounded-full border-2 flex items-center justify-center ${step > idx ? 'bg-green-600 border-green-600' : step === idx ? 'bg-[#bfa15a] border-[#bfa15a]' : 'bg-[#f5ecd7] border-[#bfa15a]' }`} style={{ width: 44, height: 44 }}>
                  {s.icon}
                </div>
                <span className="text-xs mt-1 font-semibold">{s.label}</span>
              </div>
              {idx < steps.length - 1 && <div className={`flex-1 h-1 ${step > idx ? 'bg-green-600' : 'bg-[#bfa15a]'}`}></div>}
            </React.Fragment>
          ))}
        </div>
        {/* Etapas do formulário */}
        <form className="w-full flex flex-col gap-8" onSubmit={handleSubmit}>
          {step === 0 && (
            <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
              <label className="font-semibold text-[#23281a]">Organização Sindical *</label>
              <select
                name="organization_id"
                value={form.organization_id}
                onChange={e => setForm(f => ({ ...f, organization_id: e.target.value, organization_name: '', organization_cnpj: '' }))}
                className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]"
              >
                <option value="">Selecione uma organização</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <span className="text-[#bfa15a] text-sm">Ou</span>
              <button type="button" onClick={() => setShowOrgModal(true)} className="text-[#bfa15a] font-bold hover:underline">+ Criar nova organização</button>
              {errors.organization && <span className="text-red-500 text-xs">{errors.organization}</span>}
            </div>
          )}
          {showOrgModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4 relative">
                <button onClick={() => setShowOrgModal(false)} className="absolute top-2 right-2 text-[#bfa15a] hover:text-red-500">✕</button>
                <label className="font-semibold text-[#23281a]">Nome da Organização *</label>
                <input type="text" name="organization_name" value={form.organization_name} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
                <label className="font-semibold text-[#23281a]">CNPJ *</label>
                <input type="text" name="organization_cnpj" value={form.organization_cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
                <button type="button" onClick={handleCreateOrg} className="mt-2 bg-[#bfa15a] text-white font-bold px-4 py-2 rounded hover:bg-[#a88c3d]">Criar Organização</button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
              <label className="font-semibold text-[#23281a]">Nome da Unidade *</label>
              <input type="text" name="union_name" value={form.union_name} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_name && <span className="text-red-500 text-xs">{errors.union_name}</span>}
              <label className="font-semibold text-[#23281a]">CNPJ da Unidade *</label>
              <input type="text" name="union_cnpj" value={form.union_cnpj} onChange={handleChange} placeholder="00.000.000/0001-00" className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_cnpj && <span className="text-red-500 text-xs">{errors.union_cnpj}</span>}
              <label className="font-semibold text-[#23281a]">Email institucional *</label>
              <input type="email" name="union_email" value={form.union_email} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_email && <span className="text-red-500 text-xs">{errors.union_email}</span>}
              <label className="font-semibold text-[#23281a]">Telefone *</label>
              <input type="text" name="union_phone" value={form.union_phone} onChange={handleChange} placeholder="(11) 99999-9999" className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_phone && <span className="text-red-500 text-xs">{errors.union_phone}</span>}
              <label className="font-semibold text-[#23281a]">CEP *</label>
              <input type="text" name="union_cep" value={form.union_cep} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_cep && <span className="text-red-500 text-xs">{errors.union_cep}</span>}
              <label className="font-semibold text-[#23281a]">Endereço completo *</label>
              <input type="text" name="union_address" value={form.union_address} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.union_address && <span className="text-red-500 text-xs">{errors.union_address}</span>}
              <label className="font-semibold text-[#23281a] mt-4">Empresas já cadastradas (vincular ao sindicato)</label>
              <select
                multiple
                value={empresasSelecionadas}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setEmpresasSelecionadas(options);
                }}
                className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a] h-32"
              >
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} - {emp.cnpj}</option>
                ))}
              </select>
              <span className="text-xs text-[#bfa15a]">Segure Ctrl (Windows) ou Command (Mac) para selecionar múltiplas empresas.</span>
            </div>
          )}
          {step === 2 && (
            <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
              <h4 className="font-bold text-[#23281a] mb-2">Usuário Master da Unidade</h4>
              <label className="font-semibold text-[#23281a]">Nome completo *</label>
              <input type="text" name="user_name" value={form.user_name} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.user_name && <span className="text-red-500 text-xs">{errors.user_name}</span>}
              <label className="font-semibold text-[#23281a]">Email (login) *</label>
              <input type="email" name="user_email" value={form.user_email} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.user_email && <span className="text-red-500 text-xs">{errors.user_email}</span>}
              <label className="font-semibold text-[#23281a]">CPF *</label>
              <input type="text" name="user_cpf" value={form.user_cpf} onChange={handleChange} placeholder="000.000.000-00" className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.user_cpf && <span className="text-red-500 text-xs">{errors.user_cpf}</span>}
              <label className="font-semibold text-[#23281a]">Telefone *</label>
              <input type="text" name="user_phone" value={form.user_phone} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.user_phone && <span className="text-red-500 text-xs">{errors.user_phone}</span>}
              <label className="font-semibold text-[#23281a]">Senha *</label>
              <input type="password" name="user_password" value={form.user_password} onChange={handleChange} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
              {errors.user_password && <span className="text-red-500 text-xs">{errors.user_password}</span>}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="bg-green-500 rounded-full flex items-center justify-center w-20 h-20 mb-2">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700">Cadastro finalizado!</h2>
              <span className="text-[#23281a] text-center">A unidade sindical foi criada com sucesso.</span>
            </div>
          )}
          {error && <div className="text-red-500 text-center mb-2">{error}</div>}
          {/* Navegação dos botões */}
          <div className="flex gap-4 mt-2">
            {step > 0 && step < 3 && (
              <button type="button" onClick={handleBack} className="px-6 py-2 rounded-full bg-[#bfa15a]/20 text-[#23281a] font-bold hover:bg-[#bfa15a]/40 transition">Voltar</button>
            )}
            {step < 2 && (
              <button type="button" onClick={handleNext} className="px-6 py-2 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow hover:scale-105 transition">Avançar</button>
            )}
            {step === 2 && (
              <button type="submit" className="px-8 py-2 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow hover:scale-105 transition disabled:opacity-60" disabled={loading}>{loading ? 'Salvando...' : 'Finalizar Cadastro'}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 