// Vercel deploy sync: histórico das entidades
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, Phone, Star, CreditCard, CheckCircle2, Clock3, AlertCircle, Copy, Check, BarChart3, Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generatePixPayload } from '../utils/pix';
import { dateOnlyTimestamp, todayDateOnly, parseDateOnly } from '../utils/date';
import { QRCodeSVG } from 'qrcode.react';
import { ImageUploader } from '../components/ImageUploader';
import { mediaUrl } from '../lib/api';
import type { PixPaymentConfig } from '../utils/pix';

type EntityHistoryResponse = {
  entities: Array<{
    entity: { id: string; name: string; line: string; active: boolean };
    total: number;
    firstVisits: number;
    returningVisitors: number;
    consulentes: Array<{
      attendanceId: string;
      userId: string;
      name: string;
      queueNumber?: number | null;
      attendedAt?: string | null;
      event: { id: string; title: string; date: string; time: string };
    }>;
  }>;
  totals: { consultations: number; entities: number; uniqueConsulentes: number; firstVisits: number; returningVisitors: number };
};

export const MinhaConta: React.FC = () => {
  const { currentUser, events, siteConfig, authReady, myAttendances, loadMyAttendances } = useApp();
  const [membership, setMembership] = React.useState<{
    membership: { id: string; monthlyAmountCents: number; dueDay: number; active: boolean };
    currentPayment: { id: string; referenceMonth: string; amountCents: number; dueDate: string; status: string; paidAt?: string | null; method?: string | null };
    payments: Array<{ id: string; referenceMonth: string; amountCents: number; dueDate: string; status: string; paidAt?: string | null; method?: string | null }>;
    paymentConfig: PixPaymentConfig | null;
    asaas: { enabled: boolean; environment: string } | null;
  } | null>(null);
  const [membershipLoading, setMembershipLoading] = React.useState(false);
  const [paymentRequested, setPaymentRequested] = React.useState(false);
  const [pixCode, setPixCode] = React.useState('');
  const [pixCopied, setPixCopied] = React.useState(false);
  const [asaasPayment,setAsaasPayment]=React.useState<{paymentId:string;encodedImage:string;payload:string;expirationDate:string}|null>(null);
  const [asaasLoading,setAsaasLoading]=React.useState(false);
  const [asaasCpf,setAsaasCpf]=React.useState((currentUser as {cpfCnpj?:string|null})?.cpfCnpj||'');
  const [asaasError,setAsaasError]=React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState('');
  const [entityHistory, setEntityHistory] = React.useState<EntityHistoryResponse | null>(null);
  const [entityHistoryLoading, setEntityHistoryLoading] = React.useState(false);
  const [queueNotice, setQueueNotice] = React.useState<'next' | 'called' | null>(null);
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const previousQueueStateRef = React.useRef<Record<string, string>>({});
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const canUseMembership = currentUser && currentUser.role !== 'consulente';

  React.useEffect(() => {
    const nextPhoto = currentUser?.profilePhoto ? mediaUrl(currentUser.profilePhoto) : '';
    setProfilePhoto(nextPhoto);
  }, [currentUser?.profilePhoto]);

  React.useEffect(() => {
    if (!currentUser) return;
    const hasActiveAttendance = myAttendances.some(a =>
      a.status === 'confirmed' || a.status === 'arrived' || a.status === 'called' || a.status === 'in_service'
    );
    if (!hasActiveAttendance) return;

    const interval = window.setInterval(() => {
      void loadMyAttendances();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [currentUser, myAttendances, loadMyAttendances]);

  const playQueueAlert = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume();

      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = index === 1 ? 880 : 660;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.16);
      });
    } catch {
      // Alguns navegadores bloqueiam áudio até uma interação do usuário.
    }
  }, [soundEnabled]);

  const enableQueueNotifications = React.useCallback(async () => {
    if (typeof window === 'undefined') return;

    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch {
        setNotificationPermission(Notification.permission);
      }
    } else {
      setNotificationPermission('unsupported');
    }

    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = audioContextRef.current || new AudioContextClass();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();
        setSoundEnabled(true);
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.02);
      }
    } catch {
      setSoundEnabled(false);
    }
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;

    const activeQueueAttendances = myAttendances.filter(a =>
      a.queueNumber && (a.status === 'arrived' || a.status === 'called' || a.status === 'in_service')
    );

    const nextState: Record<string, string> = {};
    activeQueueAttendances.forEach(attendance => {
      nextState[attendance.id] = attendance.status + ':' + (attendance.isNext ? 'next' : 'waiting');
    });

    const previous = previousQueueStateRef.current;

    if (Object.keys(previous).length > 0) {
      activeQueueAttendances.forEach(attendance => {
        const previousState = previous[attendance.id];
        const currentState = nextState[attendance.id];

        if (attendance.status === 'called' && previousState && previousState !== currentState) {
          setQueueNotice('called');
          playQueueAlert();

          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([250, 120, 250, 120, 400]);
          }

          if (notificationPermission === 'granted' && typeof Notification !== 'undefined') {
            try {
              new Notification('Sua vez chegou', {
                body: 'Senha ' + String(attendance.queueNumber).padStart(3, '0') + ' — dirija-se ao atendimento.',
                tag: 'fila-' + attendance.id,
              });
            } catch {
              // A notificação pode ser bloqueada pelo navegador/sistema.
            }
          }
        }

        if (attendance.status === 'arrived' && attendance.isNext && previousState && !previousState.endsWith(':next')) {
          setQueueNotice('next');
          playQueueAlert();

          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.([180, 100, 180]);
          }

          if (notificationPermission === 'granted' && typeof Notification !== 'undefined') {
            try {
              new Notification('Você é o próximo', {
                body: 'Senha ' + String(attendance.queueNumber).padStart(3, '0') + ' — fique próximo ao atendimento.',
                tag: 'fila-next-' + attendance.id,
              });
            } catch {
              // A notificação pode ser bloqueada pelo navegador/sistema.
            }
          }
        }
      });
    }

    previousQueueStateRef.current = nextState;
  }, [myAttendances, notificationPermission, playQueueAlert, currentUser]);

  React.useEffect(() => {
    if (!currentUser || currentUser.role === 'consulente') {
      setEntityHistory(null);
      return;
    }

    setEntityHistoryLoading(true);
    api.get<EntityHistoryResponse>('/api/attendance/my-entity-history')
      .then(setEntityHistory)
      .catch(() => setEntityHistory(null))
      .finally(() => setEntityHistoryLoading(false));
  }, [currentUser?.id, currentUser?.role]);

  React.useEffect(() => {
    if (!canUseMembership) return;
    setMembershipLoading(true);
    api.get<typeof membership>('/api/membership/me')
      .then(setMembership)
      .catch(() => setMembership(null))
      .finally(() => setMembershipLoading(false));
  }, [currentUser?.role]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0d0505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[rgba(201,168,76,0.3)] border-t-[#c9a84c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/entrar" replace />;

  const canViewDevelopment = currentUser.role !== 'consulente' && currentUser.role !== 'compras';
  const todayTimestamp = todayDateOnly().getTime();
  const upcomingEvents = events
    .filter(e => dateOnlyTimestamp(e.date) >= todayTimestamp && (e.isPublic || (canViewDevelopment && e.type === 'Gira de Desenvolvimento')))
    .sort((a, b) => dateOnlyTimestamp(a.date) - dateOnlyTimestamp(b.date) || a.time.localeCompare(b.time))
    .slice(0, currentUser.role === 'consulente' ? 1 : 5);

  const activeAttendance = myAttendances.find(a =>
    a.queueNumber && (a.status === 'arrived' || a.status === 'called' || a.status === 'in_service')
  );

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    agenda: 'Resp. Agenda',
    content: 'Resp. Conteúdo',
    atendimento: 'Atendimento',
    filho: 'Filho',
    consulente: 'Consulente',
    compras: 'Responsável por Compras',
    responsavel_fila: 'Responsável de Fila',
  };

  return (
    <div className="min-h-screen bg-[#0d0505] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Dashboard do usuário */}
        <div className="card-spiritual p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[rgba(201,168,76,0.05)] blur-2xl pointer-events-none" />
          <div className="flex items-start gap-5 flex-wrap relative">
            <div className="w-24 h-24 flex-shrink-0">
              <ImageUploader
                value={profilePhoto}
                onChange={(url) => { setProfilePhoto(url); }}
                uploadPath="/api/auth/profile-photo"
                maxSize={600}
                shape="round"
                compact
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <p className="font-inter text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]/70 mb-1">Minha conta</p>
              <h2 className="font-cinzel font-bold text-white text-2xl md:text-3xl">{currentUser.name}</h2>
              <p className="font-inter text-[rgba(245,240,232,0.45)] text-sm mt-1">{currentUser.email}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-[rgba(201,168,76,0.12)] border border-[rgba(201,168,76,0.3)] text-[#c9a84c] text-[11px] font-cinzel rounded-full">{roleLabels[currentUser.role]}</span>
                <span className="px-2.5 py-1 bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)] text-green-400 text-[11px] font-inter rounded-full">✓ Conta ativa</span>
                {currentUser.degree && <span className="px-2.5 py-1 bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.25)] text-purple-300 text-[11px] font-inter rounded-full">{currentUser.degree.name}</span>}
              </div>
              {currentUser.whatsapp && <p className="font-inter text-xs text-[rgba(245,240,232,0.38)] mt-3">WhatsApp: {currentUser.whatsapp}</p>}
              {currentUser.degree?.description && <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mt-2 max-w-xl">{currentUser.degree.description}</p>}
            </div>
            {(currentUser.role !== 'consulente') && <Link to="/admin" className="btn-gold text-xs w-full sm:w-auto justify-center">Painel Admin</Link>}
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card-spiritual p-4 border border-[rgba(201,168,76,0.12)]"><p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Próximas giras</p><p className="font-cinzel text-xl font-bold text-[#f5f0e8] mt-1">{upcomingEvents.length}</p></div>
          <div className="card-spiritual p-4 border border-[rgba(201,168,76,0.12)]"><p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Minhas giras</p><p className="font-cinzel text-xl font-bold text-[#f5f0e8] mt-1">{myAttendances.length}</p></div>
          <div className="card-spiritual p-4 border border-[rgba(201,168,76,0.12)]"><p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Minha fila</p>{activeAttendance ? <p className="font-cinzel text-xl font-bold text-green-400 mt-1">{String(activeAttendance.queueNumber).padStart(3, '0')}</p> : <p className="font-cinzel text-sm font-bold text-[rgba(245,240,232,0.45)] mt-2">Sem senha ativa</p>}</div>
          <div className="card-spiritual p-4 border border-[rgba(201,168,76,0.12)]"><p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Acesso</p><p className="font-cinzel text-sm font-bold text-[#c9a84c] mt-2">{canViewDevelopment ? 'Membro' : 'Consulente'}</p></div>
        </div>

        <div className="card-spiritual p-6 mb-6 border border-[rgba(201,168,76,0.2)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-base flex items-center gap-2">
                <Calendar size={16} /> Próximas Giras
              </h3>
              <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mt-1">
                {canViewDevelopment ? 'Confira seus próximos compromissos no terreiro.' : 'Confira a próxima gira disponível.'}
              </p>
            </div>
            <Link to="/agenda" className="text-xs font-cinzel text-[#c9a84c] hover:text-[#e8c97a]">
              Ver agenda →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="rounded-lg border border-[rgba(201,168,76,0.1)] bg-[rgba(201,168,76,0.02)] px-4 py-6 text-center">
              <Calendar size={22} className="mx-auto text-[rgba(201,168,76,0.45)]" />
              <p className="font-cinzel text-sm text-[rgba(245,240,232,0.7)] mt-2">Nenhuma gira próxima disponível</p>
              <p className="font-inter text-xs text-[rgba(245,240,232,0.38)] mt-1">Consulte a agenda para acompanhar as próximas datas.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingEvents.slice(0, 2).map(ev => (
                <div key={ev.id} className="p-4 rounded-lg border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{ev.title}</p>
                      <p className="font-inter text-xs text-[rgba(245,240,232,0.48)] mt-1">
                        {format(parseDateOnly(ev.date), "dd 'de' MMMM", { locale: ptBR })} às {ev.time}
                      </p>
                    </div>
                    {ev.type === 'Gira de Desenvolvimento' && (
                      <span className="text-[10px] px-2 py-0.5 rounded border border-purple-400/30 text-purple-300 whitespace-nowrap">
                        Desenvolvimento
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeAttendance && (
          <div className="card-spiritual p-5 mb-6 border border-green-500/25 bg-green-500/[0.03]">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                {queueNotice === 'called' ? <BellRing size={17} className="text-green-300" /> : <Bell size={17} className="text-[#c9a84c]" />}
                <div>
                  <p className="font-cinzel text-sm text-[#c9a84c]">Avisos da fila</p>
                  <p className="text-[10px] text-[rgba(245,240,232,0.4)]">
                    {notificationPermission === 'granted' ? 'Notificações do navegador ativadas.' : 'Ative os avisos para ser alertado quando chegar sua vez.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {soundEnabled ? <Volume2 size={14} className="text-green-300" /> : <VolumeX size={14} className="text-[rgba(245,240,232,0.35)]" />}
                {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                  <button onClick={enableQueueNotifications} className="btn-outline-gold text-[11px] py-2">
                    <Bell size={13} /> Ativar avisos
                  </button>
                )}
                {notificationPermission === 'unsupported' && (
                  <span className="text-[10px] text-[rgba(245,240,232,0.35)]">Navegador sem suporte a notificações</span>
                )}
              </div>
            </div>

            {queueNotice === 'called' && (
              <div className="mb-4 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-green-400/15 p-2"><BellRing size={18} className="text-green-300" /></div>
                  <div>
                    <p className="font-cinzel font-bold text-green-200">Sua vez chegou!</p>
                    <p className="font-inter text-xs text-green-100/75 mt-1">Senha {String(activeAttendance.queueNumber).padStart(3, '0')} — dirija-se ao atendimento.</p>
                  </div>
                  <button type="button" onClick={() => setQueueNotice(null)} className="ml-auto text-green-100/50 hover:text-white" aria-label="Fechar aviso">×</button>
                </div>
              </div>
            )}

            {queueNotice === 'next' && activeAttendance.status === 'arrived' && (
              <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-500/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock3 size={17} className="text-yellow-300" />
                  <div>
                    <p className="font-cinzel font-bold text-yellow-200">Você é o próximo!</p>
                    <p className="font-inter text-xs text-yellow-100/70 mt-1">Senha {String(activeAttendance.queueNumber).padStart(3, '0')} — fique próximo ao atendimento.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-green-300/70 font-cinzel">Minha fila</p><h3 className="font-cinzel font-bold text-white text-lg mt-1">{activeAttendance.status === 'called' ? 'Você foi chamado' : activeAttendance.status === 'in_service' ? 'Atendimento em andamento' : 'Você está na fila'}</h3><p className="font-inter text-xs text-green-100/60 mt-1">{activeAttendance.event?.title || 'Gira em atendimento'}</p></div>
              <div className="text-center min-w-[86px]"><p className="text-[9px] uppercase tracking-wider text-green-300/60">Senha</p><p className="font-cinzel font-bold text-green-300 text-3xl">{String(activeAttendance.queueNumber).padStart(3, '0')}</p></div>
            </div>
            {activeAttendance.status === 'arrived' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-green-300/60">Sua posição</p>
                  <p className="font-cinzel font-bold text-green-300 text-lg mt-0.5">{activeAttendance.queuePosition ? activeAttendance.queuePosition + 'º' : '—'}</p>
                </div>
                <div className="rounded-lg border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.04)] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-[#c9a84c]/70">À frente</p>
                  <p className="font-cinzel font-bold text-[#c9a84c] text-lg mt-0.5">{activeAttendance.peopleAhead ?? 0}</p>
                </div>
              </div>
            )}
            {activeAttendance.status === 'arrived' && activeAttendance.estimatedWaitMinutes !== undefined && (
              <div className="mt-3 rounded-lg border border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.04)] px-3 py-2 text-xs text-[rgba(245,240,232,0.65)]">
                <span className="text-[#c9a84c] font-semibold">Estimativa:</span>{' '}
                {activeAttendance.estimatedWaitMinutes <= 0
                  ? 'atendimento previsto em breve.'
                  : 'aproximadamente ' + activeAttendance.estimatedWaitMinutes + ' min de espera.'}
                <span className="block text-[10px] text-[rgba(245,240,232,0.35)] mt-1">Estimativa baseada no ritmo dos atendimentos desta gira.</span>
              </div>
            )}
            {activeAttendance.status === 'arrived' && activeAttendance.isNext && (
              <div className="mt-3 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-200/80">
                Você é o próximo da fila. Aguarde a chamada.
              </div>
            )}
          </div>
        )}

        {canViewDevelopment && (
          <Link to="/area-do-filho" className="card-spiritual p-6 mb-6 block border border-[rgba(201,168,76,0.2)] hover:border-[rgba(201,168,76,0.45)] transition-all">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-cinzel font-bold text-[#c9a84c] text-base">📚 Área do Filho</h3>
                <p className="font-inter text-xs text-[rgba(245,240,232,0.45)] mt-1">Acesse seus conteúdos de estudo, materiais e módulos liberados para o seu grau.</p>
              </div>
              <span className="text-[#c9a84c] text-sm">Acessar →</span>
            </div>
          </Link>
        )}

        {canUseMembership && (
          <div className="card-spiritual p-6 mb-6 border border-[rgba(201,168,76,0.2)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-cinzel font-bold text-[#c9a84c] text-base flex items-center gap-2">
                  <CreditCard size={16} /> Minha Mensalidade
                </h3>
                <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mt-1">Acompanhe seus pagamentos e vencimentos.</p>
              </div>
              {membership?.currentPayment && (
                <span className={`px-2.5 py-1 rounded border text-xs ${membership.currentPayment.status === 'paid' ? 'text-green-400 border-green-500/30 bg-green-500/10' : membership.currentPayment.status === 'overdue' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'}`}>
                  {membership.currentPayment.status === 'paid' ? 'Pago' : membership.currentPayment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                </span>
              )}
            </div>
            {membershipLoading ? (
              <p className="font-inter text-sm text-[rgba(245,240,232,0.45)]">Carregando mensalidade...</p>
            ) : !membership ? (
              <p className="font-crimson text-[rgba(245,240,232,0.45)] text-sm italic">Sua mensalidade ainda não foi configurada pela administração.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]"><p className="text-xs text-[rgba(245,240,232,0.4)]">Valor</p><p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{(membership.currentPayment.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]"><p className="text-xs text-[rgba(245,240,232,0.4)]">Vencimento</p><p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{new Date(membership.currentPayment.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]"><p className="text-xs text-[rgba(245,240,232,0.4)]">Referência</p><p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{membership.currentPayment.referenceMonth}</p></div>
                </div>
                {membership.currentPayment.status !== 'paid' && membership.asaas?.enabled && (
                  <div className="mt-5 p-4 rounded border border-green-500/20 bg-green-500/5">
                    <p className="font-cinzel text-green-300 text-sm">Pagamento pelo Asaas</p><p className="text-[11px] text-[rgba(245,240,232,0.45)] mt-1">Gere um PIX dinâmico. Quando o pagamento for confirmado, a mensalidade será atualizada automaticamente.</p>
                    {!asaasPayment&&<div className="mt-3 space-y-2"><label className="form-label">CPF/CNPJ do pagador</label><input value={asaasCpf} onChange={e=>setAsaasCpf(e.target.value)} placeholder="Digite seu CPF ou CNPJ" className="form-input" inputMode="numeric"/><button onClick={async()=>{setAsaasLoading(true);setAsaasError('');try{const r=await api.post<{paymentId:string;encodedImage:string;payload:string;expirationDate:string}>('/api/membership/me/asaas-payment',{cpfCnpj:asaasCpf});setAsaasPayment(r);}catch(e){setAsaasError(e instanceof Error?e.message:'Não foi possível gerar o PIX.');}finally{setAsaasLoading(false);}}} className="btn-gold text-xs" disabled={asaasLoading}>{asaasLoading?'Gerando PIX...':'Gerar PIX pelo Asaas'}</button></div>}
                    {asaasError&&<p className="mt-2 text-xs text-red-300">{asaasError}</p>}
                    {asaasPayment&&<div className="mt-3 grid md:grid-cols-[160px_1fr] gap-4 items-start"><div className="bg-white rounded p-2"><img src={`data:image/png;base64,${asaasPayment.encodedImage}`} alt="QR Code PIX da mensalidade" className="w-full aspect-square object-contain"/></div><div><p className="text-xs text-[rgba(245,240,232,0.6)] mb-2">PIX copia e cola</p><textarea readOnly value={asaasPayment.payload} className="form-input min-h-24 text-[11px]" onFocus={e=>e.currentTarget.select()}/><button onClick={async()=>{await navigator.clipboard.writeText(asaasPayment.payload);setPixCopied(true);window.setTimeout(()=>setPixCopied(false),1800);}} className="btn-outline-gold text-xs mt-2"><Copy size={13}/> {pixCopied?'Copiado!':'Copiar PIX'}</button><p className="text-[10px] text-[rgba(245,240,232,0.4)] mt-2">Expira em: {new Date(asaasPayment.expirationDate).toLocaleString('pt-BR')}</p></div></div>}
                  </div>
                )}

                {membership.currentPayment.status !== 'paid' && membership.paymentConfig && (
                  <div className="mt-5 p-4 rounded border border-[rgba(201,168,76,0.14)] bg-[rgba(201,168,76,0.03)]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-cinzel text-[#c9a84c] text-sm">Pagamento da mensalidade</p>
                        <p className="text-[11px] text-[rgba(245,240,232,0.45)] mt-1">Use o PIX configurado pela administração para este valor.</p>
                      </div>
                      <span className="text-xs text-[rgba(245,240,232,0.55)]">{membership.paymentConfig.receiverName}</span>
                    </div>

                    {membership.paymentConfig.method === 'pix' && membership.paymentConfig.pixKey && (
                      <>
                        <div className="p-3 rounded border border-[rgba(201,168,76,0.08)]">
                          <p className="text-[11px] text-[rgba(245,240,232,0.4)]">Chave PIX</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm text-[#f5f0e8] break-all flex-1">{membership.paymentConfig.pixKey}</code>
                            <button onClick={async () => { await navigator.clipboard.writeText(membership.paymentConfig?.pixKey || ''); setPixCopied(true); window.setTimeout(() => setPixCopied(false), 1800); }} className="p-2 border border-[rgba(201,168,76,0.15)] rounded text-[#c9a84c]" title="Copiar chave PIX">
                              {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button onClick={() => { try { const code = generatePixPayload(membership.paymentConfig as PixPaymentConfig, membership.currentPayment.amountCents, membership.currentPayment.id); setPixCode(code); } catch { setPixCode(''); } }} className="btn-gold text-xs">Gerar código PIX</button>
                          {pixCode && <button onClick={async () => { await navigator.clipboard.writeText(pixCode); setPixCopied(true); window.setTimeout(() => setPixCopied(false), 1800); }} className="btn-outline-gold text-xs"><Copy size={13} /> Copiar código PIX</button>}
                        </div>
                        {pixCode && <div className="mt-3"><p className="text-[11px] text-[rgba(245,240,232,0.4)] mb-1">PIX copia e cola</p><textarea readOnly value={pixCode} className="form-input min-h-24 text-[11px] break-all" onFocus={e => e.currentTarget.select()} /></div>}
                      </>
                    )}

                    {membership.paymentConfig.bankDetails && <div className="mt-3"><p className="text-[11px] text-[rgba(245,240,232,0.4)] mb-1">Dados para transferência</p><p className="text-xs text-[rgba(245,240,232,0.7)] whitespace-pre-line">{membership.paymentConfig.bankDetails}</p></div>}
                    {membership.paymentConfig.instructions && <p className="text-xs text-[rgba(245,240,232,0.55)] mt-3 whitespace-pre-line">{membership.paymentConfig.instructions}</p>}
                  </div>
                )}

                {membership.currentPayment.status !== 'paid' && (
                  <button onClick={async () => { try { await api.post('/api/membership/me/payment-request', {}); setPaymentRequested(true); } catch { setPaymentRequested(false); } }} className="btn-outline-gold text-xs mt-3">Solicitar confirmação / instruções</button>
                )}
                {paymentRequested && <p className="text-green-400 text-xs mt-2">Solicitação registrada para a administração.</p>}
                <div className="mt-5 pt-4 border-t border-[rgba(201,168,76,0.08)]">
                  <p className="font-cinzel text-[#c9a84c] text-sm mb-3">Histórico</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {membership.payments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between gap-3 p-2 rounded border border-[rgba(201,168,76,0.06)]">
                        <span className="text-xs text-[rgba(245,240,232,0.65)]">{payment.referenceMonth}</span>
                        <span className="text-xs text-[rgba(245,240,232,0.5)]">{(payment.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span className="text-xs flex items-center gap-1">
                          {payment.status === 'paid' ? <CheckCircle2 size={13} className="text-green-400" /> : payment.status === 'overdue' ? <AlertCircle size={13} className="text-red-400" /> : <Clock3 size={13} className="text-yellow-300" />}
                          {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* QR Codes e senhas das giras confirmadas */}
        {myAttendances.length > 0 && (
          <div className="card-spiritual p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-[#c9a84c]" />
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-base">Minhas Giras Confirmadas</h3>
            </div>
            <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mb-4">Apresente o QR Code abaixo na chegada. Depois do check-in, sua senha aparecerá aqui automaticamente.</p>
            <div className="space-y-3">
              {myAttendances.filter(a => { const event = events.find(e => e.id === a.eventId); return event && !event.isPublic ? currentUser.role !== 'consulente' : true; }).map(attendance => {
                const event = attendance.event || events.find(e => e.id === attendance.eventId);
                if (!event) return null;
                const statusLabel: Record<string, string> = { confirmed: 'Confirmado', arrived: 'Na fila', called: 'Chamado', in_service: 'Em atendimento', attended: 'Atendido' };
                return (
                  <div key={attendance.id} className="p-4 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="bg-white rounded-lg p-3 flex-shrink-0"><QRCodeSVG value={attendance.qrToken} size={150} level="M" includeMargin /></div>
                      <div className="flex-1 w-full">
                        <p className="font-cinzel font-bold text-[#f5f0e8]">{event.title}</p>
                        <p className="font-inter text-xs text-[rgba(245,240,232,0.5)] mt-1">{event.date} às {event.time}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3"><span className="px-2.5 py-1 rounded border border-[#c9a84c]/30 text-[#c9a84c] text-xs">{statusLabel[attendance.status] || attendance.status}</span></div>
                        {attendance.entity && <div className="mt-3 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-3"><p className="text-[10px] uppercase tracking-wider text-[#c9a84c]/70 font-cinzel">Entidade do atendimento</p><p className="font-cinzel font-bold text-[#f5f0e8] text-base mt-1">{attendance.entity.name}</p>{attendance.entity.line && <p className="text-[11px] text-[rgba(245,240,232,0.45)] mt-0.5">{attendance.entity.line}</p>}</div>}
                        {attendance.queueNumber && <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3"><p className="text-[10px] uppercase tracking-wider text-green-300/70 font-cinzel">Sua senha na fila</p><p className="font-cinzel font-bold text-green-300 text-3xl mt-1">{String(attendance.queueNumber).padStart(3, '0')}</p><p className="text-[11px] text-green-200/70 mt-1">Aguarde sua chamada. Esta senha foi atribuída no momento da chegada.</p></div>}
                        <p className="text-[11px] text-[rgba(245,240,232,0.4)] mt-3">{attendance.status === 'confirmed' ? 'Sua senha será definida quando o responsável escanear este QR Code.' : attendance.status === 'arrived' ? 'Você está aguardando ser chamado.' : attendance.status === 'called' ? 'Você foi chamado. Dirija-se ao atendimento.' : attendance.status === 'in_service' ? 'Seu atendimento está em andamento.' : 'Atendimento concluído.'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {entityHistory && entityHistory.entities.length > 0 && (
          <div className="card-spiritual p-6 mt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-cinzel font-bold text-[#c9a84c] text-base flex items-center gap-2">
                  <BarChart3 size={17} /> Histórico das minhas entidades
                </h3>
                <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mt-1">
                  Acompanhe os consulentes atendidos pelas entidades vinculadas ao seu cadastro.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full border border-[rgba(201,168,76,0.25)] text-[#c9a84c] text-[10px]">
                {entityHistory.totals.entities} entidade(s) vinculada(s)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="p-3 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Total de consultas</p>
                <p className="font-cinzel text-xl font-bold text-[#f5f0e8] mt-1">{entityHistory.totals.consultations}</p>
              </div>
              <div className="p-3 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Consulentes únicos</p>
                <p className="font-cinzel text-xl font-bold text-[#f5f0e8] mt-1">{entityHistory.totals.uniqueConsulentes}</p>
              </div>
              <div className="p-3 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Primeira vez</p>
                <p className="font-cinzel text-xl font-bold text-emerald-300 mt-1">{entityHistory.totals.firstVisits}</p>
              </div>
              <div className="p-3 rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(201,168,76,0.03)]">
                <p className="text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Retornos</p>
                <p className="font-cinzel text-xl font-bold text-[#c9a84c] mt-1">{entityHistory.totals.returningVisitors}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {entityHistory.entities.map(item => (
                <details key={item.entity.id} className="rounded border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.015)] overflow-hidden">
                  <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-cinzel text-[#f5f0e8] text-sm">{item.entity.name}</p>
                      <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">
                        {item.entity.line || 'Sem linha'} · {item.total} consulta(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="px-2 py-1 rounded border border-emerald-500/20 text-emerald-300">{item.firstVisits} 1ª vez</span>
                      <span className="px-2 py-1 rounded border border-[rgba(201,168,76,0.2)] text-[#c9a84c]">{item.returningVisitors} retorno(s)</span>
                    </div>
                  </summary>
                  <div className="border-t border-[rgba(201,168,76,0.08)] divide-y divide-[rgba(201,168,76,0.06)]">
                    {item.consulentes.length ? item.consulentes.map(record => (
                      <div key={record.attendanceId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-[#f5f0e8] font-semibold">{record.name}</p>
                          <p className="text-xs text-[rgba(245,240,232,0.4)] mt-1">
                            {record.event.title} · {record.event.date} {record.event.time}
                            {record.queueNumber ? ` · Senha ${String(record.queueNumber).padStart(3, '0')}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-[rgba(245,240,232,0.4)] uppercase">
                          {record.attendedAt ? format(new Date(record.attendedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data não registrada'}
                        </span>
                      </div>
                    )) : (
                      <p className="p-4 text-xs text-[rgba(245,240,232,0.35)]">Nenhum atendimento concluído para esta entidade.</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {entityHistoryLoading && currentUser.role !== 'consulente' && (
          <div className="card-spiritual p-4 mt-6 text-xs text-[rgba(245,240,232,0.4)]">
            Carregando histórico das entidades vinculadas...
          </div>
        )}

        {/* Quick Access */}
        <div className="card-spiritual p-6 mt-6">
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-1 flex items-center gap-2"><Star size={16} />Acesso Rápido</h3>
          <p className="font-inter text-xs text-[rgba(245,240,232,0.4)] mb-4">Acesse rapidamente as áreas mais utilizadas.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/agenda" className="btn-outline-gold text-xs justify-center"><Calendar size={14} />Agenda</Link>
            {canViewDevelopment && <Link to="/area-do-filho" className="btn-outline-gold text-xs justify-center">📚 Área do Filho</Link>}
            <button onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de agendar uma consulta.')}`, '_blank')} className="btn-wine text-xs"><Phone size={14} />Agendar Consulta</button>
            <Link to="/duvidas" className="btn-outline-gold text-xs justify-center">Tire Dúvidas</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
