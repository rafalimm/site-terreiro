import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Star, Heart } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const Footer: React.FC = () => {
  const { siteConfig } = useApp();

  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <footer className="relative bg-[#080303] border-t border-[rgba(201,168,76,0.15)]">
      {/* Top gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#c9a84c] flex items-center justify-center bg-[rgba(201,168,76,0.1)]">
                <Star size={18} className="text-[#c9a84c]" fill="currentColor" />
              </div>
              <div>
                <div className="font-cinzel font-bold text-[#c9a84c] text-sm tracking-wider">
                  CENTRO DE UMBANDA
                </div>
                <div className="font-cinzel font-black text-white text-lg tracking-widest">
                  ZÉ DO LAÇO
                </div>
              </div>
            </div>
            <p className="font-crimson text-[rgba(245,240,232,0.6)] text-base italic mb-4">
              Terreiro • Templo • Jogo de Cartas e Búzios
            </p>
            <p className="font-inter text-[rgba(245,240,232,0.5)] text-sm leading-relaxed mb-6">
              Um espaço sagrado de fé, caridade e acolhimento espiritual.
              Todos são bem-vindos, inclusive a comunidade LGBTQIA+.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div className="star-rating text-base">★★★★★</div>
              <span className="font-inter text-[rgba(245,240,232,0.5)] text-sm">5,0 — 27 avaliações</span>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-sm tracking-widest uppercase mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Início' },
                { to: '/sobre', label: 'Sobre Nós' },
                { to: '/agenda', label: 'Agenda Espiritual' },
                { to: '/cartas-buzios', label: 'Cartas & Búzios' },
                { to: '/duvidas', label: 'Tire suas Dúvidas' },
                { to: '/galeria', label: 'Galeria' },
                { to: '/noticias', label: 'Notícias & Avisos' },
                { to: '/contato', label: 'Fale Conosco' },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="font-inter text-[rgba(245,240,232,0.55)] hover:text-[#c9a84c] text-sm transition-colors duration-200 flex items-center gap-1"
                  >
                    <span className="text-[#c9a84c] opacity-60">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-sm tracking-widest uppercase mb-4">
              Contato
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#c9a84c] mt-1 flex-shrink-0" />
                <p className="font-inter text-[rgba(245,240,232,0.55)] text-sm leading-relaxed">
                  Av. Santo Amaro, 5914 - Subsolo<br />
                  Santo Amaro — São Paulo/SP<br />
                  CEP 04702-001
                </p>
              </div>
              <button
                onClick={() => openWhatsApp('Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de obter mais informações.')}
                className="flex items-center gap-3 text-[rgba(245,240,232,0.55)] hover:text-[#c9a84c] transition-colors text-sm font-inter"
              >
                <Phone size={16} className="text-[#c9a84c] flex-shrink-0" />
                (11) 94008-7119
              </button>
              <a
                href="https://www.instagram.com/centrodeumbandazedolaco/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[rgba(245,240,232,0.55)] hover:text-[#c9a84c] transition-colors text-sm font-inter"
              >
                <span className="text-[#c9a84c] text-base">📸</span>
                @centrodeumbandazedolaco
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.2)] to-transparent" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-inter text-[rgba(245,240,232,0.35)] text-xs text-center">
            © Centro de Umbanda Zé do Laço — Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacidade"
              className="font-inter text-[rgba(245,240,232,0.35)] hover:text-[#c9a84c] text-xs transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-[rgba(201,168,76,0.2)]">|</span>
            <Link
              to="/termos"
              className="font-inter text-[rgba(245,240,232,0.35)] hover:text-[#c9a84c] text-xs transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
          <p className="font-inter text-[rgba(245,240,232,0.25)] text-xs flex items-center gap-1">
            Feito com <Heart size={10} className="text-[#8b1a1a]" fill="currentColor" /> para a espiritualidade
          </p>
        </div>
      </div>
    </footer>
  );
};
