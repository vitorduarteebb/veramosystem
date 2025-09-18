import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-error mb-4">403 – Não autorizado</h2>
        <p className="text-gray-700 mb-6">Você não possui permissão para acessar esta página.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition">
          Voltar ao Login
        </Link>
      </div>
    </div>
  );
} 