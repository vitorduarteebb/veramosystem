import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaFilePdf, FaSignature, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

const AssinaturaFuncionario = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sid');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (token && sessionId) {
      loadSession();
    } else {
      setError('Link inválido');
      setLoading(false);
    }
  }, [token, sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${sessionId}/status/`);
      
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        
        // Verificar se o funcionário já assinou
        const employee = data.parties.find(p => p.role === 'EMPLOYEE');
        if (employee && employee.signed) {
          setSigned(true);
        }
      } else {
        setError('Sessão não encontrada');
      }
    } catch (err) {
      setError('Erro ao carregar sessão');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${sessionId}/send_otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'EMPLOYEE' }),
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

  const signDocument = async () => {
    if (!otp || !consent) {
      alert('Preencha o OTP e aceite o consentimento');
      return;
    }

    setSigning(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.SIGNING}sessions/${sessionId}/verify_and_sign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'EMPLOYEE',
          token: token,
          otp,
          consent: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.all_signed) {
          setSigned(true);
        } else {
          alert('Assinatura realizada! Aguardando outras partes.');
          setSigned(true);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao assinar documento');
      }
    } catch (err) {
      setError('Erro ao assinar documento');
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfa15a] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Assinatura Realizada!</h1>
          <p className="text-gray-600 mb-6">
            Sua assinatura foi registrada com sucesso. O documento será finalizado quando todas as partes assinarem.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <FaSignature className="text-6xl text-[#bfa15a] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#23281a] mb-2">Assinatura Eletrônica</h1>
          <p className="text-gray-600">Documento de Homologação de Demissão</p>
        </div>

        {/* Session Info */}
        {session && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-gray-700 mb-4">Informações do Documento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Sessão:</span> {session.session_id}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  session.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.is_completed ? 'Finalizado' : 'Em Andamento'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signing Process */}
        <div className="space-y-6">
          <div className="text-center">
            <FaFilePdf className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Para assinar este documento, você precisa verificar sua identidade através de um código de verificação (OTP).
            </p>
          </div>

          {!otpSent ? (
            <div className="text-center">
              <button
                onClick={sendOtp}
                className="px-6 py-3 bg-[#bfa15a] text-white rounded-lg hover:bg-[#a68b4a] transition-colors"
              >
                Enviar Código de Verificação
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificação (OTP)
                </label>
                <input
                  type="text"
                  placeholder="Digite o código de 6 dígitos"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa15a] text-center text-lg tracking-widest"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">Termo de Consentimento</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Declaro que li e concordo com o conteúdo do documento apresentado. Autorizo o uso de meus dados 
                  (nome, CPF, e-mail/telefone) para fins de identificação e registro de assinatura eletrônica. 
                  Estou ciente de que o ato será registrado com data/hora, endereço IP e demais evidências técnicas 
                  para fins de auditoria e validade jurídica.
                </p>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="consent" className="text-sm text-blue-800">
                    Li e concordo com os termos acima
                  </label>
                </div>
              </div>

              <button
                onClick={signDocument}
                disabled={signing || !otp || !consent}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Este é um sistema seguro de assinatura eletrônica.</p>
          <p>Suas informações são protegidas e criptografadas.</p>
        </div>
      </div>
    </div>
  );
};

export default AssinaturaFuncionario;
