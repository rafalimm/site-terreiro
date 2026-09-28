import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Calendar, Phone, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext';

const typeLabels: Record<string, string> = {
  cartas: 'Jogo de Cartas',
  buzios: 'Jogo de Búzios',
  consulta: 'Consulta / Atendimento Geral',
};

const emptyForm = {
  name: '',
  whatsapp: '',
  email: '',
  type: 'consulta',
  preferredDate: '',
  preferredTime: '',
  notes: '',
};

export const Agendar: React.FC = () => {
  const { addAppointment, siteConfig } = useApp();
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo');

  const [form, setForm] = useState({
    ...emptyForm,
    type: tipoInicial === 'cartas' || tipoInicial === 'buzios' ? tipoInicial : 'consulta',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.whatsapp || !form.preferredDate || !form.preferredTime) return;
    setLoading(true);
    setError(false);
    const success = await addAppointment({
      name: form.name,
      whatsapp: form.whatsapp,
      email: form.email || undefined,
      type: form.type as 'cartas' | 'buzios' | 'consulta',
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      notes: form.notes,
    });
    setLoading(false);
    if (success) setSubmitted(true);
    else setError(true);
  };

  const confirmarPeloWhatsApp = () => {
    const dataFormatada = form.preferredDate
      ? new Date(form.preferredDate + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';
    const msg =
      `Olá! Gostaria de confirmar meu pedido de agendamento pelo site:\n\n` +
      `Nome: ${form.name}\n` +
      `Tipo: ${typeLabels[form.type]}\n` +
      `Data desejada: ${dataFormatada}\n` +
      `Horário desejado: ${form.preferredTime}`;
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0505] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-[#c9a84c] mx-auto mb-6" />
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-2xl mb-4">Pedido Recebido!</h2>
          <p className="font-crimson text-[rgba(245,240,232,0.7)] text-lg mb-4 italic">
            Seu pedido de agendamento para <strong>{typeLabels[form.type]}</strong> foi registrado.
            Nossa equipe vai confirmar a data e o horário com você.
          </p>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm mb-8">
            Para agilizar, você também pode confirmar diretamente pelo WhatsApp agora:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={confirmarPeloWhatsApp} className="btn-wine">
              <Phone size={16} />
              Confirmar pelo WhatsApp
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ ...emptyForm });
              }}
              className="btn-outline-gold"
            >
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0505]">
      <div className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Marque sua consulta</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Agendar Consulta</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Escolha o dia e horário de sua preferência
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24">
        <div className="flex items-start gap-3 p-4 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.05)] mb-8">
          <Clock size={18} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
          <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">
            Este é um <strong>pedido de horário</strong> — nossa equipe confirma a disponibilidade com você
            pelo WhatsApp antes de garantir a data. Giras e eventos ficam na página{' '}
            <Link to="/agenda" className="text-[#c9a84c] underline">Agenda</Link>.
          </p>
        </div>

        <div className="card-spiritual p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Nome Completo *</label>
              <input
                type="text" required className="form-input" placeholder="Seu nome completo"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">WhatsApp *</label>
                <input
                  type="tel" required className="form-input" placeholder="(11) 99999-9999"
                  value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">E-mail</label>
                <input
                  type="email" className="form-input" placeholder="seu@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Tipo de Atendimento *</label>
              <select
                className="form-input" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="consulta">Consulta / Atendimento Geral</option>
                <option value="cartas">Jogo de Cartas</option>
                <option value="buzios">Jogo de Búzios</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Data Desejada *</label>
                <input
                  type="date" required className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Horário Desejado *</label>
                <input
                  type="time" required className="form-input"
                  value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Observações</label>
              <textarea
                rows={4} className="form-input resize-none"
                placeholder="Alguma informação adicional que queira compartilhar..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[rgba(139,26,26,0.15)] border border-red-500/30 rounded">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="font-inter text-red-300 text-xs">
                  Não foi possível enviar seu pedido. Verifique sua conexão e tente novamente.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full justify-center">
              {loading ? (
                <div className="w-4 h-4 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" />
              ) : (
                <Calendar size={16} />
              )}
              {loading ? 'Enviando...' : 'Solicitar Agendamento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
