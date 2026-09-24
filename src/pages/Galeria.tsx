import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useApp } from '../store/AppContext';

const CATEGORIES = ['Todos', 'Nosso Terreiro', 'Giras', 'Eventos', 'Momentos da Casa', 'Equipe', 'Eventos Especiais'];

export const Galeria: React.FC = () => {
  const { galleryItems } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = galleryItems.filter(item =>
    selectedCategory === 'Todos' || item.category === selectedCategory
  );

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevItem = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + filtered.length) % filtered.length : null);
  const nextItem = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % filtered.length : null);

  return (
    <div className="min-h-screen bg-[#0d0505]">
      {/* Hero */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(139,26,26,0.2)] to-[#0d0505]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)'
        }} />
        <div className="relative z-10 text-center px-4">
          <p className="font-cinzel text-[#c9a84c] text-xs tracking-widest uppercase mb-3">Memórias</p>
          <h1 className="section-title mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Galeria</h1>
          <div className="gold-divider mb-4" />
          <p className="font-crimson text-[rgba(245,240,232,0.6)] text-xl italic">
            Momentos do nosso terreiro em imagens
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
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

        {/* Gallery Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Camera size={48} className="text-[rgba(201,168,76,0.3)] mx-auto mb-4" />
            <h3 className="font-cinzel text-[#c9a84c] text-xl mb-2">Galeria em Construção</h3>
            <p className="font-crimson text-[rgba(245,240,232,0.5)] text-lg italic">
              Em breve, fotos e vídeos do nosso terreiro e nossas giras serão publicadas aqui.
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((item, index) => (
              <div
                key={item.id}
                className="break-inside-avoid cursor-pointer relative group overflow-hidden rounded border border-[rgba(201,168,76,0.15)] hover:border-[rgba(201,168,76,0.4)] transition-all"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,5,5,0.85)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="font-cinzel text-[#c9a84c] text-xs font-bold">{item.title}</p>
                  {item.description && (
                    <p className="font-inter text-[rgba(245,240,232,0.7)] text-xs">{item.description}</p>
                  )}
                  <span className="text-xs font-inter text-[rgba(245,240,232,0.4)] mt-1">{item.category}</span>
                </div>
                {item.isMain && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-[rgba(201,168,76,0.8)] rounded text-[#0d0505] text-xs font-cinzel font-bold">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div className="modal-overlay" onClick={closeLightbox}>
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center text-white hover:text-[#c9a84c] transition-colors"
            >
              <X size={20} />
            </button>

            {/* Nav buttons */}
            {filtered.length > 1 && (
              <>
                <button
                  onClick={prevItem}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center text-white hover:text-[#c9a84c] transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextItem}
                  className="absolute right-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[rgba(0,0,0,0.7)] border border-[rgba(201,168,76,0.3)] flex items-center justify-center text-white hover:text-[#c9a84c] transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={filtered[lightboxIndex].url}
              alt={filtered[lightboxIndex].title}
              className="w-full max-h-[80vh] object-contain rounded"
            />

            {/* Caption */}
            <div className="bg-[#1a0a0a] border-t border-[rgba(201,168,76,0.2)] p-4 rounded-b">
              <h3 className="font-cinzel font-bold text-[#c9a84c] text-base">{filtered[lightboxIndex].title}</h3>
              {filtered[lightboxIndex].description && (
                <p className="font-crimson text-[rgba(245,240,232,0.6)] text-sm mt-1">{filtered[lightboxIndex].description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-inter text-[rgba(245,240,232,0.3)] text-xs">{filtered[lightboxIndex].category}</span>
                <span className="font-inter text-[rgba(245,240,232,0.3)] text-xs">
                  {lightboxIndex + 1} / {filtered.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
