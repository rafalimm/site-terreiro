import React, { useState } from 'react';
import { CalendarCheck, Check, X, Trash2, Phone, Clock } from 'lucide-react';
import { useApp, Appointment } from '../../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeLabels: Record<string, string> = {
  cartas: 'Jogo de Cartas',
  buzios: 'Jogo de Búzios',
  consulta: 'Consulta Geral',
};

const statusStyles: Record<Appointment['status'], string> = {
  pendente: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  confirmado: 'text-green-400 border-green-400/40 bg-green-400/10',
  cancelado: 'text-red-400 border-red-400/40 bg-red-400/10',
};

const statusLabels: Record<Appointment['status'], string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

export const AdminAgendamentos: React.FC = () => {
  const { appointments, updateAppointmentStatus, deleteAppointment } = useApp();
  const [filter, setFilter] = useState<'todos' | Appointment['status']>('todos');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = appointments.filter(a => filter === 'todos' || a.status === filter);
  const pendentes = appointments.filter(a => a.status === 'pendente').length;

  const openWhatsApp = (appt: Appointment) => {
    const dataFormatada = format(new Date(appt.preferredDate + 'T00:00:00'), 'dd/MM/yyyy');
    const msg =
      `Olá, ${appt.name}! Recebemos seu pedido de agendamento (${typeLabels[appt.type]}) ` +
      `para ${dataFormatada} às ${appt.preferredTime}. Podemos confirmar esse horário?`;
    const digits = appt.whatsapp.replace(/\D/g, '');
    const number = digits.startsWith('55') ? digits : `55${digits}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
            <CalendarCheck size={20} />
            Agendamentos
          </h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
            {appointments.length} pedido(s) — {pendentes} pendente(s)
          </p>
        </div>
        <select
          className="form-input sm:max-w-[200px]"
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="confirmado">Confirmados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <CalendarCheck size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(appt => (
            <div key={appt.id} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4 hover:border-[rgba(201,168,76,0.3)] transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{appt.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusStyles[appt.status]}`}>
                      {statusLabels[appt.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded border border-[rgba(201,168,76,0.2)] text-[#c9a84c]">
                      {typeLabels[appt.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[rgba(245,240,232,0.4)]" />
                      <span className="font-inter text-[rgba(245,240,232,0.6)] text-xs">
                        {format(new Date(appt.preferredDate + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })} às {appt.preferredTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-[rgba(245,240,232,0.4)]" />
                      <span className="font-inter text-[rgba(245,240,232,0.6)] text-xs">{appt.whatsapp}</span>
                    </div>
                  </div>
                  {appt.notes && (
                    <p className="font-crimson text-[rgba(245,240,232,0.5)] text-sm mt-2 italic">"{appt.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => openWhatsApp(appt)} className="btn-outline-gold text-xs py-1.5 px-3">
                    <Phone size={12} />
                    WhatsApp
                  </button>

                  {appt.status !== 'confirmado' && (
                    <button
                      onClick={() => updateAppointmentStatus(appt.id, 'confirmado')}
                      className="p-1.5 text-green-400 border border-green-500/30 rounded hover:bg-green-500/10"
                      title="Marcar como confirmado"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {appt.status !== 'cancelado' && (
                    <button
                      onClick={() => updateAppointmentStatus(appt.id, 'cancelado')}
                      className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10"
                      title="Marcar como cancelado"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {deleteConfirm === appt.id ? (
                    <>
                      <button onClick={() => { deleteAppointment(appt.id); setDeleteConfirm(null); }} className="p-1.5 text-red-400 border border-red-500/30 rounded">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirm(appt.id)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
