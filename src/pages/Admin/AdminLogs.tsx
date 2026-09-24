import React from 'react';
import { Activity } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminLogs: React.FC = () => {
  const { activityLogs } = useApp();

  const actionColors: Record<string, string> = {
    'Criou': 'text-green-400 bg-green-400/10 border-green-400/30',
    'Editou': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    'Excluiu': 'text-red-400 bg-red-400/10 border-red-400/30',
    'Adicionou': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    'Removeu': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
          <Activity size={20} />
          Log de Atividades
        </h2>
        <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">{activityLogs.length} registro(s)</p>
      </div>

      {activityLogs.length === 0 ? (
        <div className="text-center py-16 bg-[#1a0a0a] rounded border border-[rgba(201,168,76,0.1)]">
          <Activity size={40} className="text-[rgba(201,168,76,0.3)] mx-auto mb-3" />
          <p className="font-cinzel text-[#c9a84c] text-base">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded overflow-hidden">
          <div className="divide-y divide-[rgba(201,168,76,0.06)]">
            {activityLogs.map(log => {
              const actionColor = Object.entries(actionColors).find(([key]) => log.action.includes(key))?.[1] || 'text-[rgba(245,240,232,0.5)] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]';
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-[rgba(201,168,76,0.02)] transition-colors">
                  <div className="flex-shrink-0 w-32 hidden md:block">
                    <p className="font-inter text-[rgba(245,240,232,0.3)] text-xs">
                      {format(new Date(log.timestamp), "dd/MM/yy")}
                    </p>
                    <p className="font-inter text-[rgba(245,240,232,0.2)] text-xs">
                      {format(new Date(log.timestamp), "HH:mm:ss")}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded border font-cinzel ${actionColor}`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-[rgba(245,240,232,0.75)] text-sm">
                      <span className="text-[#c9a84c] font-semibold">{log.userName}</span>
                      {' — '}{log.details}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-inter text-[rgba(245,240,232,0.25)] text-xs">{log.entity}</span>
                      <span className="font-inter text-[rgba(245,240,232,0.2)] text-xs md:hidden">
                        {format(new Date(log.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
