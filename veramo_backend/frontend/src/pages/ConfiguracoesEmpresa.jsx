import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaBell, FaLock, FaPalette, FaLanguage, FaSave, FaTimes } from 'react-icons/fa';
import EmpresaSidebar from '../components/EmpresaSidebar';
import { getUserInfo } from '../services/auth';

function TopMenu({ sidebarOpen }) {
  const user = getUserInfo();
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/empresa/agendamentos')}
          className="flex items-center gap-2 text-[#bfa15a] hover:text-[#1a2a1a] transition-colors"
        >
          <FaArrowLeft />
          Voltar
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#1a2a1a]">Bem-vindo, {user?.name || user?.email}</span>
        <div className="w-8 h-8 bg-[#bfa15a] rounded-full flex items-center justify-center text-[#1a2a1a] font-bold text-sm">
          {user?.name?.[0] || user?.email?.[0] || 'U'}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesEmpresa() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    },
    privacy: {
      showEmail: true,
      showPhone: false,
      allowContact: true
    }
  });

  const handleSaveSettings = () => {
    // Aqui você implementaria a lógica para salvar as configurações
    console.log('Configurações salvas:', settings);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#bfa15a]/60 to-[#f5ecd7] flex">
      <EmpresaSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} p-4 md:p-8`}>
        <TopMenu sidebarOpen={sidebarOpen} />
        
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1a2a1a] mb-2">Configurações</h1>
            <p className="text-lg text-[#23281a]/80">
              Gerencie suas preferências e configurações da conta
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'profile', label: 'Perfil', icon: <FaUser /> },
                  { id: 'notifications', label: 'Notificações', icon: <FaBell /> },
                  { id: 'privacy', label: 'Privacidade', icon: <FaLock /> },
                  { id: 'preferences', label: 'Preferências', icon: <FaPalette /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#bfa15a] text-[#bfa15a]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Tab: Perfil */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#1a2a1a] mb-4">Informações do Perfil</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                        placeholder="Seu nome completo"
                        defaultValue={getUserInfo()?.name || ''}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                        placeholder="seu@email.com"
                        defaultValue={getUserInfo()?.email || ''}
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empresa
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                        placeholder="Nome da empresa"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Notificações */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#1a2a1a] mb-4">Configurações de Notificação</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                        <p className="text-sm text-gray-600">Receba atualizações importantes por email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações Push</h4>
                        <p className="text-sm text-gray-600">Receba notificações no navegador</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Notificações SMS</h4>
                        <p className="text-sm text-gray-600">Receba notificações por SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Privacidade */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#1a2a1a] mb-4">Configurações de Privacidade</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Mostrar Email</h4>
                        <p className="text-sm text-gray-600">Permitir que outros usuários vejam seu email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showEmail}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showEmail: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Mostrar Telefone</h4>
                        <p className="text-sm text-gray-600">Permitir que outros usuários vejam seu telefone</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showPhone}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showPhone: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Permitir Contato</h4>
                        <p className="text-sm text-gray-600">Permitir que outros usuários entrem em contato</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.allowContact}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, allowContact: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bfa15a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bfa15a]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Preferências */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#1a2a1a] mb-4">Preferências Gerais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, language: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuso Horário
                      </label>
                      <select
                        value={settings.preferences.timezone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, timezone: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                      >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors flex items-center gap-2"
                >
                  <FaSave className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
