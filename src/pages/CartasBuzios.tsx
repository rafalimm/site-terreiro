import React from 'react';
import { Phone, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const CartasBuzios: React.FC = () => {
  const { services, siteConfig } = useApp();

  const cards = services.find(s => s.type === 'cards');
  const buzios = services.find(s => s.type === 'buzios');

  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const ServiceCard = ({ service, icon, waMsg }: { service: any; icon: string; waMsg: string }) => (
    <div className="card-spiritual p-8 md:p-10">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="font-cinzel font-bold text-[#c9a84c] text-2xl mb-2">{service.title}</h2>
      <div className="h-px bg-[rgba(201,168,76,0.3)] w-16 mb-6" />
      <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed mb-6">
        {service.description}
      </p>

      <div className="space-y-4 mb-8">
        <div className="p-4 border border-[rgba(201,168,76,0.1)] rounded bg-[rgba(201,168,76,0.03)]">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-2">Como Funciona</p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">
            {service.howItWorks}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 p-3 border border-[rgba(201,168,76,0.1)] rounded flex-1 min-w-[150px]">
            <Clock size={14} className="text-[#c9a84c]" />
            <div>
              <p className="font-cinzel text-[#c9a84c] text-xs tracking-wider">Duração</p>
              <p className="font-crimson text-[rgba(245,240,232,0.65)] text-sm">{service.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 border border-[rgba(201,168,76,0.1)] rounded flex-1 min-w-[150px]">
            <Calendar size={14} className="text-[#c9a84c]" />
            <div>
              <p className="font-cinzel text-[#c9a84c] text-xs tracking-wider">Agendamento</p>
              <p className="font-crimson text-[rgba(245,240,232,0.65)] text-sm">
                {service.requiresScheduling ? 'Necessário' : 'Não necessário'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border border-[rgba(201,168,76,0.1)] rounded bg-[rgba(201,168,76,0.03)]">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-2">🙏 Orientações</p>
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">
            {service.orientation}
          </p>
        </div>
      </div>

      <button
        onClick={() => openWhatsApp(waMsg)}
        className="btn-wine w-full justify-center"
      >
        <Phone size={16} />
        Solicitar Informações
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(/images/cards-bg.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,5,5,0.6)] to-[#0d0505]" />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Atendimentos</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Cartas & Búzios
          </h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Orientação espiritual profunda e respeitosa
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* Intro */}
        <div className="card-spiritual p-8 mb-10 text-center">
          <p className="font-crimson text-[rgba(245,240,232,0.75)] text-xl leading-relaxed italic">
            "O Centro de Umbanda Zé do Laço oferece atendimentos espirituais através do Jogo de Cartas
            e do Jogo de Búzios — práticas ancestrais realizadas com respeito, seriedade e fé pelas
            entidades de nossa casa."
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.05)] mb-10">
          <AlertCircle size={18} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">
            Todos os atendimentos são realizados mediante agendamento prévio pelo WhatsApp.
            Nossas consultas são realizadas com responsabilidade espiritual e respeito à tradição da Umbanda.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cards && (
            <ServiceCard
              service={cards}
              icon="🃏"
              waMsg="Olá! Gostaria de obter informações sobre o jogo de cartas."
            />
          )}
          {buzios && (
            <ServiceCard
              service={buzios}
              icon="🐚"
              waMsg="Olá! Gostaria de obter informações sobre o jogo de búzios."
            />
          )}
        </div>

        {/* Preparation */}
        <div className="card-spiritual p-8">
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Como se Preparar para sua Consulta
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '💧', text: 'Venha bem hidratado(a) e descansado(a)' },
              { icon: '🧘', text: 'Mantenha a mente calma e aberta' },
              { icon: '🚫', text: 'Evite álcool nas horas anteriores' },
              { icon: '💭', text: 'Pense nas questões que deseja abordar' },
              { icon: '👕', text: 'Vista roupas confortáveis' },
              { icon: '⏰', text: 'Seja pontual para o agendamento' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-[rgba(201,168,76,0.1)] rounded">
                <span className="text-xl">{item.icon}</span>
                <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => openWhatsApp('Olá! Gostaria de agendar uma consulta no Centro de Umbanda Zé do Laço.')}
              className="btn-gold"
            >
              <Phone size={16} />
              Agendar Consulta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
