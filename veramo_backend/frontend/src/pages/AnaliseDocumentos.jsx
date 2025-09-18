import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaDownload, FaEye, FaExclamationTriangle, FaUser, FaBuilding, FaUsers, FaCalendarAlt, FaClock, FaPhone, FaEnvelope, FaInfoCircle, FaThumbsUp, FaThumbsDown, FaHistory, FaClipboardList } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
import { getToken, refreshToken, logout, authFetch } from '../services/auth';

async function fetchProcessoDetalhes(processoId) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    throw new Error('Token não encontrado');
  }
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/`, {
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!retryResponse.ok) throw new Error('Erro ao buscar processo');
      return await retryResponse.json();
    } else {
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  if (!response.ok) throw new Error('Erro ao buscar processo');
  return await response.json();
}

async function aprovarDocumento(processoId, documentoId) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    throw new Error('Token não encontrado');
  }
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/approve-document/${documentoId}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/approve-document/${documentoId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!retryResponse.ok) throw new Error('Erro ao aprovar documento');
      return await retryResponse.json();
    } else {
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  if (!response.ok) throw new Error('Erro ao aprovar documento');
  return await response.json();
}

async function reprovarDocumento(processoId, documentoId, motivo) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    throw new Error('Token não encontrado');
  }
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/reject-document/${documentoId}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
  
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/reject-document/${documentoId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });
      if (!retryResponse.ok) throw new Error('Erro ao reprovar documento');
      return await retryResponse.json();
    } else {
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  if (!response.ok) throw new Error('Erro ao reprovar documento');
  return await response.json();
}

async function rejeitarProcesso(processoId, motivo) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    throw new Error('Token não encontrado');
  }
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/rejeitar-processo/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motivo }),
  });
  
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/rejeitar-processo/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });
      if (!retryResponse.ok) throw new Error('Erro ao rejeitar processo');
      return await retryResponse.json();
    } else {
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  if (!response.ok) throw new Error('Erro ao rejeitar processo');
  return await response.json();
}

async function aprovarDocumentacao(processoId) {
  const tokens = getToken();
  if (!tokens?.access) {
    logout();
    throw new Error('Token não encontrado');
  }
    
  const response = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/aprovar-documentacao/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryResponse = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${processoId}/aprovar-documentacao/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!retryResponse.ok) throw new Error('Erro ao aprovar documentação');
      return await retryResponse.json();
    } else {
      logout();
      throw new Error('Sessão expirada');
    }
  }
  
  if (!response.ok) throw new Error('Erro ao aprovar documentação');
  return await response.json();
}

async function visualizarDocumento(documentoId, setLoadingDocumento, setError) {
  try {
    setLoadingDocumento(documentoId);
    setError('');
    
    const response = await authFetch(`${API_ENDPOINTS.BASE_URL}/api/secure-media/document/${documentoId}/`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar documento');
    }
    
    // Obter o blob do documento
    const blob = await response.blob();
    
    // Criar URL temporária para o blob
    const url = window.URL.createObjectURL(blob);
    
    // Abrir em nova aba
    window.open(url, '_blank');
    
    // Limpar a URL temporária após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 10000);
    
  } catch (error) {
    console.error('Erro ao visualizar documento:', error);
    setError('Erro ao visualizar documento. Verifique sua conexão e tente novamente.');
    throw error;
  } finally {
    setLoadingDocumento(null);
  }
}

async function baixarDocumento(documentoId, nomeArquivo = 'documento', setLoadingDocumento, setError) {
  try {
    setLoadingDocumento(documentoId);
    setError('');
    
    const response = await authFetch(`${API_ENDPOINTS.BASE_URL}/api/secure-media/document/${documentoId}/`);
    
    if (!response.ok) {
      throw new Error('Erro ao baixar documento');
    }
    
    // Obter o blob do documento
    const blob = await response.blob();
    
    // Criar URL temporária para o blob
    const url = window.URL.createObjectURL(blob);
    
    // Criar elemento de download
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar a URL temporária
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    setError('Erro ao baixar documento. Verifique sua conexão e tente novamente.');
    throw error;
  } finally {
    setLoadingDocumento(null);
  }
}

export default function AnaliseDocumentos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reprovando, setReprovando] = useState(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [rejeitandoProcesso, setRejeitandoProcesso] = useState(false);
  const [motivoRejeicaoProcesso, setMotivoRejeicaoProcesso] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingDocumento, setLoadingDocumento] = useState(null);

  useEffect(() => {
    async function loadProcesso() {
      try {
        const data = await fetchProcessoDetalhes(id);
        setProcesso(data);
      } catch (err) {
        setError('Erro ao carregar processo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProcesso();
  }, [id]);

  const handleAprovarDocumento = async (documentoId) => {
    try {
      await aprovarDocumento(id, documentoId);
      // Recarregar processo para atualizar status
      const data = await fetchProcessoDetalhes(id);
      setProcesso(data);
      
      // Verificar se todos os documentos foram aprovados
      const documentosPendentes = data.documents?.filter(doc => doc.status === 'PENDENTE').length || 0;
      if (documentosPendentes === 0 && data.status === 'documentos_aprovados') {
        // Todos os documentos aprovados, redirecionar para agendamento
        navigate(`/sindicato/agendar/${id}`, { 
          state: { message: 'Todos os documentos foram aprovados! Agora você pode agendar a homologação.' }
        });
      }
    } catch (err) {
      setError('Erro ao aprovar documento');
      console.error(err);
    }
  };

  const handleReprovarDocumento = async (documentoId) => {
    if (!motivoReprovacao.trim()) {
      setError('Motivo da reprovação é obrigatório');
      return;
    }
    
    try {
      await reprovarDocumento(id, documentoId, motivoReprovacao);
      setReprovando(null);
      setMotivoReprovacao('');
      // Recarregar processo para atualizar status
      const data = await fetchProcessoDetalhes(id);
      setProcesso(data);
    } catch (err) {
      setError('Erro ao reprovar documento');
      console.error(err);
    }
  };

  const handleRejeitarProcesso = async () => {
    if (!motivoRejeicaoProcesso.trim()) {
      setError('Motivo da rejeição é obrigatório');
      return;
    }
    
    try {
      await rejeitarProcesso(id, motivoRejeicaoProcesso);
      // Redirecionar para o painel com mensagem
      navigate('/sindicato/hoje', { 
        state: { message: 'Processo rejeitado com sucesso!' }
      });
    } catch (err) {
      setError('Erro ao rejeitar processo');
      console.error(err);
    }
  };

  const handleAprovarDocumentacao = async () => {
    try {
      await aprovarDocumentacao(id);
      // Redirecionar para o painel com mensagem
      navigate('/sindicato/hoje', { 
        state: { message: 'Documentação aprovada com sucesso! A empresa poderá agendar a homologação.' }
      });
    } catch (err) {
      setError('Erro ao aprovar documentação');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">Pendente</span>;
      case 'APROVADO':
        return <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Aprovado</span>;
      case 'RECUSADO':
        return <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Recusado</span>;
      default:
        return <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">{status}</span>;
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      'carteira_trabalho': 'Carteira de Trabalho',
      'rescisao_contrato': 'Rescisão de Contrato',
      'aviso_previo': 'Aviso Prévio',
      'ferias_vencidas': 'Férias Vencidas',
      '13_salario': '13º Salário',
      'outros': 'Outros Documentos'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-[#bfa15a] text-lg animate-pulse text-center py-8">
            Carregando processo...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-red-500 text-lg text-center py-8">{error}</div>
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-red-500 text-lg text-center py-8">Processo não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <Sidebar />
      <div className={`flex-1 p-4 md:p-8 transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/sindicato/hoje')}
              className="flex items-center gap-2 text-[#bfa15a] hover:text-[#23281a] transition mb-6 group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Voltar ao Painel
            </button>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a2a1a] mb-2 tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-[#bfa15a] rounded-xl">
                    <FaClipboardList className="text-white text-2xl" />
                  </div>
                  Análise de Documentos
                </h1>
                <p className="text-[#23281a] text-lg">
                  Analise os documentos enviados pela empresa e decida sobre a aprovação
                </p>
              </div>
              
              {/* Badge de Status */}
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  processo.status === 'documentos_aprovados' ? 'bg-green-100 text-green-800' :
                  processo.status === 'rejeitado_falta_documentacao' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    processo.status === 'documentos_aprovados' ? 'bg-green-500' :
                    processo.status === 'rejeitado_falta_documentacao' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  {processo.status === 'documentos_aprovados' ? 'APROVADO' :
                   processo.status === 'rejeitado_falta_documentacao' ? 'REJEITADO' :
                   'PENDENTE'}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Funcionário */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-full">
                  <FaUser className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-blue-800">Funcionário</h3>
                  <p className="text-blue-600 font-medium">{processo.nome_funcionario}</p>
                </div>
              </div>
              
              {/* Informações de contato do funcionário */}
              <div className="space-y-2">
                {processo.email_funcionario && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaEnvelope className="text-blue-600" />
                    <span className="text-blue-700">{processo.email_funcionario}</span>
                  </div>
                )}
                {processo.telefone_funcionario && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaPhone className="text-blue-600" />
                    <span className="text-blue-700">{processo.telefone_funcionario}</span>
                  </div>
                )}
                {!processo.email_funcionario && !processo.telefone_funcionario && (
                  <div className="text-sm text-blue-500 italic">
                    Informações de contato não disponíveis
                  </div>
                )}
              </div>
            </div>

            {/* Empresa */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500 rounded-full">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-purple-800">Empresa</h3>
                  <p className="text-purple-600 font-medium">{processo.empresa_nome}</p>
                </div>
              </div>
            </div>

            {/* Sindicato */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500 rounded-full">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-green-800">Sindicato</h3>
                  <p className="text-green-600 font-medium">{processo.sindicato_nome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes do Processo */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <h3 className="text-xl font-bold text-[#1a2a1a] mb-4 flex items-center gap-2">
              <FaInfoCircle className="text-[#bfa15a]" />
              Detalhes do Processo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaCalendarAlt className="text-[#bfa15a]" />
                  <span className="font-medium">Data de Criação:</span>
                </div>
                <p className="text-gray-900 font-medium">{new Date(processo.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaClock className="text-[#bfa15a]" />
                  <span className="font-medium">Motivo:</span>
                </div>
                <p className="text-gray-900 font-medium">{processo.motivo}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaFileAlt className="text-[#bfa15a]" />
                  <span className="font-medium">Exame:</span>
                </div>
                <p className="text-gray-900 font-medium">{processo.exame || 'Não especificado'}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaHistory className="text-[#bfa15a]" />
                  <span className="font-medium">Status:</span>
                </div>
                <p className="text-gray-900 font-medium">{processo.status}</p>
              </div>
            </div>
          </div>

          {/* Lista de Documentos */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1a2a1a] flex items-center gap-2">
                <FaFileAlt className="text-[#bfa15a]" />
                Documentos Enviados
              </h2>
              
              {/* Estatísticas dos documentos */}
              {processo.documents && processo.documents.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {processo.documents.filter(doc => doc.status === 'PENDENTE').length} Pendente(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {processo.documents.filter(doc => doc.status === 'APROVADO').length} Aprovado(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {processo.documents.filter(doc => doc.status === 'RECUSADO').length} Recusado(s)
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {processo.documents && processo.documents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {processo.documents.map((doc, index) => (
                  <div key={doc.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#bfa15a] rounded-lg">
                          <FaFileAlt className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {getDocumentTypeLabel(doc.type)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Enviado em: {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <button 
                        onClick={() => visualizarDocumento(doc.id, setLoadingDocumento, setError)}
                        disabled={loadingDocumento === doc.id}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium transition flex items-center justify-center gap-2"
                      >
                        {loadingDocumento === doc.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Carregando...
                          </>
                        ) : (
                          <>
                            <FaEye />
                            Visualizar
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => baixarDocumento(doc.id, `${getDocumentTypeLabel(doc.type)}_${doc.id}`, setLoadingDocumento, setError)}
                        disabled={loadingDocumento === doc.id}
                        className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium transition flex items-center justify-center gap-2"
                      >
                        {loadingDocumento === doc.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Baixando...
                          </>
                        ) : (
                          <>
                            <FaDownload />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                    
                    {doc.status === 'PENDENTE' && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAprovarDocumento(doc.id)}
                            className="flex-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition flex items-center justify-center gap-2"
                          >
                            <FaThumbsUp />
                            Aprovar
                          </button>
                          <button 
                            onClick={() => setReprovando(doc.id)}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition flex items-center justify-center gap-2"
                          >
                            <FaThumbsDown />
                            Reprovar
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {reprovando === doc.id && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">Motivo da Reprovação</h4>
                        <textarea
                          value={motivoReprovacao}
                          onChange={(e) => setMotivoReprovacao(e.target.value)}
                          placeholder="Digite o motivo da reprovação..."
                          className="w-full p-3 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows="3"
                        />
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => handleReprovarDocumento(doc.id)}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
                          >
                            Confirmar Reprovação
                          </button>
                          <button 
                            onClick={() => {
                              setReprovando(null);
                              setMotivoReprovacao('');
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {doc.status === 'RECUSADO' && doc.motivo_recusa && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-800 mb-1">Motivo da Reprovação:</h4>
                        <p className="text-sm text-red-700">{doc.motivo_recusa}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#23281a]">
                <FaFileAlt className="text-[#bfa15a] text-4xl mx-auto mb-4" />
                <p className="text-lg font-semibold">Nenhum documento enviado</p>
                <p className="text-sm text-gray-600 mt-2 mb-6">Aguardando envio de documentos pela empresa</p>
                
                {/* Botão para rejeitar processo sem documentos */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaExclamationTriangle className="text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Ação Necessária</h3>
                  </div>
                  <p className="text-sm text-yellow-700 mb-4">
                    Como não há documentos enviados, você pode rejeitar o processo e solicitar que a empresa envie a documentação necessária.
                  </p>
                  
                  {!rejeitandoProcesso ? (
                    <button 
                      onClick={() => setRejeitandoProcesso(true)}
                      className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-medium transition flex items-center gap-2 mx-auto"
                    >
                      <FaTimesCircle />
                      Rejeitar Processo
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={motivoRejeicaoProcesso}
                        onChange={(e) => setMotivoRejeicaoProcesso(e.target.value)}
                        placeholder="Digite o motivo da rejeição e quais documentos são necessários..."
                        className="w-full p-3 border border-red-300 rounded text-sm"
                        rows="4"
                      />
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={handleRejeitarProcesso}
                          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-medium transition"
                        >
                          Confirmar Rejeição
                        </button>
                        <button 
                          onClick={() => {
                            setRejeitandoProcesso(false);
                            setMotivoRejeicaoProcesso('');
                          }}
                          className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white font-medium transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seção de Ações */}
          {processo.documents && processo.documents.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
              <h2 className="text-xl font-bold text-[#1a2a1a] mb-6 flex items-center gap-2">
                <FaCheckCircle className="text-[#bfa15a]" />
                Ações Disponíveis
              </h2>
              
              {/* Verificar se todos os documentos foram aprovados */}
              {(() => {
                const documentosPendentes = processo.documents.filter(doc => doc.status === 'PENDENTE').length;
                const documentosRecusados = processo.documents.filter(doc => doc.status === 'RECUSADO').length;
                
                if (documentosPendentes === 0 && documentosRecusados === 0) {
                  return (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-500 rounded-full">
                          <FaCheckCircle className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-800">Documentação Completa</h3>
                          <p className="text-green-600">Todos os documentos foram aprovados!</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                        <p className="text-sm text-green-700 mb-4">
                          Você pode agora aprovar a documentação completa e permitir que a empresa agende a homologação.
                        </p>
                        <button 
                          onClick={handleAprovarDocumentacao}
                          className="w-full px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2"
                        >
                          <FaCheckCircle />
                          Aprovar Documentação Completa
                        </button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-green-600">
                          Após aprovar, a empresa receberá notificação e poderá agendar a videoconferência de homologação.
                        </p>
                      </div>
                    </div>
                  );
                } else if (documentosRecusados > 0) {
                  return (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-yellow-500 rounded-full">
                          <FaExclamationTriangle className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-yellow-800">Documentação Incompleta</h3>
                          <p className="text-yellow-600">Existem documentos recusados</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          A empresa deve enviar novos documentos ou corrigir os existentes antes que você possa aprovar a documentação.
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500 rounded-full">
                          <FaFileAlt className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-800">Análise em Andamento</h3>
                          <p className="text-blue-600">{documentosPendentes} documento(s) pendente(s)</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-700">
                          Aprove ou reprove cada documento individualmente. Após analisar todos os documentos, 
                          você poderá aprovar a documentação completa.
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 