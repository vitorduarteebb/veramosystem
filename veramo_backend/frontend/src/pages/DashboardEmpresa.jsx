import React from 'react';
import { getUserInfo } from '../services/auth';
import DashboardEmpresaMaster from './DashboardEmpresaMaster';
import DashboardEmpresaComum from './DashboardEmpresaComum';

export default function DashboardEmpresa() {
  const user = getUserInfo();
  const role = user?.role;

  // Decidir qual dashboard mostrar baseado no role
  if (role === 'company_master') {
    return <DashboardEmpresaMaster />;
  } else if (role === 'company_common') {
    return <DashboardEmpresaComum />;
  } else {
    // Fallback para usuários sem role definido ou role inválido
    return <DashboardEmpresaComum />;
  }
}
