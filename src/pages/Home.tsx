import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Phone, ChevronDown, Calendar, BookOpen, MessageSquare, Camera } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const useInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children, className = '', delay = 0
}) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const Home: React.FC = () => {
  const { siteConfig, events, newsItems } = useApp();

  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const latestNews = newsItems
    .filter(n => n.active)
    .slice(0, 3);

  const nextGira = upcomingEvents[0];

  return (
    <div className="min-h-screen">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${siteConfig.heroImage})` }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,5,5,0.7)] via-[rgba(13,5,5,0.5)] to-[rgba(13,5,5,0.95)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(139,26,26,0.2)] to-transparent" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="star-particle animate-candle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                opacity: Math.random() * 0.6 + 0.2,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Rating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(201,168,76,0.3)] rounded-full bg-[rgba(201,168,76,0.05)] mb-8 animate-fadeInUp">
            <div className="star-rating text-sm">★★★★★</div>
            <span className="font-inter text-[rgba(245,240,232,0.7)] text-xs">5,0 — 27 avaliações</span>
          </div>

          {/* Title */}
          <h1
            className="font-cinzel font-black text-white mb-4 leading-tight tracking-widest animate-fadeInUp"
            style={{ fontSize: 'clamp(1.8rem, 6vw, 4rem)', animationDelay: '0.1s', textShadow: '0 0 60px rgba(201,168,76,0.3)' }}
          >
            CENTRO DE UMBANDA
          </h1>
          <h1
            className="font-cinzel font-black mb-6 leading-tight tracking-widest animate-fadeInUp"
            style={{
              fontSize: 'clamp(2.5rem, 9vw, 6rem)',
              animationDelay: '0.2s',
              background: 'linear-gradient(135deg, #a07c30, #e8c97a, #c9a84c, #a07c30)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
            }}
          >
            ZÉ DO LAÇO
          </h1>

          <p className="font-crimson text-[rgba(245,240,232,0.8)] text-xl md:text-2xl italic mb-2 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            Terreiro • Templo • Jogo de Cartas e Búzios
          </p>
          <div className="gold-divider mb-6" />

          <p className="font-crimson text-[rgba(245,240,232,0.7)] text-lg md:text-xl mb-10 animate-fadeInUp max-w-2xl mx-auto" style={{ animationDelay: '0.4s' }}>
            {siteConfig.heroSubtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            <Link to="/sobre" className="btn-gold text-sm">
              <BookOpen size={16} />
              Conheça o Terreiro
            </Link>
            <button
              onClick={() => openWhatsApp('Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de obter mais informações.')}
              className="btn-wine text-sm"
            >
              <Phone size={16} />
              Fale Conosco
            </button>
            <Link to="/agenda" className="btn-outline-gold text-sm">
              <Calendar size={16} />
              Ver Próxima Gira
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown size={24} className="text-[rgba(201,168,76,0.6)]" />
        </div>
      </section>

      {/* ========== WELCOME BANNER ========== */}
      <section className="py-8 bg-gradient-to-r from-[#5c0f0f] via-[#8b1a1a] to-[#5c0f0f] border-y border-[rgba(201,168,76,0.2)]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-cinzel text-[#f5f0e8] text-sm md:text-base tracking-widest uppercase">
            ✦ Espaço Acolhedor e Inclusivo — Comunidade LGBTQIA+ Bem-Vinda ✦
          </p>
        </div>
      </section>

      {/* ========== ABOUT TEASER ========== */}
      <section className="py-24 bg-[#0d0505] relative overflow-hidden">
        <div className="absolute inset-0 smoke-effect" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <AnimatedSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-[rgba(201,168,76,0.1)] to-transparent rounded-lg" />
                <img
                  src={siteConfig.aboutImage}
                  alt="Altar do Centro de Umbanda Zé do Laço"
                  className="relative w-full h-80 object-cover rounded-sm border border-[rgba(201,168,76,0.2)]"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-[rgba(13,5,5,0.9)] border border-[rgba(201,168,76,0.2)] rounded p-3">
                  <p className="font-cinzel text-[#c9a84c] text-xs tracking-wider text-center">
                    Centro de Umbanda Zé do Laço
                  </p>
                  <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs text-center">
                    Santo Amaro — São Paulo/SP
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Text */}
            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-[rgba(201,168,76,0.3)] to-transparent" />
                  <span className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase">Nossa Casa</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-[rgba(201,168,76,0.3)] to-transparent" />
                </div>
                <h2 className="section-title text-left mb-4" style={{ textAlign: 'left' }}>
                  Bem-vindo ao<br />Nosso Templo
                </h2>
                <div className="h-px bg-gradient-to-r from-[#c9a84c] via-transparent to-transparent mb-6" style={{ width: '80px' }} />
                <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed mb-4">
                  {siteConfig.aboutText}
                </p>
                <p className="font-crimson text-[rgba(245,240,232,0.55)] text-base leading-relaxed mb-8 italic">
                  "Um espaço onde a caridade, a fé e o amor ao próximo são os pilares de todos os nossos trabalhos."
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/sobre" className="btn-gold text-xs">
                    Nossa História
                  </Link>
                  <Link to="/nossa-casa" className="btn-outline-gold text-xs">
                    <MapPin size={14} />
                    Como Chegar
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== SERVICES CARDS ========== */}
      <section className="py-24 bg-[#0a0404] relative">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Nossos Atendimentos</p>
              <h2 className="section-title mb-3">Serviços Espirituais</h2>
              <div className="gold-divider" />
              <p className="section-subtitle mt-4">
                Orientação espiritual com respeito, seriedade e fé
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🕯️',
                title: 'Giras Espirituais',
                description: 'Cerimônias sagradas onde as entidades prestam orientação e atendimento aos consulentes. Abertas ao público conforme a agenda.',
                link: '/agenda',
                linkLabel: 'Ver Agenda',
              },
              {
                icon: '🃏',
                title: 'Jogo de Cartas',
                description: 'Consulta espiritual através do jogo de cartas, com orientações e mensagens das entidades para as diversas áreas de sua vida.',
                link: '/cartas-buzios',
                linkLabel: 'Saiba Mais',
                whatsapp: 'Olá! Gostaria de obter informações sobre o jogo de cartas.',
              },
              {
                icon: '🐚',
                title: 'Jogo de Búzios',
                description: 'Consulta ancestral através dos búzios sagrados. Uma prática profunda de orientação espiritual e leitura da vida.',
                link: '/cartas-buzios',
                linkLabel: 'Saiba Mais',
                whatsapp: 'Olá! Gostaria de obter informações sobre o jogo de búzios.',
              },
            ].map((service, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="card-spiritual p-8 h-full flex flex-col">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="font-cinzel font-bold text-[#c9a84c] text-lg mb-3">{service.title}</h3>
                  <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base leading-relaxed flex-1 mb-6">
                    {service.description}
                  </p>
                  <div className="flex gap-3">
                    <Link to={service.link} className="btn-outline-gold text-xs py-2 px-4">
                      {service.linkLabel}
                    </Link>
                    {service.whatsapp && (
                      <button
                        onClick={() => openWhatsApp(service.whatsapp!)}
                        className="btn-wine text-xs py-2 px-4"
                      >
                        Agendar
                      </button>
                    )}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEXT GIRA ========== */}
      {nextGira && (
        <section className="py-20 bg-gradient-to-r from-[#5c0f0f] via-[#6b1212] to-[#5c0f0f] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(201,168,76,0.2) 0%, transparent 50%)'
            }} />
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[rgba(201,168,76,0.4)] rounded-full mb-6">
                <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
                <span className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase">Próxima Gira</span>
              </div>
              <h2 className="font-cinzel font-black text-white text-3xl md:text-4xl mb-4 tracking-wider">
                {nextGira.title}
              </h2>
              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] px-4 py-2 rounded border border-[rgba(201,168,76,0.2)]">
                  <Calendar size={14} className="text-[#c9a84c]" />
                  <span className="font-inter text-[#f5f0e8] text-sm">
                    {format(new Date(nextGira.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] px-4 py-2 rounded border border-[rgba(201,168,76,0.2)]">
                  <span className="text-[#c9a84c] text-sm">🕰️</span>
                  <span className="font-inter text-[#f5f0e8] text-sm">{nextGira.time}</span>
                </div>
                {nextGira.isPublic && (
                  <div className="flex items-center gap-2 bg-[rgba(0,0,0,0.3)] px-4 py-2 rounded border border-[rgba(201,168,76,0.2)]">
                    <span className="text-green-400 text-sm">✓</span>
                    <span className="font-inter text-[#f5f0e8] text-sm">Aberta ao Público</span>
                  </div>
                )}
              </div>
              <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg mb-8 max-w-2xl mx-auto italic">
                {nextGira.description}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/agenda" className="btn-gold">
                  <Calendar size={16} />
                  Ver Agenda Completa
                </Link>
                <button
                  onClick={() => openWhatsApp('Olá! Gostaria de saber mais informações sobre a próxima gira.')}
                  className="btn-outline-gold"
                >
                  <Phone size={16} />
                  Mais Informações
                </button>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ========== INFO CARDS ========== */}
      <section className="py-24 bg-[#0d0505]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '⭐', value: '5,0', label: 'Avaliação no Google' },
              { icon: '❤️', value: '27+', label: 'Avaliações de Consulentes' },
              { icon: '🕯️', value: '100%', label: 'Fé e Dedicação' },
              { icon: '🌟', value: '∞', label: 'Caridade e Acolhimento' },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="text-center p-6 border border-[rgba(201,168,76,0.15)] rounded-sm bg-[rgba(201,168,76,0.02)] hover:border-[rgba(201,168,76,0.35)] transition-all">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="font-cinzel font-black text-[#c9a84c] text-3xl mb-1">{stat.value}</div>
                  <div className="font-inter text-[rgba(245,240,232,0.5)] text-sm">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEWS SECTION ========== */}
      {latestNews.length > 0 && (
        <section className="py-24 bg-[#080303]">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatedSection>
              <div className="text-center mb-16">
                <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Fique por Dentro</p>
                <h2 className="section-title mb-3">Notícias & Avisos</h2>
                <div className="gold-divider" />
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6">
              {latestNews.map((news, i) => (
                <AnimatedSection key={news.id} delay={i * 150}>
                  <div className="card-spiritual overflow-hidden">
                    {news.image && (
                      <img src={news.image} alt={news.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-6">
                      <span className="inline-block px-2 py-1 text-xs font-cinzel bg-[rgba(139,26,26,0.4)] text-[#c9a84c] border border-[rgba(139,26,26,0.5)] rounded mb-3">
                        {news.category}
                      </span>
                      <h3 className="font-cinzel font-bold text-[#f5f0e8] text-base mb-2">{news.title}</h3>
                      <p className="font-crimson text-[rgba(245,240,232,0.55)] text-sm line-clamp-3 mb-4">{news.content}</p>
                      <div className="flex items-center justify-between text-xs font-inter text-[rgba(245,240,232,0.35)]">
                        <span>{news.author}</span>
                        <span>{format(new Date(news.publishedAt), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/noticias" className="btn-outline-gold">
                <MessageSquare size={16} />
                Ver Todas as Notícias
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== MAP SECTION ========== */}
      <section className="py-24 bg-[#0d0505]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div>
                <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Venha nos Visitar</p>
                <h2 className="font-cinzel font-bold text-white text-3xl mb-4">Nossa Localização</h2>
                <div className="h-px bg-[rgba(201,168,76,0.4)] w-16 mb-6" />
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#c9a84c] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-cinzel text-[#f5f0e8] text-sm font-bold">Endereço</p>
                      <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">
                        Av. Santo Amaro, 5914 - Subsolo<br />
                        Santo Amaro — São Paulo/SP<br />
                        CEP 04702-001
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-[#c9a84c] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-cinzel text-[#f5f0e8] text-sm font-bold">WhatsApp</p>
                      <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">(11) 94008-7119</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star size={18} className="text-[#c9a84c] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-cinzel text-[#f5f0e8] text-sm font-bold">Horários</p>
                      <p className="font-crimson text-[rgba(245,240,232,0.65)] text-base">{siteConfig.workingHours}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={siteConfig.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold text-xs"
                  >
                    <MapPin size={14} />
                    Abrir no Mapa
                  </a>
                  <button
                    onClick={() => openWhatsApp('Olá! Gostaria de obter mais informações sobre o terreiro.')}
                    className="btn-wine text-xs"
                  >
                    <Phone size={14} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="h-80 rounded-sm overflow-hidden border border-[rgba(201,168,76,0.2)]">
                <iframe
                  title="Localização do Centro de Umbanda Zé do Laço"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3654.0!2d-46.7!3d-23.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a7a0a5f5a1b%3A0x1234567890abcdef!2sAv.+Santo+Amaro%2C+5914+Santo+Amaro%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.5) sepia(0.3) hue-rotate(330deg)' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 bg-[#0a0404] relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)'
        }} />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <AnimatedSection>
            <div className="text-5xl mb-6">🕯️</div>
            <h2 className="section-title mb-4">A Luz da Espiritualidade<br />Espera por Você</h2>
            <div className="gold-divider mb-6" />
            <p className="font-crimson text-[rgba(245,240,232,0.65)] text-xl italic mb-8 leading-relaxed">
              Venha conhecer nossa casa. Seja você um consulente em busca de orientação,
              ou alguém que deseja saber mais sobre a Umbanda — nossa porta está aberta.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/agenda" className="btn-gold">
                <Calendar size={16} />
                Ver Agenda
              </Link>
              <button
                onClick={() => openWhatsApp('Olá! Vim pelo site do Centro de Umbanda Zé do Laço e gostaria de obter mais informações.')}
                className="btn-wine"
              >
                <Phone size={16} />
                Entre em Contato
              </button>
              <Link to="/galeria" className="btn-outline-gold">
                <Camera size={16} />
                Ver Galeria
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};
