import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/sobre', label: 'Sobre Nós' },
  { to: '/nossa-casa', label: 'Nossa Casa' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/cartas-buzios', label: 'Cartas & Búzios' },
  { to: '/duvidas', label: 'Dúvidas' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/noticias', label: 'Notícias' },
  { to: '/contato', label: 'Contato' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, siteConfig } = useApp();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const openWhatsApp = () => {
    const message = 'Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de obter mais informações.';
    const phone = (siteConfig.whatsapp || '5511940087119').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-2 bg-[#0d0505]/95 backdrop-blur-md shadow-2xl border-b border-[rgba(201,168,76,0.15)]'
            : 'py-4 bg-gradient-to-b from-[rgba(13,5,5,0.9)] to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] flex items-center justify-center bg-[rgba(201,168,76,0.1)]">
                <Star size={16} className="text-[#c9a84c] animate-candle" fill="currentColor" />
              </div>
              <div className="absolute inset-0 rounded-full bg-[rgba(201,168,76,0.1)] animate-glow" />
            </div>
            <div>
              <div
                className="font-cinzel font-bold text-[#c9a84c] leading-tight tracking-wider"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}
              >
                CENTRO DE UMBANDA
              </div>
              <div
                className="font-cinzel font-black text-white leading-tight tracking-widest"
                style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)' }}
              >
                ZÉ DO LAÇO
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link px-3 py-2 ${
                  location.pathname === link.to ? 'text-[#c9a84c]' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={openWhatsApp}
              className="hidden md:inline-flex btn-wine text-xs py-2 px-4"
            >
              Fale Conosco
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded border border-[rgba(201,168,76,0.3)] hover:border-[#c9a84c] transition-all bg-[rgba(201,168,76,0.05)]"
                >
                  <User size={16} className="text-[#c9a84c]" />
                  <span className="text-sm font-inter text-[#f5f0e8] hidden md:block max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a0a0a] border border-[rgba(201,168,76,0.2)] rounded shadow-2xl">
                    {(currentUser.role === 'super_admin' || currentUser.role === 'admin' ||
                      currentUser.role === 'agenda' || currentUser.role === 'content' ||
                      currentUser.role === 'atendimento') && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 text-sm font-inter text-[#f5f0e8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] border-b border-[rgba(201,168,76,0.1)] transition-all"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Painel Administrativo
                      </Link>
                    )}
                    <Link
                      to="/minha-conta"
                      className="block px-4 py-3 text-sm font-inter text-[#f5f0e8] hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.08)] border-b border-[rgba(201,168,76,0.1)] transition-all"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Minha Conta
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-inter text-red-400 hover:text-red-300 hover:bg-[rgba(139,26,26,0.1)] transition-all"
                    >
                      <LogOut size={14} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/entrar"
                className="btn-outline-gold text-xs py-2 px-4"
              >
                Entrar
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 text-[#c9a84c]"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="xl:hidden mt-2 mx-4 rounded-lg bg-[#1a0a0a]/98 border border-[rgba(201,168,76,0.2)] backdrop-blur-md overflow-hidden">
            <div className="py-4 px-6 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block py-3 nav-link border-b border-[rgba(201,168,76,0.08)] ${
                    location.pathname === link.to ? 'text-[#c9a84c]' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <button onClick={openWhatsApp} className="btn-wine text-center justify-center">
                  Fale Conosco
                </button>
                {!currentUser && (
                  <Link to="/entrar" className="btn-outline-gold text-center justify-center">
                    Entrar
                  </Link>
                )}
                {currentUser && (
                  <button onClick={handleLogout} className="btn-wine text-center justify-center">
                    <LogOut size={14} />
                    Sair
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
};
