import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFilePdf, FaUsers, FaLink, FaSignature, FaDownload, FaCheckCircle, FaClock, FaUser, FaBuilding, FaUserTie } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { getToken, getUserInfo } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';

const AssinaturaSindicato = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [parties, setParties] = useState({});
  const [magicLink, setMagicLink] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);

  const steps = [
    { id: 1, title: 'Upload do PDF', icon: FaFilePdf },
    { id: 2, title: 'Definir Partes', icon: FaUsers },
    { id: 3, title: 'Gerar Link', icon: FaLink },
    { id: 4, title: 'Assinar', icon: FaSignature },
    { id: 5, title: 'Finalizar', icon: FaDownload }
  ];

  useEffect(() => {
    loadData();
  }, [scheduleId]);

  const loadData = async () => {
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        navigate('/login');
        return;
      }

      // Carregar dados do agendamento
      const scheduleResponse = await fetch(`${API_ENDPOINTS.SCHEDULES}${scheduleId}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        setSchedule(scheduleData);
        
        // Verificar se já existe sessão de assinatura
        const sessionResponse = await fetch(`${API_ENDPOINTS.SIGNING}sessions/?schedule=${scheduleId}`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });

        if (sessionResponse.ok) {
          const sessions = await sessionResponse.json();
          if (sessions.length > 0) {
            setSession(sessions[0]);
            setCurrentStep(2); // Já tem PDF, vai para definir partes
          }
        }
      }
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadPdf = async (file) => {
    try {
      const tokens = getToken();
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('schedule_id', scheduleId);

      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/create_session/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSession({ id: data.session_id });
        setCurrentStep(2);
      } else {
        setError('Erro ao fazer upload do PDF');
      }
    } catch (err) {
      setError('Erro ao fazer upload do PDF');
      console.error(err);
    }
  };

  const setPartiesData = async () => {
    try {
      const tokens = getToken();
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${session.id}/set_parties/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parties),
      });

      if (response.ok) {
        setCurrentStep(3);
      } else {
        setError('Erro ao definir partes');
      }
    } catch (err) {
      setError('Erro ao definir partes');
      console.error(err);
    }
  };

  const generateEmployeeLink = async () => {
    try {
      const tokens = getToken();
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${session.id}/gen_employee_link/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMagicLink(data.magic_link_url);
        setCurrentStep(4);
      } else {
        setError('Erro ao gerar link do funcionário');
      }
    } catch (err) {
      setError('Erro ao gerar link do funcionário');
      console.error(err);
    }
  };

  const sendOtp = async (role) => {
    try {
      const tokens = getToken();
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${session.id}/send_otp/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        setOtpSent(true);
        alert('OTP enviado! Verifique seu email/SMS.');
      } else {
        setError('Erro ao enviar OTP');
      }
    } catch (err) {
      setError('Erro ao enviar OTP');
      console.error(err);
    }
  };

  const signDocument = async (role) => {
    if (!otp || !consent) {
      alert('Preencha o OTP e aceite o consentimento');
      return;
    }

    setSigning(true);
    try {
      const tokens = getToken();
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${session.id}/verify_and_sign/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          otp,
          consent: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.all_signed) {
          setCurrentStep(5);
        } else {
          alert('Assinatura realizada! Aguardando outras partes.');
        }
      } else {
        setError('Erro ao assinar documento');
      }
    } catch (err) {
      setError('Erro ao assinar documento');
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  const downloadFinal = async () => {
    try {
      const tokens = getToken();
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${session.id}/download/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assinatura_${session.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erro ao fazer download');
      }
    } catch (err) {
      setError('Erro ao fazer download');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-[#23281a] flex items-center gap-3">
                <FaSignature className="text-[#bfa15a]" />
                Assinatura Eletrônica
              </h1>
              <button
                onClick={() => navigate('/sindicato/agendamentos/escala')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Voltar
              </button>
            </div>
            
            {schedule && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-700 mb-2">Agendamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Funcionário:</span> {schedule.nome_funcionario || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Empresa:</span> {schedule.empresa_nome || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {schedule.date ? new Date(schedule.date).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id ? 'bg-[#bfa15a] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    <step.icon />
                  </div>
                  <span className={`ml-2 font-medium ${
                    currentStep >= step.id ? 'text-[#bfa15a]' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-[#bfa15a]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-[#23281a] mb-6">Upload do PDF</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FaFilePdf className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Arraste e solte o PDF aqui ou clique para selecionar</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files[0] && uploadPdf(e.target.files[0])}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors cursor-pointer"
                  >
                    Selecionar PDF
                  </label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-[#23281a] mb-6">Definir Partes</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={parties.company?.name || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          company: { ...prev.company, name: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="CPF"
                        value={parties.company?.cpf || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          company: { ...prev.company, cpf: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={parties.company?.email || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          company: { ...prev.company, email: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="Telefone"
                        value={parties.company?.phone || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          company: { ...prev.company, phone: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sindicato</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={parties.union?.name || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          union: { ...prev.union, name: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="CPF"
                        value={parties.union?.cpf || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          union: { ...prev.union, cpf: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={parties.union?.email || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          union: { ...prev.union, email: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="Telefone"
                        value={parties.union?.phone || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          union: { ...prev.union, phone: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={parties.employee?.name || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          employee: { ...prev.employee, name: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="CPF"
                        value={parties.employee?.cpf || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          employee: { ...prev.employee, cpf: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={parties.employee?.email || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          employee: { ...prev.employee, email: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                      <input
                        type="text"
                        placeholder="Telefone"
                        value={parties.employee?.phone || ''}
                        onChange={(e) => setParties(prev => ({
                          ...prev,
                          employee: { ...prev.employee, phone: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={setPartiesData}
                    className="w-full px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-[#23281a] mb-6">Gerar Link do Funcionário</h2>
                <div className="text-center">
                  <FaLink className="text-6xl text-[#bfa15a] mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Clique no botão abaixo para gerar um link temporário que será enviado ao funcionário para assinar o documento.
                  </p>
                  <button
                    onClick={generateEmployeeLink}
                    className="px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors"
                  >
                    Gerar Link do Funcionário
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-[#23281a] mb-6">Assinar Documento</h2>
                
                {magicLink && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-green-800 mb-2">Link do Funcionário Gerado:</h3>
                    <p className="text-green-700 break-all">{magicLink}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(magicLink)}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Copiar Link
                    </button>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-700 mb-4">Assinatura do Sindicato</h3>
                    <div className="space-y-4">
                      <button
                        onClick={() => sendOtp('UNION')}
                        disabled={otpSent}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {otpSent ? 'OTP Enviado' : 'Enviar OTP'}
                      </button>
                      
                      {otpSent && (
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Digite o OTP recebido"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a]"
                          />
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="consent"
                              checked={consent}
                              onChange={(e) => setConsent(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="consent" className="text-sm text-gray-600">
                              Li e concordo com o conteúdo do documento. Autorizo o uso de meus dados para fins de identificação e registro de assinatura eletrônica.
                            </label>
                          </div>
                          
                          <button
                            onClick={() => signDocument('UNION')}
                            disabled={signing || !otp || !consent}
                            className="px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors disabled:opacity-50"
                          >
                            {signing ? 'Assinando...' : 'Assinar como Sindicato'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-[#23281a] mb-6">Documento Finalizado</h2>
                <div className="text-center">
                  <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Todas as partes assinaram o documento. Você pode fazer o download do PDF final assinado.
                  </p>
                  <button
                    onClick={downloadFinal}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FaDownload />
                    Download do PDF Final
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssinaturaSindicato;
