import React, { useState } from 'react';
import { Trash2, X, Check, Mail, MailOpen, Phone } from 'lucide-react';
import { useApp, ContactMessage } from '../../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminMensagens: React.FC = () => {
  const { contactMessages, markMessageRead, deleteMessage } = useApp();
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSelect = (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const unread = contactMessages.filter(m => !m.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Mensagens de Contato</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
            {contactMessages.length} mensagem(ns) — {unread} não lida(s)
          </p>
        </div>
      </div>

      {contactMessages.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <Mail size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma mensagem recebida</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-2">
            {contactMessages.map(msg => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`cursor-pointer bg-[#1a0a0a] border rounded p-4 transition-all ${
                  selected?.id === msg.id
                    ? 'border-[#c9a84c] bg-[rgba(201,168,76,0.05)]'
                    : msg.read
                    ? 'border-[rgba(201,168,76,0.08)] hover:border-[rgba(201,168,76,0.25)]'
                    : 'border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.03)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {msg.read ? <MailOpen size={14} className="text-[rgba(245,240,232,0.3)]" /> : <Mail size={14} className="text-[#c9a84c]" />}
                      <p className="font-cinzel font-semibold text-[#f5f0e8] text-sm truncate">{msg.name}</p>
                      {!msg.read && <div className="w-2 h-2 rounded-full bg-[#c9a84c] flex-shrink-0" />}
                    </div>
                    {msg.subject && <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs mt-0.5">{msg.subject}</p>}
                    <p className="font-crimson text-[rgba(245,240,232,0.4)] text-sm line-clamp-1 mt-1">{msg.message}</p>
                    <p className="font-inter text-[rgba(245,240,232,0.2)] text-xs mt-1">
                      {format(new Date(msg.receivedAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {deleteConfirm === msg.id ? (
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); deleteMessage(msg.id); setDeleteConfirm(null); if (selected?.id === msg.id) setSelected(null); }} className="p-1 text-red-400 border border-red-500/30 rounded">
                          <Check size={10} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm(null); }} className="p-1 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm(msg.id); }} className="p-1 text-[rgba(245,240,232,0.3)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded">
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
            {selected ? (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-cinzel font-bold text-[#f5f0e8] text-lg">{selected.name}</h3>
                    {selected.subject && (
                      <p className="font-cinzel text-[#c9a84c] text-sm">{selected.subject}</p>
                    )}
                    <p className="font-inter text-[rgba(245,240,232,0.3)] text-xs mt-1">
                      {format(new Date(selected.receivedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {selected.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#c9a84c]" />
                      <span className="font-inter text-[rgba(245,240,232,0.6)] text-sm">{selected.whatsapp}</span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#c9a84c]" />
                      <span className="font-inter text-[rgba(245,240,232,0.6)] text-sm">{selected.email}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(201,168,76,0.08)] rounded">
                  <p className="font-crimson text-[rgba(245,240,232,0.75)] text-base leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>
                {selected.whatsapp && (
                  <div className="mt-4">
                    <button
                      onClick={() => window.open(`https://wa.me/55${selected.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${selected.name}! Recebemos sua mensagem pelo site do Centro de Umbanda Zé do Laço. Estamos entrando em contato para responder sua dúvida.`)}`, '_blank')}
                      className="btn-wine text-xs"
                    >
                      <Phone size={14} />
                      Responder por WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <MailOpen size={40} className="text-[rgba(201,168,76,0.2)] mb-3" />
                <p className="font-cinzel text-[rgba(245,240,232,0.3)] text-sm">
                  Selecione uma mensagem para visualizar
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
