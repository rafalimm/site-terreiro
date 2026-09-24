import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const Sobre: React.FC = () => {
  const { siteConfig } = useApp();
  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Conheça</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Sobre Nós</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Nossa história, nossa missão, nossos valores
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Main About */}
        <div className="card-spiritual p-8 md:p-12 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Star size={20} className="text-[#c9a84c]" fill="currentColor" />
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Quem Somos</h2>
          </div>
          <p className="font-crimson text-[rgba(245,240,232,0.8)] text-lg leading-relaxed mb-4">
            {siteConfig.aboutText}
          </p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed mb-4">
            Localizado no coração de Santo Amaro, em São Paulo, o Centro de Umbanda Zé do Laço é um espaço dedicado
            à prática da Umbanda com seriedade, respeito e tradição.
          </p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">
            Nosso terreiro é um lugar de caridade, onde cada pessoa que chega é recebida com amor e sem julgamentos,
            independentemente de sua crenças, origem, identidade de gênero ou orientação sexual.
            A comunidade LGBTQIA+ é especialmente acolhida em nossa casa.
          </p>
        </div>

        {/* History - Placeholder */}
        <div className="card-spiritual p-8 md:p-12 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📜</span>
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Nossa História</h2>
          </div>
          <div className="border border-[rgba(201,168,76,0.2)] rounded p-6 bg-[rgba(201,168,76,0.03)]">
            <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">⚙️ Conteúdo em Edição</p>
            <p className="font-crimson text-[rgba(245,240,232,0.6)] text-lg leading-relaxed italic">
              {siteConfig.aboutHistory}
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="card-spiritual p-8 md:p-12 mb-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">💎</span>
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Nossos Pilares</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '🙏', title: 'Fé', desc: 'A crença inabalável na força das entidades e na proteção divina.' },
              { icon: '❤️', title: 'Caridade', desc: 'O trabalho espiritual realizado com amor e sem fins lucrativos pessoais.' },
              { icon: '🏡', title: 'Acolhimento', desc: 'Nossa casa recebe todos com respeito, inclusão e amor incondicional.' },
              { icon: '🌿', title: 'Tradição', desc: 'Preservamos as tradições da Umbanda com seriedade e responsabilidade.' },
            ].map((v, i) => (
              <div key={i} className="flex gap-4 p-4 border border-[rgba(201,168,76,0.1)] rounded hover:border-[rgba(201,168,76,0.3)] transition-all">
                <div className="text-3xl">{v.icon}</div>
                <div>
                  <h3 className="font-cinzel font-bold text-[#f5f0e8] text-sm mb-1">{v.title}</h3>
                  <p className="font-crimson text-[rgba(245,240,232,0.55)] text-base">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What is Umbanda */}
        <div className="card-spiritual p-8 md:p-12 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🌟</span>
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">O Que é a Umbanda?</h2>
          </div>
          <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed mb-4">
            A Umbanda é uma religião brasileira que une elementos do catolicismo, espiritismo kardecista,
            candomblé e tradições indígenas. Surgiu no Brasil no início do século XX e é uma das expressões
            mais autênticas da espiritualidade brasileira.
          </p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed mb-4">
            Na Umbanda, acredita-se na existência de entidades espirituais — Caboclos, Pretos Velhos, Exus,
            Pombagiras, Crianças (Erês) e outras — que se manifestam através de médiuns durante as giras
            para prestar orientação, cura e auxílio aos consulentes.
          </p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">
            A palavra de ordem da Umbanda é caridade. Todos os trabalhos são realizados com o propósito
            de ajudar o próximo, sem distinção de raça, religião, gênero ou condição social.
          </p>
          <div className="mt-6">
            <Link to="/duvidas" className="btn-outline-gold text-xs">
              Ver Dúvidas Frequentes
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/agenda" className="btn-gold">
              Ver Agenda de Giras
            </Link>
            <button
              onClick={() => openWhatsApp('Olá! Vim pelo site e gostaria de conhecer melhor o Centro de Umbanda Zé do Laço.')}
              className="btn-wine"
            >
              <Phone size={16} />
              Entrar em Contato
            </button>
            <Link to="/nossa-casa" className="btn-outline-gold">
              <MapPin size={16} />
              Como Chegar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
