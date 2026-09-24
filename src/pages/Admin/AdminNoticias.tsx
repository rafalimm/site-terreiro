import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from 'lucide-react';
import { useApp, NewsItem } from '../../store/AppContext';
import { format } from 'date-fns';

const CATEGORIES = ['Comunicado', 'Gira Especial', 'Evento', 'Aviso', 'Campanha', 'Outro'];

const emptyNews: Omit<NewsItem, 'id'> = {
  title: '',
  content: '',
  image: '',
  category: 'Comunicado',
  author: '',
  publishedAt: new Date().toISOString(),
  active: true,
};

export const AdminNoticias: React.FC = () => {
  const { newsItems, addNews, updateNews, deleteNews, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(emptyNews);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyNews, author: currentUser?.name || 'Administração' });
    setShowModal(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({
      title: item.title, content: item.content, image: item.image || '',
      category: item.category, author: item.author,
      publishedAt: item.publishedAt, active: item.active,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title || !form.content) return;
    if (editing) updateNews(editing.id, form);
    else addNews(form);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Notícias & Avisos</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{newsItems.length} publicação(ões)</p>
        </div>
        <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} />
          Nova Publicação
        </button>
      </div>

      {newsItems.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma publicação</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsItems.map(item => (
            <div key={item.id} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4 hover:border-[rgba(201,168,76,0.3)] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded border border-[rgba(139,26,26,0.4)] text-[#c9a84c] bg-[rgba(139,26,26,0.2)]">
                      {item.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${item.active ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                      {item.active ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <h3 className="font-cinzel font-bold text-[#f5f0e8] text-base">{item.title}</h3>
                  <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm line-clamp-1 mt-0.5">{item.content}</p>
                  <p className="font-inter text-[rgba(245,240,232,0.25)] text-xs mt-1">
                    {item.author} — {format(new Date(item.publishedAt), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateNews(item.id, { active: !item.active })}
                    className="p-2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded transition-all"
                    title={item.active ? 'Despublicar' : 'Publicar'}
                  >
                    {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded transition-all">
                    <Edit2 size={14} />
                  </button>
                  {deleteConfirm === item.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteNews(item.id); setDeleteConfirm(null); }} className="p-2 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-2 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded transition-all">
                      <Trash2 size={14} />
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
                {editing ? 'Editar Publicação' : 'Nova Publicação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Título *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Categoria</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Autor</label>
                  <input className="form-input" value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">URL da Imagem (opcional)</label>
                <input className="form-input" placeholder="https://..." value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Conteúdo *</label>
                <textarea rows={6} className="form-input resize-none" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Publicar imediatamente</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} className="btn-gold text-xs flex-1 justify-center">
                <Check size={14} />
                {editing ? 'Salvar' : 'Publicar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
