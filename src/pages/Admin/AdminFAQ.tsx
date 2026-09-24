import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useApp, FAQItem } from '../../store/AppContext';

const emptyFAQ: Omit<FAQItem, 'id'> = {
  question: '',
  answer: '',
  order: 99,
  active: true,
};

export const AdminFAQ: React.FC = () => {
  const { faqItems, addFAQ, updateFAQ, deleteFAQ } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [form, setForm] = useState(emptyFAQ);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyFAQ, order: faqItems.length + 1 });
    setShowModal(true);
  };

  const openEdit = (item: FAQItem) => {
    setEditing(item);
    setForm({ question: item.question, answer: item.answer, order: item.order, active: item.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.question || !form.answer) return;
    if (editing) updateFAQ(editing.id, form);
    else addFAQ(form);
    setShowModal(false);
  };

  const sorted = [...faqItems].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">FAQ — Perguntas Frequentes</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{faqItems.length} pergunta(s)</p>
        </div>
        <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} />
          Nova Pergunta
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <div key={item.id} className={`bg-[#1a0a0a] border rounded p-4 transition-all ${item.active ? 'border-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.3)]' : 'border-[rgba(255,255,255,0.05)] opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 text-[rgba(245,240,232,0.2)] mt-1">
                <GripVertical size={14} />
                <span className="font-cinzel text-xs">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-semibold text-[#f5f0e8] text-sm">{item.question}</p>
                <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm line-clamp-2 mt-1">{item.answer}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateFAQ(item.id, { active: !item.active })}
                  className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded transition-all"
                >
                  {item.active ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded transition-all">
                  <Edit2 size={12} />
                </button>
                {deleteConfirm === item.id ? (
                  <>
                    <button onClick={() => { deleteFAQ(item.id); setDeleteConfirm(null); }} className="p-1.5 text-red-400 border border-red-500/30 rounded">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">
                {editing ? 'Editar Pergunta' : 'Nova Pergunta'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Pergunta *</label>
                <input className="form-input" value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder="Digite a pergunta..." />
              </div>
              <div>
                <label className="form-label">Resposta *</label>
                <textarea rows={6} className="form-input resize-none" value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} placeholder="Digite a resposta..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ordem</label>
                  <input type="number" className="form-input" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                    <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Ativa</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} className="btn-gold text-xs flex-1 justify-center">
                <Check size={14} />
                {editing ? 'Salvar' : 'Adicionar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
