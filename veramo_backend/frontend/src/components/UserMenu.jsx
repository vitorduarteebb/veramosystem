import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, getToken, refreshToken, logout } from '../services/auth';
import { API_ENDPOINTS } from '../config/api';
import { FaUser, FaCog, FaSignOutAlt, FaKey, FaChevronDown } from 'react-icons/fa';

export default function UserMenu() {
  const user = getUserInfo();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos os campos são obrigatórios');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const tokens = getToken();
      if (!tokens?.access) {
        logout();
        navigate('/login');
        return;
      }

      const resp = await fetch(`${API_ENDPOINTS.CHANGE_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (resp.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          const retryResp = await fetch(`${API_ENDPOINTS.CHANGE_PASSWORD}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              current_password: passwordData.currentPassword,
              new_password: passwordData.newPassword,
            }),
          });
          if (retryResp.ok) {
            setPasswordSuccess('Senha alterada com sucesso!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
              setChangePasswordModal(false);
              setPasswordSuccess('');
            }, 2000);
          } else {
            setPasswordError('Erro ao alterar senha');
          }
        }
      } else if (resp.ok) {
        setPasswordSuccess('Senha alterada com sucesso!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setChangePasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        const errorData = await resp.json();
        setPasswordError(errorData.detail || 'Erro ao alterar senha');
      }
    } catch (err) {
      setPasswordError('Erro ao alterar senha');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      {/* Menu do Usuário */}
      <div className="relative user-menu-container">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          <div className="text-right">
            <div className="text-sm font-medium text-[#1a2a1a]">{user?.name || user?.email}</div>
            <div className="text-xs text-[#23281a]/70">{user?.role === 'company_master' ? 'Empresa Master' : 'Empresa Comum'}</div>
          </div>
          <div className="w-10 h-10 bg-[#bfa15a] rounded-full flex items-center justify-center text-[#1a2a1a] font-bold text-sm">
            {user?.name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <FaChevronDown className={`text-[#bfa15a] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            {/* Header do usuário */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#bfa15a] rounded-full flex items-center justify-center text-[#1a2a1a] font-bold text-sm">
                  {user?.name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user?.name || user?.email}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="text-xs text-[#bfa15a] font-medium">
                    {user?.role === 'company_master' ? 'Empresa Master' : 'Empresa Comum'}
                  </div>
                </div>
              </div>
            </div>

            {/* Opções do menu */}
            <div className="py-2">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setChangePasswordModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaKey className="w-4 h-4 text-gray-500" />
                <span>Alterar Senha</span>
              </button>
              
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/perfil');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaUser className="w-4 h-4 text-gray-500" />
                <span>Meu Perfil</span>
              </button>
              
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/configuracoes');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaCog className="w-4 h-4 text-gray-500" />
                <span>Configurações</span>
              </button>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alteração de Senha */}
      {changePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#1a2a1a]">Alterar Senha</h3>
                <button 
                  onClick={() => {
                    setChangePasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaSignOutAlt className="w-6 h-6" />
                </button>
              </div>

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">{passwordSuccess}</p>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                    placeholder="Digite sua senha atual"
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                    placeholder="Digite sua nova senha"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                    placeholder="Confirme sua nova senha"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setChangePasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 bg-[#bfa15a] text-white rounded-lg font-medium hover:bg-[#23281a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <FaKey className="w-4 h-4" />
                      Alterar Senha
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
