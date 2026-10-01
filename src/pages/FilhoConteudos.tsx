import React from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, PlayCircle, Headphones, FileText, FileDown, Image, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api, mediaUrl } from '../lib/api';

type Content={id:string;title:string;description:string;type:string;body:string;mediaUrl?:string|null;coverUrl?:string|null;sortOrder:number;published:boolean};
type Module={id:string;name:string;description:string;sortOrder:number;contents:Content[]};
type Degree={id:string;name:string;description:string;sortOrder:number;modules:Module[];contents:Content[]};
type Payload={degree:{id:string;name:string;description:string;sortOrder:number}|null;degrees:Degree[];completedContentIds:string[]};

const icons:Record<string,React.ReactNode>={video:<PlayCircle size={17}/>,audio:<Headphones size={17}/>,pdf:<FileDown size={17}/>,image:<Image size={17}/>,link:<Link2 size={17}/>,text:<FileText size={17}/>,gallery:<Image size={17}/>};

export const FilhoConteudos:React.FC=()=>{
 const {currentUser,authReady}=useApp(); const [data,setData]=React.useState<Payload|null>(null); const [open,setOpen]=React.useState<string|null>(null); const [loading,setLoading]=React.useState(true);
 const load=React.useCallback(async()=>{if(!currentUser)return;try{setData(await api.get<Payload>('/api/filho-content'));}finally{setLoading(false);}},[currentUser]);
 React.useEffect(()=>{void load();},[load]);
 if(!authReady)return <div className="min-h-screen bg-[#0d0505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin"/></div>;
 if(!currentUser)return <Navigate to="/entrar" replace/>;
 const allowed=['filho','atendimento','content','agenda','admin','super_admin'].includes(currentUser.role);
 if(!allowed)return <Navigate to="/minha-conta" replace/>;
 if(loading)return <div className="min-h-screen bg-[#0d0505] pt-28 px-4 text-center text-white/50">Carregando conteúdos...</div>;
 const done=new Set(data?.completedContentIds||[]); const all=(data?.degrees||[]).flatMap(d=>[...d.contents,...d.modules.flatMap(m=>m.contents)]); const pct=all.length?Math.round(all.filter(c=>done.has(c.id)).length/all.length*100):0;
 const complete=async(id:string)=>{await api.post('/api/filho-content/progress/'+id,{completed:!done.has(id)});await load();};
 return <div className="min-h-screen bg-[#0d0505] pt-28 pb-16 px-4"><div className="max-w-5xl mx-auto">
   <div className="card-spiritual p-7 mb-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-2 text-[#c9a84c]"><BookOpen size={20}/><span className="font-cinzel text-sm tracking-wider">ÁREA DO FILHO</span></div><h1 className="font-cinzel font-bold text-white text-2xl mt-2">{data?.degree?.name||'Área de Estudos'}</h1><p className="text-sm text-white/45 mt-1">{data?.degree?.description||'Conteúdos de estudo disponíveis para seu cargo.'}</p></div><div className="min-w-[180px]"><div className="flex justify-between text-xs text-white/45 mb-2"><span>Progresso</span><span>{pct}%</span></div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#c9a84c]" style={{width:pct+'%'}}/></div></div></div></div>
   {!data?.degree&&<div className="card-spiritual p-6 mb-5 border border-yellow-500/20"><p className="text-sm text-yellow-200">Seu cargo permite acessar esta área, mas ainda não há um grau definido para sua conta. Procure a administração para cadastrar seu grau.</p></div>}
   {(data?.degrees||[]).map(d=><div key={d.id} className="card-spiritual p-5 mb-5"><div className="flex items-center gap-3 mb-4"><span className="text-xs px-2 py-1 rounded border border-[#c9a84c]/30 text-[#c9a84c]">Grau {d.sortOrder}</span><div><h2 className="font-cinzel font-bold text-white">{d.name}</h2><p className="text-xs text-white/35">{d.description}</p></div></div>
    <div className="space-y-2">{d.modules.map(m=><div key={m.id} className="border border-white/10 rounded overflow-hidden"><button className="w-full p-4 flex items-center justify-between text-left" onClick={()=>setOpen(open===m.id?null:m.id)}><div><div className="flex items-center gap-2 text-white font-cinzel text-sm"><BookOpen size={15} className="text-[#c9a84c]"/>{m.name}</div><p className="text-xs text-white/35 mt-1">{m.description}</p></div>{open===m.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{open===m.id&&<div className="px-4 pb-4 space-y-1">{m.contents.map(c=><ContentCard key={c.id} c={c} done={done.has(c.id)} toggle={()=>void complete(c.id)}/>)}</div>}</div>)}{d.contents.length>0&&<div className="space-y-1 mt-3">{d.contents.map(c=><ContentCard key={c.id} c={c} done={done.has(c.id)} toggle={()=>void complete(c.id)}/>)}</div>}</div></div>)}
 </div></div>;
};

const ContentCard:React.FC<{c:Content;done:boolean;toggle:()=>void}>=({c,done,toggle})=>{const url=c.mediaUrl?mediaUrl(c.mediaUrl):'';return <div className="rounded border border-white/5 bg-black/10 p-3"><div className="flex items-center gap-3"><div className="text-[#c9a84c]">{icons[c.type]||<FileText size={17}/>}</div><div className="flex-1 min-w-0"><p className="text-sm text-white/80 truncate">{c.title}</p><p className="text-[11px] text-white/35">{c.description}</p></div><button onClick={toggle} className={done?'text-green-400':'text-white/25 hover:text-[#c9a84c]'} title={done?'Marcar como não concluído':'Marcar como concluído'}><CheckCircle2 size={19}/></button></div>{c.type==='text'&&c.body&&<div className="mt-3 pt-3 border-t border-white/5 text-sm text-white/65 whitespace-pre-wrap">{c.body}</div>}{url&&['video','audio','pdf','image'].includes(c.type)&&<div className="mt-3">{c.type==='video'?<video controls className="w-full max-h-[420px] rounded" src={url}/>:c.type==='audio'?<audio controls className="w-full" src={url}/>:c.type==='image'?<img src={url} alt={c.title} className="max-h-[420px] max-w-full rounded object-contain"/>:<a href={url} target="_blank" rel="noreferrer" className="text-[#c9a84c] text-sm underline">Abrir PDF</a>}</div>}{c.type==='link'&&url&&<a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[#c9a84c] text-sm underline">Abrir material</a>}</div>};
