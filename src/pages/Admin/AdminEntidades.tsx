import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Star, Eye, EyeOff, AlertCircle, Layers } from 'lucide-react';
import { useApp, Entity } from '../../store/AppContext';
import { ImageUploader } from '../../components/ImageUploader';

type EntityForm = Omit<Entity, 'id' | 'lineId'> & { lineId: string };

const emptyEntity: EntityForm = {
  name: '',
  line: '',
  lineId: '',
  description: '',
  image: '',
  history: '',
  characteristics: '',
  additionalInfo: '',
  active: true,
};

export const AdminEntidades: React.FC = () => {
  const { entities, entityLines, addEntity, updateEntity, deleteEntity, addEntityLine, updateEntityLine, deleteEntityLine } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entity | null>(null);
  const [form, setForm] = useState(emptyEntity);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLineModal, setShowLineModal] = useState(false);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [lineForm, setLineForm] = useState({ name: '', description: '', entityIds: [] as string[] });
  const [lineSaving, setLineSaving] = useState(false);
  const [lineError, setLineError] = useState('');
  const [lineModalMode, setLineModalMode] = useState<'create' | 'edit' | 'members'>('create');

  const openCreate = () => { setEditing(null); setForm(emptyEntity); setError(''); setShowModal(true); };
  const openEdit = (e: Entity) => { setEditing(e); setForm({ name: e.name, line: e.line, lineId: e.lineId || entityLines.find(line => line.name === e.line)?.id || '', description: e.description, image: e.image || '', history: e.history, characteristics: e.characteristics, additionalInfo: e.additionalInfo, active: e.active }); setError(''); setShowModal(true); };


  const openCreateLine = () => {
    setEditingLine(null);
    setLineForm({ name: '', description: '', entityIds: [] });
    setLineModalMode('create');
    setLineError('');
    setShowLineModal(true);
  };

  const openEditLine = (line: typeof entityLines[number]) => {
    setEditingLine(line.id);
    setLineForm({ name: line.name, description: line.description || '', entityIds: (line.members || []).map(entity => entity.id) });
    setLineModalMode('edit');
    setLineError('');
    setShowLineModal(true);
  };

  const openManageLineEntities = (line: typeof entityLines[number]) => {
    setEditingLine(line.id);
    setLineForm({ name: line.name, description: line.description || '', entityIds: (line.members || []).map(entity => entity.id) });
    setLineModalMode('members');
    setLineError('');
    setShowLineModal(true);
  };

  const toggleLineEntity = (entityId: string) => {
    setLineForm(prev => ({
      ...prev,
      entityIds: prev.entityIds.includes(entityId)
        ? prev.entityIds.filter(id => id !== entityId)
        : [...prev.entityIds, entityId],
    }));
  };

  const handleSaveLine = async () => {
    if (!lineForm.name.trim()) {
      setLineError('Informe o nome da linha.');
      return;
    }
    setLineError('');
    setLineSaving(true);
    const success = editingLine
      ? await updateEntityLine(editingLine, lineModalMode === 'members' ? { entityIds: lineForm.entityIds } : { name: lineForm.name, description: lineForm.description })
      : await addEntityLine({ name: lineForm.name, description: lineForm.description, entityIds: [] });
    setLineSaving(false);
    if (success) setShowLineModal(false);
    else setLineError('Não foi possível salvar a linha. Verifique se o nome já existe e se o backend está atualizado.');
  };

  const handleSave = async () => {
    if (!form.name) {
      setError('Informe ao menos o nome da entidade.');
      return;
    }
    if (!form.lineId) {
      setError('Selecione uma linha para a entidade.');
      return;
    }
    setSaving(true);
    setError('');
    const success = editing ? await updateEntity(editing.id, form) : await addEntity(form);
    setSaving(false);
    if (success) setShowModal(false);
    else setError('Não foi possível salvar a entidade. Tente novamente.');
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

      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-sm flex items-center gap-2"><Layers size={15} /> Linhas e Grupos Personalizados</h3>
            <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs mt-1">Crie grupos próprios e coloque várias entidades dentro da mesma linha.</p>
          </div>
          <button onClick={openCreateLine} className="btn-outline-gold text-xs py-2 px-3"><Plus size={13} /> Nova Linha</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entityLines.map(line => (
            <div key={line.id} className="border border-[rgba(201,168,76,0.1)] rounded p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-cinzel text-[#f5f0e8] text-sm">{line.name}</p>
                  <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs mt-1">{line.members?.length || 0} entidade(s) no grupo</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditLine(line)} title="Editar linha" className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c]"><Edit2 size={12} /></button>
                  <button onClick={() => openManageLineEntities(line)} title="Gerenciar entidades" className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c]"><Star size={12} /></button>
                  <button onClick={() => deleteEntityLine(line.id)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              </div>
              {line.description && <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm mt-2">{line.description}</p>}
            </div>
          ))}
        </div>
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

      {showLineModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">{lineModalMode === 'members' ? 'Gerenciar Entidades da Linha' : lineModalMode === 'edit' ? 'Editar Linha Personalizada' : 'Nova Linha Personalizada'}</h3>
              <button onClick={() => setShowLineModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {lineModalMode !== 'members' && (
                <>
                  <div><label className="form-label">Nome da linha *</label><input className="form-input" value={lineForm.name} onChange={e => setLineForm({ ...lineForm, name: e.target.value })} placeholder="Ex: Caboclos, Baianos e Boiadeiros" /></div>
                  <div><label className="form-label">Descrição</label><textarea rows={2} className="form-input resize-none" value={lineForm.description} onChange={e => setLineForm({ ...lineForm, description: e.target.value })} /></div>
                  {lineModalMode === 'create' && (
                    <div className="p-3 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.04)]">
                      <p className="font-inter text-xs text-[rgba(245,240,232,0.6)]">Primeiro crie a linha. Depois de criada, use <strong className="text-[#c9a84c]">Gerenciar entidades</strong> para colocar as entidades dentro dela.</p>
                    </div>
                  )}
                </>
              )}
              {lineModalMode === 'members' && (
                <div>
                  <p className="font-inter text-xs text-[rgba(245,240,232,0.55)] mb-3">Selecione as entidades que pertencem a <strong className="text-[#c9a84c]">{lineForm.name}</strong>. Uma entidade pode participar de mais de uma linha personalizada.</p>
                  <div className="max-h-64 overflow-y-auto space-y-3 border border-[rgba(201,168,76,0.1)] rounded p-2">
                    {entities.length === 0 ? <p className="text-sm text-[rgba(245,240,232,0.4)] p-2">Cadastre entidades primeiro.</p> : Object.entries(entities.reduce<Record<string, Entity[]>>((groups, entity) => {
                      const key = entity.line || 'Sem linha';
                      (groups[key] ||= []).push(entity);
                      return groups;
                    }, {})).map(([lineName, lineEntities]) => (
                      <div key={lineName}>
                        <p className="font-cinzel text-[#c9a84c] text-xs px-2 py-1 border-b border-[rgba(201,168,76,0.08)]">{lineName}</p>
                        {lineEntities.map(entity => (
                          <label key={entity.id} className="flex items-center gap-3 p-2 rounded hover:bg-[rgba(201,168,76,0.05)] cursor-pointer">
                            <input type="checkbox" checked={lineForm.entityIds.includes(entity.id)} onChange={() => toggleLineEntity(entity.id)} className="w-4 h-4 accent-[#c9a84c]" />
                            <span className="font-inter text-sm text-[rgba(245,240,232,0.75)]">{entity.name}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {lineError && <div className="mt-4 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-300 text-xs">{lineError}</div>}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSaveLine} disabled={lineSaving || (lineModalMode !== 'members' && !lineForm.name.trim())} className="btn-gold text-xs flex-1 justify-center disabled:opacity-60">
                {lineSaving ? 'Salvando...' : lineModalMode === 'members' ? 'Salvar Entidades' : lineModalMode === 'edit' ? 'Salvar Alterações' : 'Criar Linha'}
              </button>
              <button onClick={() => setShowLineModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
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
                  <label className="form-label">Linha *</label>
                  <select
                    className="form-input"
                    value={form.lineId || ''}
                    onChange={e => setForm({ ...form, lineId: e.target.value, line: entityLines.find(line => line.id === e.target.value)?.name || '' })}
                  >
                    <option value="">Selecione uma linha</option>
                    {entityLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Foto</label>
                <ImageUploader value={form.image || ''} onChange={image => setForm({ ...form, image })} maxSize={1200} shape="round" />
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
            {error && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-[rgba(139,26,26,0.15)] border border-red-500/30 rounded">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="font-inter text-red-300 text-xs">{error}</p>
              </div>
            )}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} disabled={saving} className="btn-gold text-xs flex-1 justify-center disabled:opacity-60">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" /> : <Check size={14} />}
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
