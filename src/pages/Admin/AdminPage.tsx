import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { AdminLayout, AdminSection } from './AdminLayout';
import { Dashboard } from './Dashboard';
import { AdminAgenda } from './AdminAgenda';
import { AdminNoticias } from './AdminNoticias';
import { AdminFAQ } from './AdminFAQ';
import { AdminGaleria } from './AdminGaleria';
import { AdminUsuarios } from './AdminUsuarios';
import { AdminMensagens } from './AdminMensagens';
import { AdminServicos } from './AdminServicos';
import { AdminEntidades } from './AdminEntidades';
import { AdminLogs } from './AdminLogs';
import { AdminConsulentes } from './AdminConsulentes';
import { AdminConfiguracoes } from './AdminConfiguracoes';

const ADMIN_ROLES = ['super_admin', 'admin', 'agenda', 'content', 'atendimento'];

export const AdminPage: React.FC = () => {
  const { currentUser, authReady } = useApp();
  const [section, setSection] = useState<AdminSection>('dashboard');

  // Enquanto a sessão salva (token) ainda está sendo verificada com o servidor,
  // evita redirecionar para o login prematuramente.
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0d0505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[rgba(201,168,76,0.3)] border-t-[#c9a84c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || !ADMIN_ROLES.includes(currentUser.role)) {
    return <Navigate to="/entrar" replace />;
  }

  const renderSection = () => {
    switch (section) {
      case 'dashboard': return <Dashboard />;
      case 'agenda': return <AdminAgenda />;
      case 'noticias': return <AdminNoticias />;
      case 'faq': return <AdminFAQ />;
      case 'galeria': return <AdminGaleria />;
      case 'usuarios': return <AdminUsuarios />;
      case 'mensagens': return <AdminMensagens />;
      case 'servicos': return <AdminServicos />;
      case 'entidades': return <AdminEntidades />;
      case 'logs': return <AdminLogs />;
      case 'consulentes': return <AdminConsulentes />;
      case 'configuracoes': return <AdminConfiguracoes />;
      default: return <Dashboard />;
    }
  };

  return (
    <AdminLayout section={section} setSection={setSection}>
      {renderSection()}
    </AdminLayout>
  );
};
