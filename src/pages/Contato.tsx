import React, { useState } from 'react';
import { Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const Contato: React.FC = () => {
  const { siteConfig, addContactMessage } = useApp();
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setLoading(true);
    setTimeout(() => {
      addContactMessage(form);
      setSubmitted(true);
      setLoading(false);
    }, 800);
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de mais informações.')}`, '_blank');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0505] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-[#c9a84c] mx-auto mb-6" />
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-2xl mb-4">Mensagem Enviada!</h2>
          <p className="font-crimson text-[rgba(245,240,232,0.7)] text-lg mb-8 italic">
            Obrigado pelo contato. Nossa equipe retornará em breve. Que a luz espiritual guie seus caminhos. 🙏
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', whatsapp: '', email: '', subject: '', message: '' }); }}
              className="btn-outline-gold"
            >
              Nova Mensagem
            </button>
            <button onClick={openWhatsApp} className="btn-wine">
              <Phone size={16} />
              Falar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Fale com a Gente</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Fale Conosco</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Estamos prontos para receber você
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="card-spiritual p-8">
              <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6">Informações de Contato</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 border border-[rgba(201,168,76,0.1)] rounded hover:border-[rgba(201,168,76,0.3)] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.3)] flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-cinzel text-[#f5f0e8] text-sm font-bold tracking-wider mb-0.5">WhatsApp</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">(11) 94008-7119</p>
                    <button onClick={openWhatsApp} className="btn-wine text-xs mt-2">
                      Falar Agora
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border border-[rgba(201,168,76,0.1)] rounded hover:border-[rgba(201,168,76,0.3)] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📸</span>
                  </div>
                  <div>
                    <p className="font-cinzel text-[#f5f0e8] text-sm font-bold tracking-wider mb-0.5">Instagram</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">@centrodeumbandazedolaco</p>
                    <a
                      href="https://www.instagram.com/centrodeumbandazedolaco/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-gold text-xs mt-2"
                    >
                      Seguir
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 border border-[rgba(201,168,76,0.1)] rounded hover:border-[rgba(201,168,76,0.3)] transition-all">
                  <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="font-cinzel text-[#f5f0e8] text-sm font-bold tracking-wider mb-0.5">Endereço</p>
                    <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed">
                      Av. Santo Amaro, 5914 - Subsolo<br />
                      Santo Amaro — São Paulo/SP<br />
                      CEP 04702-001
                    </p>
                    <a
                      href={siteConfig.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold text-xs mt-2"
                    >
                      <MapPin size={12} />
                      Ver no Mapa
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="rounded overflow-hidden border border-[rgba(201,168,76,0.2)]" style={{ height: '250px' }}>
              <iframe
                title="Mapa"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3654.0!2d-46.7!3d-23.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a7a0a5f5a1b%3A0x1234567890abcdef!2sAv.+Santo+Amaro%2C+5914+Santo+Amaro%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.4) sepia(0.4) hue-rotate(330deg)' }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Form */}
          <div className="card-spiritual p-8">
            <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-6 flex items-center gap-2">
              <Send size={18} />
              Envie uma Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Seu nome completo"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">WhatsApp</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="(11) 99999-9999"
                    value={form.whatsapp}
                    onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Assunto</label>
                <select
                  className="form-input"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                >
                  <option value="">Selecione o assunto</option>
                  <option value="Informações Gerais">Informações Gerais</option>
                  <option value="Jogo de Cartas">Jogo de Cartas</option>
                  <option value="Jogo de Búzios">Jogo de Búzios</option>
                  <option value="Agenda de Giras">Agenda de Giras</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="form-label">Mensagem *</label>
                <textarea
                  required
                  rows={5}
                  className="form-input resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[rgba(13,5,5,0.3)] border-t-[#0d0505] rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {loading ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
                <p className="font-inter text-[rgba(245,240,232,0.35)] text-xs text-center mt-3">
                  Respeitamos sua privacidade. Seus dados não serão compartilhados.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
