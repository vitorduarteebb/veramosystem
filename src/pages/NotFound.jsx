import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutralLight px-4">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-neutralDark mb-4">404 – Página não encontrada</h2>
        <p className="text-gray-700 mb-6">A página que você procura não existe.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition">
          Ir para o Login
        </Link>
      </div>
    </div>
  );
} 