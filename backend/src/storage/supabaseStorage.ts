import { randomUUID } from 'crypto';

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'filho-content';

function assertConfigured() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase Storage não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }
}

function objectUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function uploadToSupabaseStorage(buffer: Buffer, mimeType: string, originalName: string) {
  assertConfigured();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120) || 'arquivo';
  const path = `contents/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
  const response = await fetch(objectUrl(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': mimeType,
      'x-upsert': 'false',
    },
    body: buffer,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha no Supabase Storage (${response.status}): ${detail.slice(0, 500)}`);
  }
  return { path, url: objectUrl(path) };
}

export async function deleteFromSupabaseStorage(path: string) {
  if (!path || !supabaseUrl || !serviceKey) return;
  const response = await fetch(objectUrl(path), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });
  if (!response.ok && response.status !== 404) {
    const detail = await response.text();
    throw new Error(`Falha ao excluir arquivo do Supabase Storage (${response.status}): ${detail.slice(0, 500)}`);
  }
}
