import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import DashboardAdmin from './pages/DashboardAdmin.jsx';
import DashboardEmpresa from './pages/DashboardEmpresa.jsx';
import AgendamentosEmpresa from './pages/AgendamentosEmpresa.jsx';
import PainelSindicatoMaster from './pages/PainelSindicatoMaster.jsx';
import HomologacoesDoDia from './pages/HomologacoesDoDia.jsx';
import SindicatoNovo from './pages/SindicatoNovo';
import SindicatosList from './pages/SindicatosList';
import SindicatoDetalhes from './pages/SindicatoDetalhes';
import EmpresasList from './pages/EmpresasList.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { getToken } from './services/auth';
import EmpresaNova from './pages/EmpresaNova.jsx';
import EmpresaDetalhes from './pages/EmpresaDetalhes.jsx';
import UsuariosEmpresa from './pages/UsuariosEmpresa.jsx';
import UsuarioNovo from './pages/UsuarioNovo.jsx';
import AgendamentoNovo from './pages/AgendamentoNovo.jsx';
import { EquipeSindicato, CargasHorariasSindicato, AgendamentoHomologacao } from './pages';
import EscalaSindicato from './pages/EscalaSindicato';
import DocumentacoesSindicato from './pages/DocumentacoesSindicato';
import ProcessoHomologacaoDetalhe from './pages/ProcessoHomologacaoDetalhe';
import AnaliseDocumentos from './pages/AnaliseDocumentos';
import AgendamentoSindicato from './pages/AgendamentoSindicato';
import AgendamentoEmpresa from './pages/AgendamentoEmpresa';
import LogsSindicato from './pages/LogsSindicato';
import ProcessosFinalizados from './pages/ProcessosFinalizados';
import HomologacoesFinalizadasEmpresa from './pages/HomologacoesFinalizadasEmpresa';
import PerfilUsuario from './pages/PerfilUsuario';
import AgendamentosAdmin from './pages/AgendamentosAdmin';
import UsuariosAdmin from './pages/UsuariosAdmin';
import LogsAdmin from './pages/LogsAdmin';
import ConfiguracoesEmpresa from './pages/ConfiguracoesEmpresa';
import AssinaturaSindicato from './pages/AssinaturaSindicato';
import AssinaturaFuncionario from './pages/AssinaturaFuncionario';
import AssinaturaEmpresa from './pages/AssinaturaEmpresa';

export default function App() {
  console.log('[DEBUG] Render App. Token:', getToken && getToken());
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route
          path="/admin/agendamentos"
          element={
            <ProtectedRoute>
              <AgendamentosAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/empresas"
          element={
            <ProtectedRoute>
              <EmpresasList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/empresas/nova"
          element={
            <ProtectedRoute>
              <EmpresaNova />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/empresas/:id"
          element={
            <ProtectedRoute>
              <EmpresaDetalhes />
            </ProtectedRoute>
          }
        />
        <Route path="/empresa/dashboard" element={<DashboardEmpresa />} />
        <Route path="/empresa/agendamentos" element={<AgendamentosEmpresa />} />
        <Route path="/empresa/agendamentos/:id" element={<ProtectedRoute><AgendamentoEmpresa /></ProtectedRoute>} />
        <Route path="/empresa/agendamentos/novo" element={<ProtectedRoute><AgendamentoNovo /></ProtectedRoute>} />
        <Route path="/empresa/assinatura/:id" element={<ProtectedRoute><AssinaturaEmpresa /></ProtectedRoute>} />
        <Route path="/empresa/agendamento/:id" element={<ProtectedRoute><AgendamentoEmpresa /></ProtectedRoute>} />
        <Route path="/empresa/usuarios" element={<ProtectedRoute><UsuariosEmpresa /></ProtectedRoute>} />
        <Route path="/empresa/usuarios/novo" element={<ProtectedRoute><UsuarioNovo /></ProtectedRoute>} />
        <Route path="/empresa/homologacoes-finalizadas" element={<ProtectedRoute><HomologacoesFinalizadasEmpresa /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesEmpresa /></ProtectedRoute>} />
        <Route path="/sindicato/dashboard" element={<PainelSindicatoMaster />} />
        <Route path="/sindicato/hoje" element={<HomologacoesDoDia />} />
        <Route path="/sindicato/agendamentos" element={<ProtectedRoute><AgendamentoHomologacao /></ProtectedRoute>} />
        <Route path="/sindicato/documentacoes" element={<ProtectedRoute><DocumentacoesSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/documentacoes/:id" element={<ProtectedRoute><ProcessoHomologacaoDetalhe /></ProtectedRoute>} />
        <Route path="/admin/sindicatos/novo" element={<SindicatoNovo />} />
        <Route path="/admin/sindicatos" element={<SindicatosList />} />
        <Route path="/admin/sindicatos/:id" element={<SindicatoDetalhes />} />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <UsuariosAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute>
              <LogsAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/sindicato/usuarios/equipe" element={<ProtectedRoute><EquipeSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/usuarios/cargas-horarias" element={<ProtectedRoute><CargasHorariasSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/agendamentos/escala" element={<ProtectedRoute><EscalaSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/assinatura/:scheduleId" element={<ProtectedRoute><AssinaturaSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/agendar/:id" element={<ProtectedRoute><AgendamentoHomologacao /></ProtectedRoute>} />
        <Route path="/sindicato/analise/:id" element={<ProtectedRoute><AnaliseDocumentos /></ProtectedRoute>} />
        <Route path="/sindicato/logs" element={<ProtectedRoute><LogsSindicato /></ProtectedRoute>} />
        <Route path="/sindicato/processos-finalizados" element={<ProtectedRoute><ProcessosFinalizados /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PerfilUsuario /></ProtectedRoute>} />
        
        {/* Rotas públicas para assinatura */}
        <Route path="/assinaturas/convite/:token" element={<AssinaturaFuncionario />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
