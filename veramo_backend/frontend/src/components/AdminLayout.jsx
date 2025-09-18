import React from 'react';
import Sidebar from './Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7]">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
} 