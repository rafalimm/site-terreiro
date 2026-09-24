// Antes desta atualização, o site guardava tudo direto no localStorage do navegador
// (chaves "zedolaco_users", "zedolaco_events", etc.). Agora que existe um backend de
// verdade, essas chaves não são mais escritas — mas se ainda existirem no navegador de
// quem administra o site, dá pra usar essa função para juntar tudo em um único JSON e
// mandar para o endpoint de importação da API (POST /api/admin/import), sem perder nada
// do que já estava cadastrado.

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function hasLegacyData(): boolean {
  return localStorage.getItem('zedolaco_users') !== null || localStorage.getItem('zedolaco_events') !== null;
}

export function getLegacySnapshot() {
  return {
    users: readKey('zedolaco_users', []),
    events: readKey('zedolaco_events', []),
    faqItems: readKey('zedolaco_faq', []),
    newsItems: readKey('zedolaco_news', []),
    galleryItems: readKey('zedolaco_gallery', []),
    services: readKey('zedolaco_services', []),
    entities: readKey('zedolaco_entities', []),
    siteConfig: readKey('zedolaco_config', null),
    contactMessages: readKey('zedolaco_messages', []),
  };
}
