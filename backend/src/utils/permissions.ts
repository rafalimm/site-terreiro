// Este mapa é o mesmo usado no front-end (src/store/AppContext.tsx).
// Aqui ele serve para o backend REALMENTE aplicar a regra (o front-end só
// usa a cópia dele para decidir o que mostrar na tela, mas quem garante
// segurança de verdade é sempre o servidor).

export type UserRole = 'super_admin' | 'admin' | 'agenda' | 'content' | 'atendimento' | 'filho' | 'consulente' | 'compras' | 'responsavel_fila';

export const PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  compras: ['compras'],
  responsavel_fila: ['fila', 'pre_cadastro'],
  admin: ['agenda', 'events', 'fila', 'pre_cadastro', 'news', 'gallery', 'faq', 'messages', 'services', 'entities', 'consulentes', 'filho_content', 'membership', 'compras'],
  agenda: ['agenda', 'events', 'fila', 'filho_content', 'membership'],
  content: ['news', 'faq', 'gallery', 'institutional', 'filho_content', 'membership'],
  atendimento: ['messages', 'consulentes', 'filho_content', 'membership'],
  filho: ['own_account', 'filho_content', 'membership'],
  consulente: ['own_account'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}
