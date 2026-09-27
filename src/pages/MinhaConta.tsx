import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, Calendar, Newspaper, Phone, Star, CreditCard, CheckCircle2, Clock3, AlertCircle, Copy, Check } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generatePixPayload, PixPaymentConfig } from '../utils/pix';

export const MinhaConta: React.FC = () => {
  const { currentUser, events, newsItems, siteConfig, authReady } = useApp();
  const [membership, setMembership] = React.useState<{
    membership: { id: string; monthlyAmountCents: number; dueDay: number; active: boolean };
    currentPayment: { referenceMonth: string; amountCents: number; dueDate: string; status: string; paidAt?: string | null; method?: string | null };
    payments: Array<{ id: string; referenceMonth: string; amountCents: number; dueDate: string; status: string; paidAt?: string | null; method?: string | null }>;
    paymentConfig: PixPaymentConfig | null;
  } | null>(null);
  const [membershipLoading, setMembershipLoading] = React.useState(false);
  const [paymentRequested, setPaymentRequested] = React.useState(false);
  const [pixCode, setPixCode] = React.useState('');
  const [pixCopied, setPixCopied] = React.useState(false);

  const canUseMembership = currentUser && currentUser.role !== 'consulente';

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

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && e.isPublic)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const latestNews = newsItems.filter(n => n.active).slice(0, 3);

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    agenda: 'Resp. Agenda',
    content: 'Resp. Conteúdo',
    atendimento: 'Atendimento',
    filho: 'Filho',
    consulente: 'Consulente',
  };

  return (
    <div className="min-h-screen bg-[#0d0505] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile */}
        <div className="card-spiritual p-8 mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-20 h-20 rounded-full border-2 border-[#c9a84c] bg-[rgba(201,168,76,0.1)] flex items-center justify-center flex-shrink-0">
              <User size={32} className="text-[#c9a84c]" />
            </div>
            <div className="flex-1">
              <h2 className="font-cinzel font-bold text-white text-2xl">{currentUser.name}</h2>
              <p className="font-inter text-[rgba(245,240,232,0.5)] text-sm">{currentUser.email}</p>
              {currentUser.whatsapp && <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{currentUser.whatsapp}</p>}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.3)] text-[#c9a84c] text-xs font-cinzel rounded">
                  {roleLabels[currentUser.role]}
                </span>
                <span className="px-2 py-0.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-green-400 text-xs font-inter rounded">
                  ✓ Conta Ativa
                </span>
              </div>
            </div>
            {(currentUser.role !== 'consulente') && (
              <Link to="/admin" className="btn-gold text-xs">
                Painel Admin
              </Link>
            )}
          </div>
        </div>

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
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]">
                    <p className="text-xs text-[rgba(245,240,232,0.4)]">Valor</p>
                    <p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{(membership.currentPayment.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]">
                    <p className="text-xs text-[rgba(245,240,232,0.4)]">Vencimento</p>
                    <p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{new Date(membership.currentPayment.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="p-3 rounded border border-[rgba(201,168,76,0.1)]">
                    <p className="text-xs text-[rgba(245,240,232,0.4)]">Referência</p>
                    <p className="font-cinzel font-bold text-[#f5f0e8] mt-1">{membership.currentPayment.referenceMonth}</p>
                  </div>
                </div>
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
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(membership.paymentConfig?.pixKey || '');
                                setPixCopied(true);
                                window.setTimeout(() => setPixCopied(false), 1800);
                              }}
                              className="p-2 border border-[rgba(201,168,76,0.15)] rounded text-[#c9a84c]"
                              title="Copiar chave PIX"
                            >
                              {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => {
                              try {
                                const code = generatePixPayload(
                                  membership.paymentConfig as PixPaymentConfig,
                                  membership.currentPayment.amountCents,
                                  membership.currentPayment.id
                                );
                                setPixCode(code);
                              } catch {
                                setPixCode('');
                              }
                            }}
                            className="btn-gold text-xs"
                          >
                            Gerar código PIX
                          </button>
                          {pixCode && (
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(pixCode);
                                setPixCopied(true);
                                window.setTimeout(() => setPixCopied(false), 1800);
                              }}
                              className="btn-outline-gold text-xs"
                            >
                              <Copy size={13} /> Copiar código PIX
                            </button>
                          )}
                        </div>

                        {pixCode && (
                          <div className="mt-3">
                            <p className="text-[11px] text-[rgba(245,240,232,0.4)] mb-1">PIX copia e cola</p>
                            <textarea readOnly value={pixCode} className="form-input min-h-24 text-[11px] break-all" onFocus={e => e.currentTarget.select()} />
                          </div>
                        )}
                      </>
                    )}

                    {membership.paymentConfig.bankDetails && (
                      <div className="mt-3">
                        <p className="text-[11px] text-[rgba(245,240,232,0.4)] mb-1">Dados para transferência</p>
                        <p className="text-xs text-[rgba(245,240,232,0.7)] whitespace-pre-line">{membership.paymentConfig.bankDetails}</p>
                      </div>
                    )}
                    {membership.paymentConfig.instructions && (
                      <p className="text-xs text-[rgba(245,240,232,0.55)] mt-3 whitespace-pre-line">{membership.paymentConfig.instructions}</p>
                    )}
                  </div>
                )}

                {membership.currentPayment.status !== 'paid' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.post('/api/membership/me/payment-request', {});
                        setPaymentRequested(true);
                      } catch { setPaymentRequested(false); }
                    }}
                    className="btn-outline-gold text-xs mt-3"
                  >
                    Solicitar confirmação / instruções
                  </button>
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="card-spiritual p-6">
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
              <Calendar size={16} />
              Próximas Giras
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">Nenhuma gira programada no momento.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="p-3 border border-[rgba(201,168,76,0.1)] rounded">
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm">{ev.title}</p>
                    <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs mt-0.5">
                      {format(new Date(ev.date), "dd 'de' MMMM", { locale: ptBR })} às {ev.time}
                    </p>
                  </div>
                ))}
                <Link to="/agenda" className="block text-center font-cinzel text-[#c9a84c] text-xs hover:text-[#e8c97a] transition-colors pt-2">
                  Ver agenda completa →
                </Link>
              </div>
            )}
          </div>

          {/* Latest News */}
          <div className="card-spiritual p-6">
            <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
              <Newspaper size={16} />
              Últimas Notícias
            </h3>
            {latestNews.length === 0 ? (
              <p className="font-crimson text-[rgba(245,240,232,0.4)] text-base italic">Nenhuma notícia publicada.</p>
            ) : (
              <div className="space-y-3">
                {latestNews.map(news => (
                  <div key={news.id} className="p-3 border border-[rgba(201,168,76,0.1)] rounded">
                    <span className="text-xs text-[#c9a84c] font-cinzel">{news.category}</span>
                    <p className="font-cinzel font-bold text-[#f5f0e8] text-sm mt-0.5">{news.title}</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.4)] text-xs line-clamp-2 mt-0.5">{news.content}</p>
                  </div>
                ))}
                <Link to="/noticias" className="block text-center font-cinzel text-[#c9a84c] text-xs hover:text-[#e8c97a] transition-colors pt-2">
                  Ver todas as notícias →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="card-spiritual p-6 mt-6">
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4 flex items-center gap-2">
            <Star size={16} />
            Acesso Rápido
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/agenda" className="btn-outline-gold text-xs justify-center">
              <Calendar size={14} />
              Agenda
            </Link>
            <button
              onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de agendar uma consulta.')}`, '_blank')}
              className="btn-wine text-xs"
            >
              <Phone size={14} />
              Agendar Consulta
            </button>
            <Link to="/duvidas" className="btn-outline-gold text-xs justify-center">
              Tire Dúvidas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
