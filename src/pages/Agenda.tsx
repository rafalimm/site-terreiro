import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { format, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventCard: React.FC<{ event: any; whatsapp: string }> = ({ event, whatsapp }) => {
  const [expanded, setExpanded] = useState(false);
  const eventDate = new Date(event.date);
  const isUpcoming = isFuture(eventDate) || format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const openWhatsApp = () => {
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais informações sobre a próxima gira.')}`, '_blank');
  };

  return (
    <div className={`card-spiritual overflow-hidden transition-all ${isPast(eventDate) ? 'opacity-60' : ''}`}>
      {/* Color strip */}
      <div className={`h-1 ${isUpcoming ? 'bg-gradient-to-r from-[#8b1a1a] via-[#c9a84c] to-[#8b1a1a]' : 'bg-[rgba(201,168,76,0.2)]'}`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isUpcoming && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-[#c9a84c] text-xs font-cinzel rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                  Próxima
                </span>
              )}
              <span className="px-2 py-0.5 bg-[rgba(139,26,26,0.3)] border border-[rgba(139,26,26,0.4)] text-[rgba(245,240,232,0.7)] text-xs font-inter rounded">
                {event.type}
              </span>
              {event.isPublic && (
                <span className="px-2 py-0.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-green-400 text-xs font-inter rounded">
                  Aberta ao Público
                </span>
              )}
              {event.requiresScheduling && (
                <span className="px-2 py-0.5 bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] text-yellow-400 text-xs font-inter rounded">
                  Requer Agendamento
                </span>
              )}
            </div>
            <h3 className="font-cinzel font-bold text-white text-lg md:text-xl">{event.title}</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#c9a84c]" />
            <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">
              {format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#c9a84c]" />
            <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#c9a84c]" />
            <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Centro de Umbanda Zé do Laço</span>
          </div>
        </div>

        <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed mb-4">
          {event.description}
        </p>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-[rgba(201,168,76,0.1)] pt-4 mt-4 space-y-4 animate-fadeInUp">
            {event.orientation && (
              <div className="p-4 bg-[rgba(201,168,76,0.04)] border border-[rgba(201,168,76,0.1)] rounded">
                <p className="font-cinzel text-[#c9a84c] text-xs tracking-wider uppercase mb-2">🙏 Orientações</p>
                <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">{event.orientation}</p>
              </div>
            )}
            {event.observations && (
              <div className="p-4 bg-[rgba(139,26,26,0.08)] border border-[rgba(139,26,26,0.2)] rounded">
                <p className="font-cinzel text-[#c9a84c] text-xs tracking-wider uppercase mb-2">📌 Observações</p>
                <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">{event.observations}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-outline-gold text-xs py-2 px-4 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Menos Detalhes' : 'Ver Detalhes'}
          </button>
          {isUpcoming && (
            <button
              onClick={openWhatsApp}
              className="btn-wine text-xs py-2 px-4 flex items-center gap-2"
            >
              <Phone size={14} />
              Informações
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Agenda: React.FC = () => {
  const { events, siteConfig } = useApp();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const filteredEvents = events
    .filter(e => {
      if (filter === 'upcoming') return !isPast(new Date(e.date)) || format(new Date(e.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (filter === 'past') return isPast(new Date(e.date));
      return true;
    })
    .sort((a, b) => {
      if (filter === 'past') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Programação</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Agenda Espiritual
          </h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Giras, eventos e atividades da nossa casa
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Filters */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {[
            { key: 'upcoming', label: 'Próximas Giras' },
            { key: 'all', label: 'Todas' },
            { key: 'past', label: 'Anteriores' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded font-cinzel text-xs tracking-wider uppercase border transition-all ${
                filter === f.key
                  ? 'bg-[rgba(201,168,76,0.2)] border-[#c9a84c] text-[#c9a84c]'
                  : 'border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,168,76,0.4)] hover:text-[#c9a84c]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events list */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🕯️</div>
            <h3 className="font-cinzel text-[#c9a84c] text-xl mb-2">
              {filter === 'upcoming' ? 'Nenhuma gira programada' : 'Nenhum evento encontrado'}
            </h3>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-lg mb-6">
              Acompanhe nossas redes sociais para novidades!
            </p>
            <button
              onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber sobre as próximas giras.')}`, '_blank')}
              className="btn-wine"
            >
              <Phone size={16} />
              Consultar pelo WhatsApp
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} whatsapp={siteConfig.whatsapp} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 p-8 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.03)] text-center">
          <Users size={24} className="text-[#c9a84c] mx-auto mb-3" />
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg mb-2">Quer Participar?</h3>
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-lg mb-4 italic">
            Entre em contato pelo WhatsApp para mais informações sobre como participar das nossas giras.
          </p>
          <button
            onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais informações sobre a próxima gira.')}`, '_blank')}
            className="btn-wine"
          >
            <Phone size={16} />
            Falar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
