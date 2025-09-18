import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout, refreshToken } from '../services/auth';
import Select from 'react-select';
import { IMaskInput } from 'react-imask';
import Sidebar from '../components/Sidebar';
import FormStep from '../components/FormStep';
import FormField from '../components/FormField';
import ProgressStepper from '../components/ProgressStepper';

const initialState = {
  company_name: '',
  company_cnpj: '',
  company_email: '',
  company_phone: '',
  company_cep: '',
  company_address: '',
  sindicatos: [],
  user_name: '',
  user_email: '',
  user_cpf: '',
  user_phone: '',
  user_password: '',
};

// Componentes de cada etapa FORA do EmpresaNova
function StepOrganizacao({ form, setForm, errors, sindicatos }) {
  const sindicatoOptions = sindicatos.map(s => ({ value: s.id, label: s.name }));
  return (
    <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
      <label className="font-semibold text-[#23281a]">Vincular a Sindicato(s) *</label>
      <Select
        isMulti
        name="sindicatos"
        options={sindicatoOptions}
        value={sindicatoOptions.filter(opt => form.sindicatos.includes(opt.value))}
        onChange={opts => setForm(f => ({ ...f, sindicatos: opts ? opts.map(o => o.value) : [] }))}
        classNamePrefix="react-select"
        placeholder="Selecione um ou mais sindicatos..."
        styles={{
          control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#bfa15a' : '#bfa15a66',
            boxShadow: state.isFocused ? '0 0 0 2px #bfa15a33' : base.boxShadow,
            '&:hover': { borderColor: '#bfa15a' },
            background: 'white',
            minHeight: 44,
          }),
          multiValue: base => ({ ...base, background: '#bfa15a22', color: '#23281a' }),
          multiValueLabel: base => ({ ...base, color: '#23281a' }),
          multiValueRemove: base => ({ ...base, color: '#bfa15a', ':hover': { background: '#bfa15a', color: 'white' } }),
        }}
      />
      {errors.sindicatos && <span className="text-red-500 text-xs">{errors.sindicatos}</span>}
    </div>
  );
}
function StepEmpresa({ form, setForm, errors }) {
  return (
    <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
      <label className="font-semibold text-[#23281a]">Nome da Empresa *</label>
      <input type="text" name="company_name" value={form.company_name} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.company_name && <span className="text-red-500 text-xs">{errors.company_name}</span>}
      <label className="font-semibold text-[#23281a]">CNPJ *</label>
      <IMaskInput
        mask="00.000.000/0000-00"
        value={form.company_cnpj}
        onAccept={value => setForm(f => ({ ...f, company_cnpj: value }))}
        onChange={e => setForm(f => ({ ...f, company_cnpj: e.target.value }))}
        name="company_cnpj"
        placeholder="00.000.000/0001-00"
        className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]"
      />
      {errors.company_cnpj && <span className="text-red-500 text-xs">{errors.company_cnpj}</span>}
      <label className="font-semibold text-[#23281a]">Email institucional *</label>
      <input type="email" name="company_email" value={form.company_email} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.company_email && <span className="text-red-500 text-xs">{errors.company_email}</span>}
      <label className="font-semibold text-[#23281a]">Telefone *</label>
      <IMaskInput
        mask="(00) 00000-0000"
        value={form.company_phone}
        onAccept={value => setForm(f => ({ ...f, company_phone: value }))}
        onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))}
        name="company_phone"
        placeholder="(11) 99999-9999"
        className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]"
      />
      {errors.company_phone && <span className="text-red-500 text-xs">{errors.company_phone}</span>}
      <label className="font-semibold text-[#23281a]">CEP *</label>
      <input type="text" name="company_cep" value={form.company_cep} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.company_cep && <span className="text-red-500 text-xs">{errors.company_cep}</span>}
      <label className="font-semibold text-[#23281a]">Endereço completo *</label>
      <input type="text" name="company_address" value={form.company_address} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.company_address && <span className="text-red-500 text-xs">{errors.company_address}</span>}
    </div>
  );
}
function StepUsuario({ form, setForm, errors }) {
  return (
    <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-2 border border-[#bfa15a]/30">
      <h4 className="font-bold text-[#23281a] mb-2">Usuário Master da Empresa</h4>
      <label className="font-semibold text-[#23281a]">Nome completo *</label>
      <input type="text" name="user_name" value={form.user_name} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.user_name && <span className="text-red-500 text-xs">{errors.user_name}</span>}
      <label className="font-semibold text-[#23281a]">Email (login) *</label>
      <input type="email" name="user_email" value={form.user_email} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.user_email && <span className="text-red-500 text-xs">{errors.user_email}</span>}
      <label className="font-semibold text-[#23281a]">CPF *</label>
      <IMaskInput
        mask="000.000.000-00"
        value={form.user_cpf}
        onAccept={value => setForm(f => ({ ...f, user_cpf: value }))}
        onChange={e => setForm(f => ({ ...f, user_cpf: e.target.value }))}
        name="user_cpf"
        placeholder="000.000.000-00"
        className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]"
      />
      {errors.user_cpf && <span className="text-red-500 text-xs">{errors.user_cpf}</span>}
      <label className="font-semibold text-[#23281a]">Telefone *</label>
      <IMaskInput
        mask="(00) 00000-0000"
        value={form.user_phone}
        onAccept={value => setForm(f => ({ ...f, user_phone: value }))}
        onChange={e => setForm(f => ({ ...f, user_phone: e.target.value }))}
        name="user_phone"
        className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]"
      />
      {errors.user_phone && <span className="text-red-500 text-xs">{errors.user_phone}</span>}
      <label className="font-semibold text-[#23281a]">Senha *</label>
      <input type="password" name="user_password" value={form.user_password} onChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="rounded p-2 border border-[#bfa15a]/40 bg-white text-[#23281a]" />
      {errors.user_password && <span className="text-red-500 text-xs">{errors.user_password}</span>}
    </div>
  );
}
function StepFinalizacao({ form, sindicatos }) {
  return (
    <div className="bg-[#f5ecd7] rounded-xl p-6 shadow flex flex-col gap-4 border border-[#bfa15a]/30">
      <h4 className="font-bold text-[#23281a] mb-2">Revisar Dados</h4>
      <div><b>Empresa:</b> {form.company_name} ({form.company_cnpj})</div>
      <div><b>Email:</b> {form.company_email}</div>
      <div><b>Telefone:</b> {form.company_phone}</div>
      <div><b>Endereço:</b> {form.company_address} - CEP: {form.company_cep}</div>
      <div><b>Sindicatos:</b> {form.sindicatos.map(id => sindicatos.find(s => s.id === id)?.name).join(', ')}</div>
      <div><b>Usuário Master:</b> {form.user_name} ({form.user_email})</div>
      <div><b>CPF:</b> {form.user_cpf}</div>
      <div><b>Telefone:</b> {form.user_phone}</div>
    </div>
  );
}

