import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, Clock3, PhoneCall, Play, QrCode, RefreshCw, Users, XCircle, UserPlus } from 'lucide-react';
import { useApp, GiraAttendance } from '../../store/AppContext';
import { api } from '../../lib/api';

type QueueResponse = {
  event: { id: string; title: string; date: string; time: string; type: string; firstVisitEntityIds?: string[] };
  counts: { confirmed: number; arrived: number; called: number; inService: number; attended: number };
  attendances: Array<GiraAttendance & { user: { id: string; name: string; email: string; whatsapp?: string; role: string } }>;
  entities: Array<{ id: string; name: string; line: string; active: boolean; owner?: { id: string; name: string; role: string; active: boolean } | null }>;
  availableEntities: Array<{ id: string; name: string; line: string; active: boolean; owner?: { id: string; name: string; role: string; active: boolean } | null }>;
  availableFirstVisitEntities: Array<{ id: string; name: string; line: string; active: boolean; owner?: { id: string; name: string; role: string; active: boolean } | null }>;
  entityHistory: Array<{
    entity: { id: string; name: string; line: string; active: boolean; owner?: { id: string; name: string; role: string; active: boolean } | null };
    attendedCount: number;
    consulentes: Array<{ attendanceId: string; userId: string; name: string; queueNumber?: number | null; attendedAt?: string | null }>;
  }>;
};

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmado',
  arrived: 'Aguardando',
  called: 'Chamado',
  in_service: 'Em atendimento',
  attended: 'Atendido',
};

const statusClass: Record<string, string> = {
  confirmed: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
  arrived: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
  called: 'text-orange-300 border-orange-500/30 bg-orange-500/10',
  in_service: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
  attended: 'text-green-300 border-green-500/30 bg-green-500/10',
};

interface AdminFilaGirasProps {
  onOpenPreCadastro?: () => void;
}

