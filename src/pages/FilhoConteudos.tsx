import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, PlayCircle, Headphones, FileText, FileDown, Image,
  Link2, ChevronDown, ChevronUp, Search, GraduationCap, Clock3, X, ExternalLink,
  Sparkles, CirclePlay, Award, Download
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api, mediaUrl, downloadContentFile } from '../lib/api';

type Content = {
  id:string; title:string; description:string; type:string; body:string;
  mediaUrl?:string|null; coverUrl?:string|null; sortOrder:number; published:boolean;
};
type Module = { id:string; name:string; description:string; sortOrder:number; contents:Content[] };
type Degree = { id:string; name:string; description:string; sortOrder:number; modules:Module[]; contents:Content[] };
type Payload = {
  degree:{id:string;name:string;description:string;sortOrder:number}|null;
  degrees:Degree[];
  completedContentIds:string[];
};

const icons:Record<string,React.ReactNode> = {
  video:<PlayCircle size={18}/>, audio:<Headphones size={18}/>, pdf:<FileDown size={18}/>,
  image:<Image size={18}/>, link:<Link2 size={18}/>, text:<FileText size={18}/>,
  gallery:<Image size={18}/>
};

const typeLabels:Record<string,string> = {
  text:'Leitura', video:'Vídeo', audio:'Áudio', pdf:'PDF', image:'Imagem',
  link:'Material externo', gallery:'Galeria'
};

