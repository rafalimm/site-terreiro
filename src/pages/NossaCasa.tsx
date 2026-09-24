import React from 'react';
import { MapPin, Phone, Star, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const NossaCasa: React.FC = () => {
  const { siteConfig } = useApp();

  const openWhatsApp = () => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de mais informações.')}`, '_blank');
  };

  const openInstagram = () => {
    window.open('https://www.instagram.com/centrodeumbandazedolaco/', '_blank');
  };

  const openMap = () => {
    window.open(siteConfig.mapUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Venha nos Visitar</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Nossa Casa</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Localização, contato e informações para sua visita
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24 space-y-10">
        {/* Address Card */}
        <div className="card-spiritual p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
                <MapPin size={20} />
                Endereço
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="font-cinzel text-[#f5f0e8] text-sm font-bold tracking-wider mb-1">Centro de Umbanda Zé do Laço</p>
                  <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed">
                    Av. Santo Amaro, 5914 - Subsolo<br />
                    Santo Amaro — São Paulo/SP<br />
                    CEP 04702-001
                  </p>
                </div>
                <button
                  onClick={openMap}
                  className="btn-gold text-xs mt-2"
                >
                  <MapPin size={14} />
                  Abrir no Mapa
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
                <Phone size={20} />
                Contatos
              </h2>
              <div className="space-y-4">
                <div className="border border-[rgba(201,168,76,0.15)] rounded p-4 hover:border-[rgba(201,168,76,0.35)] transition-all">
                  <p className="font-cinzel text-[#f5f0e8] text-xs font-bold tracking-wider uppercase mb-1">WhatsApp</p>
                  <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg">(11) 94008-7119</p>
                  <button onClick={openWhatsApp} className="btn-wine text-xs mt-2">
                    Falar no WhatsApp
                  </button>
                </div>
                <div className="border border-[rgba(201,168,76,0.15)] rounded p-4 hover:border-[rgba(201,168,76,0.35)] transition-all">
                  <p className="font-cinzel text-[#f5f0e8] text-xs font-bold tracking-wider uppercase mb-1">Instagram</p>
                  <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg">@centrodeumbandazedolaco</p>
                  <button onClick={openInstagram} className="btn-outline-gold text-xs mt-2">
                    Seguir no Instagram
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="card-spiritual overflow-hidden">
          <div className="h-80 md:h-96">
            <iframe
              title="Localização"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3654.0!2d-46.7!3d-23.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a7a0a5f5a1b%3A0x1234567890abcdef!2sAv.+Santo+Amaro%2C+5914+Santo+Amaro%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.4) sepia(0.4) hue-rotate(330deg)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="p-4 bg-[rgba(201,168,76,0.05)] border-t border-[rgba(201,168,76,0.1)]">
            <button onClick={openMap} className="w-full font-cinzel text-[#c9a84c] text-sm tracking-wider hover:text-[#e8c97a] transition-colors">
              📍 Abrir no Google Maps
            </button>
          </div>
        </div>

        {/* Hours */}
        <div className="card-spiritual p-8">
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
            <Clock size={20} />
            Horários
          </h2>
          <div className="border border-[rgba(201,168,76,0.15)] rounded p-6 bg-[rgba(201,168,76,0.03)]">
            <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">ℹ️ Informação</p>
            <p className="font-crimson text-[rgba(245,240,232,0.65)] text-lg italic">{siteConfig.workingHours}</p>
          </div>
          <div className="mt-4 text-center">
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-base mb-4">
              Consulte nossa agenda para os dias e horários das próximas giras.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/agenda" className="btn-gold text-xs">Ver Agenda</a>
              <button onClick={openWhatsApp} className="btn-wine text-xs">Confirmar pelo WhatsApp</button>
            </div>
          </div>
        </div>

        {/* Orientations */}
        <div className="card-spiritual p-8">
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
            <Star size={20} />
            Orientações para sua Primeira Visita
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '👕', text: 'Venha de roupas brancas ou claras' },
              { icon: '👟', text: 'Use calçados fáceis de tirar' },
              { icon: '🚫', text: 'Evite bebidas alcoólicas no dia' },
              { icon: '⏰', text: 'Chegue com antecedência' },
              { icon: '🤫', text: 'Mantenha o respeito ao espaço sagrado' },
              { icon: '📱', text: 'Consulte a agenda ou entre em contato antes' },
              { icon: '❤️', text: 'Venha com a mente e o coração abertos' },
              { icon: '👥', text: 'Você pode trazer companhia' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-[rgba(201,168,76,0.1)] rounded hover:border-[rgba(201,168,76,0.3)] transition-all">
                <span className="text-xl">{item.icon}</span>
                <p className="font-crimson text-[rgba(245,240,232,0.7)] text-base">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
