import React, { useEffect, useMemo, useState } from 'react';
import { Check, CreditCard, Edit2, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../store/AppContext';

type MembershipRow = {
  id: string | null;
  user: { id: string; name: string; email: string; role: string; whatsapp?: string | null; active: boolean };
  monthlyAmountCents: number;
  dueDay: number;
  active: boolean;
  currentPayment: { id: string; referenceMonth: string; amountCents: number; dueDate: string; status: string; paidAt?: string | null; method?: string | null } | null;
  payments: Array<{ id: string; referenceMonth: string; amountCents: number; status: string; paidAt?: string | null; method?: string | null }>;
};

const roleLabel: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  agenda: 'Resp. Agenda',
  content: 'Resp. Conteúdo',
  atendimento: 'Atendimento',
  filho: 'Filho',
};

const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const AdminMensalidades: React.FC = () => {
  const { currentUser, lastError } = useApp();
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MembershipRow | null>(null);
  const [amount, setAmount] = useState('50,00');
  const [dueDay, setDueDay] = useState('10');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<MembershipRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<MembershipRow[]>('/api/admin/memberships');
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const activeRows = rows.filter(row => row.active);
    const paid = activeRows.filter(row => row.currentPayment?.status === 'paid').length;
    const pending = activeRows.filter(row => row.currentPayment?.status === 'pending').length;
    const overdue = activeRows.filter(row => row.currentPayment?.status === 'overdue').length;
    const expected = activeRows.reduce((sum, row) => sum + row.monthlyAmountCents, 0);
    const received = activeRows.reduce((sum, row) => sum + (row.currentPayment?.status === 'paid' ? row.currentPayment.amountCents : 0), 0);
    return { active: activeRows.length, paid, pending, overdue, expected, received };
  }, [rows]);

  const openEdit = (row: MembershipRow) => {
    setEditing(row);
    setAmount(row.monthlyAmountCents ? (row.monthlyAmountCents / 100).toFixed(2).replace('.', ',') : '50,00');
    setDueDay(String(row.dueDay || 10));
    setActive(row.active);
  };

  const saveMembership = async () => {
    if (!editing) return;
    const cents = Math.round(Number(amount.replace(/\./g, '').replace(',', '.')) * 100);
    if (!Number.isInteger(cents) || cents <= 0) return;
    setSaving(true);
    try {
      const payload = { userId: editing.user.id, monthlyAmountCents: cents, dueDay: Number(dueDay), active };
      if (editing.id) {
        await api.patch(`/api/admin/memberships/${editing.id}`, payload);
      } else {
        await api.post('/api/admin/memberships', payload);
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const registerPayment = async () => {
    if (!paymentTarget?.id) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/memberships/${paymentTarget.id}/payments`, { method: 'manual' });
      setPaymentTarget(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (currentUser?.role === 'consulente' || !currentUser) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Mensalidades</h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">Controle de mensalidades dos usuários com cargo Filho ou superior.</p>
      </div>

      {lastError && <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-300 text-sm">{lastError}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Ativos', summary.active],
          ['Pagos', summary.paid],
          ['Pendentes', summary.pending],
          ['Atrasados', summary.overdue],
          ['Recebido', money(summary.received)],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4">
            <p className="font-inter text-[rgba(245,240,232,0.45)] text-xs">{label}</p>
            <p className="font-cinzel font-bold text-[#c9a84c] text-lg mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
        <div className="p-4 border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between">
          <div>
            <h3 className="font-cinzel font-bold text-[#f5f0e8]">Membros</h3>
            <p className="font-inter text-xs text-[rgba(245,240,232,0.4)]">Esperado no mês: {money(summary.expected)}</p>
          </div>
          <Users size={18} className="text-[#c9a84c]" />
        </div>
        {loading ? (
          <div className="p-8 text-center text-[#c9a84c]">Carregando...</div>
        ) : (
          <div className="divide-y divide-[rgba(201,168,76,0.08)]">
            {rows.map(row => (
              <div key={row.user.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel font-bold text-[#f5f0e8]">{row.user.name}</p>
                  <p className="font-inter text-xs text-[rgba(245,240,232,0.4)]">{roleLabel[row.user.role] || row.user.role} · {row.user.email}</p>
                </div>
                <div className="text-sm">
                  {row.id ? <><span className="text-[#c9a84c]">{money(row.monthlyAmountCents)}</span><span className="text-[rgba(245,240,232,0.35)]"> · dia {row.dueDay}</span></> : <span className="text-[rgba(245,240,232,0.35)]">Não configurada</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${row.currentPayment?.status === 'paid' ? 'text-green-400 border-green-500/30 bg-green-500/10' : row.currentPayment?.status === 'overdue' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'}`}>
                  {row.currentPayment?.status === 'paid' ? 'Pago' : row.currentPayment?.status === 'overdue' ? 'Atrasado' : row.currentPayment ? 'Pendente' : 'Sem cobrança'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(row)} className="p-2 border border-[rgba(201,168,76,0.15)] rounded text-[#c9a84c]" title="Configurar">
                    {row.id ? <Edit2 size={14} /> : <CreditCard size={14} />}
                  </button>
                  {row.id && row.currentPayment?.status !== 'paid' && (
                    <button onClick={() => setPaymentTarget(row)} className="btn-gold text-xs py-2 px-3">
                      Registrar pagamento
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-cinzel font-bold text-[#c9a84c]">Configurar mensalidade</h3>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <p className="font-inter text-sm text-[#f5f0e8] mb-4">{editing.user.name}</p>
            <label className="form-label">Valor mensal</label>
            <input className="form-input mb-4" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50,00" />
            <label className="form-label">Dia do vencimento</label>
            <input type="number" min="1" max="28" className="form-input mb-4" value={dueDay} onChange={e => setDueDay(e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-[rgba(245,240,232,0.7)]">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-[#c9a84c]" />
              Mensalidade ativa
            </label>
            <div className="flex gap-3 mt-6">
              <button onClick={saveMembership} disabled={saving} className="btn-gold flex-1 justify-center"><Check size={14} />Salvar</button>
              <button onClick={() => setEditing(null)} className="btn-outline-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {paymentTarget && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="font-cinzel font-bold text-[#c9a84c] mb-3">Registrar pagamento</h3>
            <p className="font-inter text-sm text-[#f5f0e8]">Confirmar pagamento da mensalidade de <strong>{paymentTarget.user.name}</strong>?</p>
            <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mt-2">O mês atual será marcado como pago e ficará registrado no histórico.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={registerPayment} disabled={saving} className="btn-gold flex-1 justify-center"><Check size={14} />Confirmar pagamento</button>
              <button onClick={() => setPaymentTarget(null)} className="btn-outline-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
