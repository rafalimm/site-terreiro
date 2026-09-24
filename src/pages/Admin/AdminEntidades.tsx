import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Star, Eye, EyeOff } from 'lucide-react';
import { useApp, Entity } from '../../store/AppContext';

const emptyEntity: Omit<Entity, 'id'> = {
  name: '',
  line: '',
  description: '',
  image: '',
  history: '',
  characteristics: '',
  additionalInfo: '',
  active: true,
};

export const AdminEntidades: React.FC = () => {
  const { entities, addEntity, updateEntity, deleteEntity } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState(emptyEntity);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(emptyEntity); setShowModal(true); };
  const openEdit = (e: Entity) => { setEditing(e); setForm({ name: e.name, line: e.line, description: e.description, image: e.image || '', history: e.history, characteristics: e.characteristics, additionalInfo: e.additionalInfo, active: e.active }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) updateEntity(editing.id, form);
    else addEntity(form);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
            <Star size={18} />
            Linhas & Entidades
          </h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{entities.length} entidade(s)</p>
        </div>
        <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} />
          Nova Entidade
        </button>
      </div>

      <div className="p-4 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded">
        <p className="font-inter text-[rgba(245,240,232,0.5)] text-sm">
          ⚠️ <strong className="text-[#c9a84c]">Atenção:</strong> Esta área deve ser gerenciada com extremo respeito à tradição da Umbanda. 
          Adicione apenas informações autorizadas e verificadas pela liderança do terreiro.
        </p>
      </div>

      {entities.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <Star size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma entidade cadastrada</p>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm mt-1">Adicione com respeito e responsabilidade</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entities.map(entity => (
            <div key={entity.id} className={`bg-[#1a0a0a] border rounded p-4 transition-all ${entity.active ? 'border-[rgba(201,168,76,0.15)] hover:border-[rgba(201,168,76,0.35)]' : 'border-[rgba(255,255,255,0.05)] opacity-60'}`}>
              <div className="flex items-start gap-3">
                {entity.image && (
                  <img src={entity.image} alt={entity.name} className="w-12 h-12 object-cover rounded-full border border-[rgba(201,168,76,0.3)] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{entity.name}</p>
                  <p className="font-inter text-[#c9a84c] text-xs">{entity.line}</p>
                  <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm line-clamp-2 mt-1">{entity.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateEntity(entity.id, { active: !entity.active })} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded">
                    {entity.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button onClick={() => openEdit(entity)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded">
                    <Edit2 size={12} />
                  </button>
                  {deleteConfirm === entity.id ? (
                    <>
                      <button onClick={() => { deleteEntity(entity.id); setDeleteConfirm(null); }} className="p-1.5 text-red-400 border border-red-500/30 rounded">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirm(entity.id)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">
                {editing ? 'Editar Entidade' : 'Nova Entidade'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Linha</label>
                  <input className="form-input" placeholder="Ex: Caboclos" value={form.line} onChange={e => setForm({...form, line: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">URL da Imagem</label>
                <input className="form-input" placeholder="https://..." value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea rows={3} className="form-input resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="form-label">História</label>
                <textarea rows={3} className="form-input resize-none" value={form.history} onChange={e => setForm({...form, history: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Características</label>
                <textarea rows={2} className="form-input resize-none" value={form.characteristics} onChange={e => setForm({...form, characteristics: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Informações Adicionais</label>
                <textarea rows={2} className="form-input resize-none" value={form.additionalInfo} onChange={e => setForm({...form, additionalInfo: e.target.value})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Visível no site</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} className="btn-gold text-xs flex-1 justify-center"><Check size={14} />{editing ? 'Salvar' : 'Adicionar'}</button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
