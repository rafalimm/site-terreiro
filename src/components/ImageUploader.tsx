import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { api, mediaUrl } from '../lib/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  maxSize?: number; // maior lado da imagem, em pixels
  shape?: 'wide' | 'round';
  uploadPath?: string;
}

// Lê a foto escolhida, reduz e comprime no próprio navegador (fica leve e rápida
// no site) e envia para o servidor. Devolve o endereço final da imagem.
function fileToCompressedDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('canvas')); return; }
      ctx.fillStyle = '#ffffff'; // PNG com fundo transparente vira fundo branco
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('decode')); };
    img.src = objectUrl;
  });
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, maxSize = 1600, shape = 'wide', uploadPath = '/api/admin/uploads' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Use uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('A foto é muito grande (máximo de 20 MB).');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, maxSize);
      const { url } = await api.post<{ url: string }>(uploadPath, { dataUrl });
      onChange(mediaUrl(url));
    } catch (err) {
      setError(err instanceof Error && err.message !== 'decode' && err.message !== 'canvas'
        ? err.message
        : 'Não foi possível enviar essa imagem. Tente outra foto.');
    } finally {
      setUploading(false);
    }
  };

  const previewClass = shape === 'round'
    ? 'w-28 h-28 rounded-full'
    : 'w-full h-40 rounded';

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="flex items-center gap-3 flex-wrap">
          <img
            src={value}
            alt="Imagem selecionada"
            className={`${previewClass} object-cover border border-[rgba(201,168,76,0.3)] ${shape === 'round' ? '' : 'sm:max-w-xs'}`}
          />
          <div className="flex flex-col gap-2">
            <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="btn-outline-gold text-xs py-1.5 px-3">
              <UploadCloud size={13} />
              {uploading ? 'Enviando...' : 'Trocar imagem'}
            </button>
            <button type="button" disabled={uploading} onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-1">
              <X size={12} /> Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[rgba(201,168,76,0.3)] rounded hover:border-[#c9a84c] hover:bg-[rgba(201,168,76,0.05)] transition-all disabled:opacity-60"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-[rgba(201,168,76,0.3)] border-t-[#c9a84c] rounded-full animate-spin" />
          ) : (
            <UploadCloud size={26} className="text-[#c9a84c]" />
          )}
          <span className="font-inter text-[rgba(245,240,232,0.6)] text-sm">
            {uploading ? 'Enviando imagem...' : 'Clique para escolher uma foto do computador ou celular'}
          </span>
          <span className="font-inter text-[rgba(245,240,232,0.3)] text-xs">JPG, PNG ou WebP</span>
        </button>
      )}

      {error && <p className="font-inter text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};
