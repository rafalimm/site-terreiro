import React from 'react';
import { Plus, Edit2, Trash2, BookOpen, FolderOpen, FileText, Video, Headphones, Image, FileDown, Link2, X, Check } from 'lucide-react';
import { api } from '../../lib/api';

type Content = { id:string; degreeId:string; moduleId:string|null; title:string; description:string; type:string; body:string; mediaUrl?:string|null; coverUrl?:string|null; sortOrder:number; published:boolean };
type Module = { id:string; degreeId:string; name:string; description:string; sortOrder:number; active:boolean; contents:Content[] };
type Degree = { id:string; name:string; description:string; sortOrder:number; active:boolean; modules:Module[]; contents:Content[] };

const typeIcons: Record<string, React.ReactNode> = {
  text:<FileText size={15}/>, video:<Video size={15}/>, audio:<Headphones size={15}/>, image:<Image size={15}/>, pdf:<FileDown size={15}/>, link:<Link2 size={15}/>, gallery:<Image size={15}/>,
};
const typeLabels: Record<string,string> = { text:'Texto', video:'Vídeo', audio:'Áudio', image:'Imagem', pdf:'PDF', link:'Link externo', gallery:'Galeria' };

export const AdminFilhoConteudos: React.FC = () => {
  const [degrees,setDegrees]=React.useState<Degree[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [degreeModal,setDegreeModal]=React.useState(false);
  const [moduleModal,setModuleModal]=React.useState<{degreeId:string;module?:Module}|null>(null);
  const [contentModal,setContentModal]=React.useState<{degreeId:string;moduleId?:string;content?:Content}|null>(null);
  const [degreeForm,setDegreeForm]=React.useState({name:'',description:'',sortOrder:1});
  const [moduleForm,setModuleForm]=React.useState({name:'',description:'',sortOrder:1});
  const [contentForm,setContentForm]=React.useState({title:'',description:'',type:'text',body:'',mediaUrl:'',coverUrl:'',sortOrder:1,published:true});
  const load=React.useCallback(async()=>{setLoading(true);try{setDegrees(await api.get<Degree[]>('/api/filho-content/admin'));}finally{setLoading(false);}},[]);
  React.useEffect(()=>{void load();},[load]);

  const saveDegree=async()=>{if(!degreeForm.name.trim())return;await api.post('/api/filho-content/admin/degrees',degreeForm);setDegreeModal(false);setDegreeForm({name:'',description:'',sortOrder:degrees.length+1});await load();};
  const saveModule=async()=>{if(!moduleModal||!moduleForm.name.trim())return;if(moduleModal.module) await api.patch('/api/filho-content/admin/modules/'+moduleModal.module.id,moduleForm); else await api.post('/api/filho-content/admin/modules',{...moduleForm,degreeId:moduleModal.degreeId});setModuleModal(null);await load();};
  const saveContent=async()=>{if(!contentModal||!contentForm.title.trim())return;const payload={...contentForm,degreeId:contentModal.degreeId,moduleId:contentModal.moduleId||contentModal.content?.moduleId||null};if(contentModal.content) await api.patch('/api/filho-content/admin/contents/'+contentModal.content.id,payload); else await api.post('/api/filho-content/admin/contents',payload);setContentModal(null);await load();};
  const del=async(kind:string,id:string)=>{if(!window.confirm('Excluir este item?'))return;await api.delete('/api/filho-content/admin/'+kind+'/'+id);await load();};

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div><h2 className="font-cinzel font-bold text-[#c9a84c] text-xl">Conteúdos dos Filhos</h2><p className="font-inter text-sm text-[rgba(245,240,232,0.4)]">Organize graus, módulos e materiais de estudo sem alterar as outras áreas do site.</p></div>
      <button onClick={()=>{setDegreeForm({name:'',description:'',sortOrder:degrees.length+1});setDegreeModal(true)}} className="btn-gold text-xs"><Plus size={14}/> Novo Grau</button>
    </div>
    {loading?<p className="text-sm text-[rgba(245,240,232,0.4)]">Carregando...</p>:degrees.length===0?<div className="card-spiritual p-8 text-center"><BookOpen className="mx-auto text-[#c9a84c]" size={30}/><p className="mt-3 text-sm text-[rgba(245,240,232,0.5)]">Nenhum grau cadastrado. Crie o primeiro grau para começar.</p></div>:degrees.map(d=><div key={d.id} className="card-spiritual p-5">
      <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-xs px-2 py-1 rounded border border-[#c9a84c]/30 text-[#c9a84c]">Grau {d.sortOrder}</span><h3 className="font-cinzel font-bold text-white">{d.name}</h3></div><p className="text-xs text-[rgba(245,240,232,0.4)] mt-2">{d.description || 'Sem descrição.'}</p></div><button onClick={()=>{setDegreeForm({name:d.name,description:d.description,sortOrder:d.sortOrder});setDegreeModal(true)}} className="p-2 border border-white/10 rounded text-white/50 hover:text-[#c9a84c]"><Edit2 size={14}/></button></div>
      <div className="mt-5 space-y-3">
        {d.modules.map(m=><div key={m.id} className="rounded border border-white/10 bg-black/10 p-4 ml-0">
          <div className="flex justify-between gap-3"><div><div className="flex items-center gap-2 text-[#f5f0e8] font-cinzel text-sm"><FolderOpen size={15} className="text-[#c9a84c]"/>{m.name}</div><p className="text-xs text-white/35 mt-1">{m.description}</p></div><div className="flex gap-1"><button onClick={()=>{setModuleForm({name:m.name,description:m.description,sortOrder:m.sortOrder});setModuleModal({degreeId:d.id,module:m})}} className="p-1.5 text-white/40 hover:text-[#c9a84c]"><Edit2 size={13}/></button><button onClick={()=>void del('modules',m.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 size={13}/></button></div></div>
          <div className="mt-3 space-y-1">{m.contents.map(c=><ContentRow key={c.id} c={c} onEdit={()=>{setContentForm({title:c.title,description:c.description,type:c.type,body:c.body,mediaUrl:c.mediaUrl||'',coverUrl:c.coverUrl||'',sortOrder:c.sortOrder,published:c.published});setContentModal({degreeId:d.id,moduleId:m.id,content:c})}} onDelete={()=>void del('contents',c.id)}/>)}</div>
          <button onClick={()=>{setContentForm({title:'',description:'',type:'text',body:'',mediaUrl:'',coverUrl:'',sortOrder:m.contents.length+1,published:true});setContentModal({degreeId:d.id,moduleId:m.id})}} className="mt-3 text-xs text-[#c9a84c] flex items-center gap-1"><Plus size={13}/> Adicionar conteúdo</button>
        </div>)}
        <button onClick={()=>{setModuleForm({name:'',description:'',sortOrder:d.modules.length+1});setModuleModal({degreeId:d.id})}} className="w-full py-3 border border-dashed border-[#c9a84c]/20 rounded text-xs text-[#c9a84c]"><Plus size={13} className="inline mr-1"/> Novo módulo</button>
        {d.contents.length>0&&<div className="rounded border border-white/10 p-4"><p className="text-xs text-white/40 mb-2">Conteúdos sem módulo</p>{d.contents.map(c=><ContentRow key={c.id} c={c} onEdit={()=>{setContentForm({title:c.title,description:c.description,type:c.type,body:c.body,mediaUrl:c.mediaUrl||'',coverUrl:c.coverUrl||'',sortOrder:c.sortOrder,published:c.published});setContentModal({degreeId:d.id,content:c})}} onDelete={()=>void del('contents',c.id)}/>)}</div>}
      </div>
      <button onClick={()=>{setContentForm({title:'',description:'',type:'text',body:'',mediaUrl:'',coverUrl:'',sortOrder:d.contents.length+1,published:true});setContentModal({degreeId:d.id})}} className="mt-3 btn-outline-gold text-xs"><Plus size={13}/> Conteúdo no grau</button>
    </div>)}

    {degreeModal&&<Modal title="Grau" close={()=>setDegreeModal(false)}><div className="space-y-3"><Field label="Nome" value={degreeForm.name} set={v=>setDegreeForm({...degreeForm,name:v})}/><Field label="Descrição" value={degreeForm.description} set={v=>setDegreeForm({...degreeForm,description:v})}/><Field label="Ordem" value={String(degreeForm.sortOrder)} set={v=>setDegreeForm({...degreeForm,sortOrder:Number(v)||0})} type="number"/><button onClick={()=>void saveDegree()} className="btn-gold text-xs w-full justify-center"><Check size={14}/> Salvar</button></div></Modal>}
    {moduleModal&&<Modal title={moduleModal.module?'Editar módulo':'Novo módulo'} close={()=>setModuleModal(null)}><div className="space-y-3"><Field label="Nome" value={moduleForm.name} set={v=>setModuleForm({...moduleForm,name:v})}/><Field label="Descrição" value={moduleForm.description} set={v=>setModuleForm({...moduleForm,description:v})}/><Field label="Ordem" value={String(moduleForm.sortOrder)} set={v=>setModuleForm({...moduleForm,sortOrder:Number(v)||0})} type="number"/><button onClick={()=>void saveModule()} className="btn-gold text-xs w-full justify-center"><Check size={14}/> Salvar</button></div></Modal>}
    {contentModal&&<Modal title={contentModal.content?'Editar conteúdo':'Novo conteúdo'} close={()=>setContentModal(null)}><div className="space-y-3"><Field label="Título" value={contentForm.title} set={v=>setContentForm({...contentForm,title:v})}/><Field label="Descrição" value={contentForm.description} set={v=>setContentForm({...contentForm,description:v})}/><div><label className="form-label">Tipo</label><select className="form-input" value={contentForm.type} onChange={e=>setContentForm({...contentForm,type:e.target.value})}>{Object.entries(typeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div><label className="form-label">Conteúdo</label><textarea className="form-input min-h-32" value={contentForm.body} onChange={e=>setContentForm({...contentForm,body:e.target.value})} placeholder="Texto, descrição da aula ou observações..."/></div><Field label="URL do material (vídeo, áudio, PDF, imagem ou link)" value={contentForm.mediaUrl} set={v=>setContentForm({...contentForm,mediaUrl:v})}/><Field label="URL da capa" value={contentForm.coverUrl} set={v=>setContentForm({...contentForm,coverUrl:v})}/><Field label="Ordem" value={String(contentForm.sortOrder)} set={v=>setContentForm({...contentForm,sortOrder:Number(v)||0})} type="number"/><label className="flex gap-2 items-center text-sm text-white/70"><input type="checkbox" checked={contentForm.published} onChange={e=>setContentForm({...contentForm,published:e.target.checked})}/> Publicado</label><button onClick={()=>void saveContent()} className="btn-gold text-xs w-full justify-center"><Check size={14}/> Salvar</button></div></Modal>}
  </div>;
};

const ContentRow:React.FC<{c:Content;onEdit:()=>void;onDelete:()=>void}>=({c,onEdit,onDelete})=><div className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"><div className="flex items-center gap-2 min-w-0">{typeIcons[c.type]||<FileText size={15}/>}<span className="text-sm text-white/75 truncate">{c.title}</span>{!c.published&&<span className="text-[10px] text-yellow-300 border border-yellow-300/20 px-1 rounded">Rascunho</span>}</div><div className="flex gap-1"><button onClick={onEdit} className="p-1.5 text-white/40 hover:text-[#c9a84c]"><Edit2 size={12}/></button><button onClick={onDelete} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 size={12}/></button></div></div>;

const Field:React.FC<{label:string;value:string;set:(v:string)=>void;type?:string}>=({label,value,set,type='text'})=><div><label className="form-label">{label}</label><input type={type} className="form-input" value={value} onChange={e=>set(e.target.value)}/></div>;
const Modal:React.FC<{title:string;close:()=>void;children:React.ReactNode}>=({title,close,children})=><div className="modal-overlay"><div className="modal-content max-w-xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-5"><h3 className="font-cinzel font-bold text-[#c9a84c]">{title}</h3><button onClick={close} className="text-white/40"><X size={20}/></button></div>{children}</div></div>;
