import React from 'react';
import { Star, Phone } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const LinhasEntidades: React.FC = () => {
  const { entities, siteConfig } = useApp();
  const activeEntities = entities.filter(e => e.active);

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Espiritualidade</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Linhas & Entidades
          </h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Conheça as entidades que trabalham em nossa casa
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* Respect notice */}
        <div className="card-spiritual p-6 mb-10 text-center">
          <Star size={24} className="text-[#c9a84c] mx-auto mb-3" />
          <p className="font-crimson text-[rgba(245,240,232,0.7)] text-lg italic leading-relaxed">
            "As informações sobre as entidades e linhas trabalhadas em nosso Centro são compartilhadas
            com profundo respeito à tradição da Umbanda e à orientação de nossa liderança espiritual."
          </p>
        </div>

        {activeEntities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="font-cinzel text-[#c9a84c] text-xl mb-3">Conteúdo em Desenvolvimento</h3>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-lg italic mb-6 max-w-2xl mx-auto">
              As informações sobre as linhas e entidades que trabalham em nossa casa serão publicadas
              pela administração do Centro de Umbanda Zé do Laço. Este conteúdo é gerenciado com
              muito respeito e responsabilidade espiritual.
            </p>
            <button
              onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre as entidades e linhas do Centro de Umbanda Zé do Laço.')}`, '_blank')}
              className="btn-wine"
            >
              <Phone size={16} />
              Perguntar pelo WhatsApp
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEntities.map(entity => (
              <div key={entity.id} className="card-spiritual p-6">
                {entity.image && (
                  <img src={entity.image} alt={entity.name} className="w-20 h-20 object-cover rounded-full border-2 border-[rgba(201,168,76,0.3)] mx-auto mb-4" />
                )}
                <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg text-center mb-1">{entity.name}</h3>
                <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs text-center tracking-wider uppercase mb-3">{entity.line}</p>
                {entity.description && (
                  <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed mb-3">{entity.description}</p>
                )}
                {entity.characteristics && (
                  <div className="border-t border-[rgba(201,168,76,0.1)] pt-3">
                    <p className="font-cinzel text-[rgba(201,168,76,0.6)] text-xs uppercase mb-1">Características</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.5)] text-sm">{entity.characteristics}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
