import React from 'react';
import { Calendar, MessageSquare, Users, Newspaper, Activity, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { events, newsItems, users, contactMessages, activityLogs } = useApp();

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const unreadMessages = contactMessages.filter(m => !m.read).length;
  const activeNews = newsItems.filter(n => n.active).length;
  const totalUsers = users.length;
  const nextGira = upcomingEvents[0];

  const stats = [
    { label: 'Próximas Giras', value: upcomingEvents.length, icon: Calendar, color: 'text-[#c9a84c]', bg: 'bg-[rgba(201,168,76,0.1)]' },
    { label: 'Mensagens Novas', value: unreadMessages, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-[rgba(59,130,246,0.1)]' },
    { label: 'Publicações Ativas', value: activeNews, icon: Newspaper, color: 'text-green-400', bg: 'bg-[rgba(34,197,94,0.1)]' },
    { label: 'Total de Usuários', value: totalUsers, icon: Users, color: 'text-purple-400', bg: 'bg-[rgba(168,85,247,0.1)]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-1">Dashboard</h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
          Visão geral do Centro de Umbanda Zé do Laço
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4 hover:border-[rgba(201,168,76,0.3)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-inter text-[rgba(245,240,232,0.5)] text-xs">{stat.label}</span>
              <div className={`w-8 h-8 rounded ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={14} className={stat.color} />
              </div>
            </div>
            <p className={`font-cinzel font-bold text-2xl ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Next Gira */}
        <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#c9a84c]" />
            <h3 className="font-cinzel font-bold text-[#f5f0e8] text-sm">Próxima Gira</h3>
          </div>
          {nextGira ? (
            <div className="space-y-3">
              <div className="p-4 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.04)]">
                <h4 className="font-cinzel font-bold text-[#c9a84c] text-base mb-1">{nextGira.title}</h4>
                <div className="flex items-center gap-4 text-sm font-inter text-[rgba(245,240,232,0.5)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {format(new Date(nextGira.date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {nextGira.time}
                  </span>
                </div>
                <p className="font-crimson text-[rgba(245,240,232,0.55)] text-sm mt-2 line-clamp-2">{nextGira.description}</p>
              </div>
              {upcomingEvents.slice(1).map(ev => (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-[rgba(201,168,76,0.08)]">
                  <div>
                    <p className="font-inter text-[rgba(245,240,232,0.7)] text-sm">{ev.title}</p>
                    <p className="font-inter text-[rgba(245,240,232,0.35)] text-xs">{format(new Date(ev.date), "dd/MM/yyyy")} — {ev.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${ev.isPublic ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-[rgba(201,168,76,0.3)] text-[#c9a84c] bg-[rgba(201,168,76,0.08)]'}`}>
                    {ev.isPublic ? 'Público' : 'Privado'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">
              Nenhuma gira programada.
            </p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-[#c9a84c]" />
            <h3 className="font-cinzel font-bold text-[#f5f0e8] text-sm">Mensagens Recentes</h3>
            {unreadMessages > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-[rgba(139,26,26,0.3)] border border-[rgba(139,26,26,0.5)] text-[#c9a84c] text-xs font-cinzel rounded">
                {unreadMessages} nova{unreadMessages > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {contactMessages.length === 0 ? (
            <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">
              Nenhuma mensagem recebida.
            </p>
          ) : (
            <div className="space-y-3">
              {contactMessages.slice(0, 5).map(msg => (
                <div key={msg.id} className={`p-3 rounded border ${!msg.read ? 'border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.04)]' : 'border-[rgba(201,168,76,0.08)]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-inter text-[rgba(245,240,232,0.8)] text-sm font-semibold">{msg.name}</p>
                    {!msg.read && <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />}
                  </div>
                  <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm line-clamp-1">{msg.message}</p>
                  <p className="font-inter text-[rgba(245,240,232,0.25)] text-xs mt-1">
                    {format(new Date(msg.receivedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-[#c9a84c]" />
          <h3 className="font-cinzel font-bold text-[#f5f0e8] text-sm">Atividades Recentes</h3>
        </div>
        {activityLogs.length === 0 ? (
          <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-2">
            {activityLogs.slice(0, 8).map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-[rgba(201,168,76,0.06)]">
                <div className="w-6 h-6 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity size={10} className="text-[#c9a84c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[rgba(245,240,232,0.7)] text-sm">
                    <span className="text-[#c9a84c] font-semibold">{log.userName}</span>
                    {' '}—{' '}{log.details}
                  </p>
                  <p className="font-inter text-[rgba(245,240,232,0.25)] text-xs mt-0.5">
                    {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <span className="font-inter text-[rgba(245,240,232,0.3)] text-xs flex-shrink-0">{log.entity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
