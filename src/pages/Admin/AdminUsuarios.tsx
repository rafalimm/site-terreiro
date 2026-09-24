import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Check, Shield, Search, ShieldCheck } from 'lucide-react';
import { useApp, User, UserRole } from '../../store/AppContext';
import { format } from 'date-fns';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  agenda: 'Resp. Agenda',
  content: 'Resp. Conteúdo',
  atendimento: 'Atendimento',
  consulente: 'Consulente',
};

const roleColors: Record<UserRole, string> = {
  super_admin: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  admin: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  agenda: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  content: 'text-purple-400 border-purple-400/40 bg-purple-400/10',
  atendimento: 'text-green-400 border-green-400/40 bg-green-400/10',
  consulente: 'text-[rgba(245,240,232,0.5)] border-[rgba(245,240,232,0.2)] bg-[rgba(255,255,255,0.05)]',
};

const emptyUser: Omit<User, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  password: '',
  role: 'consulente',
  whatsapp: '',
  active: true,
};

export const AdminUsuarios: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyUser);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'todos'>('todos');
  const [savedId, setSavedId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUser);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: user.password, role: user.role, whatsapp: user.whatsapp || '', active: user.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editing) updateUser(editing.id, form);
    else addUser(form);
    setShowModal(false);
  };

  // Troca rápida de cargo direto na listagem, sem precisar abrir o modal de edição
  const handleQuickRoleChange = (user: User, newRole: UserRole) => {
    if (newRole === user.role) return;
    updateUser(user.id, { role: newRole });
    setSavedId(user.id);
    setTimeout(() => setSavedId(prev => (prev === user.id ? null : prev)), 2000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Usuários & Permissões</h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
            {filteredUsers.length} de {users.length} usuário(s)
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
            <Plus size={14} />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Busca e filtro por cargo */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.3)]" />
          <input
            type="text"
            className="form-input pl-9"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input sm:max-w-[220px]"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as UserRole | 'todos')}
        >
          <option value="todos">Todos os cargos</option>
          {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>{label}</option>
          ))}
        </select>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 p-4 bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded">
        <span className="font-inter text-[rgba(245,240,232,0.4)] text-xs mr-2">Cargos:</span>
        {Object.entries(roleLabels).map(([role, label]) => (
          <span key={role} className={`text-xs px-2 py-0.5 rounded border ${roleColors[role as UserRole]}`}>
            {label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
            <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const isSelf = user.id === currentUser?.id;
            return (
              <div key={user.id} className={`bg-[#1a0a0a] border rounded p-4 transition-all ${user.active ? 'border-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.3)]' : 'border-[rgba(255,255,255,0.05)] opacity-60'}`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center flex-shrink-0">
                      <Shield size={16} className="text-[#c9a84c]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{user.name}</p>
                        {!user.active && <span className="text-xs px-2 py-0.5 rounded border border-red-500/30 text-red-400">Inativo</span>}
                        {savedId === user.id && (
                          <span className="text-xs px-2 py-0.5 rounded border border-green-500/30 text-green-400 flex items-center gap-1">
                            <Check size={10} /> Cargo atualizado
                          </span>
                        )}
                      </div>
                      <p className="font-inter text-[rgba(245,240,232,0.35)] text-xs">{user.email}</p>
                      {user.whatsapp && <p className="font-inter text-[rgba(245,240,232,0.25)] text-xs">{user.whatsapp}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Seletor rápido de cargo */}
                    {isSuperAdmin && !isSelf ? (
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-[rgba(245,240,232,0.3)] hidden sm:block" />
                        <select
                          value={user.role}
                          onChange={e => handleQuickRoleChange(user, e.target.value as UserRole)}
                          title="Alterar cargo rapidamente"
                          className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c9a84c] ${roleColors[user.role]}`}
                        >
                          {Object.entries(roleLabels).map(([role, label]) => (
                            <option key={role} value={role} className="bg-[#1a0a0a] text-[#f5f0e8]">
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    )}

                    <span className="font-inter text-[rgba(245,240,232,0.2)] text-xs hidden md:block">
                      {format(new Date(user.createdAt), "dd/MM/yyyy")}
                    </span>

                    {isSuperAdmin && !isSelf && (
                      <>
                        <button onClick={() => openEdit(user)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-[#c9a84c] border border-[rgba(201,168,76,0.1)] rounded transition-all">
                          <Edit2 size={12} />
                        </button>
                        {deleteConfirm === user.id ? (
                          <>
                            <button onClick={() => { deleteUser(user.id); setDeleteConfirm(null); }} className="p-1.5 text-red-400 border border-red-500/30 rounded">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded">
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 text-[rgba(245,240,232,0.4)] hover:text-red-400 border border-[rgba(201,168,76,0.1)] rounded transition-all">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">
                {editing ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">E-mail *</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="form-label">WhatsApp</label>
                <input className="form-input" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Senha {!editing && '*'}</label>
                <input type="password" className="form-input" placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Cargo</label>
                <select className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <option key={role} value={role}>{label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-[#c9a84c]" />
                <span className="font-inter text-[rgba(245,240,232,0.7)] text-sm">Usuário ativo</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
              <button onClick={handleSave} className="btn-gold text-xs flex-1 justify-center">
                <Check size={14} />
                {editing ? 'Salvar' : 'Criar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-outline-gold text-xs px-6">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
