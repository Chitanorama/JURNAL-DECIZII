// @font-face via Google Fonts - loaded in index.html
import { useState, useEffect, useCallback } from "react";


// Comprima imaginile inainte de salvare - max 1000px, calitate 75%
function compressImage(dataUrl, maxSize=1000, quality=0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


const BUCKET = 'Jurnal de decizii';

async function uploadFile(file, folder='uploads') {
  const ext = file.name.split('.').pop();
  const fileName = folder+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext;
  const res = await fetch(
    SUPABASE_URL+'/storage/v1/object/'+BUCKET+'/'+fileName,
    {
      method:'POST',
      headers:{
        'apikey':SUPABASE_KEY,
        'Authorization':'Bearer '+SUPABASE_KEY,
        'Content-Type':file.type||'application/octet-stream',
        'x-upsert':'true'
      },
      body:file
    }
  );
  if(!res.ok){const e=await res.text();throw new Error('Upload error: '+e);}
  return SUPABASE_URL+'/storage/v1/object/public/'+BUCKET+'/'+fileName;
}

async function uploadDataUrl(dataUrl, ext='jpg', folder='images') {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], Date.now()+'.'+ext, {type:blob.type});
  return uploadFile(file, folder);
}

const SUPABASE_URL = "https://aphldgxfusyccyidzvze.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaGxkZ3hmdXN5Y2N5aWR6dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjMzMTAsImV4cCI6MjA5MDI5OTMxMH0.7wv92ujW6N-61R58bwC9zRbN3AmDgXNhgOxj8JyJSJM";

async function sb(method, table, body, match) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (match) Object.entries(match).forEach(([k,v]) => url.searchParams.set(k, `eq.${v}`));
  if (method === "GET" && !match) url.searchParams.set("select", "*");
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
  if (method === "POST") headers["Prefer"] = "resolution=merge-duplicates,return=representation";
  if (method === "DELETE") headers["Prefer"] = "return=representation";
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(Array.isArray(body)?body:[body]) : undefined
  });
  if (!res.ok) {
    const e = await res.text();
    console.error("Supabase error:", e);
    throw new Error(e);
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}

const dbGet = (table, match) => sb("GET", table, null, match);
const dbUpsert = (table, body) => sb("POST", table, Array.isArray(body) ? body : [body]);
const dbDelete = (table, match) => sb("DELETE", table, null, match);

const DEFAULT_PHASES = ["Pre-Design","Concept","Proiect Tehnic","Achizitii","Santier","Punch List","Photo Shooting si Styling","Admin","Scope Creep"];
const DEFAULT_SPECIALTIES = ["Autorizatii si Avize","Studii","Arhitectura","Instalatii Termice","Instalatii Electrice","Instalatii Sanitare","Ventilatie si Aer Conditionat","Eficienta Energetica","Design Interior"];
const STATUSES = ["In asteptare","In discutie","Decizie luata"];
const STATUS_COLORS = {
  "In asteptare":{bg:"#FAEEDA",text:"#854F0B",border:"#EF9F27"},
  "In discutie":{bg:"#E6F1FB",text:"#185FA5",border:"#378ADD"},
  "Decizie luata":{bg:"#EAF3DE",text:"#3B6D11",border:"#639922"},
};
const PHASE_COLORS = {
  "Pre-Design":"#5F5E5A","Concept":"#534AB7","Proiect Tehnic":"#185FA5",
  "Achizitii":"#0F6E56","Santier":"#993C1D","Punch List":"#A32D2D",
  "Photo Shooting si Styling":"#993356","Admin":"#888780","Scope Creep":"#BA7517"
};
const STAT_CONFIG = [
  {l:"Total",key:null,color:"#534AB7"},
  {l:"In asteptare",key:"In asteptare",color:"#BA7517"},
  {l:"In discutie",key:"In discutie",color:"#185FA5"},
  {l:"Decizie luata",key:"Decizie luata",color:"#3B6D11"},
];
const ADMIN_CODE = "admin2024";
const ADMIN_NAME = "Anna";

function makeDecision(ph,sp){return{id:Date.now().toString(),dateAdded:new Date().toISOString().slice(0,10),category:ph||"Pre-Design",specialty:sp||"Arhitectura",title:"",description:"",descImages:[],finalDecision:"",finalImages:[],links:[],attachments:[],createdBy:"",decisionOwner:"",approvedBy:"",dateDecision:"",status:"In asteptare",discussion:[],changeLog:[]};}
function makeProj(){return{projectCode:"",client:"",name:"",code:"",description:"",images:[],team:[]};}
function makeUser(){return{name:"",code:"",projectIds:[]};}

const Badge2=({status})=>{const c=STATUS_COLORS[status]||STATUS_COLORS["In asteptare"];return <span style={{background:c.bg,color:c.text,border:"1px solid "+c.border,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{status}</span>;};
const PhasePill2=({phase})=>{const col=PHASE_COLORS[phase]||"#888";return <span style={{background:col+"18",color:col,border:"1px solid "+col+"44",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{phase}</span>;};
const SecTitle2=({children})=><div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingBottom:6,borderBottom:"1px solid #eee"}}>{children}</div>;
const Card2=({children,style})=><div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:10,padding:"14px 16px",...(style||{})}}>{children}</div>;
const Btn1=({children,disabled,onClick})=><button onClick={onClick} disabled={!!disabled} style={{fontWeight:500,background:disabled?"#eee":"#3d3530",color:disabled?"#aaa":"#fff",border:"none",borderRadius:8,padding:"7px 20px",cursor:disabled?"not-allowed":"pointer",fontSize:13}}>{children}</button>;
const Inp=({label,...p})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<input style={{width:"100%",boxSizing:"border-box",background:"#fff"}} {...p}/></div>;
const Sel=({label,children,...p})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<select style={{width:"100%",boxSizing:"border-box",background:"#fff"}} {...p}>{children}</select></div>;
const Txt=({label,locked,...p})=><div style={{marginBottom:8}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<textarea style={{width:"100%",boxSizing:"border-box",minHeight:68,resize:"vertical",fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",fontSize:14,padding:"8px 10px",border:"1px solid #e8e4df",borderRadius:8,background:locked?"#f5f5f5":"#fff",color:"#2c2c2c",cursor:locked?"not-allowed":"text"}} readOnly={!!locked} {...p}/></div>;

function AddableSel({label,value,onChange,options,onAdd,onDelete,canAdd}){
  const [adding,setAdding]=useState(false);
  const [nv,setNv]=useState("");
  const doAdd=()=>{if(!nv.trim())return;onAdd(nv.trim());onChange(nv.trim());setNv("");setAdding(false);};
  return(<div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}
    <div style={{display:"flex",alignItems:"center",border:"1px solid #e8e4df",borderRadius:8,overflow:"hidden",background:"#fff"}}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,padding:"8px 10px",cursor:"pointer"}}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
      {canAdd&&<div style={{display:"flex",borderLeft:"1px solid #eee",flexShrink:0}}>
        <button onClick={()=>setAdding(a=>!a)} title="Adauga" style={{border:"none",background:"transparent",padding:"8px 10px",cursor:"pointer",fontSize:13,color:"#534AB7",fontWeight:500}}>+</button>
        {value&&onDelete&&<button onClick={()=>{onDelete(value);onChange(options.filter(o=>o!==value)[0]||"");}} title={"Sterge: "+value} style={{border:"none",borderLeft:"1px solid #eee",background:"transparent",padding:"8px 10px",cursor:"pointer",fontSize:13,color:"#A32D2D"}}>x</button>}
      </div>}
    </div>
    {adding&&<div style={{display:"flex",gap:6,marginTop:6}}>
      <input autoFocus placeholder="Denumire noua..." value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdd()} style={{flex:1,fontSize:13}}/>
      <button onClick={doAdd} style={{fontSize:13,padding:"6px 14px",background:"#534AB7",color:"#fff",border:"none",borderRadius:7,cursor:"pointer"}}>Ok</button>
      <button onClick={()=>{setAdding(false);setNv("");}}>x</button>
    </div>}
  </div>);
}

