import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, Calendar, Newspaper, Phone, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MinhaConta: React.FC = () => {
  const { currentUser, events, newsItems, siteConfig, authReady } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0d0505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[rgba(201,168,76,0.3)] border-t-[#c9a84c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/entrar" replace />;

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && e.isPublic)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const latestNews = newsItems.filter(n => n.active).slice(0, 3);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    agenda: 'Resp. Agenda',
    content: 'Resp. Conteúdo',
    atendimento: 'Atendimento',
    consulente: 'Consulente',
  };

  return (
    <div className="min-h-screen bg-[#0d0505] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile */}
        <div className="card-spiritual p-8 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-20 h-20 rounded-full border-2 border-[#c9a84c] bg-[rgba(201,168,76,0.1)] flex items-center justify-center flex-shrink-0">
              <User size={32} className="text-[#c9a84c]" />
            </div>
            <div className="flex-1">
              <h2 className="font-cinzel font-bold text-white text-2xl">{currentUser.name}</h2>
              <p className="font-inter text-[rgba(245,240,232,0.5)] text-sm">{currentUser.email}</p>
              {currentUser.whatsapp && <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{currentUser.whatsapp}</p>}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-[#c9a84c] text-xs font-cinzel rounded">
                  {roleLabels[currentUser.role]}
                </span>
                <span className="px-2 py-0.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-green-400 text-xs font-inter rounded">
                  ✓ Conta Ativa
                </span>
              </div>
            </div>
            {(currentUser.role !== 'consulente') && (
              <Link to="/admin" className="btn-gold text-xs">
                Painel Admin
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="card-spiritual p-6">
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
              <Calendar size={16} />
              Próximas Giras
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">Nenhuma gira programada no momento.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="p-3 border border-[rgba(201,168,76,0.1)] rounded">
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{ev.title}</p>
                    <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs mt-0.5">
                      {format(new Date(ev.date), "dd 'de' MMMM", { locale: ptBR })} às {ev.time}
                    </p>
                  </div>
                ))}
                <Link to="/agenda" className="block text-center font-cinzel text-[#c9a84c] text-xs hover:text-[#e8c97a] transition-colors pt-2">
                  Ver agenda completa →
                </Link>
              </div>
            )}
          </div>

          {/* Latest News */}
          <div className="card-spiritual p-6">
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
              <Newspaper size={16} />
              Últimas Notícias
            </h3>
            {latestNews.length === 0 ? (
              <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">Nenhuma notícia publicada.</p>
            ) : (
              <div className="space-y-3">
                {latestNews.map(news => (
                  <div key={news.id} className="p-3 border border-[rgba(201,168,76,0.1)] rounded">
                    <span className="text-xs text-[#c9a84c] font-cinzel">{news.category}</span>
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm mt-0.5">{news.title}</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.4)] text-xs line-clamp-2 mt-0.5">{news.content}</p>
                  </div>
                ))}
                <Link to="/noticias" className="block text-center font-cinzel text-[#c9a84c] text-xs hover:text-[#e8c97a] transition-colors pt-2">
                  Ver todas as notícias →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="card-spiritual p-6 mt-6">
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
            <Star size={16} />
            Acesso Rápido
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/agenda" className="btn-outline-gold text-xs justify-center">
              <Calendar size={14} />
              Agenda
            </Link>
            <button
              onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de agendar uma consulta.')}`, '_blank')}
              className="btn-wine text-xs"
            >
              <Phone size={14} />
              Agendar Consulta
            </button>
            <Link to="/duvidas" className="btn-outline-gold text-xs justify-center">
              Tire Dúvidas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
