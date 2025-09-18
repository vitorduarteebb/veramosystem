import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-[90vw]">
        {children}
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-[#23281a] font-bold">Cancelar</button>
      </div>
    </div>
  );
} 