import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaShieldAlt, FaCalendarAlt, FaVideo, FaUsers, FaBuilding, FaHandshake, FaCheckCircle, FaArrowRight, FaWhatsapp, FaEnvelope, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { login, fetchUserInfo } from '../services/auth.js';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const user = await fetchUserInfo();
      setLoading(false);
      if (!user || !user.role) {
        setError('Não foi possível identificar o tipo de usuário.');
        return;
      }
      if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin/dashboard');
      else if (user.role === 'company_master') navigate('/empresa/dashboard');
      else if (user.role === 'company_common') navigate('/empresa/agendamentos');
      else if (user.role === 'union_master') navigate('/sindicato/dashboard');
      else if (user.role === 'union_common') navigate('/sindicato/hoje');
      else navigate('/');
    } catch (err) {
      setLoading(false);
      setError('E-mail ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23281a] via-[#3a4a2c] to-[#bfa15a] overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/veramo_logo.png" alt="Veramo" className="h-10 w-auto" />
              <span className="ml-3 text-white text-xl font-bold">Veramo</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowLogin(true)}
                className="text-white hover:text-[#bfa15a] transition-colors duration-200"
              >
                Entrar
              </button>
              <a href="#contato" className="text-white hover:text-[#bfa15a] transition-colors duration-200">
                Contato
              </a>
              <a href="#sobre" className="text-white hover:text-[#bfa15a] transition-colors duration-200">
                Sobre
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fadeIn">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Revolucionamos o jeito de fazer
              <span className="text-[#bfa15a] block">homologações no Brasil</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
              Agendamentos digitais, documentos organizados, reuniões online. 
              Tudo em um único lugar, com segurança e eficiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-[#bfa15a] hover:bg-[#a8904a] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                Já tenho acesso
                <FaArrowRight className="text-sm" />
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-[#23281a] px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2">
                <FaPlay className="text-sm" />
                Ver como funciona
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Por que escolher a Veramo?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-[#bfa15a] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCalendarAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Agenda Digital Automatizada</h3>
              <p className="text-white/80">
                Evite erros e atrasos com a disponibilidade inteligente. 
                Agendamentos automáticos e lembretes personalizados.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-[#bfa15a] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Segurança e Assinatura Digital</h3>
              <p className="text-white/80">
                Conformidade com LGPD e validade jurídica garantida. 
                Documentos criptografados e assinaturas digitais seguras.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-[#bfa15a] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaVideo className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Reuniões Online Automáticas</h3>
              <p className="text-white/80">
                Economia de tempo e deslocamento. Links do Google Meet 
                gerados automaticamente para cada homologação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Whom Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Para quem é feito?
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-[#bfa15a] w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <FaBuilding className="text-white text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Empresas</h3>
              </div>
              <p className="text-white/80 text-lg mb-6">
                Agende e gerencie homologações com poucos cliques. 
                Controle total sobre documentos e processos.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Upload de documentos simplificado
                </li>
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Acompanhamento em tempo real
                </li>
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Relatórios detalhados
                </li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-[#bfa15a] w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <FaHandshake className="text-white text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Sindicatos</h3>
              </div>
              <p className="text-white/80 text-lg mb-6">
                Organize sua equipe e horários com facilidade. 
                Gestão eficiente de homologações.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Gestão de equipe integrada
                </li>
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Controle de horários
                </li>
                <li className="flex items-center text-white/90">
                  <FaCheckCircle className="text-[#bfa15a] mr-3" />
                  Análise de documentos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para modernizar suas homologações?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Junte-se a centenas de empresas e sindicatos que já confiam na Veramo
          </p>
          <button 
            onClick={() => setShowLogin(true)}
            className="bg-[#bfa15a] hover:bg-[#a8904a] text-white px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Começar agora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#23281a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/veramo_logo.png" alt="Veramo" className="h-8 w-auto" />
                <span className="ml-2 text-white font-bold">Veramo</span>
              </div>
              <p className="text-white/70">
                Revolucionando homologações no Brasil com tecnologia e inovação.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <div className="space-y-2">
                <a href="https://wa.me/552134522342" className="flex items-center text-white/70 hover:text-[#bfa15a] transition-colors">
                  <FaWhatsapp className="mr-2" />
                  (21) 3452-2342
                </a>
                <a href="mailto:contato@veramo.com.br" className="flex items-center text-white/70 hover:text-[#bfa15a] transition-colors">
                  <FaEnvelope className="mr-2" />
                  contato@veramo.com.br
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Redes Sociais</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-white/70 hover:text-[#bfa15a] transition-colors">
                  <FaLinkedin className="text-xl" />
                </a>
                <a href="https://instagram.com/veramobrasil" className="text-white/70 hover:text-[#bfa15a] transition-colors">
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/70 hover:text-[#bfa15a] transition-colors">
                  Termos de Uso
                </a>
                <a href="#" className="block text-white/70 hover:text-[#bfa15a] transition-colors">
                  Política de Privacidade
                </a>
                <a href="#" className="block text-white/70 hover:text-[#bfa15a] transition-colors">
                  LGPD
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/50">
              © 2024 Veramo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md animate-fadeIn">
            <div className="text-center mb-6">
              <img src="/veramo_logo.png" alt="Veramo" className="h-12 w-auto mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#23281a]">Seu acesso rápido</h2>
              <p className="text-gray-600">ao ambiente de homologações</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bfa15a] focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <div className="text-red-500 text-xs min-h-[20px]" aria-live="assertive">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#bfa15a] hover:bg-[#a8904a] text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <a href="#" className="text-[#bfa15a] hover:underline text-sm">
                Esqueci minha senha
              </a>
            </div>
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}


    </div>
  );
} 