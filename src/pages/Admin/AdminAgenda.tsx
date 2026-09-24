import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, X, Check } from 'lucide-react';
import { useApp, GiraEvent } from '../../store/AppContext';
import { format } from 'date-fns';

const emptyEvent: Omit<GiraEvent, 'id' | 'createdAt' | 'createdBy'> = {
  title: '',
  date: '',
  time: '',
  type: '',
  description: '',
  orientation: '',
  isPublic: true,
  requiresScheduling: false,
  observations: '',
};

export const AdminAgenda: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GiraEvent | null>(null);
  const [form, setForm] = useState(emptyEvent);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEvent);
    setShowModal(true);
  };

  const openEdit = (ev: GiraEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title, date: ev.date, time: ev.time, type: ev.type,
      description: ev.description, orientation: ev.orientation,
      isPublic: ev.isPublic, requiresScheduling: ev.requiresScheduling,
      observations: ev.observations,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title || !form.date) return;
    if (editing) {
      updateEvent(editing.id, form);
    } else {
      addEvent({ ...form, createdBy: currentUser?.id || '1' });
    }
    setShowModal(false);
  };

  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Agenda / Giras</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{events.length} evento(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} />
          Nova Gira
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <Calendar size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma gira cadastrada</p>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm mt-1">Clique em "Nova Gira" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map(ev => (
            <div key={ev.id} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4 hover:border-[rgba(201,168,76,0.3)] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-cinzel font-bold text-[#f5f0e8] text-base">{ev.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${ev.isPublic ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-[rgba(201,168,76,0.3)] text-[#c9a84c]'}`}>
                      {ev.isPublic ? 'Público' : 'Privado'}
                    </span>
                    {ev.requiresScheduling && (
                      <span className="text-xs px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                        Agendamento
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-inter text-[rgba(245,240,232,0.45)]">
                    <span>📅 {format(new Date(ev.date), "dd/MM/yyyy")}</span>
                    <span>🕐 {ev.time}</span>
                    <span className="text-[#c9a84c] opacity-70">{ev.type}</span>
                  </div>
                  {ev.description && (
                    <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm mt-1 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(ev)} className="p-2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.4)] rounded transition-all">
                    <Edit2 size={14} />
                  </button>
                  {deleteConfirm === ev.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteEvent(ev.id); setDeleteConfirm(null); }} className="p-2 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-all">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(ev.id)} className="p-2 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] hover:border-red-500/30 rounded transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">
                {editing ? 'Editar Gira' : 'Nova Gira'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Título *</label>
                <input className="form-input" placeholder="Ex: Gira de Caboclos" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Data *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Horário</label>
                  <input type="time" className="form-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Tipo de Gira</label>
                <input className="form-input" placeholder="Ex: Gira de Caboclos" value={form.type} onChange={e => setForm({...form, type: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea rows={3} className="form-input resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Orientações</label>
                <textarea rows={2} className="form-input resize-none" value={form.orientation} onChange={e => setForm({...form, orientation: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Observações</label>
                <textarea rows={2} className="form-input resize-none" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})}
                    className="w-4 h-4 accent-[#c9a84c]" />
                  <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Aberto ao Público</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.requiresScheduling} onChange={e => setForm({...form, requiresScheduling: e.target.checked})}
                    className="w-4 h-4 accent-[#c9a84c]" />
                  <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Requer Agendamento</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} className="btn-gold text-xs flex-1 justify-center">
                <Check size={14} />
                {editing ? 'Salvar Alterações' : 'Criar Gira'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
