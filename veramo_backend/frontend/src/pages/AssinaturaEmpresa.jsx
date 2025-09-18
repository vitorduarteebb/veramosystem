import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFilePdf, FaSignature, FaCheckCircle, FaExclamationTriangle, FaDownload, FaSpinner } from 'react-icons/fa';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { getToken, getUserInfo } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';

const AssinaturaEmpresa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [signing, setSigning] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.company) {
      navigate('/login');
      return;
    }

    // Aqui você pode carregar os dados da sessão de assinatura
    // Por enquanto, vamos simular um estado básico
    setLoading(false);
  }, [navigate]);

  const handleSendOtp = async () => {
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.SIGNING}${id}/send_otp/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'COMPANY' }),
      });

      if (response.ok) {
        setOtpSent(true);
      } else {
        setError('Erro ao enviar OTP');
      }
    } catch (err) {
      setError('Erro ao enviar OTP');
    }
  };

  const handleSign = async () => {
    if (!otp || !consent) {
      setError('Por favor, preencha o OTP e aceite o termo de consentimento');
      return;
    }

    setSigning(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.SIGNING}${id}/verify_and_sign/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'COMPANY',
          otp: otp,
          consent: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.all_signed) {
          // Todos assinaram, redirecionar para download
          navigate(`/empresa/agendamentos/${id}?signed=true`);
        } else {
          // Apenas esta parte assinou, mostrar mensagem
          setError('Assinatura realizada com sucesso! Aguardando outras partes...');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao assinar documento');
      }
    } catch (err) {
      setError('Erro ao assinar documento');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <EmpresaSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
            <p className="text-[#1a2a1a] text-lg">Carregando documento para assinatura...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1a2a1a] mb-2">Assinatura de Documentos</h1>
                <p className="text-gray-600">Processo de homologação - Assinatura eletrônica</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-full text-sm font-bold bg-purple-500 text-white">
                  AGUARDANDO ASSINATURA
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-red-600" />
                <span className="text-red-800 font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Document Preview */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
              <FaFilePdf className="text-red-500" />
              Documento para Assinatura
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FaFilePdf className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Documento de homologação carregado pelo sindicato</p>
              <p className="text-sm text-gray-500 mt-2">
                Este documento contém os termos e condições da homologação de demissão
              </p>
            </div>
          </div>

          {/* Signing Process */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
              <FaSignature className="text-purple-500" />
              Processo de Assinatura
            </h2>

            {/* OTP Section */}
            <div className="space-y-4">
              {!otpSent ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Para assinar o documento, você receberá um código de verificação por e-mail
                  </p>
                  <button
                    onClick={handleSendOtp}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FaSignature />
                    Enviar Código de Verificação
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-600" />
                      <span className="text-green-800 font-semibold">
                        Código enviado com sucesso!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Verifique seu e-mail e insira o código abaixo
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Verificação (OTP)
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Digite o código de 6 dígitos"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      maxLength="6"
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                      <strong>Declaro que li e concordo com o conteúdo do documento apresentado.</strong> 
                      Autorizo o uso de meus dados (nome, CPF, e-mail/telefone) para fins de identificação e registro de assinatura eletrônica. 
                      Estou ciente de que o ato será registrado com data/hora, endereço IP e demais evidências técnicas para fins de auditoria e validade jurídica.
                    </label>
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={!otp || !consent || signing}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {signing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Assinando...
                      </>
                    ) : (
                      <>
                        <FaSignature />
                        Assinar Documento
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-[#1a2a1a] mb-4">Status das Assinaturas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-yellow-800">Empresa</p>
                <p className="text-sm text-yellow-700">⏳ Pendente</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-yellow-800">Sindicato</p>
                <p className="text-sm text-yellow-700">⏳ Pendente</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                <p className="font-medium text-yellow-800">Funcionário</p>
                <p className="text-sm text-yellow-700">⏳ Pendente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssinaturaEmpresa;
