import React from 'react';
import { Plus, Edit2, Trash2, BookOpen, FolderOpen, FileText, Video, Headphones, Image, FileDown, Link2, X, Check, Search, Eye, EyeOff, ChevronDown, ChevronUp, Layers, BarChart3, UploadCloud, Loader2, FileArchive } from 'lucide-react';
import { api, mediaUrl, uploadContentFile } from '../../lib/api';

type Content = { id:string; degreeId:string; moduleId:string|null; title:string; description:string; type:string; body:string; mediaUrl?:string|null; coverUrl?:string|null; sortOrder:number; published:boolean };
type Module = { id:string; degreeId:string; name:string; description:string; sortOrder:number; active:boolean; contents:Content[] };
type Degree = { id:string; name:string; description:string; sortOrder:number; active:boolean; modules:Module[]; contents:Content[] };

const typeIcons: Record<string, React.ReactNode> = {
  text:<FileText size={15}/>, video:<Video size={15}/>, audio:<Headphones size={15}/>, image:<Image size={15}/>, pdf:<FileDown size={15}/>, link:<Link2 size={15}/>, gallery:<Image size={15}/>,
};
const typeLabels: Record<string,string> = { text:'Texto', video:'Vídeo', audio:'Áudio', image:'Imagem', pdf:'PDF', link:'Link externo', gallery:'Galeria' };
const typeHelp: Record<string,string> = {
  text:'Use o campo abaixo para escrever o conteúdo da aula.',
  video:'Cole a URL do vídeo. O aluno poderá reproduzi-lo dentro da Área do Filho.',
  audio:'Cole a URL do áudio. O aluno terá um player dentro da Área do Filho.',
  image:'Cole a URL da imagem que será exibida em tamanho ampliado.',
  pdf:'Cole a URL direta do PDF. Ele será aberto dentro da Área do Filho.',
  link:'Cole o endereço completo do material externo.',
  gallery:'Cole várias URLs de imagens, uma por linha ou separadas por vírgula.'
};

