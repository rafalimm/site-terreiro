import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, History, Loader2, QrCode, Search, UserPlus, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';

interface EventOption {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

interface PreRegistration {
  id: string;
  name: string;
  cpfCnpj?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  registrationCompleted: boolean;
  preRegisteredAt?: string | null;
  registrationCompletedAt?: string | null;
  attendances: Array<{
    queueNumber?: number | null;
    qrToken: string;
    status: string;
    event: EventOption;
  }>;
}

interface CreatedPreRegistration {
  user: { id: string; name: string; cpfCnpj?: string | null };
  attendance: { queueNumber?: number | null; qrToken: string; event: EventOption };
}

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const formatCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};
const formatDateTime = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : '—';

export const AdminPreCadastro: React.FC = () => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [records, setRecords] = useState<PreRegistration[]>([]);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [eventId, setEventId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [created, setCreated] = useState<CreatedPreRegistration | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const [eventList, history] = await Promise.all([
        api.get<EventOption[]>('/api/attendance/queue-events'),
        api.get<PreRegistration[]>('/api/admin/pre-registrations'),
      ]);
      setEvents(eventList);
      setRecords(history);
      if (!eventId && eventList.length) setEventId(eventList[0].id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os pré-cadastros.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { void loadHistory(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const normalizedCpf = onlyDigits(cpf);
    if (!name.trim() || normalizedCpf.length !== 11 || !eventId) {
      setMessage('Informe nome completo, CPF válido e selecione a gira.');
      return;
    }
    try {
      setLoading(true);
      const result = await api.post<CreatedPreRegistration>('/api/admin/pre-registrations', {
        name: name.trim(), cpf: normalizedCpf, eventId,
      });
      setCreated(result);
      setName('');
      setCpf('');
      await loadHistory();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar o pré-cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter(record => {
      const matchesFilter = filter === 'all' ||
        (filter === 'pending' && !record.registrationCompleted) ||
        (filter === 'completed' && record.registrationCompleted);
      const matchesSearch = !term ||
        record.name.toLowerCase().includes(term) ||
        String(record.cpfCnpj || '').includes(onlyDigits(term));
      return matchesFilter && matchesSearch;
    });
  }, [records, search, filter]);

  const pendingCount = records.filter(r => !r.registrationCompleted).length;
  const completedCount = records.filter(r => r.registrationCompleted).length;

  const copyQueue = async () => {
    if (!created?.attendance.queueNumber) return;
    await navigator.clipboard?.writeText(String(created.attendance.queueNumber));
    setMessage('Senha copiada.');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
          <UserPlus size={21} /> Pré-cadastro
        </h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
          Cadastre rapidamente quem chegou sem conseguir fazer o cadastro completo.
        </p>
      </div>

      {message && <div className="p-3 rounded border border-yellow-500/20 bg-yellow-500/5 text-sm text-yellow-100">{message}</div>}

      <div className="grid lg:grid-cols-[minmax(0,460px)_1fr] gap-5">
        <form onSubmit={handleCreate} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-5 space-y-4">
          <div>
            <p className="font-cinzel text-[#f5f0e8] font-bold">Novo pré-cadastro</p>
            <p className="text-xs text-[rgba(245,240,232,0.45)] mt-1">
              Somente nome e CPF são necessários. A senha e o e-mail serão definidos depois pela própria pessoa.
            </p>
          </div>
          <div>
            <label className="form-label">Nome completo *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" required />
          </div>
          <div>
            <label className="form-label">CPF *</label>
            <input className="form-input" value={formatCpf(cpf)} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} required />
          </div>
          <div>
            <label className="form-label">Gira / fila *</label>
            <select className="form-input" value={eventId} onChange={e => setEventId(e.target.value)} required>
              <option value="">Selecione...</option>
              {events.map(event => <option key={event.id} value={event.id}>{event.date} — {event.time} — {event.title}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Criando...' : 'Criar pré-cadastro e gerar senha'}
          </button>
        </form>

        <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-5">
          <div className="flex items-center gap-2 mb-4"><QrCode size={18} className="text-[#c9a84c]" /><p className="font-cinzel text-[#f5f0e8] font-bold">Como funciona</p></div>
          <div className="space-y-3 text-sm text-[rgba(245,240,232,0.65)]">
            <p><strong className="text-white">1.</strong> Informe nome, CPF e a gira.</p>
            <p><strong className="text-white">2.</strong> O sistema cria a conta de consulente e coloca a pessoa imediatamente na fila.</p>
            <p><strong className="text-white">3.</strong> A senha e o QR Code aparecem na tela do responsável.</p>
            <p><strong className="text-white">4.</strong> A pessoa acessa “Já tenho pré-cadastro”, informa o CPF e conclui WhatsApp, e-mail e senha.</p>
            <p><strong className="text-white">5.</strong> O histórico mostra quem ainda está pendente e quem já concluiu.</p>
          </div>
        </div>
      </div>

      {created && (
        <div className="bg-[rgba(34,197,94,0.07)] border border-green-500/25 rounded p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-green-300 text-xs uppercase tracking-wider font-cinzel">Pré-cadastro criado</p>
              <h3 className="font-cinzel text-white text-xl mt-1">{created.user.name}</h3>
              <p className="text-xs text-[rgba(245,240,232,0.5)] mt-1">{created.attendance.event.title} — {created.attendance.event.date} às {created.attendance.event.time}</p>
            </div>
            <button onClick={() => setCreated(null)} className="text-xs text-[rgba(245,240,232,0.55)] hover:text-white">Fechar</button>
          </div>
          <div className="mt-5 grid md:grid-cols-[180px_1fr] gap-5 items-center">
            <div className="bg-white p-3 rounded w-fit mx-auto"><QRCodeSVG value={created.attendance.qrToken} size={150} includeMargin /></div>
            <div>
              <p className="text-[rgba(245,240,232,0.55)] text-xs uppercase tracking-wider">Senha da fila</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-cinzel text-[#c9a84c] text-5xl font-black">{created.attendance.queueNumber ? String(created.attendance.queueNumber).padStart(3, '0') : '—'}</span>
                <button onClick={copyQueue} className="p-2 rounded border border-[rgba(201,168,76,0.2)] text-[#c9a84c]" title="Copiar senha"><Clipboard size={17} /></button>
              </div>
              <p className="text-sm text-[rgba(245,240,232,0.7)] mt-3">Mostre o QR Code e entregue a senha para a pessoa. Ela já está registrada na fila.</p>
              <div className="mt-3 flex items-center gap-2 text-green-300 text-sm"><CheckCircle2 size={16} /> Primeira visita marcada automaticamente.</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-[#c9a84c]" />
          <div><p className="font-cinzel text-[#f5f0e8] font-bold">Histórico de pré-cadastros</p><p className="text-xs text-[rgba(245,240,232,0.4)]">{pendingCount} pendentes · {completedCount} concluídos</p></div>
        </div>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,240,232,0.35)]" /><input className="form-input pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou CPF" /></div>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
            <option value="all">Todos</option><option value="pending">Pendentes</option><option value="completed">Concluídos</option>
          </select>
          <button onClick={() => void loadHistory()} className="btn-outline">Atualizar</button>
        </div>
        {historyLoading ? (
          <div className="py-8 text-center text-sm text-[rgba(245,240,232,0.5)]">Carregando histórico...</div>
        ) : !filteredRecords.length ? (
          <div className="py-8 text-center text-sm text-[rgba(245,240,232,0.5)]">Nenhum pré-cadastro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-[rgba(245,240,232,0.4)] border-b border-[rgba(201,168,76,0.1)]">
                <th className="py-3 pr-4">Pessoa</th><th className="py-3 pr-4">CPF</th><th className="py-3 pr-4">Senha</th><th className="py-3 pr-4">Gira</th><th className="py-3 pr-4">Status</th><th className="py-3">Pré-cadastro</th>
              </tr></thead>
              <tbody>
                {filteredRecords.map(record => {
                  const attendance = record.attendances[0];
                  return <tr key={record.id} className="border-b border-[rgba(201,168,76,0.06)]">
                    <td className="py-3 pr-4 text-white">{record.name}</td>
                    <td className="py-3 pr-4 text-[rgba(245,240,232,0.65)] whitespace-nowrap">{formatCpf(record.cpfCnpj || '')}</td>
                    <td className="py-3 pr-4 text-[#c9a84c] font-semibold">{attendance?.queueNumber ? String(attendance.queueNumber).padStart(3, '0') : '—'}</td>
                    <td className="py-3 pr-4 text-[rgba(245,240,232,0.65)] whitespace-nowrap">{attendance ? attendance.event.date + ' — ' + attendance.event.title : '—'}</td>
                    <td className="py-3 pr-4"><span className={record.registrationCompleted ? 'inline-flex px-2 py-1 rounded text-xs bg-green-500/10 text-green-300' : 'inline-flex px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-300'}>{record.registrationCompleted ? 'Concluído' : 'Pendente'}</span></td>
                    <td className="py-3 text-[rgba(245,240,232,0.45)] whitespace-nowrap">{formatDateTime(record.preRegisteredAt)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-[rgba(245,240,232,0.35)] flex items-center gap-2"><Users size={14} /> Disponível para Responsável de Fila, Administrador e Super Administrador.</div>
    </div>
  );
};
