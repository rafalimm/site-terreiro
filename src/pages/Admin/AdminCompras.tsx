import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart, Plus, Check, Trash2, Edit2, X, PackageCheck,
  Clock3, AlertTriangle, Search
} from 'lucide-react';
import { api } from '../../lib/api';

interface PurchaseItem {
  id: string;
  name: string;
  quantity: string;
  unit: string | null;
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string;
  status: 'pending' | 'purchased';
  createdBy: string;
  purchasedBy: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type FormState = {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  priority: PurchaseItem['priority'];
  notes: string;
};

const emptyForm: FormState = {
  name: '',
  quantity: '',
  unit: '',
  category: '',
  priority: 'normal',
  notes: '',
};

const priorityLabels: Record<PurchaseItem['priority'], string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityClasses: Record<PurchaseItem['priority'], string> = {
  low: 'text-slate-300 border-slate-300/30 bg-slate-300/5',
  normal: 'text-blue-300 border-blue-300/30 bg-blue-300/5',
  high: 'text-orange-300 border-orange-300/30 bg-orange-300/5',
  urgent: 'text-red-300 border-red-300/30 bg-red-300/5',
};

export const AdminCompras: React.FC = () => {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PurchaseItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [showPurchased, setShowPurchased] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<PurchaseItem[]>('/api/admin/purchases');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a lista.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const pending = useMemo(() => items.filter(item => item.status === 'pending'), [items]);
  const purchased = useMemo(() => items.filter(item => item.status === 'purchased'), [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => {
      if (!showPurchased && item.status === 'purchased') return false;
      if (!term) return true;
      return [item.name, item.category || '', item.notes, item.createdBy, item.purchasedBy || '']
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, showPurchased]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: PurchaseItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category || '',
      priority: item.priority,
      notes: item.notes,
    });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.quantity.trim()) {
      setError('Informe o item e a quantidade.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editing) {
        const updated = await api.patch<PurchaseItem>(`/api/admin/purchases/${editing.id}`, form);
        setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
      } else {
        const created = await api.post<PurchaseItem>('/api/admin/purchases', form);
        setItems(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o item.');
    } finally {
      setSaving(false);
    }
  };

  const togglePurchased = async (item: PurchaseItem) => {
    try {
      const updated = await api.patch<PurchaseItem>(`/api/admin/purchases/${item.id}`, {
        status: item.status === 'purchased' ? 'pending' : 'purchased',
      });
      setItems(prev => prev.map(current => current.id === updated.id ? updated : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o item.');
    }
  };

  const remove = async (item: PurchaseItem) => {
    if (!window.confirm(`Remover "${item.name}" da lista?`)) return;
    try {
      await api.delete(`/api/admin/purchases/${item.id}`);
      setItems(prev => prev.filter(current => current.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o item.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
            <ShoppingCart size={21} /> Lista de Compras
          </h2>
          <p className="font-inter text-[rgba(245,240,232,0.45)] text-sm mt-1">
            Organize os materiais que o terreiro precisa comprar e confirme quando forem adquiridos.
          </p>
        </div>
        <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
          <Plus size={14} /> Adicionar item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="admin-card p-4">
          <p className="text-xs text-[rgba(245,240,232,0.4)]">Pendentes</p>
          <p className="text-2xl font-cinzel text-[#f5f0e8] mt-1">{pending.length}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs text-[rgba(245,240,232,0.4)]">Comprados</p>
          <p className="text-2xl font-cinzel text-green-300 mt-1">{purchased.length}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs text-[rgba(245,240,232,0.4)]">Total</p>
          <p className="text-2xl font-cinzel text-[#c9a84c] mt-1">{items.length}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs text-[rgba(245,240,232,0.4)]">Urgentes</p>
          <p className="text-2xl font-cinzel text-red-300 mt-1">
            {pending.filter(item => item.priority === 'urgent').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded border border-red-500/30 bg-red-500/5 text-red-300 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={15} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]" />
          <input
            className="form-input pl-9"
            placeholder="Buscar item, categoria ou observação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 px-3 text-xs text-[rgba(245,240,232,0.6)] border border-[rgba(201,168,76,0.1)] rounded bg-[#1a0a0a]">
          <input type="checkbox" checked={showPurchased} onChange={e => setShowPurchased(e.target.checked)} className="accent-[#c9a84c]" />
          Mostrar comprados
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[rgba(245,240,232,0.4)]">Carregando lista...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <ShoppingCart size={28} className="mx-auto text-[rgba(201,168,76,0.35)] mb-3" />
          <p className="text-sm text-[rgba(245,240,232,0.45)]">Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-[#1a0a0a] border rounded p-4 ${item.status === 'purchased' ? 'border-green-500/15 opacity-75' : 'border-[rgba(201,168,76,0.12)]'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <button
                  onClick={() => togglePurchased(item)}
                  title={item.status === 'purchased' ? 'Marcar como pendente' : 'Confirmar compra'}
                  className={`w-10 h-10 rounded border flex items-center justify-center flex-shrink-0 transition-all ${item.status === 'purchased' ? 'border-green-400/50 bg-green-400/10 text-green-300' : 'border-[rgba(201,168,76,0.25)] text-[rgba(245,240,232,0.35)] hover:text-[#c9a84c]'}`}
                >
                  {item.status === 'purchased' ? <Check size={18} /> : <PackageCheck size={18} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-cinzel font-bold text-sm ${item.status === 'purchased' ? 'text-green-200 line-through' : 'text-[#f5f0e8]'}`}>
                      {item.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded border border-[rgba(201,168,76,0.15)] text-[#c9a84c]">
                      {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${priorityClasses[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </span>
                    {item.category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[rgba(245,240,232,0.5)]">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.notes && <p className="text-xs text-[rgba(245,240,232,0.5)] mt-1">{item.notes}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[rgba(245,240,232,0.3)]">
                    <span>Adicionado por {item.createdBy}</span>
                    {item.purchasedAt && <span>Comprado por {item.purchasedBy} em {new Date(item.purchasedAt).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.status === 'pending' && <Clock3 size={14} className="text-orange-300" />}
                  {item.status === 'purchased' && <PackageCheck size={14} className="text-green-300" />}
                  <button onClick={() => openEdit(item)} className="p-2 rounded border border-[rgba(201,168,76,0.12)] text-[rgba(245,240,232,0.45)] hover:text-[#c9a84c]" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(item)} className="p-2 rounded border border-red-500/10 text-[rgba(245,240,232,0.35)] hover:text-red-300" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">
                {editing ? 'Editar item' : 'Adicionar compra'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Item *</label>
                <input className="form-input" placeholder="Ex.: Velas brancas" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Quantidade *</label>
                  <input className="form-input" placeholder="20" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Unidade</label>
                  <input className="form-input" placeholder="unidades, caixas..." value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Categoria</label>
                  <input className="form-input" placeholder="Limpeza, gira, cozinha..." value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Prioridade</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value as PurchaseItem['priority']})}>
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Observação</label>
                <textarea className="form-input min-h-[90px]" placeholder="Marca, tamanho, local para comprar..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={save} disabled={saving} className="btn-gold text-xs flex-1 justify-center disabled:opacity-50">
                <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