export default function EmpresaNova() {
  console.log('renderizou EmpresaNova');
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [sindicatos, setSindicatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Proteção de rota
    const tokens = getToken();
    if (!tokens?.access) {
      navigate('/login');
      return;
    }
    // Buscar sindicatos para seleção
    fetch('https://veramo.com.br/api/unions/', {
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async r => {
        if (r.status === 401) {
          const newAccess = await refreshToken();
          if (newAccess) {
            return fetch('https://veramo.com.br/api/unions/', {
              headers: {
                'Authorization': `Bearer ${newAccess}`,
                'Content-Type': 'application/json',
              },
            });
          } else {
            throw new Error('401');
          }
        }
        return r;
      })
      .then(r => r.json())
      .then(data => setSindicatos(data))
      .catch((err) => {
        if (err.message === '401') {
          logout();
          navigate('/login');
        } else {
          setSindicatos([]);
        }
      });
  }, [navigate]);

  // Validações parciais por etapa
  function validateStep(currentStep) {
    const e = {};
    if (currentStep === 0) {
      if (!form.sindicatos.length) e.sindicatos = 'Selecione pelo menos um sindicato';
    }
    if (currentStep === 1) {
      if (!form.company_name) e.company_name = 'Obrigatório';
      if (!form.company_cnpj || form.company_cnpj.replace(/\D/g, '').length !== 14) e.company_cnpj = 'CNPJ inválido';
      if (!form.company_email || !/^\S+@\S+\.\S+$/.test(form.company_email)) e.company_email = 'E-mail inválido';
      if (!form.company_phone || form.company_phone.replace(/\D/g, '').length < 10) e.company_phone = 'Telefone inválido';
      if (!form.company_cep) e.company_cep = 'Obrigatório';
      if (!form.company_address) e.company_address = 'Obrigatório';
    }
    if (currentStep === 2) {
      if (!form.user_name) e.user_name = 'Obrigatório';
      if (!form.user_email || !/^\S+@\S+\.\S+$/.test(form.user_email)) e.user_email = 'E-mail inválido';
      if (!form.user_cpf || form.user_cpf.replace(/\D/g, '').length !== 11) e.user_cpf = 'CPF inválido';
      if (!form.user_phone || form.user_phone.replace(/\D/g, '').length < 10) e.user_phone = 'Telefone inválido';
      if (!form.user_password || form.user_password.length < 6) e.user_password = 'Mínimo 6 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value, type, selectedOptions } = e.target;
    let v = value;
    if (name === 'sindicatos') v = Array.from(selectedOptions).map(o => Number(o.value));
    setForm(f => ({ ...f, [name]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validateStep(step)) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    let tokens = getToken();
    try {
      let resp = await fetch('https://veramo.com.br/api/companies/full-create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: {
            name: form.company_name,
            cnpj: form.company_cnpj,
            email: form.company_email,
            phone: form.company_phone,
            cep: form.company_cep,
            address: form.company_address,
          },
          unions: form.sindicatos,
          user: {
            name: form.user_name,
            email: form.user_email,
            cpf: form.user_cpf,
            phone: form.user_phone,
            password: form.user_password,
          },
        }),
      });
      if (resp.status === 401) {
        const newAccess = await refreshToken();
        if (newAccess) {
          tokens = getToken();
          resp = await fetch('https://veramo.com.br/api/companies/full-create/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newAccess}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              company: {
                name: form.company_name,
                cnpj: form.company_cnpj,
                email: form.company_email,
                phone: form.company_phone,
                cep: form.company_cep,
                address: form.company_address,
              },
              unions: form.sindicatos,
              user: {
                name: form.user_name,
                email: form.user_email,
                cpf: form.user_cpf,
                phone: form.user_phone,
                password: form.user_password,
              },
            }),
          });
          if (resp.status === 401) throw new Error('401');
        } else {
          throw new Error('401');
        }
      }
      if (!resp.ok) throw new Error('Erro ao criar empresa');
      setSuccess(true);
      setTimeout(() => navigate('/admin/empresas'), 2000);
    } catch (err) {
      if (err.message === '401') {
        logout();
        navigate('/login');
      } else {
        setError('Erro ao criar empresa.');
      }
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { 
      title: 'Organização', 
      description: 'Vincular sindicatos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      component: StepOrganizacao 
    },
    { 
      title: 'Empresa', 
      description: 'Dados da empresa',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      component: StepEmpresa 
    },
    { 
      title: 'Usuário', 
      description: 'Usuário master',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      component: StepUsuario 
    },
    { 
      title: 'Revisão', 
      description: 'Confirmar dados',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      component: StepFinalizacao 
    },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#23281a] mb-2">
                Cadastrar Nova Empresa
              </h1>
              <p className="text-gray-600">
                Preencha os dados para criar uma nova empresa no sistema
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/empresas')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancelar</span>
            </button>
          </div>
        </div>
        {/* Progress Stepper */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <ProgressStepper 
            steps={steps} 
            currentStep={step}
            onStepClick={(index) => {
              if (index <= step) setStep(index);
            }}
          />
        </div>
          <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Renderizar todas as etapas, mas esconder as não ativas */}
            {steps.map((s, i) => (
              <div key={s.label} style={{ display: step === i ? 'block' : 'none' }}>
                {s.component({ form, setForm, errors, sindicatos })}
              </div>
            ))}
            {error && <div className="text-red-500 text-center text-sm">{error}</div>}
            {success && <div className="text-green-600 text-center text-lg font-bold">Empresa criada com sucesso!</div>}
            <div className="flex gap-4 mt-4">
              {step > 0 && <button type="button" className="py-2 px-6 rounded-full bg-[#bfa15a]/80 text-white font-bold shadow hover:scale-105 transition" onClick={() => setStep(step - 1)} disabled={loading}>Voltar</button>}
              <button type="submit" className="py-2 px-6 rounded-full bg-gradient-to-r from-[#bfa15a] via-[#23281a] to-[#18140c] text-white font-bold shadow-lg hover:scale-105 transition" disabled={loading}>{loading ? 'Salvando...' : step === steps.length - 1 ? 'Cadastrar Empresa' : 'Avançar'}</button>
            </div>
          </form>
      </main>
    </div>
  );
} 