export const AdminFilhoConteudos: React.FC = () => {
  const [degrees,setDegrees]=React.useState<Degree[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [degreeModal,setDegreeModal]=React.useState(false); const [editingDegree,setEditingDegree]=React.useState<Degree|null>(null);
  const [moduleModal,setModuleModal]=React.useState<{degreeId:string;module?:Module}|null>(null);
  const [contentModal,setContentModal]=React.useState<{degreeId:string;moduleId?:string;content?:Content}|null>(null);
  const [degreeForm,setDegreeForm]=React.useState({name:'',description:'',sortOrder:1});
  const [moduleForm,setModuleForm]=React.useState({name:'',description:'',sortOrder:1});
  const [contentForm,setContentForm]=React.useState({title:'',description:'',type:'text',body:'',mediaUrl:'',coverUrl:'',sortOrder:1,published:true});
  const [search,setSearch]=React.useState('');
  const [filter,setFilter]=React.useState<'all'|'published'|'draft'>('all');
  const [openDegrees,setOpenDegrees]=React.useState<Record<string,boolean>>({});

  const load=React.useCallback(async()=>{setLoading(true);try{setDegrees(await api.get<Degree[]>('/api/filho-content/admin'));}finally{setLoading(false);}},[]);
  React.useEffect(()=>{void load();},[load]);

  const resetContent=()=>setContentForm({title:'',description:'',type:'text',body:'',mediaUrl:'',coverUrl:'',sortOrder:1,published:true});
  const saveDegree=async()=>{if(!degreeForm.name.trim())return;if(editingDegree) await api.patch('/api/filho-content/admin/degrees/'+editingDegree.id,degreeForm); else await api.post('/api/filho-content/admin/degrees',degreeForm);setDegreeModal(false);setEditingDegree(null);setDegreeForm({name:'',description:'',sortOrder:degrees.length+1});await load();};
  const saveModule=async()=>{if(!moduleModal||!moduleForm.name.trim())return;if(moduleModal.module) await api.patch('/api/filho-content/admin/modules/'+moduleModal.module.id,moduleForm); else await api.post('/api/filho-content/admin/modules',{...moduleForm,degreeId:moduleModal.degreeId});setModuleModal(null);await load();};
  const saveContent=async()=>{if(!contentModal||!contentForm.title.trim())return;const payload={...contentForm,degreeId:contentModal.degreeId,moduleId:contentModal.moduleId||contentModal.content?.moduleId||null};if(contentModal.content) await api.patch('/api/filho-content/admin/contents/'+contentModal.content.id,payload); else await api.post('/api/filho-content/admin/contents',payload);setContentModal(null);await load();};
  const del=async(kind:string,id:string)=>{if(!window.confirm('Excluir este item? Esta ação não poderá ser desfeita.'))return;await api.delete('/api/filho-content/admin/'+kind+'/'+id);await load();};

  const allContents=degrees.flatMap(d=>[...d.contents,...d.modules.flatMap(m=>m.contents)]);
  const publishedCount=allContents.filter(c=>c.published).length;
  const draftCount=allContents.length-publishedCount;
  const filtered=(c:Content)=>{
    const q=search.trim().toLowerCase();
    const text=[c.title,c.description,typeLabels[c.type]||c.type].join(' ').toLowerCase();
    return (!q||text.includes(q)) && (filter==='all'||(filter==='published'?c.published:!c.published));
  };

  const openContent=(degreeId:string,moduleId:string|undefined,content?:Content)=>{
    if(content) setContentForm({title:content.title,description:content.description,type:content.type,body:content.body,mediaUrl:content.mediaUrl||'',coverUrl:content.coverUrl||'',sortOrder:content.sortOrder,published:content.published});
    else { resetContent(); setContentForm(v=>({...v,sortOrder:1})); }
    setContentModal({degreeId,moduleId,content});
  };

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div><div className="flex items-center gap-2"><BookOpen className="text-[#c9a84c]" size={22}/><h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Conteúdos dos Filhos</h2></div><p className="font-inter text-sm text-[rgba(245,240,232,0.4)] mt-1">Gerencie graus, módulos e materiais de estudo em um único painel.</p></div>
      <button onClick={()=>{setEditingDegree(null);setDegreeForm({name:'',description:'',sortOrder:degrees.length+1});setDegreeModal(true)}} className="btn-gold text-xs"><Plus size={14}/> Novo Grau</button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat icon={<Layers size={17}/>} label="Graus" value={degrees.length}/>
      <Stat icon={<FolderOpen size={17}/>} label="Módulos" value={degrees.reduce((n,d)=>n+d.modules.length,0)}/>
      <Stat icon={<Eye size={17}/>} label="Publicados" value={publishedCount}/>
      <Stat icon={<EyeOff size={17}/>} label="Rascunhos" value={draftCount}/>
    </div>

    {degrees.length>0 && <div className="card-spiritual p-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo por título, descrição ou tipo..." className="form-input pl-9"/></div>
        <div className="flex gap-2">
          {(['all','published','draft'] as const).map(v=><button key={v} onClick={()=>setFilter(v)} className={filter===v?'btn-gold text-xs':'btn-outline-gold text-xs'}>{v==='all'?'Todos':v==='published'?'Publicados':'Rascunhos'}</button>)}
        </div>
      </div>
    </div>}

    {loading?<div className="card-spiritual p-8 text-center text-sm text-white/40">Carregando conteúdos...</div>:degrees.length===0?<div className="card-spiritual p-8 text-center"><BookOpen className="mx-auto text-[#c9a84c]" size={30}/><p className="mt-3 text-sm text-white/50">Nenhum grau cadastrado. Crie o primeiro grau para começar.</p></div>:degrees.map((d,index)=>{
      const isOpen=openDegrees[d.id]??(index===0);
      const degreeContent=[...d.contents,...d.modules.flatMap(m=>m.contents)];
      const degreePublished=degreeContent.filter(c=>c.published).length;
      return <div key={d.id} className="card-spiritual overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-3">
          <button onClick={()=>setOpenDegrees(v=>({...v,[d.id]:!isOpen}))} className="flex items-start gap-3 text-left min-w-0 flex-1">
            <span className="w-10 h-10 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/5 flex items-center justify-center text-sm font-cinzel font-bold text-[#e8c97a] shrink-0">{d.sortOrder}</span>
            <span className="min-w-0"><span className="flex items-center gap-2 flex-wrap"><span className="font-cinzel font-bold text-white">{d.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/35">{degreeContent.length} materiais</span><span className="text-[10px] px-2 py-0.5 rounded-full border border-green-400/15 text-green-300/60">{degreePublished} publicados</span></span><span className="block text-xs text-white/35 mt-1">{d.description||'Sem descrição.'}</span></span>
          </button>
          <div className="flex items-center gap-1"><button onClick={()=>{setEditingDegree(d);setDegreeForm({name:d.name,description:d.description,sortOrder:d.sortOrder});setDegreeModal(true)}} className="p-2 border border-white/10 rounded text-white/50 hover:text-[#c9a84c]" title="Editar grau"><Edit2 size={14}/></button><button onClick={()=>setOpenDegrees(v=>({...v,[d.id]:!isOpen}))} className="p-2 text-white/40">{isOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button></div>
        </div>

        {isOpen && <div className="px-5 pb-5 space-y-3">
          {d.modules.map(m=><div key={m.id} className="rounded-lg border border-white/10 bg-black/10 overflow-hidden">
            <div className="p-4 flex justify-between gap-3"><div className="flex items-start gap-2 min-w-0"><FolderOpen size={16} className="text-[#c9a84c] mt-0.5 shrink-0"/><div><div className="text-white font-cinzel text-sm">{m.name}</div><p className="text-xs text-white/35 mt-1">{m.description||'Sem descrição.'}</p></div></div><div className="flex gap-1 shrink-0"><button onClick={()=>{setModuleForm({name:m.name,description:m.description,sortOrder:m.sortOrder});setModuleModal({degreeId:d.id,module:m})}} className="p-1.5 text-white/40 hover:text-[#c9a84c]" title="Editar módulo"><Edit2 size={13}/></button><button onClick={()=>void del('modules',m.id)} className="p-1.5 text-white/40 hover:text-red-400" title="Excluir módulo"><Trash2 size={13}/></button></div></div>
            <div className="px-3 pb-3 space-y-1">{m.contents.filter(filtered).map(c=><ContentRow key={c.id} c={c} onEdit={()=>openContent(d.id,m.id,c)} onDelete={()=>void del('contents',c.id)}/>)}{m.contents.filter(filtered).length===0&&<p className="text-xs text-white/25 p-2">{search||filter!=='all'?'Nenhum conteúdo corresponde aos filtros.':'Nenhum conteúdo neste módulo.'}</p>}</div>
            <button onClick={()=>{resetContent();setContentForm(v=>({...v,sortOrder:m.contents.length+1}));setContentModal({degreeId:d.id,moduleId:m.id})}} className="mx-3 mb-3 text-xs text-[#c9a84c] flex items-center gap-1"><Plus size={13}/> Adicionar conteúdo</button>
          </div>)}
          <button onClick={()=>{setModuleForm({name:'',description:'',sortOrder:d.modules.length+1});setModuleModal({degreeId:d.id})}} className="w-full py-3 border border-dashed border-[#c9a84c]/20 rounded text-xs text-[#c9a84c] hover:bg-[#c9a84c]/5"><Plus size={13} className="inline mr-1"/> Novo módulo</button>
          {d.contents.filter(filtered).length>0&&<div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-white/40 mb-2">Conteúdos sem módulo</p>{d.contents.filter(filtered).map(c=><ContentRow key={c.id} c={c} onEdit={()=>openContent(d.id,undefined,c)} onDelete={()=>void del('contents',c.id)}/>)}</div>}
          <button onClick={()=>{resetContent();setContentForm(v=>({...v,sortOrder:d.contents.length+1}));setContentModal({degreeId:d.id})}} className="btn-outline-gold text-xs"><Plus size={13}/> Conteúdo direto no grau</button>
        </div>}
      </div>;
    })}

    {degreeModal&&<Modal title={editingDegree?'Editar grau':'Novo grau'} close={()=>setDegreeModal(false)}><div className="space-y-3"><Field label="Nome do grau" value={degreeForm.name} set={v=>setDegreeForm({...degreeForm,name:v})} placeholder="Ex.: 1º Grau"/><Field label="Descrição" value={degreeForm.description} set={v=>setDegreeForm({...degreeForm,description:v})} placeholder="Explique brevemente o objetivo deste grau"/><Field label="Ordem de exibição" value={String(degreeForm.sortOrder)} set={v=>setDegreeForm({...degreeForm,sortOrder:Number(v)||0})} type="number"/><button onClick={()=>void saveDegree()} className="btn-gold text-xs w-full justify-center"><Check size={14}/> Salvar grau</button></div></Modal>}
    {moduleModal&&<Modal title={moduleModal.module?'Editar módulo':'Novo módulo'} close={()=>setModuleModal(null)}><div className="space-y-3"><Field label="Nome do módulo" value={moduleForm.name} set={v=>setModuleForm({...moduleForm,name:v})} placeholder="Ex.: Fundamentos"/><Field label="Descrição" value={moduleForm.description} set={v=>setModuleForm({...moduleForm,description:v})} placeholder="O que será estudado neste módulo?"/><Field label="Ordem de exibição" value={String(moduleForm.sortOrder)} set={v=>setModuleForm({...moduleForm,sortOrder:Number(v)||0})} type="number"/><button onClick={()=>void saveModule()} className="btn-gold text-xs w-full justify-center"><Check size={14}/> Salvar módulo</button></div></Modal>}
    {contentModal&&<ContentModal form={contentForm} setForm={setContentForm} editing={!!contentModal.content} close={()=>setContentModal(null)} save={()=>void saveContent()}/>}
  </div>;
};

const ContentModal: React.FC<{
  form: { title: string; description: string; type: string; body: string; mediaUrl: string; coverUrl: string; sortOrder: number; published: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; type: string; body: string; mediaUrl: string; coverUrl: string; sortOrder: number; published: boolean }>>;
  editing: boolean;
  close: () => void;
  save: () => void;
}> = ({ form, setForm, editing, close, save }) => {
  const [tab, setTab] = React.useState<'details' | 'material' | 'preview'>('details');
  const [uploading, setUploading] = React.useState<'media' | 'cover' | 'gallery' | null>(null);
  const set = (patch: Partial<typeof form>) => setForm(v => ({ ...v, ...patch }));
  const url = form.mediaUrl ? mediaUrl(form.mediaUrl) : '';
  const gallery = form.type === 'gallery'
    ? form.mediaUrl.split(/[\n,]+/).map(v => v.trim()).filter(Boolean)
    : [];
  const acceptedByType: Record<string, string> = {
    image: 'image/jpeg,image/png,image/webp',
    video: 'video/mp4,video/webm',
    audio: 'audio/mpeg,audio/wav,audio/ogg',
    pdf: 'application/pdf',
    gallery: 'image/jpeg,image/png,image/webp',
  };

  const upload = async (kind: 'media' | 'cover' | 'gallery', files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (kind !== 'gallery') selected.splice(1);
    setUploading(kind);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (file.size > 20 * 1024 * 1024) throw new Error('O arquivo excede o limite de 20 MB.');
        const result = await uploadContentFile(file);
        uploaded.push(result.url);
      }
      if (kind === 'media') set({ mediaUrl: uploaded[0] || '' });
      else if (kind === 'cover') set({ coverUrl: uploaded[0] || '' });
      else set({ mediaUrl: [...gallery, ...uploaded].join('\\n') });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <Modal title={editing ? 'Editar conteúdo' : 'Novo conteúdo'} close={close}>
      <div className="flex gap-1 border-b border-white/10 mb-5">
        {([
          ['details', 'Detalhes'],
          ['material', 'Material'],
          ['preview', 'Pré-visualizar'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={tab === value
              ? 'px-3 py-2 text-xs text-[#e8c97a] border-b-2 border-[#c9a84c]'
              : 'px-3 py-2 text-xs text-white/35'}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="space-y-4">
          <Field label="Título *" value={form.title} set={v => set({ title: v })} placeholder="Ex.: Introdução à Umbanda" />
          <Field label="Descrição" value={form.description} set={v => set({ description: v })} placeholder="Resumo curto que aparecerá para o Filho" />
          <div>
            <label className="form-label">Tipo de material</label>
            <select
              className="form-input"
              value={form.type}
              onChange={e => set({ type: e.target.value, body: e.target.value === 'text' ? form.body : '' })}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="text-[11px] text-white/30 mt-1">{typeHelp[form.type]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ordem" value={String(form.sortOrder)} set={v => set({ sortOrder: Number(v) || 0 })} type="number" />
            <label className="flex items-center gap-2 text-sm text-white/65 pt-7">
              <input type="checkbox" checked={form.published} onChange={e => set({ published: e.target.checked })} />
              Publicado
            </label>
          </div>
        </div>
      )}

      {tab === 'material' && (
        <div className="space-y-4">
          {form.type === 'text' ? (
            <div>
              <label className="form-label">Texto da aula</label>
              <textarea
                className="form-input min-h-56 leading-6"
                value={form.body}
                onChange={e => set({ body: e.target.value })}
                placeholder="Escreva aqui o conteúdo completo da aula..."
              />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/5 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm text-white/75 font-medium">{form.type === 'gallery' ? 'Imagens da galeria' : 'Arquivo principal'}</p>
                    <p className="text-[11px] text-white/35 mt-1">Envie diretamente pelo computador. Limite de 20 MB por arquivo.</p>
                  </div>
                  <label className="btn-gold text-xs cursor-pointer shrink-0">
                    <UploadCloud size={14} />
                    {uploading ? (
                      <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                    ) : (
                      form.type === 'gallery' ? 'Adicionar imagens' : 'Selecionar arquivo'
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept={acceptedByType[form.type]}
                      multiple={form.type === 'gallery'}
                      disabled={!!uploading}
                      onChange={e => void upload(form.type === 'gallery' ? 'gallery' : 'media', e.target.files)}
                    />
                  </label>
                </div>
                {form.mediaUrl && (
                  <div className="flex items-center gap-2 rounded border border-white/10 bg-black/15 p-2">
                    <FileArchive size={15} className="text-[#c9a84c]" />
                    <span className="text-xs text-white/55 truncate flex-1">
                      {form.type === 'gallery' ? gallery.length + ' imagem(ns) adicionada(s)' : form.mediaUrl}
                    </span>
                    <button type="button" onClick={() => set({ mediaUrl: '' })} className="text-xs text-red-300/70 hover:text-red-300">Remover</button>
                  </div>
                )}
                <textarea
                  className="form-input min-h-20 mt-3"
                  value={form.mediaUrl}
                  onChange={e => set({ mediaUrl: e.target.value })}
                  placeholder={form.type === 'gallery' ? 'Uma URL por linha (ou use o botão acima)...' : 'URL pública opcional, caso prefira não enviar o arquivo...'}
                />
              </div>

              {form.type !== 'gallery' && (
                <div className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/65">Capa (opcional)</p>
                      <p className="text-[11px] text-white/30 mt-1">JPG, PNG ou WebP, até 20 MB.</p>
                    </div>
                    <label className="btn-outline-gold text-xs cursor-pointer">
                      <UploadCloud size={14} />
                      {uploading === 'cover' ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : 'Enviar capa'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={!!uploading}
                        onChange={e => void upload('cover', e.target.files)}
                      />
                    </label>
                  </div>
                  <Field label="URL da capa (alternativa)" value={form.coverUrl} set={v => set({ coverUrl: v })} placeholder="https://..." />
                  {form.coverUrl && <img src={mediaUrl(form.coverUrl)} alt="" className="mt-3 h-24 w-40 object-cover rounded border border-white/10" />}
                </div>
              )}

              <div className="rounded-lg border border-[#c9a84c]/15 bg-[#c9a84c]/5 p-3 text-xs text-white/50 flex gap-2">
                <BarChart3 size={15} className="text-[#c9a84c] shrink-0" />
                <span>O arquivo enviado fica armazenado no servidor e recebe um endereço próprio. URLs externas continuam disponíveis como alternativa.</span>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'preview' && (
        <div className="rounded-lg border border-white/10 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-[#c9a84c] text-xs uppercase tracking-wider">
            {typeIcons[form.type]} {typeLabels[form.type]}
          </div>
          <h4 className="font-cinzel text-white font-bold text-lg mt-2">{form.title || 'Sem título'}</h4>
          {form.description && <p className="text-xs text-white/40 mt-1">{form.description}</p>}
          {form.type === 'text' && <p className="mt-4 text-sm text-white/65 whitespace-pre-wrap leading-6">{form.body || 'Nenhum texto informado.'}</p>}
          {form.type === 'image' && url && <img src={url} alt="" className="mt-4 max-h-64 w-full object-contain rounded bg-black/20" />}
          {form.type === 'video' && url && <video controls className="mt-4 w-full rounded bg-black" src={url} />}
          {form.type === 'audio' && url && <audio controls className="mt-4 w-full" src={url} />}
          {form.type === 'pdf' && url && <iframe title="Prévia do PDF" src={url} className="mt-4 w-full h-64 rounded bg-white" />}
          {form.type === 'link' && url && <a href={url} target="_blank" rel="noreferrer" className="btn-gold text-xs mt-4">Abrir link <Link2 size={14} /></a>}
          {form.type === 'gallery' && gallery.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {gallery.map((src, i) => <img key={i} src={mediaUrl(src)} alt="" className="w-full h-28 object-cover rounded" />)}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-5 pt-4 border-t border-white/10">
        <button onClick={close} className="btn-outline-gold text-xs flex-1 justify-center">Cancelar</button>
        <button onClick={save} disabled={!form.title.trim()} className="btn-gold text-xs flex-1 justify-center disabled:opacity-40">
          <Check size={14} /> {editing ? 'Salvar alterações' : 'Criar conteúdo'}
        </button>
      </div>
    </Modal>
  );
};
const ContentRow:React.FC<{c:Content;onEdit:()=>void;onDelete:()=>void}>=({c,onEdit,onDelete})=><div className="flex items-center justify-between gap-3 py-2.5 px-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] rounded"><div className="flex items-center gap-2 min-w-0">{typeIcons[c.type]||<FileText size={15}/>}<div className="min-w-0"><div className="flex items-center gap-2"><span className="text-sm text-white/75 truncate">{c.title}</span>{!c.published&&<span className="text-[10px] text-yellow-300 border border-yellow-300/20 px-1.5 rounded">Rascunho</span>}</div><span className="text-[10px] text-white/25">{typeLabels[c.type]||c.type}</span></div></div><div className="flex gap-1 shrink-0"><button onClick={onEdit} className="p-1.5 text-white/40 hover:text-[#c9a84c]" title="Editar"><Edit2 size={12}/></button><button onClick={onDelete} className="p-1.5 text-white/40 hover:text-red-400" title="Excluir"><Trash2 size={12}/></button></div></div>;

const Stat:React.FC<{icon:React.ReactNode;label:string;value:number}>=({icon,label,value})=><div className="card-spiritual p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/5 flex items-center justify-center text-[#c9a84c]">{icon}</div><div><p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p><p className="font-cinzel font-bold text-white text-lg">{value}</p></div></div>;

const Field:React.FC<{label:string;value:string;set:(v:string)=>void;type?:string;placeholder?:string}>=({label,value,set,type='text',placeholder})=><div><label className="form-label">{label}</label><input type={type} className="form-input" value={value} onChange={e=>set(e.target.value)} placeholder={placeholder}/></div>;
const Modal:React.FC<{title:string;close:()=>void;children:React.ReactNode}>=({title,close,children})=><div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}><div className="modal-content max-w-xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-5"><h3 className="font-cinzel font-bold text-[#c9a84c]">{title}</h3><button onClick={close} className="text-white/40 hover:text-white"><X size={20}/></button></div>{children}</div></div>;
