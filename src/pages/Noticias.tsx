import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Tag } from 'lucide-react';
import { useApp } from '../store/AppContext';

const CATEGORIES = ['Todos', 'Comunicado', 'Gira Especial', 'Evento', 'Aviso', 'Campanha'];

export const Noticias: React.FC = () => {
  const { newsItems } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  const filtered = newsItems
    .filter(n => n.active)
    .filter(n => selectedCategory === 'Todos' || n.category === selectedCategory)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Comunicados</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Notícias & Avisos
          </h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Fique por dentro das novidades do nosso terreiro
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded font-cinzel text-xs tracking-wider uppercase border transition-all ${
                selectedCategory === cat
                  ? 'bg-[rgba(201,168,76,0.2)] border-[#c9a84c] text-[#c9a84c]'
                  : 'border-[rgba(201,168,76,0.2)] text-[rgba(245,240,232,0.5)] hover:border-[rgba(201,168,76,0.4)] hover:text-[#c9a84c]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📰</div>
            <h3 className="font-cinzel text-[#c9a84c] text-xl mb-2">Nenhuma publicação encontrada</h3>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-lg italic">
              Acompanhe nossas redes sociais para ficar por dentro das novidades!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(news => (
              <div
                key={news.id}
                className="card-spiritual overflow-hidden cursor-pointer"
                onClick={() => setSelectedNews(news)}
              >
                {news.image ? (
                  <img src={news.image} alt={news.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[rgba(139,26,26,0.3)] to-[rgba(201,168,76,0.1)] flex items-center justify-center">
                    <span className="text-5xl">📰</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-cinzel bg-[rgba(139,26,26,0.3)] text-[#c9a84c] border border-[rgba(139,26,26,0.4)] rounded">
                      <Tag size={10} />
                      {news.category}
                    </span>
                  </div>
                  <h3 className="font-cinzel font-bold text-[#f5f0e8] text-base mb-2 leading-snug">
                    {news.title}
                  </h3>
                  <p className="font-crimson text-[rgba(245,240,232,0.55)] text-sm leading-relaxed line-clamp-3 mb-4">
                    {news.content}
                  </p>
                  <div className="flex items-center justify-between text-xs font-inter text-[rgba(245,240,232,0.35)] border-t border-[rgba(201,168,76,0.08)] pt-3">
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {news.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(news.publishedAt), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-cinzel bg-[rgba(139,26,26,0.3)] text-[#c9a84c] border border-[rgba(139,26,26,0.4)] rounded mb-2">
                  {selectedNews.category}
                </span>
                <h2 className="font-cinzel font-bold text-[#f5f0e8] text-xl">{selectedNews.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-[rgba(245,240,232,0.4)] hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            {selectedNews.image && (
              <img src={selectedNews.image} alt={selectedNews.title} className="w-full h-48 object-cover rounded mb-4" />
            )}
            <p className="font-crimson text-[rgba(245,240,232,0.75)] text-lg leading-relaxed mb-4 whitespace-pre-wrap">
              {selectedNews.content}
            </p>
            <div className="flex items-center justify-between text-sm font-inter text-[rgba(245,240,232,0.35)] border-t border-[rgba(201,168,76,0.1)] pt-4">
              <span className="flex items-center gap-1">
                <User size={12} />
                {selectedNews.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {format(new Date(selectedNews.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
