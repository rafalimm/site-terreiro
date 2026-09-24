import React, { useState } from 'react';
import { Users, User as UserIcon, ShieldPlus, Check, X } from 'lucide-react';
import { useApp, UserRole } from '../../store/AppContext';
import { format } from 'date-fns';

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  agenda: 'Resp. Agenda',
  content: 'Resp. Conteúdo',
  atendimento: 'Atendimento',
  consulente: 'Consulente',
};

// Cargos de equipe que podem ser atribuídos a um consulente já cadastrado.
// "super_admin" fica de fora daqui — esse cargo só é atribuído em Usuários & Permissões.
const promotableRoles: UserRole[] = ['admin', 'agenda', 'content', 'atendimento'];

export const AdminConsulentes: React.FC = () => {
  const { users, updateUser, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('atendimento');
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const consulentes = users
    .filter(u => u.role === 'consulente')
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  const openPromote = (userId: string) => {
    setPromotingId(userId);
    setSelectedRole('atendimento');
  };

  const confirmPromote = (userId: string) => {
    updateUser(userId, { role: selectedRole });
    setPromotingId(null);
    setConfirmedId(userId);
    setTimeout(() => setConfirmedId(prev => (prev === userId ? null : prev)), 2500);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
          <Users size={20} />
          Consulentes Cadastrados
        </h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{consulentes.length} consulente(s)</p>
      </div>

      <div>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar consulente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isSuperAdmin && (
        <div className="p-3 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded flex items-start gap-2">
          <ShieldPlus size={14} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
          <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs">
            Precisa que alguém que já se cadastrou no site passe a ajudar na equipe? Use o botão
            <span className="text-[#c9a84c]"> "Definir cargo" </span>
            para atribuir uma função a essa pessoa, sem precisar cadastrá-la de novo em Usuários.
          </p>
        </div>
      )}

      {consulentes.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <Users size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhum consulente cadastrado</p>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm mt-1">Os consulentes aparecem aqui ao criar uma conta no site</p>
        </div>
      ) : (
        <div className="space-y-2">
          {consulentes.map(user => (
            <div key={user.id} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4 hover:border-[rgba(201,168,76,0.3)] transition-all">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center flex-shrink-0">
                  <UserIcon size={16} className="text-[#c9a84c]" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{user.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded border ${user.active ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                    {confirmedId === user.id && (
                      <span className="text-xs px-2 py-0.5 rounded border border-green-500/30 text-green-400 flex items-center gap-1">
                        <Check size={10} /> Cargo atribuído
                      </span>
                    )}
                  </div>
                  <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs">{user.email}</p>
                  {user.whatsapp && <p className="font-inter text-[rgba(245,240,232,0.3)] text-xs">{user.whatsapp}</p>}
                </div>

                <div className="text-right">
                  <p className="font-inter text-[rgba(245,240,232,0.2)] text-xs">Cadastrado em</p>
                  <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs">{format(new Date(user.createdAt), "dd/MM/yyyy")}</p>
                </div>

                {isSuperAdmin && (
                  <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                    {promotingId === user.id ? (
                      <>
                        <select
                          className="form-input py-1.5 text-xs w-auto"
                          value={selectedRole}
                          onChange={e => setSelectedRole(e.target.value as UserRole)}
                          autoFocus
                        >
                          {promotableRoles.map(role => (
                            <option key={role} value={role}>{roleLabels[role]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => confirmPromote(user.id)}
                          className="p-1.5 text-green-400 border border-green-500/30 rounded"
                          title="Confirmar cargo"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setPromotingId(null)}
                          className="p-1.5 text-[rgba(245,240,232,0.4)] border border-[rgba(255,255,255,0.1)] rounded"
                          title="Cancelar"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openPromote(user.id)}
                        className="btn-outline-gold text-xs py-1.5 px-3 whitespace-nowrap"
                      >
                        <ShieldPlus size={12} />
                        Definir cargo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded">
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs">
          🔒 Por respeito à privacidade dos consulentes e em conformidade com a LGPD, apenas informações
          necessárias para contato e identificação são armazenadas.
        </p>
      </div>
    </div>
  );
};
