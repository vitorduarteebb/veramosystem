import React from 'react';
import { FaBell } from 'react-icons/fa';
import UserMenu from './UserMenu';

export default function TopMenu({ sidebarOpen }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <button className="text-[#bfa15a] hover:text-[#1a2a1a] transition-colors relative">
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">2</span>
        </button>
      </div>
      
      <UserMenu />
    </div>
  );
}