export const AdminFilaGiras: React.FC<AdminFilaGirasProps> = ({ onOpenPreCadastro }) => {
  const { events, hasPermission } = useApp();
  const [adminEvents, setAdminEvents] = useState<typeof events>([]);
  const [eventId, setEventId] = useState('');
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [callTargetId, setCallTargetId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [firstVisitPending, setFirstVisitPending] = useState<{ qrToken: string; name: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadQueue = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await api.get<QueueResponse>(`/api/admin/events/${eventId}/attendance`);
      setQueue(data);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a fila.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadAdminEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await api.get<typeof events>('/api/attendance/queue-events');
        if (!cancelled) {
          setAdminEvents(data);
          if (!eventId && data.length) setEventId(data[0].id);
          if (!data.length) setMessage('Nenhuma gira cadastrada para gerenciar a fila. Crie uma gira na Agenda / Giras primeiro.');
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as giras para a fila.');
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };
    loadAdminEvents();
    return () => { cancelled = true; };
  }, [events]);

  useEffect(() => {
    if (eventId) loadQueue();
  }, [eventId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Mantém dois ou mais responsáveis de fila sincronizados em celulares diferentes.
  useEffect(() => {
    if (!eventId) return;
    const interval = window.setInterval(() => { loadQueue(); }, 2500);
    return () => window.clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  const startScanner = async () => {
    if (!eventId) return;
    setMessage('');
    setScannerOpen(true);

    window.setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('gira-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async decodedText => {
            await stopScanner();
            try {
              const scanned = await api.get<GiraAttendance & { user?: { name: string } }>(`/api/attendance/token/${encodeURIComponent(decodedText)}`);
              setFirstVisitPending({ qrToken: decodedText, name: scanned.user?.name || 'participante' });
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'QR Code inválido.');
            }
          },
          () => undefined
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Não foi possível acessar a câmera. Verifique a permissão do navegador.');
        setScannerOpen(false);
      }
    }, 100);
  };

  const confirmCheckIn = async (isFirstVisit: boolean) => {
    if (!firstVisitPending) return;
    try {
      const updated = await api.post<GiraAttendance>(`/api/admin/events/${eventId}/attendance/check-in`, { qrToken: firstVisitPending.qrToken, isFirstVisit });
      setFirstVisitPending(null);
      setMessage(`${isFirstVisit ? 'Primeira vez identificada' : 'Retorno identificado'}: ${updated.user?.name || 'participante'} — senha ${String(updated.queueNumber).padStart(3, '0')}.`);
      await loadQueue();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível registrar a chegada.');
    }
  };

  const openCallDialog = (attendanceId: string) => {
    setCallTargetId(attendanceId);
    const target = queue?.attendances.find(a => a.id === attendanceId);
    const entitiesForCall = target?.isFirstVisit && (queue?.event.firstVisitEntityIds?.length || 0) > 0
      ? (queue?.availableFirstVisitEntities || [])
      : (queue?.availableEntities || []);
    setSelectedEntityId(entitiesForCall.length === 1 ? entitiesForCall[0].id : '');
    setMessage('');
  };

  const performCall = async () => {
    if (!callTargetId) return;
    if ((queue?.entities.length || 0) > 0 && !selectedEntityId) {
      setMessage('Selecione a entidade disponível para chamar este consulente.');
      return;
    }

    try {
      const updated = await api.post<GiraAttendance & {
        entity?: { id: string; name: string; line?: string; active?: boolean; owner?: { id: string; name: string; role: string; active: boolean } | null };
      }>(
        `/api/admin/events/${eventId}/attendance/${callTargetId}/call`,
        { entityId: selectedEntityId || undefined }
      );
      setCallTargetId(null);
      setSelectedEntityId('');
      await loadQueue();
      setMessage(
        updated.entity?.name
          ? `Participante chamado para ${updated.entity.name}.`
          : 'Participante chamado.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível chamar a pessoa.');
      await loadQueue();
    }
  };

  const action = async (attendanceId: string, endpoint: 'start' | 'complete') => {
    try {
      await api.post(`/api/admin/events/${eventId}/attendance/${attendanceId}/${endpoint}`, {});
      await loadQueue();

      if (endpoint === 'complete') {
        const fresh = await api.get<QueueResponse>(`/api/admin/events/${eventId}/attendance`);
        setQueue(fresh);
        const next = fresh.attendances.find(a => a.status === 'arrived' && a.isFirstVisit)
          || fresh.attendances.find(a => a.status === 'arrived');

        if (next) {
          setCallTargetId(next.id);
          const nextEntities = next.isFirstVisit && (fresh.event.firstVisitEntityIds?.length || 0) > 0
            ? (fresh.availableFirstVisitEntities || [])
            : (fresh.availableEntities || []);
          setSelectedEntityId(nextEntities.length === 1 ? nextEntities[0].id : '');
          setMessage(`Atendimento finalizado. Próximo: senha ${next.queueNumber ? String(next.queueNumber).padStart(3, '0') : '—'} — ${next.user?.name || 'consulente'}.`);
        } else {
          setMessage('Atendimento finalizado. Não há mais pessoas aguardando na fila.');
        }
      } else {
        setMessage('Atendimento iniciado.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a fila.');
    }
  };

  const callNext = () => {
    const next = queue?.attendances.find(a => a.status === 'arrived' && a.isFirstVisit) || queue?.attendances.find(a => a.status === 'arrived');
    if (!next) {
      setMessage('Não há consulentes aguardando na fila.');
      return;
    }
    openCallDialog(next.id);
  };

  const availableEvents = adminEvents.length ? adminEvents : events;
  const current = queue?.attendances.find(a => a.status === 'in_service') || queue?.attendances.find(a => a.status === 'called');
  const nextWaiting = queue?.attendances.find(a => a.status === 'arrived' && a.isFirstVisit) || queue?.attendances.find(a => a.status === 'arrived');
  const queueAttendances = queue?.attendances.filter(a => ['arrived', 'called', 'in_service'].includes(a.status)) || [];
  const firstVisitQueue = queueAttendances.filter(a => a.isFirstVisit);
  const returningQueue = queueAttendances.filter(a => !a.isFirstVisit);
  const canPreCadastro = hasPermission('pre_cadastro') || hasPermission('*');
  const currentElapsedMinutes = current?.status === 'in_service' && current.serviceStartedAt
    ? Math.max(0, Math.floor((now - new Date(current.serviceStartedAt).getTime()) / 60000))
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Fila de Atendimento</h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">Controle de chegada, chamada e atendimento de cada gira.</p>
      </div>

      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-4">
        <label className="form-label">Selecione a gira</label>
        <select className="form-input" value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">Selecione...</option>
          {availableEvents.map(event => (
            <option key={event.id} value={event.id}>{event.date} — {event.time} — {event.title}</option>
          ))}
        </select>
      </div>

      {eventsLoading && !availableEvents.length && (
        <div className="p-4 rounded border border-[rgba(201,168,76,0.15)] bg-[#1a0a0a] text-sm text-[rgba(245,240,232,0.6)]">
          Carregando giras...
        </div>
      )}

      {!eventsLoading && !availableEvents.length && (
        <div className="p-6 rounded border border-yellow-500/20 bg-yellow-500/5 text-sm text-yellow-200/80">
          Nenhuma gira disponível para a fila. Cadastre uma gira em <strong>Agenda / Giras</strong> e depois volte para esta tela.
        </div>
      )}

      {loading && (
        <div className="p-4 rounded border border-[rgba(201,168,76,0.15)] bg-[#1a0a0a] text-sm text-[rgba(245,240,232,0.65)]">
          Carregando a fila da gira...
        </div>
      )}

      {message && (
        <div className="p-4 rounded border border-yellow-500/20 bg-yellow-500/5 text-sm text-yellow-100">
          {message}
        </div>
      )}

      {queue && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Confirmados', count: queue.counts.confirmed, Icon: Users },
              { label: 'Aguardando', count: queue.counts.arrived, Icon: Clock3 },
              { label: 'Chamados', count: queue.counts.called, Icon: PhoneCall },
              { label: 'Em atendimento', count: queue.counts.inService, Icon: Play },
              { label: 'Atendidos', count: queue.counts.attended, Icon: CheckCircle2 },
            ].map(({ label, count, Icon }) => (
              <div key={label} className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-4">
                <Icon size={17} className="text-[#c9a84c] mb-2" />
                <p className="text-[rgba(245,240,232,0.4)] text-xs">{label}</p>
                <p className="font-cinzel text-[#f5f0e8] text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-[#c9a84c] font-cinzel uppercase tracking-wider">Painel rápido da fila</p>
                <p className="text-sm text-[rgba(245,240,232,0.45)] mt-1">Visão prática para quem está responsável pelo atendimento.</p>
              </div>
              <span className="text-xs text-[rgba(245,240,232,0.4)]">Atualização automática</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="rounded border border-[rgba(201,168,76,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.4)]">Próxima senha</p>
                <p className="font-cinzel text-[#c9a84c] text-2xl font-bold mt-1">{nextWaiting?.queueNumber ? String(nextWaiting.queueNumber).padStart(3, '0') : '—'}</p>
                <p className="text-xs text-[rgba(245,240,232,0.45)] mt-1 truncate">{nextWaiting?.user?.name || 'Ninguém aguardando'}</p>
              </div>
              <div className="rounded border border-[rgba(201,168,76,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.4)]">Pessoas à frente</p>
                <p className="font-cinzel text-[#f5f0e8] text-2xl font-bold mt-1">{nextWaiting?.peopleAhead ?? 0}</p>
                <p className="text-xs text-[rgba(245,240,232,0.45)] mt-1">{nextWaiting?.estimatedWaitMinutes ? `Espera estimada: ~${nextWaiting.estimatedWaitMinutes} min` : 'Sem espera estimada'}</p>
              </div>
              <div className="rounded border border-[rgba(201,168,76,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.4)]">Entidades livres</p>
                <p className="font-cinzel text-[#f5f0e8] text-2xl font-bold mt-1">{queue.availableEntities.length}</p>
                <p className="text-xs text-[rgba(245,240,232,0.45)] mt-1">prontas para nova chamada</p>
              </div>
            </div>
            {queueAttendances.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {queueAttendances.slice(0, 8).map(attendance => (
                  <div key={attendance.id} className="flex items-center gap-2 px-3 py-2 rounded border border-[rgba(201,168,76,0.08)] bg-[rgba(255,255,255,0.015)]">
                    <span className="font-cinzel text-[#c9a84c] text-xs font-bold">{attendance.queueNumber ? String(attendance.queueNumber).padStart(3, '0') : '—'}</span>
                    <span className="text-xs text-[rgba(245,240,232,0.65)] max-w-32 truncate">{attendance.user?.name}</span>
                    <span className={(statusClass[attendance.status] || '') + ' px-1.5 py-0.5 rounded border text-[9px]'}>{statusLabel[attendance.status] || attendance.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-[rgba(201,168,76,0.06)] border border-[#c9a84c]/30 rounded p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-[#c9a84c] font-cinzel uppercase tracking-wider">Em atendimento agora</p>
                  {current ? (
                    <>
                      <p className="font-cinzel text-white text-xl mt-2">{current.user?.name}</p>
                      <p className="text-sm text-[rgba(245,240,232,0.5)] mt-1">
                        Senha <span className="text-[#c9a84c] font-bold">{current.queueNumber ? String(current.queueNumber).padStart(3, '0') : '—'}</span>
                        {' · '}{current.status === 'in_service' ? 'Atendimento em andamento' : 'Aguardando início'}
                      </p>
                      {current.status === 'in_service' && (
                        <p className="text-xs text-[rgba(245,240,232,0.55)] mt-2">
                          Tempo de atendimento: <span className="text-[#f5f0e8]">{currentElapsedMinutes < 1 ? 'menos de 1 min' : `${currentElapsedMinutes} min`}</span>
                        </p>
                      )}
                      {current.entity && (
                        <p className="text-xs text-[rgba(245,240,232,0.55)] mt-2">
                          Entidade: <span className="text-[#f5f0e8]">{current.entity.name}</span>
                          {current.entity.owner?.name && <> · Incorporante: <span className="text-[#c9a84c]">{current.entity.owner.name}</span></>}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-cinzel text-white text-xl mt-2">Nenhum atendimento ativo</p>
                      <p className="text-sm text-[rgba(245,240,232,0.45)] mt-1">A fila está pronta para a próxima chamada.</p>
                    </>
                  )}
                </div>
                {current?.status === 'called' && (
                  <button onClick={() => action(current.id, 'start')} className="btn-gold text-xs">
                    <Play size={14}/> Iniciar atendimento
                  </button>
                )}
                {current?.status === 'in_service' && (
                  <button onClick={() => action(current.id, 'complete')} className="btn-gold text-xs">
                    <CheckCircle2 size={14}/> Finalizar e chamar próximo
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.12)] rounded p-5">
              <p className="text-xs text-[#c9a84c] font-cinzel uppercase tracking-wider">Próximo da fila</p>
              {nextWaiting ? (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-[#c9a84c]/40 flex items-center justify-center font-cinzel text-[#c9a84c] font-bold">
                      {nextWaiting.queueNumber ? String(nextWaiting.queueNumber).padStart(3, '0') : '—'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-inter text-[#f5f0e8] font-semibold truncate">{nextWaiting.user?.name}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.4)]">{nextWaiting.isFirstVisit ? 'Primeira vez' : 'Retornante'}</p>
                    </div>
                  </div>
                  <button onClick={callNext} className="btn-gold text-xs w-full justify-center mt-4">
                    <PhoneCall size={14}/> Chamar próximo
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-[rgba(245,240,232,0.45)]">Nenhuma pessoa aguardando.</p>
                  <p className="text-xs text-[rgba(245,240,232,0.3)] mt-1">A fila está vazia no momento.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={callNext} disabled={!queue?.attendances.some(a => a.status === 'arrived')} className="btn-gold text-xs disabled:opacity-50"><PhoneCall size={15}/> Chamar próximo número</button>
            <button onClick={startScanner} disabled={scannerOpen} className="btn-outline-gold text-xs"><QrCode size={15}/> Escanear chegada</button>
            {canPreCadastro && onOpenPreCadastro && (
              <button onClick={onOpenPreCadastro} className="btn-outline-gold text-xs"><UserPlus size={15}/> Pré-cadastro</button>
            )}
            <button onClick={loadQueue} disabled={loading} className="btn-outline-gold text-xs"><RefreshCw size={14}/> {loading ? 'Atualizando...' : 'Atualizar fila'}</button>
          </div>

          {firstVisitPending && (
            <div className="modal-overlay">
              <div className="modal-content max-w-md">
                <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">Identificar chegada</h3>
                <p className="text-sm text-[#f5f0e8] mt-2">{firstVisitPending.name}</p>
                <p className="text-xs text-[rgba(245,240,232,0.5)] mt-2">Esta pessoa está vindo pela primeira vez?</p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button onClick={() => confirmCheckIn(true)} className="btn-gold text-xs justify-center">Sim, primeira vez</button>
                  <button onClick={() => confirmCheckIn(false)} className="btn-outline-gold text-xs justify-center">Não, já frequenta</button>
                </div>
                <button onClick={() => setFirstVisitPending(null)} className="w-full mt-3 text-xs text-[rgba(245,240,232,0.45)] hover:text-white">Cancelar</button>
              </div>
            </div>
          )}

          {callTargetId && (
            <div className="modal-overlay">
              <div className="modal-content max-w-md">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg">Chamar consulente</h3>
                    <p className="text-xs text-[rgba(245,240,232,0.45)] mt-1">
                      {(() => {
                        const target = queue?.attendances.find(a => a.id === callTargetId);
                        return <>Senha {String(target?.queueNumber || '').padStart(3, '0')} {target?.user?.name ? `· ${target.user.name}` : ''}</>;
                      })()}
                    </p>
                  </div>
                  <button onClick={() => setCallTargetId(null)} className="text-[rgba(245,240,232,0.4)] hover:text-white"><XCircle size={20}/></button>
                </div>

                {(() => {
                  const target = queue?.attendances.find(a => a.id === callTargetId);
                  const entitiesForCall = target?.isFirstVisit && (queue?.event.firstVisitEntityIds?.length || 0) > 0 ? (queue?.availableFirstVisitEntities || []) : (queue?.availableEntities || []);
                  return entitiesForCall.length ? (

                  <div className="space-y-2">
                    <label className="form-label">Escolha a entidade disponível</label>
                    {entitiesForCall.length === 1 && selectedEntityId === entitiesForCall[0].id && (
                      <p className="text-[11px] text-[#c9a84c] mb-2">Única entidade disponível — selecionada automaticamente.</p>
                    )}
                    {entitiesForCall.map(entity => (
                      <button
                        key={entity.id}
                        onClick={() => setSelectedEntityId(entity.id)}
                        className={`w-full text-left p-3 rounded border transition-colors ${selectedEntityId === entity.id ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.02)]'}`}
                      >
                        <span className="block text-sm text-[#f5f0e8] font-inter">{entity.name}</span>
                        <span className="block text-xs text-[rgba(245,240,232,0.4)]">{entity.line || 'Sem linha'}</span>
                        {entity.owner?.name && (
                          <span className="block text-xs text-[rgba(201,168,76,0.8)] mt-1">Incorporante: {entity.owner.name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : queue?.entities.length ? (
                  <div className="p-3 rounded border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-200/70">
                    Todas as entidades permitidas para este atendimento estão ocupadas no momento. Aguarde uma ser liberada.
                  </div>
                ) : (
                  <div className="p-3 rounded border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-200/70">
                    Esta gira ainda não possui entidades vinculadas. O atendimento continuará funcionando sem vinculação de entidade.
                  </div>
                )
                })()}

                <div className="flex gap-3 mt-6 pt-4 border-t border-[rgba(201,168,76,0.1)]">
                  <button onClick={() => setCallTargetId(null)} className="btn-outline-gold text-xs flex-1 justify-center">Cancelar</button>
                  <button onClick={performCall} disabled={(queue?.entities.length || 0) > 0 && !selectedEntityId} className="btn-gold text-xs flex-1 justify-center disabled:opacity-50">
                    <PhoneCall size={14}/> Chamar agora
                  </button>
                </div>
              </div>
            </div>
          )}

          {scannerOpen && (
            <div className="bg-[#1a0a0a] border border-[#c9a84c]/30 rounded p-4 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <p className="font-cinzel text-[#c9a84c] text-sm">Escaneie o QR Code do participante</p>
                <button onClick={stopScanner} className="p-1 text-[rgba(245,240,232,0.5)]"><XCircle size={18}/></button>
              </div>
              <div id="gira-qr-reader" className="overflow-hidden rounded bg-black min-h-64" />
              <p className="text-[11px] text-[rgba(245,240,232,0.4)] mt-2">No celular, permita o acesso à câmera quando o navegador solicitar.</p>
            </div>
          )}

          {queue.entities.length > 0 && (
            <>
            <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
              <div className="p-4 border-b border-[rgba(201,168,76,0.08)]">
                <h3 className="font-cinzel text-[#c9a84c]">Status das entidades</h3>
                <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">Veja rapidamente quais entidades estão livres e quais estão em atendimento.</p>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {queue.entities.map(entity => {
                  const activeAttendance = queue.attendances.find(a => a.entity?.id === entity.id && ['called', 'in_service'].includes(a.status));
                  const isFree = !activeAttendance;
                  return (
                    <div key={entity.id} className={`rounded border p-4 ${isFree ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-cinzel text-[#f5f0e8] text-sm truncate">{entity.name}</p>
                          <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">{entity.line || 'Sem linha'}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded border text-[10px] font-semibold ${isFree ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-orange-300 border-orange-500/30 bg-orange-500/10'}`}>
                          {isFree ? 'LIVRE' : 'EM ATENDIMENTO'}
                        </span>
                      </div>
                      {entity.owner?.name && (
                        <p className="text-xs text-[rgba(245,240,232,0.55)] mt-3">Incorporante: <span className="text-[#c9a84c]">{entity.owner.name}</span></p>
                      )}
                      {activeAttendance && (
                        <p className="text-xs text-[rgba(245,240,232,0.55)] mt-1">Consulente: <span className="text-[#f5f0e8]">{activeAttendance.user?.name}</span> · senha {activeAttendance.queueNumber ? String(activeAttendance.queueNumber).padStart(3, '0') : '—'}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
              <div className="p-4 border-b border-[rgba(201,168,76,0.08)]">
                <h3 className="font-cinzel text-[#c9a84c]">Entidades desta gira</h3>
                <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">Histórico dos consulentes já atendidos por cada entidade.</p>
              </div>
              <div className="divide-y divide-[rgba(201,168,76,0.07)]">
                {queue.entityHistory.map(item => (
                  <div key={item.entity.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-cinzel text-[#f5f0e8] text-sm">{item.entity.name}</p>
                        <p className="text-xs text-[rgba(245,240,232,0.4)]">{item.entity.line || 'Sem linha'}</p>
                      </div>
                      <span className="text-[#c9a84c] text-sm font-semibold">{item.attendedCount} atendido(s)</span>
                    </div>
                    {item.consulentes.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.consulentes.map(person => (
                          <span key={person.attendanceId} className="px-2.5 py-1 rounded border border-[rgba(201,168,76,0.12)] text-xs text-[rgba(245,240,232,0.65)]">
                            {person.name}{person.queueNumber ? ` — senha ${String(person.queueNumber).padStart(3, '0')}` : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[rgba(245,240,232,0.3)] mt-2">Nenhum atendimento finalizado para esta entidade.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </>
          )}

          <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
            <div className="p-4 border-b border-[rgba(201,168,76,0.08)]">
              <h3 className="font-cinzel text-[#c9a84c]">Fila da gira</h3>
              <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">A primeira vez fica separada visualmente para facilitar a chamada e o encaminhamento.</p>
            </div>
            <div className="divide-y divide-[rgba(201,168,76,0.07)]">
              <div className="p-4 bg-emerald-500/5">
                <p className="font-cinzel text-emerald-300 text-sm">Primeira vez ({firstVisitQueue.length})</p>
              </div>
              {firstVisitQueue.length === 0 ? (
                <p className="p-4 text-xs text-[rgba(245,240,232,0.35)]">Nenhum consulente de primeira vez aguardando ou em atendimento.</p>
              ) : firstVisitQueue.map(attendance => (
                <div key={attendance.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-emerald-400/40 flex items-center justify-center font-cinzel text-emerald-300 font-bold">{attendance.queueNumber ? String(attendance.queueNumber).padStart(3, '0') : '—'}</div>
                    <div>
                      <p className="font-inter text-[#f5f0e8] font-semibold">{attendance.user?.name}</p>
                      {attendance.entity && (
                        <p className="text-xs text-[rgba(245,240,232,0.5)] mt-1">
                          {attendance.entity.name}
                          {attendance.entity.owner?.name && <> · <span className="text-[#c9a84c]">Incorporante: {attendance.entity.owner.name}</span></>}
                        </p>
                      )}
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold">PRIMEIRA VEZ</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={(statusClass[attendance.status] || '') + ' px-2.5 py-1 rounded border text-xs'}>{statusLabel[attendance.status] || attendance.status}</span>
                    {attendance.status === 'arrived' && <button onClick={() => openCallDialog(attendance.id)} className="btn-outline-gold text-xs"><PhoneCall size={13}/> Chamar</button>}
                    {attendance.status === 'called' && <button onClick={() => action(attendance.id, 'start')} className="btn-outline-gold text-xs"><Play size={13}/> Iniciar</button>}
                    {attendance.status === 'in_service' && <button onClick={() => action(attendance.id, 'complete')} className="btn-gold text-xs"><CheckCircle2 size={13}/> Finalizar</button>}
                  </div>
                </div>
              ))}
              <div className="p-4 bg-[rgba(201,168,76,0.03)]">
                <p className="font-cinzel text-[#c9a84c] text-sm">Retornantes ({returningQueue.length})</p>
              </div>
              {returningQueue.length === 0 ? (
                <p className="p-4 text-xs text-[rgba(245,240,232,0.35)]">Nenhum consulente retornante aguardando ou em atendimento.</p>
              ) : returningQueue.map(attendance => (
                <div key={attendance.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-[#c9a84c]/30 flex items-center justify-center font-cinzel text-[#c9a84c] font-bold">{attendance.queueNumber ? String(attendance.queueNumber).padStart(3, '0') : '—'}</div>
                    <div>
                      <p className="font-inter text-[#f5f0e8] font-semibold">{attendance.user?.name}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.4)]">{attendance.user?.role}</p>
                      {attendance.entity && (
                        <p className="text-xs text-[rgba(245,240,232,0.5)] mt-1">
                          {attendance.entity.name}
                          {attendance.entity.owner?.name && <> · <span className="text-[#c9a84c]">Incorporante: {attendance.entity.owner.name}</span></>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={(statusClass[attendance.status] || '') + ' px-2.5 py-1 rounded border text-xs'}>{statusLabel[attendance.status] || attendance.status}</span>
                    {attendance.status === 'arrived' && <button onClick={() => openCallDialog(attendance.id)} className="btn-outline-gold text-xs"><PhoneCall size={13}/> Chamar</button>}
                    {attendance.status === 'called' && <button onClick={() => action(attendance.id, 'start')} className="btn-outline-gold text-xs"><Play size={13}/> Iniciar</button>}
                    {attendance.status === 'in_service' && <button onClick={() => action(attendance.id, 'complete')} className="btn-gold text-xs"><CheckCircle2 size={13}/> Finalizar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
