import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Exemplo de rotas protegidas, ajuste conforme criar os painéis */}
          {/* <Route path="/empresa/*" element={<ProtectedRoute requiredRole="company_master"><PainelEmpresa /></ProtectedRoute>} /> */}
          {/* <Route path="/sindicato/*" element={<ProtectedRoute requiredRole="union_master"><PainelSindicato /></ProtectedRoute>} /> */}
          {/* <Route path="/admin/*" element={<ProtectedRoute requiredRole="superadmin"><PainelAdmin /></ProtectedRoute>} /> */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
} 