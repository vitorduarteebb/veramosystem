import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { FaUpload, FaFileAlt, FaEye, FaDownload } from 'react-icons/fa';

// Componente EmpresaSidebar reutilizado
function EmpresaSidebar({ open, setOpen }) {
  const user = getUserInfo();
  const isCompanyMaster = user?.role === 'company_master';
  
  const menu = [
    { label: 'Dashboard', path: '/empresa/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg>
    ) },
    { label: 'Agendamentos', path: '/empresa/agendamentos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    ) },
  ];
  
  // Adicionar "Funcionários" apenas para company_master
  if (isCompanyMaster) {
    menu.push({
      label: 'Funcionários', 
      path: '/empresa/usuarios', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="#bfa15a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.657 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    });
  }
  
  return (
    <aside className={`h-screen bg-[#1a2a1a] text-[#bfa15a] shadow-lg flex flex-col transition-all duration-300 fixed left-0 top-0 z-30 ${open ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#bfa15a]/20">
        <div className="flex items-center gap-2">
          <img src="/veramo_logo.png" alt="Logo Veramo" className={`transition-all duration-300 ${open ? 'w-12 h-12' : 'w-8 h-8'} object-contain`} />
          {open && <span className="text-base font-medium">VERAMO</span>}
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-[#bfa15a] focus:outline-none ml-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {menu.map(item => (
            <li key={item.label}>
              <a href={item.path} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#bfa15a]/10 transition-colors group">
                <span className="text-[#bfa15a]">{item.icon}</span>
                {open && <span className="text-base font-medium">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default function ProcessoHomologacaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docModal, setDocModal] = useState(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [docRejeitado, setDocRejeitado] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const etapa = getEtapaStatus(processo?.status);

  // Tipos de documentos disponíveis
  const documentTypes = [
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

  useEffect(() => {
    const user = getUserInfo();
    setUserInfo(user);
  }, []);

  useEffect(() => {
    async function fetchProcesso() {
      setLoading(true);
      try {
        const tokens = getToken();
        if (!tokens?.access) {
          logout();
          navigate('/login');
          return;
        }

        const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (resp.status === 401) {
          // Tentar renovar o token
          const newToken = await refreshToken();
          if (newToken) {
            const retryResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            });
            if (!retryResp.ok) throw new Error('Erro ao buscar processo após renovação do token');
            setProcesso(await retryResp.json());
          } else {
            logout();
            navigate('/login');
          }
        } else if (!resp.ok) {
          throw new Error('Erro ao buscar processo');
        } else {
          setProcesso(await resp.json());
        }
      } catch (err) {
        console.error('Erro ao buscar processo:', err);
        setError('Erro ao buscar detalhes do processo.');
      } finally {
        setLoading(false);
      }
    }
    fetchProcesso();
  }, [id]);

  // Função para upload de documentos
  const handleUploadDocuments = async () => {
    setUploading(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Adicionar arquivos e tipos
      Object.entries(selectedFiles).forEach(([type, file]) => {
        if (file) {
          formData.append('documents', file);
          formData.append('types', type);
        }
      });

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/upload-documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        const processoAtualizado = await processoResp.json();
        setProcesso(processoAtualizado);
        
        // Verificar se o status mudou para aguardando_aprovacao
        if (processoAtualizado.status === 'aguardando_aprovacao') {
          alert('Documentos enviados com sucesso! O processo voltou para "Aguardando Aprovação".');
        } else {
          alert('Documentos enviados com sucesso!');
        }
      }

      setUploadModal(false);
      setSelectedFiles({});
    } catch (err) {
      alert(`Erro ao enviar documentos: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Função para aprovar documento
  const handleApproveDocument = async (documentId) => {
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/approve-document/${documentId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao aprovar documento');
      }

      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        setProcesso(await processoResp.json());
      }

      setDocModal(null);
      alert('Documento aprovado com sucesso!');
    } catch (err) {
      alert(`Erro ao aprovar documento: ${err.message}`);
    }
  };

  // Função para rejeitar documento
  const handleRejectDocument = async (documentId) => {
    if (!motivoRecusa.trim()) {
      alert('Por favor, informe o motivo da recusa');
      return;
    }

    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/reject-document/${documentId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo: motivoRecusa }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao rejeitar documento');
      }

      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        setProcesso(await processoResp.json());
      }

      setDocModal(null);
      setMotivoRecusa('');
      setDocRejeitado(null);
      alert('Documento rejeitado com sucesso!');
    } catch (err) {
      alert(`Erro ao rejeitar documento: ${err.message}`);
    }
  };

  // Função para obter status visual do documento
  const getDocumentStatusBadge = (status) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">Pendente</span>;
      case 'APROVADO':
        return <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Aprovado</span>;
      case 'RECUSADO':
        return <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Recusado</span>;
      default:
        return <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">Desconhecido</span>;
    }
  };

  // Função para verificar se documento pode ser enviado
  const canUploadDocument = (docType) => {
    const existingDoc = processo?.documents?.find(doc => doc.type === docType);
    return !existingDoc || existingDoc.status === 'RECUSADO';
  };

  // Função para selecionar arquivo
  const handleFileSelect = (type, file) => {
    if (!canUploadDocument(type)) {
      alert('Este documento já foi enviado e não pode ser substituído.');
      return;
    }
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  // Nova função para mapear status para etapa
  function getEtapaStatus(status) {
    switch (status) {
      case 'aguardando_aprovacao':
      case 'aguardando_analise_documentacao':
      case 'pendente_documentacao':
      case 'analise_documentacao':
      case 'documentacao_rejeitada':
        return 1;
      case 'documentos_aprovados':
      case 'aguardando_agendamento':
        return 2;
      case 'agendado':
      case 'em_videoconferencia':
        return 3;
      case 'assinatura_pendente':
      case 'assinado':
        return 4;
      case 'finalizado':
        return 4;
      default:
        return 1;
    }
  }

  // Determinar se é usuário de empresa ou sindicato
  const isEmpresa = userInfo?.company;
  const isSindicato = userInfo?.union;

  // Estado para ressalvas
  const [ressalvas, setRessalvas] = useState(processo?.ressalvas || '');
  const [salvandoRessalva, setSalvandoRessalva] = useState(false);
  const [avancandoEtapa, setAvancandoEtapa] = useState(false);

  // Estado para assinaturas
  const [documentoAssinado, setDocumentoAssinado] = useState(null);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [confirmandoAssinatura, setConfirmandoAssinatura] = useState(false);

  // Função para salvar ressalvas
  const handleSalvarRessalva = async () => {
    setSalvandoRessalva(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/salvar-ressalva/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ressalvas }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao salvar ressalvas');
      }

      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        setProcesso(await processoResp.json());
      }

      alert('Ressalvas salvas com sucesso!');
    } catch (err) {
      alert(`Erro ao salvar ressalvas: ${err.message}`);
    } finally {
      setSalvandoRessalva(false);
    }
  };

  // Função para avançar etapa
  const handleAvancarEtapa = async () => {
    if (!confirm('Confirmar que deseja avançar para a próxima etapa?')) {
      return;
    }

    setAvancandoEtapa(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/avancar-etapa/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao avançar etapa');
      }

      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        const novoProcesso = await processoResp.json();
        setProcesso(novoProcesso);
        setRessalvas(novoProcesso.ressalvas || '');
      }

      alert('Processo avançou para a próxima etapa com sucesso!');
    } catch (err) {
      alert(`Erro ao avançar etapa: ${err.message}`);
    } finally {
      setAvancandoEtapa(false);
    }
  };

  // Atualizar ressalvas quando processo mudar
  useEffect(() => {
    if (processo?.ressalvas !== undefined) {
      setRessalvas(processo.ressalvas || '');
    }
  }, [processo?.ressalvas]);

  // Função para upload de documento assinado
  const handleUploadAssinatura = async () => {
    if (!documentoAssinado) {
      alert('Selecione um documento para fazer upload');
      return;
    }

    setFazendoUpload(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('documento', documentoAssinado);

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/upload-assinatura/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      const result = await resp.json();
      
      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        setProcesso(await processoResp.json());
      }

      setDocumentoAssinado(null);
      alert(result.detail);
    } catch (err) {
      alert(`Erro ao fazer upload: ${err.message}`);
    } finally {
      setFazendoUpload(false);
    }
  };

  // Função para confirmar assinatura (sem upload)
  const handleConfirmarAssinatura = async () => {
    if (!confirm('Confirmar que os documentos foram assinados?')) {
      return;
    }

    setConfirmandoAssinatura(true);
    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/confirmar-assinatura/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Erro ao confirmar assinatura');
      }

      const result = await resp.json();
      
      // Recarregar dados do processo
      const processoResp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
      });
      if (processoResp.ok) {
        setProcesso(await processoResp.json());
      }

      alert(result.detail);
    } catch (err) {
      alert(`Erro ao confirmar assinatura: ${err.message}`);
    } finally {
      setConfirmandoAssinatura(false);
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!processo) return null;

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      {isEmpresa ? (
        <EmpresaSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      ) : (
        <Sidebar />
      )}
      <div className={`flex-1 p-8 max-w-6xl mx-auto ${isEmpresa ? (sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20') : 'ml-0 md:ml-64'} transition-all duration-300`}>
        <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2 bg-[#bfa15a] text-white rounded font-bold">Voltar</button>
        <h1 className="text-2xl font-bold mb-6 text-[#23281a]">
          {isEmpresa ? 'Detalhes do Agendamento' : 'Detalhes do Processo'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna 1: Dados do Funcionário */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-2">
            <div className="text-lg font-bold text-[#23281a]">{processo.nome_funcionario}</div>
            <div className="text-sm text-gray-500">{processo.cargo_funcionario || 'Cargo não informado'}</div>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 rounded bg-orange-100 text-orange-700 font-bold text-xs">Status: {processo.status}</span>
            </div>
            <div className="mt-4 text-sm">
              <b>Empresa:</b> {processo.empresa_nome || processo.empresa}<br />
              <b>Motivo Demissão:</b> {processo.motivo}<br />
              <b>Exame Demissional:</b> {processo.exame ? 'Realizado' : 'Não realizado'}<br />
              <b>Data Demissão:</b> {processo.demission_date || '-'}
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#23281a]">Documentos Anexados</h2>
                {isEmpresa && (
                  <button 
                    onClick={() => setUploadModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#bfa15a] text-white rounded text-sm hover:bg-[#23281a] transition"
                  >
                    <FaUpload className="text-xs" />
                    Enviar
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {(processo.documents || []).map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FaFileAlt className="text-[#bfa15a] text-sm" />
                    <span className="truncate flex-1 text-sm">{doc.type || doc.name || 'Documento'}</span>
                    <div className="flex items-center gap-2">
                      {getDocumentStatusBadge(doc.status)}
                      {doc.status === 'RECUSADO' && (
                        <span className="text-xs text-red-600" title={doc.motivo_recusa}>
                          ⚠️
                        </span>
                      )}
                      <div className="flex gap-1">
                        <button 
                          className="text-blue-600 hover:text-blue-800" 
                          onClick={() => setDocModal(doc)}
                          title="Visualizar"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <a 
                          href={doc.file} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-green-700 hover:text-green-900"
                          title="Baixar"
                        >
                          <FaDownload className="text-xs" />
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
                {(!processo.documents || processo.documents.length === 0) && (
                  <li className="text-[#bfa15a] text-sm italic">Nenhum documento enviado</li>
                )}
              </ul>
            </div>
          </div>
          {/* Coluna 2: Etapas e Videoconferência */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4 col-span-2">
            {/* Barra de etapas */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 flex items-center">
                <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-white ${etapa >= 1 ? 'bg-[#bfa15a]' : 'bg-gray-300'}`}>1</div>
                <div className="flex-1 h-1 bg-gray-200 mx-2" />
                <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-white ${etapa >= 2 ? 'bg-[#bfa15a]' : 'bg-gray-300'}`}>2</div>
                <div className="flex-1 h-1 bg-gray-200 mx-2" />
                <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-white ${etapa >= 3 ? 'bg-[#bfa15a]' : 'bg-gray-300'}`}>3</div>
                <div className="flex-1 h-1 bg-gray-200 mx-2" />
                <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-white ${etapa === 4 ? 'bg-[#bfa15a]' : 'bg-gray-300'}`}>4</div>
              </div>
            </div>
            {/* Etapas dinâmicas */}
            {etapa === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-[#23281a]">Análise de Documentação</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {isEmpresa 
                    ? 'O sindicato está analisando os documentos enviados. Aguarde a aprovação para prosseguir.'
                    : 'Analise os documentos enviados pela empresa e aprove ou rejeite conforme necessário.'
                  }
                </p>
                {isSindicato && processo.status !== 'documentos_aprovados' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">Ações Disponíveis:</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/sindicato/analise/${id}`)}
                        className="px-4 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 transition"
                      >
                        Analisar Documentos
                      </button>
                    </div>
                  </div>
                )}
                {isSindicato && processo.status === 'documentos_aprovados' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Documentação Aprovada!</h3>
                    <p className="text-green-700 text-sm mb-2">
                      Todos os documentos foram aprovados. A empresa poderá agendar a homologação.
                    </p>
                  </div>
                )}
              </div>
            )}
            {etapa === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-[#23281a]">Agendamento / Videoconferência</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {isEmpresa 
                    ? 'Escolha uma data e hora na agenda dos homologadores do sindicato para realizar a videoconferência.'
                    : 'A empresa deve escolher uma data e hora na agenda. Após o agendamento, será realizada a videoconferência.'
                  }
                </p>
                {isEmpresa && processo.status === 'documentos_aprovados' && (
                  <div className="mt-4">
                    <button 
                      onClick={() => navigate(`/empresa/agendamento/${id}`)}
                      className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold hover:bg-[#23281a] transition"
                    >
                      Agendar Videoconferência
                    </button>
                  </div>
                )}
                {isSindicato && processo.status === 'documentos_aprovados' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Documentação Aprovada!</h3>
                    <p className="text-blue-700 text-sm">
                      A empresa poderá agendar a homologação quando desejar.
                    </p>
                  </div>
                )}
                {processo.video_link && (
                  <div className="mt-4">
                    <a
                      href={`https://calendar.google.com/calendar/u/0/r/eventedit?vcon=meet&hl=pt-BR`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
                    >
                      Gerar Evento
                    </a>
                  </div>
                )}
              </div>
            )}
            {etapa === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-[#23281a]">
                  {processo.status === 'agendado' || processo.status === 'em_videoconferencia' ? 'Videoconferência' : 'Assinatura de Documentação'}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  {processo.status === 'agendado' || processo.status === 'em_videoconferencia' 
                    ? 'Sua videoconferência de homologação está agendada e pronta para iniciar.'
                    : 'Após a videoconferência, ambas as partes devem assinar digitalmente os documentos.'
                  }
                </p>
                
                {processo.status === 'agendado' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Videoconferência:</h3>
                    <div className="bg-blue-50 p-3 rounded mb-3 border border-blue-200">
                      <p className="text-blue-800 text-sm mb-2">
                        <strong>Como usar o Google Meet:</strong>
                      </p>
                      <ol className="text-blue-700 text-sm space-y-1">
                        <li>1. {userInfo?.union ? 'Clique em "Gerar" para abrir o evento no Google Calendar' : 'Clique em "Acessar" para entrar na sala'}</li>
                        <li>2. Clique em "Iniciar reunião" ou "Participar"</li>
                        <li>3. Permita acesso à câmera e microfone</li>
                        <li>4. Compartilhe o link com os participantes</li>
                      </ol>
                    </div>
                    <div className="flex gap-2">
                      {processo.video_link && (
                        <button 
                          onClick={() => navigator.clipboard.writeText(processo.video_link)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                        >
                          Copiar Link
                        </button>
                      )}
                      {/* Campo para usuários do sindicato inserirem/ajustarem o link manualmente */}
                      {userInfo?.union && (
                        <input
                          type="text"
                          defaultValue={processo.video_link || ''}
                          onBlur={async (e) => {
                            const novoLink = e.target.value.trim();
                            if (!novoLink || novoLink === processo.video_link) return;
                            try {
                              const tokens = getToken();
                              if (!tokens?.access) {
                                logout();
                                navigate('/login');
                                return;
                              }
                              const resp = await fetch(`${API_ENDPOINTS.DEMISSAO_PROCESSES}${id}/set-video-link/`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${tokens.access}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ video_link: novoLink }),
                              });
                              if (resp.ok) {
                                const data = await resp.json();
                                setProcesso(prev => ({ ...prev, video_link: data?.video_link || novoLink }));
                              }
                            } catch {}
                          }}
                          placeholder="Cole o link do Meet aqui (apenas sindicato)"
                          className="flex-1 px-3 py-1 border rounded text-sm"
                        />
                      )}
                      {userInfo?.union ? (
                        <a 
                          href={`https://calendar.google.com/calendar/u/0/r/eventedit?vcon=meet&hl=pt-BR`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                        >
                          Gerar
                        </a>
                      ) : (
                        processo.video_link ? (
                          <a 
                            href={(processo.video_link || '').startsWith('http') ? processo.video_link : `https://${(processo.video_link || '').replace(/^\/+/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                          >
                            Acessar
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500 self-center">Aguardando link do sindicato</span>
                        )
                      )}
                    </div>
                  </div>
                )}
                
                {processo.status !== 'agendado' && (
                  <button className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold">Assinar Documentos</button>
                )}
              </div>
            )}
            {etapa === 4 && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-[#23281a]">Assinatura de Documentação</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Após a videoconferência, ambas as partes devem assinar digitalmente os documentos.
                </p>
                
                {/* Status das assinaturas */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3">Status das Assinaturas:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${processo.assinado_empresa ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${processo.assinado_empresa ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-medium">Empresa</span>
                      </div>
                      <p className="text-sm mt-1">
                        {processo.assinado_empresa ? '✅ Assinado' : '⏳ Pendente'}
                      </p>
                      {processo.assinado_empresa && processo.data_assinatura_empresa && (
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(processo.data_assinatura_empresa).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                    
                    <div className={`p-3 rounded-lg ${processo.assinado_sindicato ? 'bg-green-100 border border-green-300' : 'bg-yellow-100 border border-yellow-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${processo.assinado_sindicato ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-medium">Sindicato</span>
                      </div>
                      <p className="text-sm mt-1">
                        {processo.assinado_sindicato ? '✅ Assinado' : '⏳ Pendente'}
                      </p>
                      {processo.assinado_sindicato && processo.data_assinatura_sindicato && (
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(processo.data_assinatura_sindicato).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload de documento assinado */}
                {!processo.assinado_empresa && isEmpresa && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-[#23281a] mb-3">Upload de Documento Assinado (Empresa)</h3>
                    <div className="space-y-3">
                      <input
                        type="file"
                        onChange={(e) => setDocumentoAssinado(e.target.files[0])}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      {documentoAssinado && (
                        <p className="text-sm text-green-600">
                          ✓ {documentoAssinado.name}
                        </p>
                      )}
                      <button
                        onClick={handleUploadAssinatura}
                        disabled={!documentoAssinado || fazendoUpload}
                        className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold disabled:opacity-50"
                      >
                        {fazendoUpload ? 'Fazendo Upload...' : 'Fazer Upload'}
                      </button>
                    </div>
                  </div>
                )}

                {!processo.assinado_sindicato && isSindicato && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-[#23281a] mb-3">Upload de Documento Assinado (Sindicato)</h3>
                    <div className="space-y-3">
                      <input
                        type="file"
                        onChange={(e) => setDocumentoAssinado(e.target.files[0])}
                        className="w-full p-2 border rounded"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      {documentoAssinado && (
                        <p className="text-sm text-green-600">
                          ✓ {documentoAssinado.name}
                        </p>
                      )}
                      <button
                        onClick={handleUploadAssinatura}
                        disabled={!documentoAssinado || fazendoUpload}
                        className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold disabled:opacity-50"
                      >
                        {fazendoUpload ? 'Fazendo Upload...' : 'Fazer Upload'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmação de assinatura (alternativa ao upload) */}
                {((!processo.assinado_empresa && isEmpresa) || (!processo.assinado_sindicato && isSindicato)) && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-[#23281a] mb-2">Confirmação de Assinatura</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Se os documentos já foram assinados fisicamente, você pode confirmar a assinatura sem fazer upload.
                    </p>
                    <button
                      onClick={handleConfirmarAssinatura}
                      disabled={confirmandoAssinatura}
                      className="px-4 py-2 bg-gray-600 text-white rounded font-bold disabled:opacity-50"
                    >
                      {confirmandoAssinatura ? 'Confirmando...' : 'Confirmar Assinatura'}
                    </button>
                  </div>
                )}

                {/* Processo finalizado */}
                {processo.status === 'finalizado' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800">🎉 Processo Finalizado!</h3>
                    <p className="text-green-700 text-sm">
                      Todas as assinaturas foram confirmadas e o processo de homologação foi concluído com sucesso.
                    </p>
                    {processo.data_termino && (
                      <p className="text-xs text-green-600 mt-2">
                        Finalizado em: {new Date(processo.data_termino).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Resumo/Ressalvas - Só na etapa 3 */}
            {isSindicato && etapa === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-[#23281a]">Ressalvas</h2>
                <textarea 
                  className="w-full border rounded p-2 mb-2" 
                  rows={4} 
                  placeholder="Digite aqui as ressalvas..." 
                  value={ressalvas}
                  onChange={(e) => setRessalvas(e.target.value)}
                />
                <button 
                  onClick={handleSalvarRessalva}
                  disabled={salvandoRessalva}
                  className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold disabled:opacity-50"
                >
                  {salvandoRessalva ? 'Salvando...' : 'Gravar Ressalva'}
                </button>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-[#23281a] rounded font-bold">Voltar</button>
              {isSindicato && etapa === 3 && (
                <button 
                  onClick={handleAvancarEtapa}
                  disabled={avancandoEtapa}
                  className="px-4 py-2 bg-[#1a2a1a] text-white rounded font-bold disabled:opacity-50"
                >
                  {avancandoEtapa ? 'Avançando...' : 'Avançar'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Modal de Upload de Documentos */}
        <Modal open={uploadModal} onClose={() => setUploadModal(false)}>
          <div className="w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 text-[#23281a]">Enviar Documentos</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {documentTypes.map((docType) => {
                const existingDoc = processo?.documents?.find(doc => doc.type === docType.value);
                const canUpload = canUploadDocument(docType.value);
                
                return (
                  <div key={docType.value} className={`border rounded-lg p-3 ${!canUpload ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`block font-medium ${!canUpload ? 'text-gray-500' : 'text-[#23281a]'}`}>
                        {docType.label}
                      </label>
                      {existingDoc && (
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(existingDoc.status)}
                          {existingDoc.status === 'RECUSADO' && (
                            <span className="text-xs text-red-600" title={existingDoc.motivo_recusa}>
                              Motivo: {existingDoc.motivo_recusa}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {canUpload ? (
                      <>
                        <input
                          type="file"
                          onChange={(e) => handleFileSelect(docType.value, e.target.files[0])}
                          className="w-full p-2 border rounded text-sm"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        {selectedFiles[docType.value] && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {selectedFiles[docType.value].name}
                          </p>
                        )}
                        {existingDoc && existingDoc.status === 'RECUSADO' && (
                          <p className="text-sm text-blue-600 mt-1">
                            ⚠️ Documento será substituído
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">
                        {existingDoc?.status === 'PENDENTE' && 'Documento enviado, aguardando análise'}
                        {existingDoc?.status === 'APROVADO' && 'Documento aprovado, não pode ser alterado'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUploadDocuments}
                disabled={uploading || Object.keys(selectedFiles).length === 0}
                className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold disabled:opacity-50"
              >
                {uploading ? 'Enviando...' : 'Enviar Documentos'}
              </button>
              <button
                onClick={() => setUploadModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal de visualização e ação do documento */}
        <Modal open={!!docModal} onClose={() => { setDocModal(null); setMotivoRecusa(''); }}>
          {docModal && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#23281a]">Visualizar Documento</h2>
                <div className="flex items-center gap-2">
                  {getDocumentStatusBadge(docModal.status)}
                  {docModal.status === 'RECUSADO' && (
                    <span className="text-xs text-red-600">⚠️</span>
                  )}
                </div>
              </div>
              
              {docModal.status === 'RECUSADO' && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-1">Motivo da Recusa:</h3>
                  <p className="text-sm text-red-700">{docModal.motivo_recusa}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Rejeitado em: {new Date(docModal.rejeitado_em).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              
              {docModal.status === 'APROVADO' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-1">Documento Aprovado</h3>
                  <p className="text-xs text-green-600">
                    Aprovado em: {new Date(docModal.aprovado_em).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              
              <iframe src={docModal.file} title="Documento" className="w-full h-96 mb-4 border rounded" />
              <div className="flex gap-2 mb-4">
                <a href={docModal.file} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#bfa15a] text-white rounded font-bold">Baixar</a>
                {isSindicato && docModal.status === 'PENDENTE' && (
                  <>
                    <button className="px-4 py-2 bg-green-600 text-white rounded font-bold" onClick={() => handleApproveDocument(docModal.id)}>Aprovar</button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded font-bold" onClick={() => setDocRejeitado(docModal)}>Rejeitar</button>
                  </>
                )}
              </div>
              {docRejeitado && docRejeitado.id === docModal.id && (
                <div className="mt-2">
                  <textarea 
                    className="w-full border rounded p-2 mb-2" 
                    rows={3} 
                    placeholder="Motivo da recusa" 
                    value={motivoRecusa} 
                    onChange={e => setMotivoRecusa(e.target.value)} 
                  />
                  <button className="px-4 py-2 bg-red-600 text-white rounded font-bold w-full" onClick={() => handleRejectDocument(docModal.id)}>Confirmar Recusa</button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 