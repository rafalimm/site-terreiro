import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, setToken, getToken, ApiError } from '../lib/api';

// ============================================================
// TYPES
// (mesmos tipos de antes — nada muda para quem importa daqui)
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'agenda' | 'content' | 'atendimento' | 'consulente';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  whatsapp?: string;
  createdAt: string;
  active: boolean;
}

export interface GiraEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  description: string;
  orientation: string;
  isPublic: boolean;
  requiresScheduling: boolean;
  observations: string;
  createdBy: string;
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  category: string;
  author: string;
  publishedAt: string;
  active: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  isMain: boolean;
  createdAt: string;
}

export interface ServiceInfo {
  id: string;
  type: 'cards' | 'buzios';
  title: string;
  description: string;
  howItWorks: string;
  duration: string;
  orientation: string;
  requiresScheduling: boolean;
}

export interface Entity {
  id: string;
  name: string;
  line: string;
  description: string;
  image?: string;
  history: string;
  characteristics: string;
  additionalInfo: string;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  aboutHistory: string;
  whatsapp: string;
  instagram: string;
  address: string;
  mapUrl: string;
  email: string;
  workingHours: string;
  heroImage: string;
  aboutImage: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
  read: boolean;
}

const emptySiteConfig: SiteConfig = {
  heroTitle: '', heroSubtitle: '', aboutText: '', aboutHistory: '', whatsapp: '',
  instagram: '', address: '', mapUrl: '', email: '', workingHours: '', heroImage: '', aboutImage: '',
};

// ============================================================
// PERMISSÕES
// Isso aqui é só para decidir o que MOSTRAR na tela. Quem garante a
// segurança de verdade é sempre o backend (veja backend/src/utils/permissions.ts) —
// então mesmo que alguém adultere o front-end, o servidor recusa a ação.
// ============================================================

const PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['*'],
  admin: ['agenda', 'events', 'news', 'gallery', 'faq', 'messages', 'services', 'entities', 'consulentes'],
  agenda: ['agenda', 'events'],
  content: ['news', 'faq', 'gallery', 'institutional'],
  atendimento: ['messages', 'consulentes'],
  consulente: ['own_account'],
};

// ============================================================
// CONTEXT
// ============================================================

interface AppContextType {
  currentUser: User | null;
  users: User[];
  events: GiraEvent[];
  faqItems: FAQItem[];
  newsItems: NewsItem[];
  galleryItems: GalleryItem[];
  services: ServiceInfo[];
  entities: Entity[];
  activityLogs: ActivityLog[];
  siteConfig: SiteConfig;
  contactMessages: ContactMessage[];

