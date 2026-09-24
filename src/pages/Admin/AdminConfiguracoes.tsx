import React, { useState, useEffect, useRef } from 'react';
import { Save, Settings, UploadCloud, Download, AlertTriangle } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { getLegacySnapshot, hasLegacyData } from '../../lib/legacySnapshot';
import { normalizeWhatsApp } from '../../lib/whatsapp';

export const AdminConfiguracoes: React.FC = () => {
  const { siteConfig, updateSiteConfig, loadingPublicData, currentUser } = useApp();
  const [form, setForm] = useState({ ...siteConfig });
  const [saved, setSaved] = useState(false);
  const syncedRef = useRef(false);

  // siteConfig chega da API de forma assíncrona; assim que carregar pela primeira
  // vez, sincroniza o formulário (sem sobrescrever o que a pessoa já estiver digitando depois).
  useEffect(() => {
    if (!loadingPublicData && !syncedRef.current) {
      setForm({ ...siteConfig });
      syncedRef.current = true;
    }
  }, [loadingPublicData, siteConfig]);

  const handleSave = () => {
    const normalizedForm = { ...form, whatsapp: normalizeWhatsApp(form.whatsapp) };
    setForm(normalizedForm);
    updateSiteConfig(normalizedForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const InputField = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        value={form[field] as string}
        placeholder={placeholder}
        onChange={e => setForm({ ...form, [field]: e.target.value })}
      />
    </div>
  );

  const TextareaField = ({ label, field, rows = 4 }: { label: string; field: keyof typeof form; rows?: number }) => (
    <div>
      <label className="form-label">{label}</label>
      <textarea
        rows={rows}
        className="form-input resize-none"
        value={form[field] as string}
        onChange={e => setForm({ ...form, [field]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-[#c9a84c] text-xl flex items-center gap-2">
            <Settings size={20} />
            Configurações do Site
          </h2>
          <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">Edite qualquer informação do site</p>
        </div>
        <button onClick={handleSave} className={`btn-gold text-xs py-2 px-4 ${saved ? 'opacity-80' : ''}`}>
          <Save size={14} />
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
        <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4">🏠 Seção Hero (Página Inicial)</h3>
        <div className="space-y-4">
          <InputField label="Título Principal" field="heroTitle" />
          <InputField label="Subtítulo" field="heroSubtitle" />
          <ImageUploadField
            label="Imagem de Fundo (Hero)"
            value={form.heroImage}
            onChange={value => setForm({ ...form, heroImage: value })}
            helper="JPG, PNG ou WebP • até 5 MB"
          />
        </div>
      </div>

      {/* About Section */}
      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
        <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4">📖 Sobre Nós</h3>
        <div className="space-y-4">
          <TextareaField label="Texto Principal (Sobre Nós)" field="aboutText" rows={4} />
          <TextareaField label="História do Terreiro" field="aboutHistory" rows={6} />
          <ImageUploadField
            label="Imagem da seção Sobre"
            value={form.aboutImage}
            onChange={value => setForm({ ...form, aboutImage: value })}
            helper="JPG, PNG ou WebP • até 5 MB"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6">
        <h3 className="font-cinzel font-bold text-[#c9a84c] text-base mb-4">📞 Informações de Contato</h3>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <InputField label="WhatsApp usado por todos os botões do site" field="whatsapp" placeholder="5511940087119" />
              <p className="font-inter text-xs text-[rgba(245,240,232,0.45)]">Informe o número com DDD e código do país. Ao salvar, este número será sincronizado automaticamente com Fale Conosco, Agendar, Falar no WhatsApp e demais botões de atendimento.</p>
            </div>
            <InputField label="Instagram (sem @)" field="instagram" />
          </div>
          <InputField label="Endereço Completo" field="address" />
          <InputField label="URL do Google Maps" field="mapUrl" placeholder="https://maps.google.com/?q=..." />
          <InputField label="E-mail de Contato" field="email" type="email" />
          <TextareaField label="Horários de Atendimento" field="workingHours" rows={3} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-gold flex-1 justify-center">
          <Save size={16} />
          {saved ? '✓ Alterações Salvas!' : 'Salvar Todas as Alterações'}
        </button>
        <button onClick={() => setForm({ ...siteConfig })} className="btn-outline-gold">
          Resetar
        </button>
      </div>

      {currentUser?.role === 'super_admin' && <MigracaoDados />}
    </div>
  );
};


const ImageUploadField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}> = ({ label, value, onChange, helper }) => {
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    setError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato inválido. Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem é muito grande. O limite é de 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.onerror = () => setError('Não foi possível ler a imagem. Tente novamente.');
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="space-y-3">
        <div
          className="border border-dashed border-[rgba(201,168,76,0.25)] rounded p-4 bg-[rgba(201,168,76,0.03)] hover:border-[rgba(201,168,76,0.5)] transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] flex items-center justify-center text-[#c9a84c]">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="font-inter text-sm text-[#f5f0e8]">Clique para selecionar uma imagem</p>
              <p className="font-inter text-xs text-[rgba(245,240,232,0.4)]">ou arraste e solte aqui • {helper}</p>
            </div>
          </div>
        </div>

        {value && (
          <div className="relative overflow-hidden rounded border border-[rgba(201,168,76,0.2)] bg-black/20">
            <img src={value} alt={label} className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs hover:bg-black/90"
            >
              Remover
            </button>
          </div>
        )}

        {error && <p className="font-inter text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
};

// ============================================================
// Migração: traz para o backend os dados que ficaram gravados no
// localStorage do navegador antes desta atualização (usuários, agenda,
// notícias, galeria, entidades, mensagens e configurações do site).
// ============================================================
const MigracaoDados: React.FC = () => {
  const { importLegacyData } = useApp();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const legacyExists = hasLegacyData();

  const handleExport = () => {
    const snapshot = getLegacySnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-zedolaco-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!confirm('Isso vai enviar os dados antigos deste navegador para o servidor. Pode ser feito mais de uma vez sem duplicar usuários. Continuar?')) return;
    setStatus('loading');
    try {
      const snapshot = getLegacySnapshot();
      const res = await importLegacyData(snapshot);
      const r = res.result as Record<string, number | boolean>;
      setMessage(
        `Importado: ${r.users} usuário(s), ${r.events} evento(s), ${r.faqItems} pergunta(s) de FAQ, ` +
        `${r.newsItems} notícia(s), ${r.galleryItems} foto(s), ${r.entities} entidade(s), ${r.contactMessages} mensagem(ns).`
      );
      setStatus('done');
    } catch {
      setMessage('Não foi possível concluir a importação. Confira se o backend está no ar e tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className="bg-[#1a0a0a] border border-[rgba(201,168,76,0.1)] rounded p-6 space-y-4">
      <h3 className="font-cinzel font-bold text-[#c9a84c] text-base flex items-center gap-2">
        <UploadCloud size={18} />
        Migração de Dados (localStorage → Servidor)
      </h3>
      <p className="font-inter text-[rgba(245,240,232,0.4)] text-sm">
        Antes desta atualização, os dados do site ficavam salvos apenas no navegador. Use as opções abaixo
        para levar o que já estava cadastrado para o novo backend, sem perder nada.
      </p>

      {!legacyExists && (
        <div className="flex items-start gap-2 p-3 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.15)] rounded">
          <AlertTriangle size={14} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
          <p className="font-inter text-[rgba(245,240,232,0.5)] text-xs">
            Não encontrei dados antigos neste navegador. Isso é normal se você já fez a importação antes,
            se este é um navegador novo, ou se o site já nasceu conectado ao backend.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={handleExport} disabled={!legacyExists} className="btn-outline-gold text-xs py-2 px-4 disabled:opacity-40">
          <Download size={14} />
          Baixar backup local (JSON)
        </button>
        <button onClick={handleImport} disabled={!legacyExists || status === 'loading'} className="btn-gold text-xs py-2 px-4 disabled:opacity-40">
          <UploadCloud size={14} />
          {status === 'loading' ? 'Importando...' : 'Importar para o servidor'}
        </button>
      </div>

      {message && (
        <p className={`font-inter text-xs ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
      )}
    </div>
  );
};
