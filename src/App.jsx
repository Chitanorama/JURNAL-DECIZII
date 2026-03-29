const Btn1=({children,disabled,onClick})=><button onClick={onClick} disabled={!!disabled} style={{fontWeight:500,background:disabled?"#eee":"#534AB7",color:disabled?"#aaa":"#fff",border:"none",borderRadius:8,padding:"7px 20px",cursor:disabled?"not-allowed":"pointer",fontSize:13}}>{children}</button>;
const Inp=({label,...p})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<input style={{width:"100%",boxSizing:"border-box",background:"#fff"}} {...p}/></div>;
const Sel=({label,children,...p})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<select style={{width:"100%",boxSizing:"border-box",background:"#fff"}} {...p}>{children}</select></div>;
const Txt=({label,locked,...p})=><div style={{marginBottom:8}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<textarea style={{width:"100%",boxSizing:"border-box",minHeight:68,resize:"vertical",fontFamily:"var(--font-sans)",fontSize:14,padding:"8px 10px",border:"1px solid #ddd",borderRadius:8,background:locked?"#f5f5f5":"#fff",color:"var(--color-text-primary)",cursor:locked?"not-allowed":"text"}} readOnly={!!locked} {...p}/></div>;
const Txt=({label,locked,...p})=><div style={{marginBottom:8}}>{label&&<label style={{display:"block",fontSize:12,color:"#888",marginBottom:3,fontWeight:500}}>{label}</label>}<textarea style={{width:"100%",boxSizing:"border-box",minHeight:68,resize:"vertical",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",fontSize:14,padding:"8px 10px",border:"1px solid #ddd",borderRadius:8,background:locked?"#f5f5f5":"#fff",color:"#2c2c2c",cursor:locked?"not-allowed":"text"}} readOnly={!!locked} {...p}/></div>;

function AddableSel({label,value,onChange,options,onAdd,onDelete,canAdd}){
const [adding,setAdding]=useState(false);
@@ -419,7 +419,7 @@ export default function App(){

// PROJECT SELECTION
if(!ap)return(
    <div style={{fontFamily:"var(--font-sans)",background:"#f8f7f5",minHeight:"100vh"}}>
    <div style={{fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",background:"#f8f7f5",minHeight:"100vh"}}>
<div style={{background:"#fff",borderBottom:"1.5px solid #e0ddd8",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
<span style={{fontWeight:500,fontSize:13,color:"#aaa",letterSpacing:"0.03em"}}>JURNAL DE DECIZII</span>
<button onClick={logout} style={{fontSize:13,padding:"5px 12px",color:"#aaa"}}>Iesi</button>
@@ -452,7 +452,7 @@ export default function App(){

// PROJECT VIEW
return(
    <div style={{fontFamily:"var(--font-sans)",background:"#f8f7f5",minHeight:"100vh"}}>
    <div style={{fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",background:"#f8f7f5",minHeight:"100vh"}}>
<div style={{background:"#fff",borderBottom:"1.5px solid #e0ddd8",padding:"0 20px"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52,flexWrap:"wrap",gap:8}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
@@ -519,7 +519,7 @@ export default function App(){
<td style={{padding:"11px 16px",verticalAlign:"middle",fontSize:12,maxWidth:0}}>
{d.status==="Decizie luata"&&d.approvedBy
?<div><div style={{fontWeight:500,color:"#3B6D11",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.approvedBy}</div>{d.dateDecision&&<div style={{fontSize:11,color:"#aaa"}}>{d.dateDecision}</div>}</div>
                        :<span style={{color:d.decisionOwner?"var(--color-text-primary)":"#ccc",fontWeight:d.decisionOwner?500:400}}>{d.decisionOwner||"-"}</span>}
                        :<span style={{color:d.decisionOwner?"#2c2c2c":"#ccc",fontWeight:d.decisionOwner?500:400}}>{d.decisionOwner||"-"}</span>}
</td>
<td style={{padding:"11px 16px",verticalAlign:"middle"}}><Badge2 status={d.status}/></td>
<td style={{padding:"11px 16px",verticalAlign:"middle",textAlign:"right"}}>
@@ -541,7 +541,7 @@ export default function App(){
<Badge2 status={dd.status}/>
</div>
{dd.title&&<div style={{fontWeight:500,fontSize:18,lineHeight:1.3,marginBottom:6}}>{dd.title}</div>}
          {dd.description&&<div style={{fontSize:14,lineHeight:1.6,marginBottom:8,whiteSpace:"pre-wrap",color:dd.title?"#555":"var(--color-text-primary)",fontWeight:dd.title?400:500}}>{dd.description}</div>}
          {dd.description&&<div style={{fontSize:14,lineHeight:1.6,marginBottom:8,whiteSpace:"pre-wrap",color:dd.title?"#555":"#2c2c2c",fontWeight:dd.title?400:500}}>{dd.description}</div>}
<ImgRow images={dd.descImages}/>
</div>
{dd.finalDecision&&<div style={{background:"#EAF3DE",border:"1px solid #639922",borderRadius:10,padding:"12px 14px",marginBottom:12}}><SecTitle2>Decizia finala</SecTitle2><div style={{fontSize:14,color:"#27500A"}}>{dd.finalDecision}</div><ImgRow images={dd.finalImages}/></div>}
@@ -557,7 +557,7 @@ export default function App(){
</div>}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
{[["Creat de",dd.createdBy],["Decide",dd.decisionOwner],["Decizie luata de",dd.approvedBy],["Data deciziei",dd.dateDecision],["Inregistrat la",dd.dateAdded]].map(pair=>(
              <div key={pair[0]}><div style={{fontSize:11,color:"#aaa",marginBottom:2,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em"}}>{pair[0]}</div><div style={{fontSize:13,fontWeight:500,color:pair[1]?"var(--color-text-primary)":"#ccc"}}>{pair[1]||"-"}</div></div>
              <div key={pair[0]}><div style={{fontSize:11,color:"#aaa",marginBottom:2,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em"}}>{pair[0]}</div><div style={{fontSize:13,fontWeight:500,color:pair[1]?"#2c2c2c":"#ccc"}}>{pair[1]||"-"}</div></div>
))}
</div>
</Card2>
@@ -591,7 +591,7 @@ export default function App(){
<option value="">- cine scrie? -</option>
{projectTeam.map(m=><option key={m}>{m}</option>)}
</select>
            <textarea value={ctxt} onChange={e=>setCtxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment();}}} placeholder="Scrie un mesaj... (Enter pentru trimite)" style={{width:"100%",boxSizing:"border-box",minHeight:60,resize:"vertical",fontFamily:"var(--font-sans)",fontSize:13,padding:"8px 10px",border:"1px solid #ddd",borderRadius:8,background:"#fff",color:"var(--color-text-primary)",marginBottom:6}}/>
            <textarea value={ctxt} onChange={e=>setCtxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment();}}} placeholder="Scrie un mesaj... (Enter pentru trimite)" style={{width:"100%",boxSizing:"border-box",minHeight:60,resize:"vertical",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",fontSize:13,padding:"8px 10px",border:"1px solid #ddd",borderRadius:8,background:"#fff",color:"#2c2c2c",marginBottom:6}}/>
<ImgPaste images={cimgs} onChange={setCimgs}/>
<div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}>
<Btn1 onClick={addComment} disabled={!ctxt.trim()||!cname}>Trimite</Btn1>
