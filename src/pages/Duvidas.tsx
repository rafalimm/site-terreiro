import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, MessageSquare } from 'lucide-react';
import { useApp } from '../store/AppContext';

const FAQItem: React.FC<{ item: any; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border border-[rgba(201,168,76,0.15)] rounded transition-all duration-300 overflow-hidden ${
        open ? 'border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.03)]' : 'hover:border-[rgba(201,168,76,0.3)]'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="font-cinzel text-[#c9a84c] text-xs opacity-60 flex-shrink-0 hidden sm:block">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-cinzel font-semibold text-[#f5f0e8] text-base leading-snug">
            {item.question}
          </span>
        </div>
        <div className="flex-shrink-0">
          {open
            ? <ChevronUp size={18} className="text-[#c9a84c]" />
            : <ChevronDown size={18} className="text-[rgba(245,240,232,0.4)]" />
          }
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-[rgba(201,168,76,0.1)]">
          <div className="pt-4 pl-0 sm:pl-10">
            <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const Duvidas: React.FC = () => {
  const { faqItems, siteConfig } = useApp();
  const [search, setSearch] = useState('');

  const activeFAQs = faqItems
    .filter(f => f.active)
    .filter(f =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Esclarecimentos</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Tire Suas Dúvidas
          </h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Perguntas frequentes sobre o terreiro e a Umbanda
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24">
        {/* Search */}
        <div className="mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar pergunta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-10"
            />
            <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(201,168,76,0.4)]" />
          </div>
        </div>

        {/* FAQ List */}
        {activeFAQs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-xl">
              Nenhuma pergunta encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeFAQs.map((item, index) => (
              <FAQItem key={item.id} item={item} index={index} />
            ))}
          </div>
        )}

        {/* Not found CTA */}
        <div className="mt-16 p-8 border border-[rgba(201,168,76,0.2)] rounded bg-[rgba(201,168,76,0.03)] text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-cinzel font-bold text-[#c9a84c] text-xl mb-3">Não encontrou sua resposta?</h3>
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-lg italic mb-6">
            Entre em contato conosco pelo WhatsApp. Estamos prontos para esclarecer qualquer dúvida
            com respeito e carinho.
          </p>
          <button
            onClick={() => window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre o Centro de Umbanda Zé do Laço.')}`, '_blank')}
            className="btn-wine"
          >
            <Phone size={16} />
            Tirar Dúvida pelo WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
