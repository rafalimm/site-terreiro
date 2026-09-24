import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Newspaper, HelpCircle, Image,
  Users, Settings, LogOut, Menu, X, Star, MessageSquare,
  Activity, Layers, CreditCard, Shield
} from 'lucide-react';
import { useApp } from '../../store/AppContext';

export type AdminSection =
  | 'dashboard' | 'agenda' | 'noticias' | 'faq' | 'galeria'
  | 'usuarios' | 'configuracoes' | 'mensagens' | 'servicos'
  | 'entidades' | 'logs' | 'consulentes';

interface AdminLayoutProps {
  children: React.ReactNode;
  section: AdminSection;
  setSection: (s: AdminSection) => void;
}

const menuItems: { key: AdminSection; label: string; icon: any; perm?: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'agenda', label: 'Agenda / Giras', icon: Calendar, perm: 'agenda' },
  { key: 'noticias', label: 'Notícias', icon: Newspaper, perm: 'news' },
  { key: 'faq', label: 'FAQ', icon: HelpCircle, perm: 'faq' },
  { key: 'galeria', label: 'Galeria', icon: Image, perm: 'gallery' },
  { key: 'servicos', label: 'Cartas & Búzios', icon: CreditCard, perm: 'services' },
  { key: 'entidades', label: 'Entidades', icon: Star, perm: 'entities' },
  { key: 'mensagens', label: 'Mensagens', icon: MessageSquare, perm: 'messages' },
  { key: 'consulentes', label: 'Consulentes', icon: Users, perm: 'consulentes' },
  { key: 'usuarios', label: 'Usuários', icon: Shield },
  { key: 'logs', label: 'Logs', icon: Activity },
  { key: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, section, setSection }) => {
  const { currentUser, logout, hasPermission } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const canAccess = (item: typeof menuItems[0]) => {
    if (!item.perm) return true;
    return hasPermission(item.perm) || hasPermission('*');
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    agenda: 'Resp. Agenda',
    content: 'Resp. Conteúdo',
    atendimento: 'Atendimento',
    consulente: 'Consulente',
  };

  return (
    <div className="min-h-screen bg-[#080303] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#100505] border-r border-[rgba(201,168,76,0.1)] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[rgba(201,168,76,0.1)]">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border border-[#c9a84c] flex items-center justify-center bg-[rgba(201,168,76,0.1)]">
              <Star size={12} className="text-[#c9a84c]" fill="currentColor" />
            </div>
            <div>
              <div className="font-cinzel text-[#c9a84c] text-xs tracking-wider">UMBANDA</div>
              <div className="font-cinzel font-black text-white text-sm tracking-widest">ZÉ DO LAÇO</div>
            </div>
          </Link>
          <div className="mt-3 p-2 rounded bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.1)]">
            <p className="font-inter text-[#f5f0e8] text-xs font-semibold truncate">{currentUser?.name}</p>
            <p className="font-inter text-[#c9a84c] text-xs">{roleLabels[currentUser?.role || '']}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.filter(canAccess).map(item => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
              className={`admin-sidebar-link ${section === item.key ? 'active' : ''}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[rgba(201,168,76,0.1)] space-y-1">
          <Link to="/" className="admin-sidebar-link">
            <Layers size={16} />
            Ver Site
          </Link>
          <button onClick={handleLogout} className="admin-sidebar-link text-red-400 hover:text-red-300 hover:bg-[rgba(139,26,26,0.15)]">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#100505]/95 backdrop-blur-sm border-b border-[rgba(201,168,76,0.1)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 text-[#c9a84c]"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="font-cinzel font-bold text-[#f5f0e8] text-sm md:text-base">
                Painel Administrativo
              </h1>
              <p className="font-inter text-[rgba(245,240,232,0.4)] text-xs">
                Centro de Umbanda Zé do Laço
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded border border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.05)]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-inter text-[rgba(245,240,232,0.6)] text-xs">Online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
