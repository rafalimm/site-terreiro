import React, { useState } from 'react';
import { Plus, Trash2, X, Check, Star, AlertCircle } from 'lucide-react';
import { useApp, GalleryItem } from '../../store/AppContext';
import { ImageUploader } from '../../components/ImageUploader';

const GALLERY_CATEGORIES = ['Nosso Terreiro', 'Giras', 'Eventos', 'Momentos da Casa', 'Equipe', 'Eventos Especiais'];

const emptyItem: Omit<GalleryItem, 'id' | 'createdAt'> = {
  url: '',
  title: '',
  description: '',
  category: 'Nosso Terreiro',
  isMain: false,
};

export const AdminGaleria: React.FC = () => {
  const { galleryItems, addGalleryItem, updateGalleryItem, deleteGalleryItem } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('Todos');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = filterCat === 'Todos' ? galleryItems : galleryItems.filter(g => g.category === filterCat);

  const handleSave = async () => {
    if (!form.url || !form.title) {
      setError('Escolha uma foto e defina um título antes de salvar.');
      return;
    }
    setSaving(true);
    setError('');
    const success = await addGalleryItem(form);
    setSaving(false);
    if (success) {
      setShowModal(false);
      setForm(emptyItem);
    } else {
      setError('Não foi possível salvar a foto. Tente novamente.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Galeria de Fotos</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{galleryItems.length} foto(s)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} />
          Adicionar Foto
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {['Todos', ...GALLERY_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded font-cinzel text-xs border transition-all ${filterCat === cat ? 'bg-[rgba(201,168,76,0.2)] border-[#c9a84c] text-[#c9a84c]' : 'border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,168,76,0.4)]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma foto adicionada</p>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm mt-1">Adicione fotos para exibir na galeria do site</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="relative group overflow-hidden rounded border border-[rgba(201,168,76,0.1)] bg-[#1a0a0a]">
              <img src={item.url} alt={item.title} className="w-full h-36 object-cover" onError={e => { (e.target as HTMLImageElement).src = '/images/about-bg.jpg'; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,5,5,0.9)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="font-cinzel text-[#c9a84c] text-xs truncate">{item.title}</p>
                  <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs">{item.category}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => updateGalleryItem(item.id, { isMain: !item.isMain })}
                    className={`p-1.5 rounded border transition-all ${item.isMain ? 'bg-[rgba(201,168,76,0.5)] border-[#c9a84c] text-[#0d0505]' : 'bg-[rgba(0,0,0,0.5)] border-[rgba(201,168,76,0.3)] text-[#c9a84c]'}`}
                  >
                    <Star size={10} fill={item.isMain ? 'currentColor' : 'none'} />
                  </button>
                  {deleteConfirm === item.id ? (
                    <>
                      <button onClick={() => { deleteGalleryItem(item.id); setDeleteConfirm(null); }} className="p-1.5 rounded bg-red-500/50 border border-red-400 text-white">
                        <Check size={10} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.2)] text-white">
                        <X size={10} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded bg-[rgba(0,0,0,0.5)] border border-red-400/30 text-red-400">
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
              {item.isMain && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[rgba(201,168,76,0.8)] rounded text-[#0d0505] text-xs font-cinzel font-bold">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">Adicionar Foto</h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Foto *</label>
                <ImageUploader value={form.url} onChange={url => setForm({ ...form, url })} maxSize={1600} />
              </div>
              <div>
                <label className="form-label">Título *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Categoria</label>
                <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isMain} onChange={e => setForm({...form, isMain: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Definir como foto principal</span>
              </label>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-[rgba(139,26,26,0.15)] border border-red-500/30 rounded">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="font-inter text-red-300 text-xs">{error}</p>
              </div>
            )}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} disabled={saving} className="btn-gold text-xs flex-1 justify-center disabled:opacity-60">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" /> : <Check size={14} />}
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
