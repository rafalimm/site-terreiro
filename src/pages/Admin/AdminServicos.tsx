import React, { useState } from 'react';
import { Save, CreditCard } from 'lucide-react';
import { useApp, ServiceInfo } from '../../store/AppContext';

export const AdminServicos: React.FC = () => {
  const { services, updateService } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ServiceInfo>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const startEdit = (service: ServiceInfo) => {
    setEditingId(service.id);
    setForm({ ...service });
  };

  const handleSave = (id: string) => {
    updateService(id, form);
    setEditingId(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
          <CreditCard size={20} />
          Cartas & Búzios
        </h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">Gerencie as descrições dos serviços</p>
      </div>

      {services.map(service => (
        <div key={service.id} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-base flex items-center gap-2">
              {service.type === 'cards' ? '🃏' : '🐚'}
              {service.title}
            </h3>
            {editingId === service.id ? (
              <div className="flex gap-2">
                <button onClick={() => handleSave(service.id)} className="btn-gold text-xs py-1.5 px-3">
                  <Save size={12} />
                  Salvar
                </button>
                <button onClick={() => setEditingId(null)} className="btn-outline-gold text-xs py-1.5 px-3">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => startEdit(service)} className="btn-outline-gold text-xs py-1.5 px-3">
                Editar
              </button>
            )}
          </div>

          {editingId === service.id ? (
            <div className="space-y-4">
              <div>
                <label className="form-label">Título</label>
                <input className="form-input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea rows={4} className="form-input resize-none" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Como Funciona</label>
                <textarea rows={3} className="form-input resize-none" value={form.howItWorks || ''} onChange={e => setForm({...form, howItWorks: e.target.value})} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Duração Aproximada</label>
                  <input className="form-input" value={form.duration || ''} onChange={e => setForm({...form, duration: e.target.value})} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.requiresScheduling} onChange={e => setForm({...form, requiresScheduling: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                    <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Requer Agendamento</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="form-label">Orientações para o Consulente</label>
                <textarea rows={3} className="form-input resize-none" value={form.orientation || ''} onChange={e => setForm({...form, orientation: e.target.value})} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="font-cinzel text-[rgba(201,168,76,0.6)] text-xs uppercase tracking-wider">Descrição:</span>
                <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base mt-0.5">{service.description}</p>
              </div>
              <div>
                <span className="font-cinzel text-[rgba(201,168,76,0.6)] text-xs uppercase tracking-wider">Como Funciona:</span>
                <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base mt-0.5">{service.howItWorks}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="font-cinzel text-[rgba(201,168,76,0.6)] text-xs uppercase tracking-wider">Duração:</span>
                  <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">{service.duration}</p>
                </div>
                <div>
                  <span className="font-cinzel text-[rgba(201,168,76,0.6)] text-xs uppercase tracking-wider">Agendamento:</span>
                  <p className={`font-crimson text-base ${service.requiresScheduling ? 'text-yellow-400' : 'text-green-400'}`}>
                    {service.requiresScheduling ? 'Necessário' : 'Não necessário'}
                  </p>
                </div>
              </div>
              {saved === service.id && (
                <p className="font-cinzel text-green-400 text-xs">✓ Salvo com sucesso!</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
