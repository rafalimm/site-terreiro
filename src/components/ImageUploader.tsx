import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, X, Camera, Check } from 'lucide-react';
import { api, mediaUrl } from '../lib/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  maxSize?: number;
  shape?: 'wide' | 'round';
  uploadPath?: string;
  compact?: boolean;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('decode'));
    reader.readAsDataURL(file);
  });
}

function fileToCompressedDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('canvas'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('decode'));
    };
    img.src = objectUrl;
  });
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  maxSize = 1600,
  shape = 'wide',
  uploadPath = '/api/admin/uploads',
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cropInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localValue, setLocalValue] = useState(value);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const openFilePicker = () => {
    (shape === 'round' ? cropInputRef : inputRef).current?.click();
  };

  const validateFile = (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Use uma imagem JPG, PNG ou WebP.');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('A foto é muito grande (máximo de 20 MB).');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegularFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validateFile(file)) return;

    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, maxSize);
      const response = await api.post<{ url: string }>(uploadPath, { dataUrl });
      const nextUrl = mediaUrl(response.url);
      setLocalValue(nextUrl);
      onChange(nextUrl);
    } catch (err) {
      setError(err instanceof Error && !['decode', 'canvas'].includes(err.message)
        ? err.message
        : 'Não foi possível enviar essa imagem. Tente outra foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validateFile(file)) return;

    try {
      const img = await loadImage(file);
      setCropFile(file);
      setCropImage(img);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    } catch {
      setError('Não foi possível abrir essa imagem. Tente outra foto.');
    }
  };

  const closeCrop = () => {
    if (uploading) return;
    setCropFile(null);
    setCropImage(null);
    setCropOffset({ x: 0, y: 0 });
  };

  const createCroppedDataUrl = () => {
    if (!cropImage) return null;

    const sourceSide = Math.min(cropImage.naturalWidth, cropImage.naturalHeight) / cropZoom;
    const previewSide = 280;
    const previewScale = previewSide / sourceSide;

    let sourceX = (cropImage.naturalWidth - sourceSide) / 2 - cropOffset.x / previewScale;
    let sourceY = (cropImage.naturalHeight - sourceSide) / 2 - cropOffset.y / previewScale;

    sourceX = Math.max(0, Math.min(cropImage.naturalWidth - sourceSide, sourceX));
    sourceY = Math.max(0, Math.min(cropImage.naturalHeight - sourceSide, sourceY));

    const outputSide = Math.min(maxSize, 800);
    const canvas = document.createElement('canvas');
    canvas.width = outputSide;
    canvas.height = outputSide;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSide, outputSide);
    ctx.drawImage(
      cropImage,
      sourceX,
      sourceY,
      sourceSide,
      sourceSide,
      0,
      0,
      outputSide,
      outputSide,
    );
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const handleCropUpload = async () => {
    if (!cropFile || !cropImage) return;
    setUploading(true);
    setError('');

    try {
      const dataUrl = createCroppedDataUrl();
      if (!dataUrl) throw new Error('crop');
      const response = await api.post<{ url: string }>(uploadPath, { dataUrl });
      const nextUrl = mediaUrl(response.url);
      setLocalValue(nextUrl);
      onChange(nextUrl);
      closeCrop();
    } catch (err) {
      setError(err instanceof Error && err.message !== 'crop'
        ? err.message
        : 'Não foi possível salvar essa foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropImage || uploading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: cropOffset.x,
      oy: cropOffset.y,
    };
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !cropImage) return;
    const sourceSide = Math.min(cropImage.naturalWidth, cropImage.naturalHeight) / cropZoom;
    const scale = 280 / sourceSide;
    const maxX = Math.max(0, (cropImage.naturalWidth * scale - 280) / 2);
    const maxY = Math.max(0, (cropImage.naturalHeight * scale - 280) / 2);

    setCropOffset({
      x: Math.max(-maxX, Math.min(maxX, dragRef.current.ox + e.clientX - dragRef.current.x)),
      y: Math.max(-maxY, Math.min(maxY, dragRef.current.oy + e.clientY - dragRef.current.y)),
    });
  };

  const previewClass = shape === 'round'
    ? 'w-28 h-28 rounded-full'
    : 'w-full h-40 rounded';

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleRegularFile}
      />

      {shape === 'round' && (
        <input
          ref={cropInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCropFile}
        />
      )}

      {shape === 'round' ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={uploading}
            onClick={openFilePicker}
            className="relative w-28 h-28 rounded-full border-2 border-[#c9a84c] bg-[rgba(201,168,76,0.08)] overflow-hidden group disabled:opacity-60"
            title="Alterar foto de perfil"
          >
            {localValue ? (
              <img src={localValue} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <UserPlaceholder />
            )}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
              <span className="text-[10px] text-white font-inter">Alterar foto</span>
            </span>
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/65">
                <span className="w-6 h-6 border-2 border-white/30 border-t-[#c9a84c] rounded-full animate-spin" />
              </span>
            )}
          </button>
          {!compact && (
            <div>
              <p className="font-inter text-xs text-[rgba(245,240,232,0.5)]">
                Clique na foto para escolher uma imagem.
              </p>
              <p className="font-inter text-[rgba(245,240,232,0.3)] text-[11px] mt-1">
                Você poderá ajustar o enquadramento antes de salvar.
              </p>
            </div>
          )}
        </div>
      ) : localValue ? (
        <div className="flex items-center gap-3 flex-wrap">
          <img
            src={localValue}
            alt="Imagem selecionada"
            className={`${previewClass} object-cover border border-[rgba(201,168,76,0.3)] sm:max-w-xs`}
          />
          <div className="flex flex-col gap-2">
            <button type="button" disabled={uploading} onClick={openFilePicker} className="btn-outline-gold text-xs py-1.5 px-3">
              <UploadCloud size={13} />
              {uploading ? 'Enviando...' : 'Trocar imagem'}
            </button>
            <button type="button" disabled={uploading} onClick={() => { setLocalValue(''); onChange(''); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-1">
              <X size={12} /> Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={openFilePicker}
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

      {cropImage && cropFile && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-md max-h-[calc(100vh-24px)] overflow-y-auto rounded-xl border border-[rgba(201,168,76,0.25)] bg-[#160909] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-cinzel font-bold text-[#c9a84c]">Ajustar foto de perfil</h3>
                <p className="font-inter text-xs text-[rgba(245,240,232,0.45)] mt-1">Arraste a imagem e ajuste o zoom.</p>
              </div>
              <button type="button" onClick={closeCrop} disabled={uploading} className="text-[rgba(245,240,232,0.5)] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div
              className="relative w-[min(280px,70vw)] h-[min(280px,70vw)] mx-auto rounded-full overflow-hidden border-2 border-[#c9a84c] bg-black touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
            >
              {(() => {
                const previewSide = Math.min(280, Math.round(window.innerWidth * 0.7));
                const sourceSide = Math.min(cropImage.naturalWidth, cropImage.naturalHeight) / cropZoom;
                const scale = previewSide / sourceSide;
                const width = cropImage.naturalWidth * scale;
                const height = cropImage.naturalHeight * scale;
                const left = (previewSide - width) / 2 + cropOffset.x;
                const top = (previewSide - height) / 2 + cropOffset.y;
                return (
                  <img
                    src={cropImage.src}
                    alt="Ajuste da foto"
                    draggable={false}
                    className="absolute max-w-none select-none pointer-events-none"
                    style={{ width, height, left, top }}
                  />
                );
              })()}
              <div className="absolute inset-0 rounded-full ring-2 ring-[#c9a84c]/70 pointer-events-none" />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-[rgba(245,240,232,0.45)] mb-2">
                <span>Zoom</span>
                <span>{cropZoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropZoom}
                onChange={e => setCropZoom(Number(e.target.value))}
                className="w-full accent-[#c9a84c]"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={closeCrop} disabled={uploading} className="btn-outline-gold text-xs">
                Cancelar
              </button>
              <button type="button" onClick={handleCropUpload} disabled={uploading} className="btn-gold text-xs">
                <Check size={14} />
                {uploading ? 'Salvando...' : 'Usar esta foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserPlaceholder: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <Camera size={30} className="text-[#c9a84c]" />
  </div>
);
