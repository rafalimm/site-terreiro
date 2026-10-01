// Cliente HTTP simples usado por todo o AppContext para falar com o backend.
// A URL da API vem de uma variável de ambiente (VITE_API_URL), então trocar de
// hospedagem/domínio no futuro é só mudar essa variável — nada de código muda.

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isProductionBrowser =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

export const API_URL =
  isProductionBrowser
    ? 'https://site-terreiro-production.up.railway.app'
    : configuredApiUrl || 'http://localhost:3333';

// Imagens enviadas pelo painel ficam guardadas como "/api/images/ID". Aqui completamos
// com o endereço da API, então trocar de domínio no futuro não quebra nenhuma foto.
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url;
  if (!url.startsWith('/api/images/') && !url.startsWith('/api/files/')) return url;
  const base = API_URL.replace(/\/+$/, '');
  return `${base}${url}`;
}
const TOKEN_KEY = 'zedolaco_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // default true — envia o token salvo, se existir
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Respostas sem corpo (ex: DELETE com 204)
  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // corpo vazio ou não-JSON — segue com data = null
  }

  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error || `Erro na requisição (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => apiRequest<T>(path, { method: 'PUT', body, auth }),
  delete: <T>(path: string, auth = true) => apiRequest<T>(path, { method: 'DELETE', auth }),
};


export async function uploadContentFile(file: File): Promise<{ url: string; name: string; size: number; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
  return api.post('/api/admin/content-uploads', {
    dataUrl,
    originalName: file.name,
  });
}


export async function uploadImageFile(file: File): Promise<{ url: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
  return api.post('/api/admin/uploads', { dataUrl });
}
