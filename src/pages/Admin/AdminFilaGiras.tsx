import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, Clock3, PhoneCall, Play, QrCode, RefreshCw, Users, XCircle } from 'lucide-react';
import { useApp, GiraAttendance } from '../../store/AppContext';
import { api } from '../../lib/api';

type QueueResponse = {
  event: { id: string; title: string; date: string; time: string; type: string };
  counts: { confirmed: number; arrived: number; called: number; inService: number; attended: number };
  attendances: Array<GiraAttendance & { user: { id: string; name: string; email: string; whatsapp?: string; role: string } }>;
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

export const AdminFilaGiras: React.FC = () => {
  const { events } = useApp();
  const [eventId, setEventId] = useState('');
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState('');
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
    if (events.length && !eventId) setEventId(events[0].id);
  }, [events, eventId]);

  useEffect(() => {
    if (eventId) loadQueue();
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current.clear().catch(() => undefined);
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
              const updated = await api.post<GiraAttendance>(
                `/api/admin/events/${eventId}/attendance/check-in`,
                { qrToken: decodedText }
              );
              setMessage(`Chegada registrada: ${updated.user?.name || 'participante'} — senha ${String(updated.queueNumber).padStart(3, '0')}.`);
              await loadQueue();
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

  const action = async (attendanceId: string, endpoint: 'call' | 'start' | 'complete') => {
    try {
      await api.post(`/api/admin/events/${eventId}/attendance/${attendanceId}/${endpoint}`, {});
      await loadQueue();
      setMessage(endpoint === 'call' ? 'Participante chamado.' : endpoint === 'start' ? 'Atendimento iniciado.' : 'Atendimento finalizado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a fila.');
    }
  };

  const current = queue?.attendances.find(a => a.status === 'in_service') || queue?.attendances.find(a => a.status === 'called');

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
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.date} — {event.time} — {event.title}</option>
          ))}
        </select>
      </div>

      {queue && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

          {current && (
            <div className="bg-[rgba(201,168,76,0.06)] border border-[#c9a84c]/30 rounded p-5">
              <p className="text-xs text-[#c9a84c] font-cinzel uppercase tracking-wider">Em destaque</p>
              <div className="flex items-center justify-between gap-4 mt-2 flex-wrap">
                <div>
                  <p className="font-cinzel text-white text-lg">{current.user?.name}</p>
                  <p className="text-xs text-[rgba(245,240,232,0.45)]">Senha {current.queueNumber ? String(current.queueNumber).padStart(3, '0') : '—'}</p>
                </div>
                {current.status === 'called' && <button onClick={() => action(current.id, 'start')} className="btn-gold text-xs"><Play size={14}/> Iniciar atendimento</button>}
                {current.status === 'in_service' && <button onClick={() => action(current.id, 'complete')} className="btn-gold text-xs"><CheckCircle2 size={14}/> Finalizar atendimento</button>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={startScanner} disabled={scannerOpen} className="btn-gold text-xs"><QrCode size={15}/> Escanear chegada</button>
            <button onClick={loadQueue} disabled={loading} className="btn-outline-gold text-xs"><RefreshCw size={14}/> {loading ? 'Atualizando...' : 'Atualizar fila'}</button>
          </div>

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

          {message && <div className="p-3 rounded border border-[#c9a84c]/20 bg-[#c9a84c]/5 text-sm text-[#f5f0e8]">{message}</div>}

          <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
            <div className="p-4 border-b border-[rgba(201,168,76,0.08)]">
              <h3 className="font-cinzel text-[#c9a84c]">Fila da gira</h3>
            </div>
            <div className="divide-y divide-[rgba(201,168,76,0.07)]">
              {queue.attendances.length === 0 ? (
                <p className="p-6 text-sm text-[rgba(245,240,232,0.4)]">Nenhuma confirmação registrada.</p>
              ) : queue.attendances.map(attendance => (
                <div key={attendance.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-[#c9a84c]/30 flex items-center justify-center font-cinzel text-[#c9a84c] font-bold">
                      {attendance.queueNumber ? String(attendance.queueNumber).padStart(3, '0') : '—'}
                    </div>
                    <div>
                      <p className="font-inter text-[#f5f0e8] font-semibold">{attendance.user?.name}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.4)]">{attendance.user?.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={(statusClass[attendance.status] || '') + ' px-2.5 py-1 rounded border text-xs'}>
                      {statusLabel[attendance.status] || attendance.status}
                    </span>
                    {attendance.status === 'arrived' && <button onClick={() => action(attendance.id, 'call')} className="btn-outline-gold text-xs"><PhoneCall size={13}/> Chamar</button>}
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
