// Este mapa é o mesmo usado no front-end (src/store/AppContext.tsx).
// Aqui ele serve para o backend REALMENTE aplicar a regra (o front-end só
// usa a cópia dele para decidir o que mostrar na tela, mas quem garante
// segurança de verdade é sempre o servidor).

export type UserRole = 'super_admin' | 'admin' | 'agenda' | 'content' | 'atendimento' | 'consulente';

export const PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  admin: ['agenda', 'events', 'news', 'gallery', 'faq', 'messages', 'services', 'entities', 'consulentes'],
  agenda: ['agenda', 'events'],
  content: ['news', 'faq', 'gallery', 'institutional'],
  atendimento: ['messages', 'consulentes'],
  consulente: ['own_account'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}