  loadingPublicData: boolean;
  authReady: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; whatsapp?: string }) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  lastError: string | null;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addEvent: (event: Omit<GiraEvent, 'id' | 'createdAt'>) => Promise<void>;
  updateEvent: (id: string, data: Partial<GiraEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  addFAQ: (item: Omit<FAQItem, 'id'>) => Promise<void>;
  updateFAQ: (id: string, data: Partial<FAQItem>) => Promise<void>;
  deleteFAQ: (id: string) => Promise<void>;

  addNews: (item: Omit<NewsItem, 'id'>) => Promise<void>;
  updateNews: (id: string, data: Partial<NewsItem>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;

  addGalleryItem: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => Promise<void>;
  updateGalleryItem: (id: string, data: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  updateService: (id: string, data: Partial<ServiceInfo>) => Promise<void>;

  addEntity: (entity: Omit<Entity, 'id'>) => Promise<void>;
  updateEntity: (id: string, data: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;

  updateSiteConfig: (data: Partial<SiteConfig>) => Promise<void>;

  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'receivedAt' | 'read'>) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;

  refreshAdminData: () => Promise<void>;
  importLegacyData: (snapshot: Record<string, unknown>) => Promise<{ message: string; result: Record<string, unknown> }>;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<GiraEvent[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(emptySiteConfig);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [loadingPublicData, setLoadingPublicData] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof ApiError ? err.message : 'Não foi possível completar a ação. Verifique sua conexão.';
    setLastError(message);
    console.error(err);
  };

  // ---- Dados públicos (site institucional) ----
  const loadPublicData = useCallback(async () => {
    try {
      const bundle = await api.get<{
        events: GiraEvent[]; faqItems: FAQItem[]; newsItems: NewsItem[];
        galleryItems: GalleryItem[]; services: ServiceInfo[]; entities: Entity[]; siteConfig: SiteConfig | null;
      }>('/api/public/bundle', false);
      setEvents(bundle.events);
      setFaqItems(bundle.faqItems);
      setNewsItems(bundle.newsItems);
      setGalleryItems(bundle.galleryItems);
      setServices(bundle.services);
      setEntities(bundle.entities);
      if (bundle.siteConfig) setSiteConfig(bundle.siteConfig);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingPublicData(false);
    }
  }, []);

  // ---- Dados restritos à equipe (usuários, mensagens, logs) ----
  const refreshAdminData = useCallback(async () => {
    if (!currentUser || currentUser.role === 'consulente') return;
    const [usersRes, messagesRes, logsRes] = await Promise.allSettled([
      api.get<User[]>('/api/admin/users'),
      api.get<ContactMessage[]>('/api/admin/messages'),
      api.get<ActivityLog[]>('/api/admin/logs'),
    ]);
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value);
    if (messagesRes.status === 'fulfilled') setContactMessages(messagesRes.value);
    if (logsRes.status === 'fulfilled') setActivityLogs(logsRes.value);
  }, [currentUser]);

  // Carrega os dados públicos assim que o site abre (funciona sem login)
  useEffect(() => { loadPublicData(); }, [loadPublicData]);

  // Tenta retomar a sessão salva (token no localStorage) quando o app carrega
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) { setAuthReady(true); return; }
      try {
        const user = await api.get<User>('/api/auth/me');
        setCurrentUser(user);
      } catch {
        setToken(null); // token expirado/inválido
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  // Sempre que o usuário logado mudar, busca os dados administrativos correspondentes
  useEffect(() => { refreshAdminData(); }, [refreshAdminData]);

  // ---- Autenticação ----
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password }, false);
      setToken(token);
      setCurrentUser(user);
      setLastError(null);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const register = async (data: { name: string; email: string; password: string; whatsapp?: string }): Promise<boolean> => {
    try {
      const { token, user } = await api.post<{ token: string; user: User }>('/api/auth/register', data, false);
      setToken(token);
      setCurrentUser(user);
      setLastError(null);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setContactMessages([]);
    setActivityLogs([]);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    const perms = PERMISSIONS[currentUser.role];
    return perms.includes('*') || perms.includes(permission);
  };

  // ---- Usuários ----
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const created = await api.post<User>('/api/admin/users', userData);
      setUsers(prev => [created, ...prev]);
    } catch (err) { handleError(err); }
  };
  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      const updated = await api.patch<User>(`/api/admin/users/${id}`, data);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
      if (currentUser?.id === id) setCurrentUser(updated);
    } catch (err) { handleError(err); }
  };
  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Agenda / Giras ----
  const addEvent = async (eventData: Omit<GiraEvent, 'id' | 'createdAt'>) => {
    try {
      const created = await api.post<GiraEvent>('/api/admin/events', eventData);
      setEvents(prev => [...prev, created]);
    } catch (err) { handleError(err); }
  };
  const updateEvent = async (id: string, data: Partial<GiraEvent>) => {
    try {
      const updated = await api.patch<GiraEvent>(`/api/admin/events/${id}`, data);
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err) { handleError(err); }
  };
  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/api/admin/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- FAQ ----
  const addFAQ = async (item: Omit<FAQItem, 'id'>) => {
    try {
      const created = await api.post<FAQItem>('/api/admin/faq', item);
      setFaqItems(prev => [...prev, created]);
    } catch (err) { handleError(err); }
  };
  const updateFAQ = async (id: string, data: Partial<FAQItem>) => {
    try {
      const updated = await api.patch<FAQItem>(`/api/admin/faq/${id}`, data);
      setFaqItems(prev => prev.map(f => (f.id === id ? updated : f)));
    } catch (err) { handleError(err); }
  };
  const deleteFAQ = async (id: string) => {
    try {
      await api.delete(`/api/admin/faq/${id}`);
      setFaqItems(prev => prev.filter(f => f.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Notícias ----
  const addNews = async (item: Omit<NewsItem, 'id'>) => {
    try {
      const created = await api.post<NewsItem>('/api/admin/news', item);
      setNewsItems(prev => [created, ...prev]);
    } catch (err) { handleError(err); }
  };
  const updateNews = async (id: string, data: Partial<NewsItem>) => {
    try {
      const updated = await api.patch<NewsItem>(`/api/admin/news/${id}`, data);
      setNewsItems(prev => prev.map(n => (n.id === id ? updated : n)));
    } catch (err) { handleError(err); }
  };
  const deleteNews = async (id: string) => {
    try {
      await api.delete(`/api/admin/news/${id}`);
      setNewsItems(prev => prev.filter(n => n.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Galeria ----
  const addGalleryItem = async (item: Omit<GalleryItem, 'id' | 'createdAt'>) => {
    try {
      const created = await api.post<GalleryItem>('/api/admin/gallery', item);
      setGalleryItems(prev => [created, ...prev]);
    } catch (err) { handleError(err); }
  };
  const updateGalleryItem = async (id: string, data: Partial<GalleryItem>) => {
    try {
      const updated = await api.patch<GalleryItem>(`/api/admin/gallery/${id}`, data);
      setGalleryItems(prev => prev.map(g => (g.id === id ? updated : g)));
    } catch (err) { handleError(err); }
  };
  const deleteGalleryItem = async (id: string) => {
    try {
      await api.delete(`/api/admin/gallery/${id}`);
      setGalleryItems(prev => prev.filter(g => g.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Serviços (búzios/cartas) ----
  const updateService = async (id: string, data: Partial<ServiceInfo>) => {
    try {
      const updated = await api.patch<ServiceInfo>(`/api/admin/services/${id}`, data);
      setServices(prev => prev.map(s => (s.id === id ? updated : s)));
    } catch (err) { handleError(err); }
  };

  // ---- Entidades / Linhas ----
  const addEntity = async (entity: Omit<Entity, 'id'>) => {
    try {
      const created = await api.post<Entity>('/api/admin/entities', entity);
      setEntities(prev => [...prev, created]);
    } catch (err) { handleError(err); }
  };
  const updateEntity = async (id: string, data: Partial<Entity>) => {
    try {
      const updated = await api.patch<Entity>(`/api/admin/entities/${id}`, data);
      setEntities(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err) { handleError(err); }
  };
  const deleteEntity = async (id: string) => {
    try {
      await api.delete(`/api/admin/entities/${id}`);
      setEntities(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Configurações do site ----
  const updateSiteConfig = async (data: Partial<SiteConfig>) => {
    try {
      const updated = await api.patch<SiteConfig>('/api/admin/config', data);
      setSiteConfig(updated);
    } catch (err) { handleError(err); }
  };

  // ---- Mensagens de contato ----
  const addContactMessage = async (msg: Omit<ContactMessage, 'id' | 'receivedAt' | 'read'>) => {
    try {
      await api.post('/api/public/contact', msg, false);
    } catch (err) { handleError(err); }
  };
  const markMessageRead = async (id: string) => {
    try {
      const updated = await api.patch<ContactMessage>(`/api/admin/messages/${id}/lida`);
      setContactMessages(prev => prev.map(m => (m.id === id ? updated : m)));
    } catch (err) { handleError(err); }
  };
  const deleteMessage = async (id: string) => {
    try {
      await api.delete(`/api/admin/messages/${id}`);
      setContactMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) { handleError(err); }
  };

  // ---- Migração dos dados antigos (localStorage -> backend) ----
  const importLegacyData = async (snapshot: Record<string, unknown>) => {
    const result = await api.post<{ message: string; result: Record<string, unknown> }>('/api/admin/import', snapshot);
    await Promise.all([loadPublicData(), refreshAdminData()]);
    return result;
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, events, faqItems, newsItems, galleryItems, services,
      entities, activityLogs, siteConfig, contactMessages,
      loadingPublicData, authReady, lastError,
      login, register, logout, hasPermission,
      addUser, updateUser, deleteUser,
      addEvent, updateEvent, deleteEvent,
      addFAQ, updateFAQ, deleteFAQ,
      addNews, updateNews, deleteNews,
      addGalleryItem, updateGalleryItem, deleteGalleryItem,
      updateService,
      addEntity, updateEntity, deleteEntity,
      updateSiteConfig,
      addContactMessage, markMessageRead, deleteMessage,
      refreshAdminData, importLegacyData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