export const FilhoConteudos:React.FC = () => {
  const {currentUser,authReady} = useApp();
  const [data,setData] = React.useState<Payload|null>(null);
  const [openModule,setOpenModule] = React.useState<string|null>(null);
  const [openDegree,setOpenDegree] = React.useState<string|null>(null);
  const [selected,setSelected] = React.useState<Content|null>(null);
  const [search,setSearch] = React.useState('');
  const [loading,setLoading] = React.useState(true);

  const load = React.useCallback(async()=>{
    if(!currentUser) return;
    try { setData(await api.get<Payload>('/api/filho-content')); }
    finally { setLoading(false); }
  },[currentUser]);

  React.useEffect(()=>{void load();},[load]);

  if(!authReady) return <div className="min-h-screen bg-[#0d0505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin"/></div>;
  if(!currentUser) return <Navigate to="/entrar" replace/>;

  const allowed=['filho','atendimento','content','agenda','admin','super_admin'].includes(currentUser.role);
  if(!allowed) return <Navigate to="/minha-conta" replace/>;
  if(loading) return <div className="min-h-screen bg-[#0d0505] pt-28 px-4 text-center text-white/50">Carregando conteúdos...</div>;

  const done = new Set(data?.completedContentIds||[]);
  const degrees = data?.degrees||[];
  const all = degrees.flatMap(d=>[...d.contents,...d.modules.flatMap(m=>m.contents)]);
  const completed = all.filter(c=>done.has(c.id)).length;
  const pct = all.length ? Math.round(completed/all.length*100) : 0;

  const toggleComplete = async(id:string)=>{
    await api.post('/api/filho-content/progress/'+id,{completed:!done.has(id)});
    await load();
  };

  const matches = (c:Content) => {
    const q=search.trim().toLowerCase();
    return !q || [c.title,c.description,c.body,typeLabels[c.type]||c.type].join(' ').toLowerCase().includes(q);
  };

  const moduleProgress = (contents:Content[]) => {
    const total=contents.length;
    const finished=contents.filter(c=>done.has(c.id)).length;
    return {total,finished,pct:total?Math.round(finished/total*100):0};
  };

  return (
    <div className="min-h-screen bg-[#0d0505] pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <section className="relative overflow-hidden rounded-xl border border-[#c9a84c]/25 bg-gradient-to-br from-[#24100e] via-[#180908] to-[#0d0505] p-6 md:p-8 mb-6">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#c9a84c]/5 blur-3xl"/>
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-7">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[#c9a84c] mb-3">
                <GraduationCap size={21}/>
                <span className="font-cinzel text-xs tracking-[0.18em] uppercase">Área reservada aos Filhos</span>
              </div>
              <h1 className="font-cinzel font-bold text-white text-2xl md:text-3xl">Caminho de Estudos</h1>
              <p className="text-sm md:text-base text-white/55 mt-2 max-w-xl">
                {data?.degree
                  ? <>Você está no <strong className="text-[#e8c97a]">{data.degree.name}</strong>. Estude os materiais liberados para o seu grau e acompanhe seu progresso.</>
                  : 'Os conteúdos serão liberados conforme o grau cadastrado pela administração.'}
              </p>
            </div>
            <div className="w-full lg:w-72">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-white/45">Progresso geral</span>
                <span className="text-[#e8c97a] font-semibold">{completed}/{all.length} concluídos</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#a07c30] via-[#e8c97a] to-[#c9a84c] transition-all duration-500" style={{width:pct+'%'}}/>
              </div>
              <p className="text-right text-[11px] text-white/35 mt-1">{pct}% concluído</p>
            </div>
          </div>
        </section>

        {!data?.degree && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 mb-6 flex gap-3 items-start">
            <Award size={20} className="text-yellow-300 mt-0.5 shrink-0"/>
            <div><p className="text-sm text-yellow-100">Seu cargo permite acessar esta área, mas ainda não há um grau definido.</p><p className="text-xs text-yellow-100/55 mt-1">Procure a administração para cadastrar seu grau de desenvolvimento.</p></div>
          </div>
        )}

        {degrees.length>0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar nos conteúdos..."
                className="form-input pl-10 h-11"
              />
              {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X size={15}/></button>}
            </div>
            <div className="rounded border border-[#c9a84c]/15 bg-[#1a0a0a] px-4 h-11 flex items-center gap-2 text-xs text-white/45">
              <Sparkles size={15} className="text-[#c9a84c]"/>
              {degrees.length} {degrees.length===1?'grau disponível':'graus disponíveis'}
            </div>
          </div>
        )}

        {degrees.map((d,index)=>{
          const degreeContents=[...d.contents,...d.modules.flatMap(m=>m.contents)];
          const dp=moduleProgress(degreeContents);
          const isCurrent=data?.degree?.id===d.id;
          const expanded=openDegree===d.id || search.length>0 || (index===0 && openDegree===null);
          return (
            <section key={d.id} className="card-spiritual mb-5 overflow-hidden">
              <button onClick={()=>setOpenDegree(expanded&&openDegree===d.id?null:d.id)} className="w-full text-left p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/5 flex items-center justify-center shrink-0">
                    <span className="font-cinzel font-bold text-[#e8c97a]">{d.sortOrder}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-cinzel font-bold text-white text-base md:text-lg">{d.name}</h2>
                      {isCurrent && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-[#c9a84c]/30 text-[#e8c97a] bg-[#c9a84c]/5">Seu grau</span>}
                    </div>
                    <p className="text-xs text-white/40 mt-1">{d.description||'Conteúdos e estudos deste grau.'}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#c9a84c]" style={{width:dp.pct+'%'}}/></div>
                      <span className="text-[10px] text-white/35 whitespace-nowrap">{dp.finished}/{dp.total}</span>
                    </div>
                  </div>
                  <div className="text-white/30 mt-1">{expanded?<ChevronUp size={19}/>:<ChevronDown size={19}/>}</div>
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-5 md:px-6 md:pb-6 space-y-3">
                  {d.modules.map(m=>{
                    const filtered=m.contents.filter(matches);
                    const mp=moduleProgress(m.contents);
                    const moduleOpen=openModule===m.id || search.length>0;
                    if(search && filtered.length===0) return null;
                    return (
                      <div key={m.id} className="rounded-lg border border-white/10 bg-black/10 overflow-hidden">
                        <button onClick={()=>setOpenModule(moduleOpen&&openModule===m.id?null:m.id)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02]">
                          <div className="w-9 h-9 rounded border border-[#c9a84c]/20 bg-[#c9a84c]/5 flex items-center justify-center text-[#c9a84c]"><BookOpen size={17}/></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3"><p className="font-cinzel text-sm font-bold text-white/90">{m.name}</p><span className="text-[10px] text-white/35">{mp.finished}/{mp.total}</span></div>
                            <p className="text-[11px] text-white/35 mt-0.5">{m.description||'Módulo de estudo'}</p>
                          </div>
                          {moduleOpen?<ChevronUp size={17} className="text-white/30"/>:<ChevronDown size={17} className="text-white/30"/>}
                        </button>
                        {moduleOpen && (
                          <div className="border-t border-white/5 p-3 space-y-2">
                            {filtered.map(c=><ContentCard key={c.id} c={c} done={done.has(c.id)} toggle={()=>void toggleComplete(c.id)} open={()=>setSelected(c)}/>)}
                            {filtered.length===0 && <p className="text-xs text-white/30 p-2">Nenhum conteúdo encontrado.</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {d.contents.filter(matches).length>0 && (
                    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                      <p className="font-cinzel text-[11px] uppercase tracking-wider text-[#c9a84c] px-2 pb-2">Materiais deste grau</p>
                      <div className="space-y-2">{d.contents.filter(matches).map(c=><ContentCard key={c.id} c={c} done={done.has(c.id)} toggle={()=>void toggleComplete(c.id)} open={()=>setSelected(c)}/>)}</div>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

        {degrees.length===0 && (
          <div className="card-spiritual p-10 text-center">
            <BookOpen size={34} className="mx-auto text-[#c9a84c]"/>
            <h2 className="font-cinzel text-white mt-4">Nenhum conteúdo disponível</h2>
            <p className="text-sm text-white/40 mt-2">Quando a administração publicar os primeiros materiais, eles aparecerão aqui.</p>
          </div>
        )}
      </div>

      {selected && <ContentViewer content={selected} done={done.has(selected.id)} toggle={()=>void toggleComplete(selected.id)} close={()=>setSelected(null)}/>}
    </div>
  );
};

const ContentCard:React.FC<{c:Content;done:boolean;toggle:()=>void;open:()=>void}> = ({c,done,toggle,open}) => {
  const cover=c.coverUrl?mediaUrl(c.coverUrl):'';
  return (
    <div className="group rounded-lg border border-white/5 bg-[#0d0505]/40 hover:border-[#c9a84c]/20 transition-colors p-3">
      <div className="flex items-center gap-3">
        {cover ? <img src={cover} alt="" className="w-12 h-12 rounded object-cover border border-white/10 shrink-0"/> : <div className="w-10 h-10 rounded border border-[#c9a84c]/15 bg-[#c9a84c]/5 flex items-center justify-center text-[#c9a84c] shrink-0">{icons[c.type]||<FileText size={18}/>}</div>}
        <button onClick={open} className="flex-1 min-w-0 text-left">
          <p className="text-sm text-white/85 group-hover:text-[#e8c97a] transition-colors truncate">{c.title}</p>
          <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-[#c9a84c]/70">{typeLabels[c.type]||c.type}</span>{c.description&&<span className="text-[10px] text-white/30 truncate">• {c.description}</span>}</div>
        </button>
        <button onClick={toggle} className={done?'text-green-400':'text-white/25 hover:text-[#c9a84c]'} title={done?'Marcar como não concluído':'Marcar como concluído'}><CheckCircle2 size={20}/></button>
        <button onClick={open} className="hidden sm:block p-2 text-white/20 hover:text-white/60" title="Abrir conteúdo"><CirclePlay size={17}/></button>
      </div>
    </div>
  );
};

const ContentViewer:React.FC<{content:Content;done:boolean;toggle:()=>void;close:()=>void}> = ({content,done,toggle,close}) => {
  const url=content.mediaUrl?mediaUrl(content.mediaUrl):'';
  const gallery=(content.mediaUrl||'').split(/\n|,/).map(v=>v.trim()).filter(Boolean);
  return (
    <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}>
      <div className="modal-content max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><div className="flex items-center gap-2 text-[#c9a84c] text-xs uppercase tracking-wider">{icons[content.type]||<FileText size={16}/>} {typeLabels[content.type]||content.type}</div><h2 className="font-cinzel font-bold text-white text-xl mt-2">{content.title}</h2>{content.description&&<p className="text-sm text-white/40 mt-1">{content.description}</p>}</div>
          <button onClick={close} className="text-white/40 hover:text-white p-1"><X size={21}/></button>
        </div>
        {content.type==='text' && content.body && <div className="rounded-lg border border-white/10 bg-black/10 p-5 text-sm md:text-base text-white/70 whitespace-pre-wrap leading-7">{content.body}</div>}
        {content.type==='video' && url && <video controls autoPlay className="w-full max-h-[65vh] rounded-lg bg-black" src={url}/>}
        {content.type==='audio' && url && <div className="rounded-lg border border-white/10 p-6"><Headphones className="text-[#c9a84c] mb-4" size={28}/><audio controls className="w-full" src={url}/></div>}
        {content.type==='image' && url && <img src={url} alt={content.title} className="w-full max-h-[65vh] rounded-lg object-contain bg-black/20"/>}
        {content.type==='pdf' && url && <iframe title={content.title} src={url} className="w-full h-[65vh] rounded-lg border border-white/10 bg-white"/>}
        {['video','audio','image','pdf'].includes(content.type) && url && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={downloading}
              onClick={async()=>{try{setDownloading(true);await downloadContentFile(content.mediaUrl || '', content.title);}catch(error){window.alert(error instanceof Error ? error.message : 'Não foi possível baixar o arquivo.');}finally{setDownloading(false);}}}
              className="btn-outline-gold text-xs disabled:opacity-50"
            >
              <Download size={15}/> {downloading ? 'Baixando...' : 'Baixar arquivo'}
            </button>
          </div>
        )}
        {content.type==='link' && url && <a href={url} target="_blank" rel="noreferrer" className="btn-gold">Abrir material <ExternalLink size={15}/></a>}
        {content.type==='gallery' && gallery.length>0 && <div className="grid sm:grid-cols-2 gap-3">{gallery.map((src,i)=><img key={i} src={mediaUrl(src)} alt={content.title+' '+(i+1)} className="w-full max-h-80 rounded-lg object-cover border border-white/10"/>)}</div>}
        {content.type!=='text' && content.body && <div className="mt-5 rounded-lg border border-white/10 bg-black/10 p-4 text-sm text-white/60 whitespace-pre-wrap">{content.body}</div>}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-white/35"><Clock3 size={14}/>{done?'Conteúdo concluído':'Marque como concluído após estudar'}</div>
          <button onClick={toggle} className={done?'btn-outline-gold text-xs':'btn-gold text-xs'}>{done?<><CheckCircle2 size={15}/> Concluído</>:<><CheckCircle2 size={15}/> Marcar como concluído</>}</button>
        </div>
      </div>
    </div>
  );
};