function LinksList({links,onChange}){
  const [nu,setNu]=useState("");const [nl,setNl]=useState("");
  const add=()=>{if(!nu.trim())return;onChange([...(links||[]),{url:nu.trim(),label:nl.trim()||nu.trim()}]);setNu("");setNl("");};
  const ls=links||[];
  return(<div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>Linkuri</label>
    {ls.map((l,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:"#fafafa",border:"1px solid #ede9e4",borderRadius:7,padding:"6px 10px"}}>
      <a href={l.url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,flex:1,color:"#534AB7",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.label}</a>
      <span onClick={()=>onChange(ls.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:"#bbb",fontSize:12}}>x</span>
    </div>)}
    <input placeholder="Eticheta (optional)" value={nl} onChange={e=>setNl(e.target.value)} style={{width:"100%",boxSizing:"border-box",fontSize:13,marginBottom:4}}/>
    <div style={{display:"flex",gap:6}}>
      <input placeholder="https://..." value={nu} onChange={e=>setNu(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:1,fontSize:13}}/>
      <button onClick={add} style={{fontSize:13,padding:"0 12px",whiteSpace:"nowrap"}}>+ Link</button>
    </div>
  </div>);
}

function AttachList({attachments,onChange}){
  const fmtSize=s=>s>1048576?(s/1048576).toFixed(1)+"MB":(s/1024).toFixed(0)+"KB";
  const handleFile=e=>{Array.from(e.target.files||[]).forEach(file=>{// Afiseaza imediat cu URL local temporar
const tempUrl=URL.createObjectURL(file);const tempEntry={name:file.name,size:file.size,data:tempUrl,uploading:true};const newAt=[...(attachments||[]),tempEntry];onChange(newAt);// Upload in background
uploadFile(file,'attachments').then(url=>{onChange(newAt.map(x=>x===tempEntry?{name:file.name,size:file.size,data:url,isUrl:true}:x));}).catch(()=>{onChange(newAt.map(x=>x===tempEntry?{...x,uploading:false}:x));});});e.target.value="";};
  const at=attachments||[];
  return(<div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>Atasamente</label>
    {at.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:"#fafafa",border:"1px solid #ede9e4",borderRadius:7,padding:"6px 10px"}}>
      <a href={a.data} download={a.name} style={{fontSize:13,flex:1,color:"#534AB7",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</a>
      <span style={{fontSize:11,color:"#aaa",flexShrink:0}}>{fmtSize(a.size)}</span>
      <span onClick={()=>onChange(at.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:"#bbb",fontSize:12}}>x</span>
    </div>)}
    <label style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,padding:"5px 12px",border:"1px solid #e8e4df",borderRadius:7,cursor:"pointer",background:"#fff"}}>
      Alege fisier<input type="file" multiple style={{display:"none"}} onChange={handleFile}/>
    </label>
  </div>);
}

function ImgPaste({images,onChange,locked}){
  const imgs=images||[];
  const handlePaste=e=>{if(locked)return;const items=e.clipboardData&&e.clipboardData.items;if(!items)return;for(let i=0;i<items.length;i++){if(items[i].type.startsWith("image/")){const r=new FileReader();r.onload=ev=>{const localUrl=ev.target.result;// Afiseaza imediat local
compressImage(localUrl).then(compressed=>{const newImgs=[...imgs,compressed];onChange(newImgs);// Upload in background - inlocuieste cu URL permanent
uploadDataUrl(compressed,'jpg','images').then(url=>{onChange(newImgs.map(x=>x===compressed?url:x));}).catch(()=>{});});};r.readAsDataURL(items[i].getAsFile());}}};
  return(<div style={{marginBottom:12}}>
    <div onPaste={handlePaste} tabIndex={0} style={{border:"1.5px dashed #ddd",borderRadius:8,padding:"8px 12px",minHeight:36,outline:"none",background:locked?"#f5f5f5":"#fafafa",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",cursor:locked?"not-allowed":"text"}} onFocus={e=>{if(!locked)e.currentTarget.style.borderColor="#534AB7";}} onBlur={e=>e.currentTarget.style.borderColor="#ddd"}>
      {imgs.length===0&&<span style={{fontSize:12,color:"#ccc"}}>{locked?"Blocat":"Click + Ctrl+V pentru a lipi o imagine"}</span>}
      {imgs.map((src,i)=><div key={i} style={{position:"relative"}}>
        <img src={src} alt="" style={{height:56,borderRadius:6,border:"1px solid #ede9e4",display:"block",cursor:"pointer"}} onClick={()=>window.open(src)}/>
        {!locked&&<span onClick={ev=>{ev.stopPropagation();onChange(imgs.filter((_,j)=>j!==i));}} style={{position:"absolute",top:-6,right:-6,background:"#A32D2D",color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,cursor:"pointer"}}>x</span>}
      </div>)}
    </div>
  </div>);
}

const ImgRow=({images})=>{const imgs=images||[];if(!imgs.length)return null;return <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>{imgs.map((src,i)=><img key={i} src={src} alt="" style={{height:72,borderRadius:6,border:"1px solid #ede9e4",cursor:"pointer"}} onClick={()=>window.open(src)}/>)}</div>;};

function Drawer({title,onClose,children}){
  return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}} onClick={onClose}>
    <div style={{flex:1}}/>
    <div style={{width:"min(500px,100vw)",background:"#f0e8e4",borderLeft:"1.5px solid #ddd0ca",height:"100%",overflowY:"auto",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid #ddd0ca",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#e8dcd8",flexShrink:0}}>
        <span style={{fontWeight:500,fontSize:15,color:"#3a2e2b"}}>{title}</span>
        <button onClick={onClose} style={{fontSize:13,padding:"4px 12px"}}>x Inchide</button>
      </div>
      <div style={{padding:"20px",flex:1,overflowY:"auto"}}>{children}</div>
    </div>
  </div>);
}

function TeamPicker({team,setTeam,users,nm,setNm}){
  const t=team||[];
  return(<div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>Echipa</label>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
      {t.map((m,i)=><span key={m} style={{fontSize:13,background:"#534AB715",border:"1px solid #534AB740",borderRadius:20,padding:"4px 12px",display:"flex",alignItems:"center",gap:6,color:"#534AB7"}}>{m}<span style={{cursor:"pointer",fontSize:11}} onClick={()=>setTeam(t.filter((_,j)=>j!==i))}>x</span></span>)}
    </div>
    {users.length>0&&<select onChange={e=>{if(e.target.value&&!t.includes(e.target.value))setTeam([...t,e.target.value]);e.target.value="";}} style={{width:"100%",boxSizing:"border-box",fontSize:13,marginBottom:8}}>
      <option value="">+ Selecteaza din utilizatori existenti</option>
      {users.filter(u=>!t.includes(u.name)).map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
    </select>}
    <div style={{display:"flex",gap:6}}>
      <input placeholder="Sau adauga persoana noua..." value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&nm.trim()){setTeam([...t,nm.trim()]);setNm("");}}} style={{flex:1,fontSize:13}}/>
      <button onClick={()=>{if(nm.trim()){setTeam([...t,nm.trim()]);setNm("");}}}>+ Adauga</button>
    </div>
  </div>);
}

