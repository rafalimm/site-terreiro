import { prisma } from '../lib/prisma';

const IMAGE_PATH = /\/api\/images\/([A-Za-z0-9_-]+)$/;

// Guardamos no banco apenas o caminho relativo (/api/images/ID). Assim, se o
// domínio da API mudar no futuro, as imagens continuam funcionando: o front-end
// completa o endereço com a VITE_API_URL na hora de exibir.
export function toRelativeImageUrl<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  const match = value.match(IMAGE_PATH);
  if (match && /^https?:\/\//.test(value)) return `/api/images/${match[1]}`;
  return value;
}

export function uploadedImageId(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const match = url.match(IMAGE_PATH);
  return match ? match[1] : null;
}

// Apaga a imagem enviada quando o registro que a usava é excluído ou trocado.
export async function deleteUploadedImage(url: unknown) {
  const id = uploadedImageId(url);
  if (!id) return;
  try {
    await prisma.uploadedImage.deleteMany({ where: { id } });
  } catch (err) {
    console.error('Falha ao limpar imagem antiga:', err);
  }
}