function ProjectCards({projects,onSelect,userName,isAdmin,onNew,onUsers}){
  return(<div style={{padding:"2rem 1.5rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div>
        <div style={{fontSize:13,color:"#aaa",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>{"Buna, "+userName+"!"}</div>
        <h2 style={{fontWeight:400,fontSize:22,margin:0,fontFamily:"Cormorant Garamond,Georgia,serif",letterSpacing:"0.03em"}}>Proiectele tale</h2>
      </div>
      {isAdmin&&<div style={{display:"flex",gap:8}}>
        <button onClick={onUsers} style={{fontSize:13,padding:"6px 14px"}}>Utilizatori</button>
        <Btn1 onClick={onNew}>+ Proiect nou</Btn1>
      </div>}
    </div>
    {projects.length===0
      ?<div style={{textAlign:"center",color:"#aaa",fontSize:14,padding:"3rem"}}>Niciun proiect. Apasa + Proiect nou.</div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
        {projects.map(p=><div key={p.id} onClick={()=>onSelect(p)} style={{background:"#fdf9f6",border:"1px solid #e8e2dc",borderRadius:12,padding:"20px 20px 16px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"#f5f0ea",border:"1px solid #d4c9bc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:14,color:"#8a7060"}}>✦</div>
          {p.projectCode&&<div style={{fontSize:11,color:"#aaa",marginBottom:2,fontWeight:500,letterSpacing:"0.04em"}}>{p.projectCode}</div>}
          <div style={{fontWeight:500,fontSize:15,marginBottom:4,letterSpacing:"0.02em"}}>{p.name}</div>
          {p.client&&<div style={{fontSize:12,color:"#888"}}>{p.client}</div>}
          {p.team&&p.team.length>0&&<div style={{fontSize:11,color:"#bbb",marginTop:8}}>{p.team.join(", ")}</div>}
        </div>)}
      </div>}
  </div>);
}

export default function App(){
  const [session,setSession]=useState(null);
  const [lname,setLname]=useState("");
  const [lcode,setLcode]=useState("");
  const [lerr,setLerr]=useState("");
  const [loading,setLoading]=useState(false);
  const [projects,setProjects]=useState([]);
  const [users,setUsers]=useState([]);
  const [phases,setPhases]=useState(DEFAULT_PHASES);
  const [specs,setSpecs]=useState(DEFAULT_SPECIALTIES);
  const [ap,setAp]=useState(null);
  const [decisions,setDecisions]=useState([]);
  const [nm,setNm]=useState("");
  const [pf,setPf]=useState(makeProj());
  const [drawer,setDrawer]=useState(null);
  const [eid,setEid]=useState(null);
  const [form,setForm]=useState(makeDecision());
  const [fph,setFph]=useState("Toate");
  const [fst,setFst]=useState("Toate");
  const [srch,setSrch]=useState("");
  const [did,setDid]=useState(null);
  const [ctxt,setCtxt]=useState("");
  const [cname,setCname]=useState("");
  const [cimgs,setCimgs]=useState([]);
  const [confirmDel,setConfirmDel]=useState(false);
  const isAdmin=session&&session.role==="admin";
  const isClient=session&&session.role==="client";
  const [dbError, setDbError] = useState("");

  // Load global settings (phases, specs, users)
  const loadGlobal = useCallback(async()=>{
    try {
      const rows = await dbGet("settings");
      rows.forEach(r=>{
        if(r.id==="phases") setPhases(r.data);
        if(r.id==="specs") setSpecs(r.data);
      });
      const urows = await dbGet("users");
      setUsers(urows.map(r=>r.data));
    } catch(e){ console.error(e); }
  },[]);

  const loadProjects = useCallback(async()=>{
    try {
      const rows = await dbGet("projects");
      return rows.map(r=>r.data);
    } catch(e){ console.error(e); return []; }
  },[]);

  const loadDecisions = useCallback(async(projectId)=>{
    try {
      const rows = await dbGet("decisions",{project_id:projectId});
      return rows.map(r=>r.data);
    } catch(e){ console.error(e); return []; }
  },[]);

  useEffect(()=>{ loadGlobal(); },[loadGlobal]);

  useEffect(()=>{
    if(!ap) return;
    loadDecisions(ap.id).then(setDecisions);
    // Poll every 10s for real-time updates
    const interval = setInterval(()=>loadDecisions(ap.id).then(setDecisions), 10000);
    return ()=>clearInterval(interval);
  },[ap,loadDecisions]);

  const savePhases2=async p=>{setPhases(p);await dbUpsert("settings",{id:"phases",data:p});};
  const saveSpecs2=async s=>{setSpecs(s);await dbUpsert("settings",{id:"specs",data:s});};

  const saveUsers2=async u=>{
    setUsers(u);
    await Promise.all(u.map(usr=>dbUpsert("users",{id:usr.id||usr.name,data:usr})));
  };

  // TEST conexiune Supabase
  const [testMsg, setTestMsg] = useState("");
  const testConnection = async () => {
    setTestMsg("Se testeaza...");
    try {
      const r = await dbGet("projects");
      setTestMsg("Conexiune OK! Proiecte in DB: " + r.length);
    } catch(e) {
      setTestMsg("EROARE: " + e.message);
    }
  };
  const projectTeam=ap?(ap.team||[]).concat(ap.client&&!(ap.team||[]).includes(ap.client)?[ap.client+" (client)"]:[]):[];

  const handleLogin=async()=>{
    setLoading(true); setLerr("");
    const name=lname.trim(); const code=lcode.trim();
    if(!name){setLerr("Introdu numele tau.");setLoading(false);return;}
    try {
      const allProjects = await loadProjects();
      setProjects(allProjects);
      await loadGlobal();
      if(code===ADMIN_CODE&&name===ADMIN_NAME){
        setSession({name:ADMIN_NAME,role:"admin",projectIds:allProjects.map(p=>p.id)});
        setLoading(false); return;
      }
      const urows = await dbGet("users");
      const allUsers = urows.map(r=>r.data);
      const col=allUsers.find(u=>u.code===code&&u.name.toLowerCase()===name.toLowerCase());
      if(col){setSession({name:col.name,role:"colleague",projectIds:col.projectIds||[]});setLoading(false);return;}
      const proj=allProjects.find(p=>p.code===code);
      if(proj){setSession({name,role:"client",projectIds:[proj.id]});setAp(proj);setLoading(false);return;}
      setLerr("Combinatie nume + cod incorecta.");
    } catch(e){ setLerr("Eroare de conexiune. Incearca din nou."); }
    setLoading(false);
  };

  const logout=()=>{setSession(null);setLname("");setLcode("");setAp(null);setDrawer(null);setProjects([]);setDecisions([]);};
  const myProjects=projects.filter(p=>session&&(session.projectIds||[]).includes(p.id));

  const addProject=async()=>{
    if(!pf.name.trim())return;
    setLoading(true); setDbError("");
    try {
      const team=(pf.team||[]).includes(ADMIN_NAME)?pf.team:[ADMIN_NAME,...(pf.team||[])];
      const p=Object.assign({},pf,{id:Date.now().toString(),team,created:new Date().toISOString().slice(0,10)});
      const result = await dbUpsert("projects",{id:p.id,data:p});
      console.log("upsert result:", result);
      const upd=[...projects,p]; setProjects(upd);
      if(isAdmin)setSession(s=>Object.assign({},s,{projectIds:s.projectIds.concat([p.id])}));
      setAp(p); setPf(makeProj()); setDrawer(null);
    } catch(e){
      console.error("addProject error:",e);
      setDbError("Eroare: "+e.message);
    }
    setLoading(false);
  };

  const saveProjSettings=async()=>{
    setLoading(true);
    const updated=Object.assign({},ap,pf);
    await dbUpsert("projects",{id:updated.id,data:updated});
    setProjects(projects.map(p=>p.id===ap.id?updated:p));
    setAp(updated); setDrawer(null); setConfirmDel(false); setLoading(false);
  };

  const deleteProject=async()=>{
    setLoading(true);
    await dbDelete("projects",{id:ap.id});
    setProjects(projects.filter(p=>p.id!==ap.id));
    setSession(s=>Object.assign({},s,{projectIds:s.projectIds.filter(id=>id!==ap.id)}));
    setAp(null); setDrawer(null); setConfirmDel(false); setLoading(false);
  };

  const openSettings=()=>{setPf({projectCode:ap.projectCode||"",client:ap.client||"",name:ap.name||"",code:ap.code||"",description:ap.description||"",images:ap.images||[],team:ap.team||[]});setConfirmDel(false);setDrawer("settings");};

  const openNew=()=>{setForm(makeDecision(phases[0],specs[0]));setEid(null);setDrawer("decision");};
  const openEdit=d=>{setForm(Object.assign({},d));setEid(d.id);setDrawer("decision");};
  const hasDisc=d=>!!(d.discussion&&d.discussion.length>0);
  const contentLocked=d=>!isAdmin&&hasDisc(d);

  const saveDec=async()=>{
    if(!(form.title||"").trim())return;
    setLoading(true);
    const now=new Date().toISOString().slice(0,10);
    const tme=new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"});
    const clog=(form.changeLog||[]).slice();
    if(eid&&isAdmin){const orig=decisions.find(x=>x.id===eid);if(orig&&hasDisc(orig)){const changed=[];if(orig.description!==form.description)changed.push("descriere");if(orig.finalDecision!==form.finalDecision)changed.push("decizie finala");if(changed.length>0)clog.push({by:session.name,date:now,time:tme,fields:changed});}}
    const saved=Object.assign({},form,{createdBy:form.createdBy||session.name,changeLog:clog});
    await dbUpsert("decisions",{id:saved.id,project_id:ap.id,data:saved});
    if(eid)setDecisions(decisions.map(x=>x.id===eid?saved:x));
    else setDecisions([Object.assign({},saved,{id:Date.now().toString()})].concat(decisions));
    setDrawer(null); setLoading(false);
  };

  const deleteDec=async(d)=>{
    await dbDelete("decisions",{id:d.id});
    setDecisions(decisions.filter(x=>x.id!==d.id));
    setDrawer(null); setDid(null);
  };

  const canDelete=d=>isAdmin||(d.createdBy===session.name&&!hasDisc(d));
  const canDecide=d=>session&&d.decisionOwner&&d.decisionOwner===session.name;

  const setDecStatus=async(d,status)=>{
    const updated=Object.assign({},d,{status,approvedBy:session.name,dateDecision:new Date().toISOString().slice(0,10)});
    await dbUpsert("decisions",{id:updated.id,project_id:ap.id,data:updated});
    setDecisions(decisions.map(x=>x.id===d.id?updated:x));
  };

  const addComment=async()=>{
    if(!ctxt.trim()||!cname)return;
    const c={text:ctxt.trim(),author:cname,images:cimgs||[],date:new Date().toISOString().slice(0,10),time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"})};
    const d=decisions.find(x=>x.id===did);
    if(!d)return;
    const ns=d.status==="In asteptare"?"In discutie":d.status;
    const updated=Object.assign({},d,{discussion:(d.discussion||[]).concat([c]),status:ns});
    await dbUpsert("decisions",{id:updated.id,project_id:ap.id,data:updated});
    setDecisions(decisions.map(x=>x.id===did?updated:x));
    setCtxt(""); setCimgs([]);
  };

  const saveUser2=async(uf,euid)=>{
    const newUser=Object.assign({id:euid||Date.now().toString()},uf);
    await dbUpsert("users",{id:newUser.id,data:newUser});
    let upd;
    if(euid) upd=users.map(u=>u.id===euid?newUser:u);
    else upd=[...users,newUser];
    setUsers(upd);
    return upd;
  };

  const deleteUser2=async(id)=>{
    await dbDelete("users",{id});
    setUsers(users.filter(u=>u.id!==id));
  };

  const filtered=decisions.filter(d=>{
    if(fph!=="Toate"&&d.category!==fph)return false;
    if(fst!=="Toate"&&d.status!==fst)return false;
    if(srch&&!(d.title||"").toLowerCase().includes(srch.toLowerCase())&&!d.description.toLowerCase().includes(srch.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>b.id.localeCompare(a.id));
  const dd=decisions.find(d=>d.id===did);

  // LOGIN
  if(!session)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#faf7f4",padding:"2rem",boxSizing:"border-box"}}>
      <div style={{width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",fontSize:20,fontWeight:300,letterSpacing:"0.4em",color:"#2c2c2c",textTransform:"uppercase",marginBottom:16}}>ANNTERIOR</div>
        <div style={{width:28,height:1.5,background:"#c8b89a",margin:"0 auto 20px",borderRadius:2}}/>
        <h1 style={{fontWeight:300,fontSize:24,margin:"0 0 8px",color:"#2c2c2c"}}>Jurnal de decizii</h1>
        <p style={{color:"#bbb",fontSize:13,marginBottom:36,lineHeight:1.6}}>Introdu numele si codul de acces.</p>
        <div style={{textAlign:"left"}}>
          <Inp label="Numele tau" placeholder="ex. Anna, Mihai..." value={lname} onChange={e=>{setLname(e.target.value);setLerr("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          <Inp label="Cod de acces" type="password" placeholder="••••••••" value={lcode} onChange={e=>{setLcode(e.target.value);setLerr("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>
        {lerr&&<div style={{fontSize:13,color:"#A32D2D",marginBottom:10,textAlign:"left"}}>{lerr}</div>}
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",background:loading?"#aaa":"#2c2c2c",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:14,cursor:loading?"wait":"pointer",marginBottom:16}}>
          {loading?"Se incarca...":"Intra"}
        </button>
        <p style={{fontSize:12,color:"#ccc",margin:0}}>Codul iti este trimis de administrator.</p>
      </div>
    </div>
  );

  // PROJECT SELECTION
  if(!ap)return(
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",background:"#faf7f4",minHeight:"100vh"}}>
      <div style={{background:"#fff",borderBottom:"1.5px solid #e0ddd8",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
        <span style={{fontWeight:400,fontSize:12,color:"#b8afa8",letterSpacing:"0.12em"}}>JURNAL DE DECIZII</span>
        <button onClick={logout} style={{fontSize:13,padding:"5px 12px",color:"#aaa"}}>Iesi</button>
      </div>

      <ProjectCards projects={myProjects} onSelect={setAp} userName={session.name} isAdmin={isAdmin} onNew={()=>{setPf(makeProj());setDrawer("newProject");}} onUsers={()=>setDrawer("users")}/>
      {drawer==="newProject"&&<Drawer title="Proiect nou" onClose={()=>setDrawer(null)}>
        <Card2>
          <SecTitle2>Detalii proiect</SecTitle2>
          <Inp label="Cod proiect" placeholder="ex. ABU-PIPERA-01" value={pf.projectCode} onChange={e=>setPf(f=>Object.assign({},f,{projectCode:e.target.value}))}/>
          <Inp label="Nume client" placeholder="ex. Andreea Bubu" value={pf.client} onChange={e=>setPf(f=>Object.assign({},f,{client:e.target.value}))}/>
          <Inp label="Nume proiect *" placeholder="ex. Vila Pipera" value={pf.name} onChange={e=>setPf(f=>Object.assign({},f,{name:e.target.value}))}/>
          <Inp label="Cod acces client" placeholder="ex. pipera2024" value={pf.code} onChange={e=>setPf(f=>Object.assign({},f,{code:e.target.value}))}/>
          <TeamPicker team={pf.team} setTeam={t=>setPf(f=>Object.assign({},f,{team:t}))} users={users} nm={nm} setNm={setNm}/>
        </Card2>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <button onClick={()=>setDrawer(null)}>Anuleaza</button>
          <Btn1 onClick={addProject} disabled={!pf.name.trim()||loading}>Creeaza</Btn1>
        </div>
      </Drawer>}
      {drawer==="users"&&<UsersDrawerComp users={users} projects={projects} saveUser={saveUser2} deleteUser={deleteUser2} onClose={()=>setDrawer(null)}/>}
    </div>
  );

  // PROJECT VIEW
  return(
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",background:"#faf7f4",minHeight:"100vh"}}>
      <div style={{background:"#fff",borderBottom:"1.5px solid #e0ddd8",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span onClick={()=>{if(!isClient)setAp(null);}} style={{fontWeight:400,fontSize:12,color:"#b8afa8",letterSpacing:"0.12em",cursor:isClient?"default":"pointer"}}>JURNAL DE DECIZII</span>
            <span style={{color:"#ddd",fontSize:18}}>/</span>
            {ap.projectCode&&<span style={{fontSize:12,color:"#aaa",fontWeight:500}}>{ap.projectCode}</span>}
            {ap.projectCode&&<span style={{color:"#ddd"}}>·</span>}
            <span style={{fontWeight:500,fontSize:14}}>{ap.name+(ap.client?" - "+ap.client:"")}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isAdmin&&<button onClick={()=>{setPf(makeProj());setDrawer("newProject");}} style={{fontSize:13,padding:"5px 12px"}}>+ Proiect</button>}
            {isAdmin&&<button onClick={()=>setDrawer("users")} style={{fontSize:13,padding:"5px 12px"}}>Utilizatori</button>}
            {isAdmin&&<button onClick={openSettings} style={{fontSize:13,padding:"5px 12px"}}>Setari</button>}
            {!isClient&&<Btn1 onClick={openNew}>+ Decizie</Btn1>}
            <button onClick={logout} style={{fontSize:13,padding:"5px 12px",color:"#aaa"}}>Iesi</button>
          </div>
        </div>
      </div>

      <div style={{padding:"20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {STAT_CONFIG.map(s=>{const val=s.key?decisions.filter(d=>d.status===s.key).length:decisions.length;return(
            <Card2 key={s.l} style={{borderLeft:"3px solid "+s.color,padding:"12px 16px"}}>
              <div style={{fontSize:11,color:"#888",marginBottom:6,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.l}</div>
              <div style={{fontSize:28,fontWeight:500,color:s.color}}>{val}</div>
            </Card2>);})}
        </div>

        <Card2 style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",background:"#fafafa"}}>
            <input placeholder="Cauta topic..." value={srch} onChange={e=>setSrch(e.target.value)} style={{flex:1,minWidth:140,fontSize:13}}/>
            <select value={fph} onChange={e=>setFph(e.target.value)} style={{fontSize:13}}>
              <option value="Toate">Toate fazele</option>
              {phases.map(p=><option key={p}>{p}</option>)}
            </select>
            <select value={fst} onChange={e=>setFst(e.target.value)} style={{fontSize:13}}>
              <option value="Toate">Toate statusurile</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup><col style={{width:"30%"}}/><col style={{width:"12%"}}/><col style={{width:"16%"}}/><col style={{width:"18%"}}/><col style={{width:"18%"}}/><col style={{width:"6%"}}/></colgroup>
            <thead style={{background:"#f5f0ea"}}>
              <tr>{["Topic","Faza","Specialitate","Decide","Status",""].map((h,i)=><th key={i} style={{padding:"8px 16px",fontSize:11,color:"#999",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em",textAlign:"left",borderBottom:"1px solid #e8e6e1"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length===0
                ?<tr><td colSpan={6} style={{padding:"3rem",textAlign:"center",color:"#aaa",fontSize:14}}>{decisions.length===0?"Niciun topic inregistrat.":"Niciun rezultat."}</td></tr>
                :filtered.map(d=>(
                  <tr key={d.id} onClick={()=>{setDid(d.id);setCtxt("");setCname("");setCimgs([]);setDrawer("detail");}}
                    style={{cursor:"pointer",borderBottom:"1px solid #e8e6e1",background:did===d.id&&drawer==="detail"?"#f0eeeb":"#fff"}}
                    onMouseEnter={e=>e.currentTarget.style.background=did===d.id&&drawer==="detail"?"#f0eeeb":"#fafaf8"}
                    onMouseLeave={e=>e.currentTarget.style.background=did===d.id&&drawer==="detail"?"#f0eeeb":"#fff"}>
                    <td style={{padding:"11px 16px",verticalAlign:"middle",maxWidth:0,overflow:"hidden"}}>
                      <div style={{fontSize:14,fontWeight:500,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title||d.description.split("\n")[0]}</div>
                      <div style={{fontSize:12,color:"#aaa",display:"flex",gap:10}}>
                        {d.createdBy&&<span>{"de "+d.createdBy}</span>}
                        <span>{d.dateAdded}</span>
                        {d.discussion&&d.discussion.length>0&&<span>{"["+d.discussion.length+"]"}</span>}
                      </div>
                    </td>
                    <td style={{padding:"11px 16px",verticalAlign:"middle"}}><PhasePill2 phase={d.category}/></td>
                    <td style={{padding:"11px 16px",verticalAlign:"middle",fontSize:12,color:"#666",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:0}}>{d.specialty}</td>
                    <td style={{padding:"11px 16px",verticalAlign:"middle",fontSize:12,maxWidth:0}}>
                      {d.status==="Decizie luata"&&d.approvedBy
                        ?<div><div style={{fontWeight:500,color:"#3B6D11",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.approvedBy}</div>{d.dateDecision&&<div style={{fontSize:11,color:"#aaa"}}>{d.dateDecision}</div>}</div>
                        :<span style={{color:d.decisionOwner?"#2c2c2c":"#ccc",fontWeight:d.decisionOwner?500:400}}>{d.decisionOwner||"-"}</span>}
                    </td>
                    <td style={{padding:"11px 16px",verticalAlign:"middle"}}><Badge2 status={d.status}/></td>
                    <td style={{padding:"11px 16px",verticalAlign:"middle",textAlign:"right"}}>
                      {!isClient&&(isAdmin||(d.createdBy===session.name))&&<span onClick={e=>{e.stopPropagation();openEdit(d);}} style={{fontSize:15,color:"#bbb",cursor:"pointer"}}>✏️</span>}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Card2>
      </div>

      {drawer==="detail"&&dd&&<Drawer title="Detalii topic" onClose={()=>{setDrawer(null);setDid(null);}}>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            <PhasePill2 phase={dd.category}/>
            <span style={{fontSize:11,color:"#666",background:"#f5f0ea",border:"1px solid #e8e4df",borderRadius:20,padding:"3px 10px"}}>{dd.specialty}</span>
            <Badge2 status={dd.status}/>
          </div>
          {dd.title&&<div style={{fontWeight:500,fontSize:18,lineHeight:1.3,marginBottom:6}}>{dd.title}</div>}
          {dd.description&&<div style={{fontSize:14,lineHeight:1.6,marginBottom:8,whiteSpace:"pre-wrap",color:dd.title?"#555":"#2c2c2c",fontWeight:dd.title?400:500}}>{dd.description}</div>}
          <ImgRow images={dd.descImages}/>
        </div>
        {dd.finalDecision&&<div style={{background:"#EAF3DE",border:"1px solid #639922",borderRadius:10,padding:"12px 14px",marginBottom:12}}><SecTitle2>Decizia finala</SecTitle2><div style={{fontSize:14,color:"#27500A"}}>{dd.finalDecision}</div><ImgRow images={dd.finalImages}/></div>}
        {((dd.links&&dd.links.length>0)||(dd.attachments&&dd.attachments.length>0))&&<Card2 style={{marginBottom:12}}>
          {dd.links&&dd.links.length>0&&<div style={{marginBottom:8}}><SecTitle2>Linkuri</SecTitle2>{dd.links.map((l,i)=><div key={i} style={{marginBottom:6}}><a href={l.url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#534AB7",textDecoration:"none"}}>{l.label}</a></div>)}</div>}
          {dd.attachments&&dd.attachments.length>0&&<div><SecTitle2>Atasamente</SecTitle2>{dd.attachments.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><a href={a.data} download={a.name} style={{fontSize:13,color:"#534AB7",textDecoration:"none"}}>{a.name}</a><span style={{fontSize:11,color:"#aaa"}}>{a.size>1048576?(a.size/1048576).toFixed(1)+"MB":(a.size/1024).toFixed(0)+"KB"}</span></div>)}</div>}
        </Card2>}
        <Card2 style={{marginBottom:12}}>
          <SecTitle2>Detalii</SecTitle2>
          {dd.changeLog&&dd.changeLog.length>0&&<div style={{marginBottom:12,padding:"8px 10px",background:"#FAEEDA",borderRadius:7}}>
            <div style={{fontSize:11,color:"#854F0B",fontWeight:500,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Jurnal modificari</div>
            {dd.changeLog.map((entry,i)=><div key={i} style={{fontSize:12,color:"#666",marginBottom:3,display:"flex",gap:8,flexWrap:"wrap"}}><span style={{color:"#aaa",whiteSpace:"nowrap"}}>{entry.date+" "+entry.time}</span><span>{"Modificat de "+entry.by+": "+entry.fields.join(", ")}</span></div>)}
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["Creat de",dd.createdBy],["Decide",dd.decisionOwner],["Decizie luata de",dd.approvedBy],["Data deciziei",dd.dateDecision],["Inregistrat la",dd.dateAdded]].map(pair=>(
              <div key={pair[0]}><div style={{fontSize:11,color:"#aaa",marginBottom:2,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em"}}>{pair[0]}</div><div style={{fontSize:13,fontWeight:500,color:pair[1]?"#2c2c2c":"#ccc"}}>{pair[1]||"-"}</div></div>
            ))}
          </div>
        </Card2>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {!isClient&&(isAdmin||(dd.createdBy===session.name))&&<button onClick={()=>{setDrawer(null);openEdit(dd);}} style={{fontSize:13,padding:"6px 16px"}}>Editeaza</button>}
          {canDelete(dd)&&<button onClick={()=>deleteDec(dd)} style={{fontSize:13,padding:"6px 16px",color:"#A32D2D"}}>Sterge</button>}
          {canDecide(dd)&&dd.status!=="Decizie luata"&&(
            <div>
              {!dd.finalDecision&&<div style={{fontSize:12,color:"#854F0B",background:"#FAEEDA",border:"1px solid #EF9F27",borderRadius:7,padding:"7px 12px",marginBottom:8}}>Completeaza decizia finala inainte de a inchide topicul.</div>}
              <button onClick={()=>dd.finalDecision&&setDecStatus(dd,"Decizie luata")} style={{fontSize:13,padding:"6px 16px",background:dd.finalDecision?"#EAF3DE":"#f5f5f5",color:dd.finalDecision?"#3B6D11":"#aaa",border:"1px solid "+(dd.finalDecision?"#639922":"#ddd"),borderRadius:8,cursor:dd.finalDecision?"pointer":"not-allowed",fontWeight:500}}>Decizie luata</button>
            </div>
          )}
          {isAdmin&&dd.status==="Decizie luata"&&<button onClick={()=>setDecStatus(dd,"In discutie")} style={{fontSize:13,padding:"6px 16px",color:"#888"}}>Redeschide</button>}
        </div>
        <Card2>
          <SecTitle2>{"Discutii ("+(dd.discussion||[]).length+")"}</SecTitle2>
          {(dd.discussion||[]).length===0?<div style={{fontSize:13,color:"#aaa",marginBottom:14}}>Nicio discutie.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {dd.discussion.map((c,i)=>{const mine=c.author===session.name;return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",background:mine?"#E6F1FB":"#f0eeeb",borderRadius:mine?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"8px 12px",border:"1px solid "+(mine?"#B5D4F4":"#ddd")}}>
                    <div style={{fontSize:11,color:mine?"#185FA5":"#888",marginBottom:3,fontWeight:500}}>{c.author}</div>
                    <div style={{fontSize:13,lineHeight:1.5}}>{c.text}</div>
                    {c.images&&c.images.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>{c.images.map((src,j)=><img key={j} src={src} alt="" style={{height:60,borderRadius:5,border:"1px solid #e8e4df",cursor:"pointer"}} onClick={()=>window.open(src)}/>)}</div>}
                  </div>
                  <div style={{fontSize:11,color:"#bbb",marginTop:2,padding:"0 4px"}}>{c.date+" "+c.time}</div>
                </div>);})}
            </div>}
          <div style={{borderTop:"1px solid #eee",paddingTop:12}}>
            <select value={cname} onChange={e=>setCname(e.target.value)} style={{width:"100%",boxSizing:"border-box",marginBottom:8,fontSize:13}}>
              <option value="">- cine scrie? -</option>
              {projectTeam.map(m=><option key={m}>{m}</option>)}
            </select>
            <textarea value={ctxt} onChange={e=>setCtxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment();}}} placeholder="Scrie un mesaj... (Enter pentru trimite)" style={{width:"100%",boxSizing:"border-box",minHeight:60,resize:"vertical",fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",fontSize:13,padding:"8px 10px",border:"1px solid #e8e4df",borderRadius:8,background:"#fff",color:"#2c2c2c",marginBottom:6}}/>
            <ImgPaste images={cimgs} onChange={setCimgs}/>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}>
              <Btn1 onClick={addComment} disabled={!ctxt.trim()||!cname}>Trimite</Btn1>
            </div>
          </div>
        </Card2>
      </Drawer>}

      {drawer==="decision"&&<Drawer title={eid?"Editeaza topic":"Topic nou"} onClose={()=>setDrawer(null)}>
        <Card2 style={{marginBottom:14}}>
          <SecTitle2>Clasificare</SecTitle2>
          <AddableSel label="Faza" value={form.category} onChange={v=>setForm(f=>Object.assign({},f,{category:v}))} options={phases} onAdd={v=>savePhases2(phases.concat([v]))} onDelete={v=>savePhases2(phases.filter(p=>p!==v))} canAdd={isAdmin}/>
          <AddableSel label="Specialitate" value={form.specialty} onChange={v=>setForm(f=>Object.assign({},f,{specialty:v}))} options={specs} onAdd={v=>saveSpecs2(specs.concat([v]))} onDelete={v=>saveSpecs2(specs.filter(s=>s!==v))} canAdd={isAdmin}/>
        </Card2>
        <Card2 style={{marginBottom:14}}>
          <SecTitle2>Continut</SecTitle2>
          {contentLocked(form)&&<div style={{fontSize:12,color:"#854F0B",background:"#FAEEDA",border:"1px solid #EF9F27",borderRadius:7,padding:"8px 12px",marginBottom:12}}>Campurile sunt blocate deoarece exista discutii. Doar adminul poate modifica.</div>}
          <Inp label="Titlu topic *" value={form.title||""} onChange={e=>setForm(f=>Object.assign({},f,{title:e.target.value}))} placeholder="ex. Decizie finisaj pardoseala living"/>
          <Txt label="Descriere / detalii" value={form.description} onChange={e=>{if(!contentLocked(form))setForm(f=>Object.assign({},f,{description:e.target.value}));}} placeholder="Descriere detaliata, context..." locked={contentLocked(form)}/>
          <ImgPaste images={form.descImages} onChange={imgs=>{if(!contentLocked(form))setForm(f=>Object.assign({},f,{descImages:imgs}));}} locked={contentLocked(form)}/>
          <Txt label="Decizia finala" value={form.finalDecision} onChange={e=>setForm(f=>Object.assign({},f,{finalDecision:e.target.value}))} placeholder="Concluzia agreata dupa discutii..."/>
          <ImgPaste images={form.finalImages} onChange={imgs=>setForm(f=>Object.assign({},f,{finalImages:imgs}))}/>
        </Card2>
        <Card2 style={{marginBottom:14}}>
          <SecTitle2>Linkuri si atasamente</SecTitle2>
          <LinksList links={form.links} onChange={v=>setForm(f=>Object.assign({},f,{links:v}))}/>
          <AttachList attachments={form.attachments} onChange={v=>setForm(f=>Object.assign({},f,{attachments:v}))}/>
        </Card2>
        <Card2 style={{marginBottom:14}}>
          <SecTitle2>Responsabilitate</SecTitle2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Sel label="Creat de" value={form.createdBy} onChange={e=>setForm(f=>Object.assign({},f,{createdBy:e.target.value}))}>
              <option value="">- selecteaza -</option>
              {projectTeam.map(m=><option key={m}>{m}</option>)}
            </Sel>
            {eid&&form.decisionOwner&&!isAdmin
              ?<div style={{marginBottom:12}}><label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>Decide</label><div style={{padding:"8px 10px",background:"#f5f0ea",border:"1px solid #e8e4df",borderRadius:8,fontSize:14,color:"#444"}}>{form.decisionOwner+" (blocat)"}</div></div>
              :<Sel label={isAdmin&&eid&&form.decisionOwner?"Decide (admin override)":"Decide"} value={form.decisionOwner} onChange={e=>setForm(f=>Object.assign({},f,{decisionOwner:e.target.value}))}>
                <option value="">- selecteaza -</option>
                {projectTeam.map(m=><option key={m}>{m}</option>)}
              </Sel>}
          </div>
          <Inp label="Data deciziei" type="date" value={form.dateDecision} onChange={e=>setForm(f=>Object.assign({},f,{dateDecision:e.target.value}))}/>
        </Card2>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setDrawer(null)}>Anuleaza</button>
          <Btn1 onClick={saveDec} disabled={!(form.title||"").trim()||loading}>Salveaza</Btn1>
        </div>
      </Drawer>}

      {drawer==="settings"&&<Drawer title="Setari proiect" onClose={()=>{setDrawer(null);setConfirmDel(false);}}>
        <Card2 style={{marginBottom:14}}>
          <SecTitle2>Detalii proiect</SecTitle2>
          <Inp label="Cod proiect" value={pf.projectCode} onChange={e=>setPf(f=>Object.assign({},f,{projectCode:e.target.value}))}/>
          <Inp label="Nume client" value={pf.client} onChange={e=>setPf(f=>Object.assign({},f,{client:e.target.value}))}/>
          <Inp label="Nume proiect" value={pf.name} onChange={e=>setPf(f=>Object.assign({},f,{name:e.target.value}))}/>
          <Inp label="Cod acces client" value={pf.code} onChange={e=>setPf(f=>Object.assign({},f,{code:e.target.value}))}/>
          <TeamPicker team={pf.team} setTeam={t=>setPf(f=>Object.assign({},f,{team:t}))} users={users} nm={nm} setNm={setNm}/>
        </Card2>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          {!confirmDel
            ?<button onClick={()=>setConfirmDel(true)} style={{fontSize:13,padding:"6px 14px",color:"#A32D2D",border:"1px solid #E24B4A",borderRadius:8,background:"#FCEBEB",cursor:"pointer"}}>Sterge proiectul</button>
            :<div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:13,color:"#A32D2D",fontWeight:500}}>Esti sigura?</span>
              <button onClick={deleteProject} style={{fontSize:13,padding:"6px 14px",color:"#fff",background:"#A32D2D",border:"none",borderRadius:8,cursor:"pointer"}}>Da, sterge</button>
              <button onClick={()=>setConfirmDel(false)} style={{fontSize:13,padding:"6px 14px"}}>Anuleaza</button>
            </div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setDrawer(null);setConfirmDel(false);}}>Inchide</button>
            <Btn1 onClick={saveProjSettings} disabled={loading}>Salveaza</Btn1>
          </div>
        </div>
      </Drawer>}

      {drawer==="newProject"&&<Drawer title="Proiect nou" onClose={()=>setDrawer(null)}>
        <Card2>
          <SecTitle2>Detalii proiect</SecTitle2>
          <Inp label="Cod proiect" placeholder="ex. ABU-PIPERA-01" value={pf.projectCode} onChange={e=>setPf(f=>Object.assign({},f,{projectCode:e.target.value}))}/>
          <Inp label="Nume client" placeholder="ex. Andreea Bubu" value={pf.client} onChange={e=>setPf(f=>Object.assign({},f,{client:e.target.value}))}/>
          <Inp label="Nume proiect *" placeholder="ex. Vila Pipera" value={pf.name} onChange={e=>setPf(f=>Object.assign({},f,{name:e.target.value}))}/>
          <Inp label="Cod acces client" placeholder="ex. pipera2024" value={pf.code} onChange={e=>setPf(f=>Object.assign({},f,{code:e.target.value}))}/>
          <TeamPicker team={pf.team} setTeam={t=>setPf(f=>Object.assign({},f,{team:t}))} users={users} nm={nm} setNm={setNm}/>
        </Card2>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <button onClick={()=>setDrawer(null)}>Anuleaza</button>
          <Btn1 onClick={addProject} disabled={!pf.name.trim()||loading}>Creeaza</Btn1>
        </div>
      </Drawer>}

      {drawer==="users"&&<UsersDrawerComp users={users} projects={projects} saveUser={saveUser2} deleteUser={deleteUser2} onClose={()=>setDrawer(null)}/>}
    </div>
  );
}

function UsersDrawerComp({users,projects,saveUser,deleteUser,onClose}){
  const [uf,setUf]=useState(makeUser());
  const [euid,setEuid]=useState(null);
  const [loading,setLoading]=useState(false);
  const save=async()=>{
    if(!uf.name.trim()||!uf.code.trim())return;
    setLoading(true);
    await saveUser(uf,euid);
    setUf(makeUser());setEuid(null);setLoading(false);
  };
  const del=async(id)=>{setLoading(true);await deleteUser(id);setLoading(false);};
  const toggleProj=pid=>{const ids=(uf.projectIds||[]).includes(pid)?(uf.projectIds||[]).filter(x=>x!==pid):[...(uf.projectIds||[]),pid];setUf(f=>Object.assign({},f,{projectIds:ids}));};
  return(<Drawer title="Utilizatori si acces" onClose={onClose}>
    <Card2 style={{marginBottom:14}}>
      <SecTitle2>{euid?"Editeaza coleg":"Adauga coleg"}</SecTitle2>
      <Inp label="Nume" placeholder="ex. Mihai" value={uf.name} onChange={e=>setUf(f=>Object.assign({},f,{name:e.target.value}))}/>
      <Inp label="Cod de acces" placeholder="ex. mihai2024" value={uf.code} onChange={e=>setUf(f=>Object.assign({},f,{code:e.target.value}))}/>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,color:"#888",marginBottom:6,fontWeight:500}}>Acces la proiecte</label>
        {projects.length===0?<div style={{fontSize:13,color:"#aaa"}}>Niciun proiect.</div>:projects.map(p=><label key={p.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:6,cursor:"pointer"}}>
          <input type="checkbox" checked={(uf.projectIds||[]).includes(p.id)} onChange={()=>toggleProj(p.id)}/>
          {(p.projectCode?p.projectCode+" - ":"")+p.name+(p.client?" ("+p.client+")":"")}
        </label>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn1 onClick={save} disabled={loading}>{euid?"Salveaza":"Adauga"}</Btn1>
        {euid&&<button onClick={()=>{setEuid(null);setUf(makeUser());}}>Anuleaza</button>}
      </div>
    </Card2>
    {users.length>0&&<Card2><SecTitle2>Colegi existenti</SecTitle2>
      {users.map(u=><div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f0eeeb"}}>
        <div>
          <div style={{fontWeight:500,fontSize:13}}>{u.name}</div>
          <div style={{fontSize:12,color:"#aaa"}}>{"Cod: "+u.code+" - "+(u.projectIds||[]).length+" proiect(e)"}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setUf({name:u.name,code:u.code,projectIds:u.projectIds||[]});setEuid(u.id);}} style={{fontSize:12,padding:"3px 10px"}}>edit</button>
          <button onClick={()=>del(u.id)} disabled={loading} style={{fontSize:12,padding:"3px 10px",color:"#A32D2D"}}>x</button>
        </div>
      </div>)}
    </Card2>}
  </Drawer>);
}
