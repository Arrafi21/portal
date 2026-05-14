// SMARTMOVE APP - paste this entire file as App.jsx in GitHub
// Key change: uses fetchCSV to read Google Sheets directly

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pndxwrkxwknwtwkilyxv.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_F84YeHO7BdQQoNTtnmc_jA_lKYhVG4-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// GOOGLE SHEETS - fetched directly as CSV (sheet must be "Anyone with link")
const SHEET_ID_MAIN = "185jtGeHdyihieh2cDqYby8pPrrVN7edsw9t4i7kn6ts";
const SHEET_ID_XELM = "1C1ElshfhSbodvgWqSBIbPXP8lxlfyLSMONp0cMo3k0M";
const ALL_MEMBERS = ["Amir","Kinza","Mubarak","Nourin","Mahbuba","Tanya"];

async function fetchCSV(sheetId, gid = "0") {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return parseCSV(await res.text());
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const split = line => {
    const r = []; let c = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i+1]==='"') { c+='"'; i++; } else q=!q; }
      else if (ch===',' && !q) { r.push(c.trim()); c=""; }
      else c+=ch;
    }
    r.push(c.trim()); return r;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map((l,i) => {
    const v = split(l); const o = { _rowIndex: i+2 };
    headers.forEach((h,j) => { o[h] = (v[j]||"").trim(); });
    return o;
  }).filter(r => Object.entries(r).filter(([k])=>k!=='_rowIndex').some(([,v])=>v));
  return { headers, rows };
}

const C = { bg:"#07101F",surface:"#0C1A2E",card:"#101F35",border:"rgba(255,255,255,0.07)",gold:"#F5A623",goldSoft:"rgba(245,166,35,0.12)",teal:"#00C9C0",tealSoft:"rgba(0,201,192,0.12)",green:"#10C98A",greenSoft:"rgba(16,201,138,0.12)",red:"#FF4F6A",redSoft:"rgba(255,79,106,0.12)",blue:"#3D8EFF",purple:"#9B6EFF",text:"#EAF1FA",muted:"#6B82A0",faint:"#2A3F58" };
const AVATAR_COLORS=[C.teal,C.gold,C.purple,C.blue,C.green,"#FF8A65","#EC407A","#26C6DA"];
const LEAD_SOURCES=["Facebook Ads","Instagram Ads","TikTok Ads","Google Ads","Agent Referral","Student Referral","Old Students","Walk-In","XELM","Phoenix Leads","Other"];
const UNIVERSITIES=["University of Sunderland","University of Wolverhampton","ARU London","London Metropolitan University","Arden University","University of Wales Trinity Saint David","University of the West of Scotland","London School of Commerce","BPP University","LCCA","Other"];
const LEAD_OUTCOMES=[{id:"no_answer",label:"No Answer",icon:"📵",color:"#6B82A0"},{id:"voicemail",label:"Voicemail Left",icon:"📨",color:"#6B82A0"},{id:"wrong_number",label:"Wrong Number",icon:"❌",color:"#FF4F6A"},{id:"not_eligible",label:"Not Eligible",icon:"🚫",color:"#FF4F6A"},{id:"declined",label:"Not Interested",icon:"👎",color:"#FF8A65"},{id:"callback",label:"Call Back Requested",icon:"🔄",color:"#F5A623"},{id:"interested",label:"Interested",icon:"✅",color:"#00C9C0"},{id:"app_started",label:"Application Started",icon:"📝",color:"#3D8EFF"},{id:"app_submitted",label:"App Submitted",icon:"🎓",color:"#10C98A"},{id:"duplicate",label:"Duplicate Lead",icon:"♻️",color:"#9B6EFF"},{id:"no_show",label:"No Show / Ghosted",icon:"👻",color:"#6B82A0"},{id:"language",label:"Language Barrier",icon:"🌐",color:"#FF8A65"}];
const CHANNELS=["B2C","B2A"];
const DAY_LABELS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const todayISO=()=>new Date().toISOString().split("T")[0];
const fmtDate=d=>{if(!d)return"—";const[y,m,dd]=d.split("-");return`${dd}/${m}/${y}`;};
const weekStart=d=>{const dt=new Date(d);dt.setDate(dt.getDate()-dt.getDay()+1);return dt.toISOString().split("T")[0];};
const initials=n=>n.trim().split(" ").map(w=>w[0]?.toUpperCase()).join("").slice(0,2);
const avatarClr=n=>AVATAR_COLORS[(n.charCodeAt(0)+(n.charCodeAt(1)||0))%AVATAR_COLORS.length];
const Avatar=({name,size=36})=>(<div style={{width:size,height:size,borderRadius:99,flexShrink:0,background:avatarClr(name)+"22",border:`1.5px solid ${avatarClr(name)}55`,display:"flex",alignItems:"center",justifyContent:"center",color:avatarClr(name),fontWeight:800,fontSize:size*0.38}}>{initials(name)}</div>);
const Tag=({label,color})=>(<span style={{background:color+"18",color,border:`1px solid ${color}33`,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700}}>{label}</span>);
const ProgressBar=({value,max=100,color=C.teal,height=5})=>(<div style={{height,background:C.faint,borderRadius:99,overflow:"hidden",flexGrow:1}}><div style={{height:"100%",borderRadius:99,transition:"width 0.6s ease",width:`${Math.min(100,(value/max)*100)}%`,background:color}}/></div>);
const Field=({label,required,hint,children})=>(<div style={{display:"flex",flexDirection:"column",gap:6}}><label style={{color:C.muted,fontSize:10.5,letterSpacing:1.1,textTransform:"uppercase",display:"flex",gap:6,alignItems:"center"}}>{label}{required&&<span style={{color:C.gold}}>*</span>}{hint&&<span style={{color:C.faint,textTransform:"none",letterSpacing:0}}>{hint}</span>}</label>{children}</div>);
const SHead=({icon,label,color})=>(<div style={{display:"flex",alignItems:"center",gap:8,color,fontWeight:700,fontSize:11.5,letterSpacing:1.2,textTransform:"uppercase",paddingBottom:10,borderBottom:`1px solid ${C.border}`,marginBottom:16}}>{icon} {label}</div>);
const iCss={width:"100%",background:"#0C1A2E",border:`1px solid rgba(255,255,255,0.07)`,borderRadius:10,padding:"10px 13px",color:"#EAF1FA",fontSize:13.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.2s"};
const Spinner=()=>(<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}><div style={{width:32,height:32,border:`3px solid ${C.faint}`,borderTopColor:C.gold,borderRadius:99,animation:"spin 0.8s linear infinite"}}/></div>);
const STATUS_COLORS={"didn't pick up":{bg:"#FFF9C4",color:"#F57F17",border:"#F9A825"},"didnt pick up":{bg:"#FFF9C4",color:"#F57F17",border:"#F9A825"},"not interested":{bg:"#FFEBEE",color:"#C62828",border:"#EF5350"},"unreachable":{bg:"#FF8A65",color:"#fff",border:"#FF5722"},"unreachable + no whatsapp":{bg:"#FF8A65",color:"#fff",border:"#FF5722"},"went on voicemail":{bg:"#E8F5E9",color:"#2E7D32",border:"#66BB6A"},"voicemail":{bg:"#E8F5E9",color:"#2E7D32",border:"#66BB6A"},"need to call again":{bg:"#E3F2FD",color:"#1565C0",border:"#42A5F5"},"call back later":{bg:"#E3F2FD",color:"#1565C0",border:"#42A5F5"},"interested":{bg:"#E8F5E9",color:"#1B5E20",border:"#43A047"},"application submitted":{bg:"#E8F5E9",color:"#1B5E20",border:"#2E7D32"},"wrong number":{bg:"#880000",color:"#fff",border:"#880000"},"hung up":{bg:"#FF8A65",color:"#fff",border:"#FF5722"},"whatsapp sms":{bg:"#E3F2FD",color:"#1565C0",border:"#42A5F5"},"no response":{bg:"#F5F5F5",color:"#616161",border:"#BDBDBD"},"not eligible":{bg:"#FFEBEE",color:"#C62828",border:"#EF5350"},"repeat lead":{bg:"#F3E5F5",color:"#6A1B9A",border:"#AB47BC"},"other issue":{bg:"#FFF3E0",color:"#E65100",border:"#FFA726"},"call failed":{bg:"#FFEBEE",color:"#C62828",border:"#EF5350"}};
const getStatusStyle=s=>{if(!s)return{bg:C.surface,color:C.muted,border:C.border};return STATUS_COLORS[s.toLowerCase().trim()]||{bg:C.surface,color:C.muted,border:C.border};};

function LeadsView({profile,isManager}){
  const[activeTab,setActiveTab]=useState(isManager?"ALL":(profile?.full_name||ALL_MEMBERS[0]));
  const[data,setData]=useState({});
  const[loading,setLoading]=useState(false);
  const[lastRefresh,setLastRefresh]=useState(null);
  const[error,setError]=useState("");
  const[search,setSearch]=useState("");
  const[statusFilter,setStatusFilter]=useState("");
  const loadAll=async()=>{
    setLoading(true);setError("");
    try{
      const{headers,rows}=await fetchCSV(SHEET_ID_MAIN,"0");
      const assignedCol=headers.find(h=>["councillor","marketing office","marketier assigned","assigned","agent"].includes(h.toLowerCase().trim()))||null;
      const grouped={};ALL_MEMBERS.forEach(m=>{grouped[m]=[];});grouped["Unassigned"]=[];
      rows.forEach(row=>{
        const raw=assignedCol?(row[assignedCol]||""):"";
        const match=ALL_MEMBERS.find(m=>raw.trim().toLowerCase()===m.toLowerCase()||raw.trim().toLowerCase().startsWith(m.toLowerCase()));
        if(match)grouped[match].push(row);else grouped["Unassigned"].push(row);
      });
      let xelmRows=[];try{const xr=await fetchCSV(SHEET_ID_XELM,"0");xelmRows=xr.rows;}catch(e){}
      setData({...grouped,"XELM":xelmRows,"Phoenix Leads":[]});setLastRefresh(new Date());
    }catch(e){setError("Could not load leads: "+e.message);}
    setLoading(false);
  };
  useEffect(()=>{loadAll();},[]);
  const SOURCE_TABS=["Phoenix Leads","XELM"];
  const visibleTabs=isManager?["ALL",...ALL_MEMBERS,...SOURCE_TABS]:[profile?.full_name].filter(t=>ALL_MEMBERS.includes(t));
  const getRows=()=>{
    let rows=[];
    if(activeTab==="ALL"){ALL_MEMBERS.forEach(t=>{(data[t]||[]).forEach(r=>rows.push({...r,_tab:t}));});}
    else{rows=(data[activeTab]||[]).map(r=>({...r,_tab:activeTab}));}
    if(search){const q=search.toLowerCase();rows=rows.filter(r=>(r.Name||r.Contact||"").toLowerCase().includes(q)||(r.Phone||"").includes(q)||(r.Email||"").toLowerCase().includes(q)||(r.Course||r["Desired Course"]||"").toLowerCase().includes(q));}
    if(statusFilter){rows=rows.filter(r=>(r.Status||"").toLowerCase().includes(statusFilter.toLowerCase()));}
    return rows;
  };
  const rows=getRows();
  const statusCounts={};rows.forEach(r=>{const s=r.Status||"No Status";statusCounts[s]=(statusCounts[s]||0)+1;});
  const topStatuses=Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const allStatuses=[...new Set(Object.values(data).flat().map(r=>r.Status||"").filter(Boolean))].sort();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div><div style={{fontSize:20,fontWeight:900,color:C.text}}>📋 Live Leads <span style={{color:C.muted,fontWeight:400,fontSize:13}}>{rows.length} leads</span></div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{lastRefresh?`Refreshed ${lastRefresh.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}`:"Loading…"}</div></div>
        <button onClick={loadAll} disabled={loading} style={{background:loading?C.surface:`linear-gradient(135deg,${C.teal},#008B87)`,color:loading?C.muted:"#0A1020",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>{loading?"⏳ Loading…":"⟳ Refresh Leads"}</button>
      </div>
      {error&&<div style={{background:C.redSoft,border:`1px solid ${C.red}44`,borderRadius:12,padding:"14px 18px",color:C.red,fontSize:13}}>⚠ {error}</div>}
      {topStatuses.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8}}><button onClick={()=>setStatusFilter("")} style={{background:!statusFilter?C.goldSoft:C.surface,border:`1px solid ${!statusFilter?C.gold:C.border}`,color:!statusFilter?C.gold:C.muted,borderRadius:99,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>All ({rows.length})</button>{topStatuses.map(([s,n])=>{const st=getStatusStyle(s);const active=statusFilter===s;return(<button key={s} onClick={()=>setStatusFilter(active?"":s)} style={{background:active?st.color:st.bg,border:`1px solid ${st.border}`,color:active?"#fff":st.color,borderRadius:99,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s} ({n})</button>);})}</div>}
      <div style={{display:"flex",gap:0,background:C.surface,borderRadius:12,padding:4,flexWrap:"wrap",border:`1px solid ${C.border}`}}>{visibleTabs.map(t=>(<button key={t} onClick={()=>{setActiveTab(t);setSearch("");setStatusFilter("");}} style={{background:activeTab===t?C.card:"transparent",border:`1px solid ${activeTab===t?C.gold+"44":"transparent"}`,color:activeTab===t?C.gold:C.muted,borderRadius:9,padding:"7px 16px",fontSize:12,fontWeight:activeTab===t?800:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t==="ALL"?"🌐 All Team":SOURCE_TABS.includes(t)?`📥 ${t}`:`👤 ${t}`}{t!=="ALL"&&data[t]&&<span style={{color:C.faint,fontSize:10,marginLeft:5}}>({(data[t]||[]).length})</span>}</button>))}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name, phone, email, course…" style={{...iCss,flex:1,minWidth:220,fontSize:13}}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...iCss,width:"auto",fontSize:12,padding:"7px 12px"}}><option value="">All Statuses</option>{allStatuses.map(s=><option key={s}>{s}</option>)}</select>{(search||statusFilter)&&<button onClick={()=>{setSearch("");setStatusFilter("");}} style={{background:C.redSoft,border:`1px solid ${C.red}33`,color:C.red,borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>}</div>
      {loading&&<div style={{display:"flex",flexDirection:"column",gap:8}}>{[1,2,3,4,5].map(i=><div key={i} style={{background:C.card,borderRadius:12,padding:16,height:64,opacity:0.5}}/>)}</div>}
      {!loading&&rows.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"60px 20px"}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:6}}>No leads found</div><div style={{fontSize:13}}>{error?"Check the error above.":"Try refreshing or changing your filter."}</div></div>}
      {!loading&&rows.length>0&&<div style={{display:"flex",flexDirection:"column",gap:8}}>{rows.map((r,idx)=>{
        const status=r.Status||"";const st=getStatusStyle(status);
        const name=r.Name||r.Contact||"—";const phone=r.Phone||"—";const email=r.Email||"—";
        const course=r.Course||r["Desired Course"]||"—";const visa=r["Visa status"]||r["Visa Status"]||r.Visa||"—";const loc=r.Location||"—";
        const comments=r.Comments||r["Rafl Comments"]||r["RafI Comments"]||"";
        const assigned=r.Councillor||r["Marketier Assigned"]||r._tab||"";
        const date=r.Date||"";const call2=r["Call Day 2"]||r["2nd call"]||"";const call3=r["Call Day 3"]||r["3rd call"]||"";
        return(<div key={`${r._tab}-${r._rowIndex}-${idx}`} style={{background:C.card,border:`2px solid ${st.border}33`,borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"200px 140px 1fr 160px 140px",gap:10,alignItems:"center"}}>
            <div><div style={{color:C.text,fontWeight:700,fontSize:14}}>{name}</div><div style={{color:C.teal,fontSize:11,marginTop:2,fontFamily:"monospace"}}>{phone}</div>{email!=="—"&&<div style={{color:C.muted,fontSize:10,marginTop:1,wordBreak:"break-all"}}>{email}</div>}</div>
            <div><div style={{color:C.gold,fontSize:12,fontWeight:600}}>{course}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{visa}</div><div style={{color:C.muted,fontSize:11}}>{loc}</div></div>
            <div>{comments&&<div style={{color:C.muted,fontSize:12,lineHeight:1.5,background:C.surface,borderRadius:8,padding:"6px 10px"}}>{comments.slice(0,120)}{comments.length>120?"…":""}</div>}{call2&&<div style={{color:C.blue,fontSize:11,marginTop:4}}>📞 Day 2: {call2.slice(0,60)}</div>}{call3&&<div style={{color:C.purple,fontSize:11,marginTop:2}}>📞 Day 3: {call3.slice(0,60)}</div>}</div>
            <div>{(activeTab==="ALL"||SOURCE_TABS.includes(activeTab))&&assigned&&<div style={{color:avatarClr(assigned),fontWeight:700,fontSize:12,background:avatarClr(assigned)+"22",borderRadius:7,padding:"4px 10px",display:"inline-block"}}>{assigned}</div>}{date&&<div style={{color:C.muted,fontSize:11,marginTop:4}}>📅 {date}</div>}</div>
            <div><div style={{background:st.bg,color:st.color,border:`1px solid ${st.border}`,borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,textAlign:"center"}}>{status||"No Status"}</div></div>
          </div>
        </div>);
      })}</div>}
    </div>
  );
}

function AuthScreen(){
  const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[fullName,setFullName]=useState("");const[loading,setLoading]=useState(false);const[msg,setMsg]=useState({type:"",text:""});
  const handle=async()=>{setLoading(true);setMsg({type:"",text:""});try{if(mode==="login"){const{error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}else if(mode==="signup"){if(!fullName.trim())throw new Error("Please enter your full name.");const{error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName.trim(),role:"agent"}}});if(error)throw error;setMsg({type:"ok",text:"✅ Account created! Check your email to confirm, then log in."});setMode("login");}else{const{error}=await supabase.auth.resetPasswordForEmail(email);if(error)throw error;setMsg({type:"ok",text:"✅ Password reset email sent."});}}catch(e){setMsg({type:"err",text:e.message});}setLoading(false);};
  return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}select option{background:#0C1A2E}`}</style><div style={{width:"100%",maxWidth:420,padding:24}}><div style={{textAlign:"center",marginBottom:36}}><div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${C.gold},#D4600A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>🎓</div><div style={{fontSize:20,fontWeight:900,color:C.text}}>Smartmove Education Group</div><div style={{color:C.muted,fontSize:12,marginTop:4,letterSpacing:0.8}}>TEAM PERFORMANCE PORTAL</div></div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28}}><div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:22}}>{mode==="login"?"Sign In":mode==="signup"?"Create Account":"Reset Password"}</div>{msg.text&&<div style={{background:msg.type==="ok"?C.greenSoft:C.redSoft,border:`1px solid ${msg.type==="ok"?C.green:C.red}44`,borderRadius:10,padding:"10px 14px",color:msg.type==="ok"?C.green:C.red,fontSize:13,marginBottom:18}}>{msg.text}</div>}<div style={{display:"flex",flexDirection:"column",gap:14}}>{mode==="signup"&&<Field label="Full Name" required><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" style={iCss}/></Field>}<Field label="Company Email" required><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@smartmoveedu.com" style={iCss}/></Field>{mode!=="reset"&&<Field label="Password" required><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={iCss} onKeyDown={e=>e.key==="Enter"&&handle()}/></Field>}<button onClick={handle} disabled={loading} style={{background:`linear-gradient(135deg,${C.gold},#D4600A)`,color:"#0A1020",border:"none",borderRadius:11,padding:"13px",fontSize:14,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",marginTop:4,opacity:loading?0.7:1}}>{loading?"Please wait…":mode==="login"?"Sign In →":mode==="signup"?"Create Account →":"Send Reset Email →"}</button></div><div style={{marginTop:18,display:"flex",flexDirection:"column",gap:8,textAlign:"center"}}>{mode==="login"&&<><button onClick={()=>setMode("signup")} style={{background:"none",border:"none",color:C.teal,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Don't have an account? Sign up</button><button onClick={()=>setMode("reset")} style={{background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Forgot password?</button></>}{mode!=="login"&&<button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:C.teal,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back to sign in</button>}</div></div></div></div>);
}

function EntryForm({profile,onSaved}){
  const blank={date:todayISO(),channel:"B2C",lead_source:"",leads_allocated:20,calls_made:"",hours_spent:"",uni_apps:[{university:"",count:1}],lead_outcomes:Array(20).fill(""),blockers:"",follow_ups:"",notes:""};
  const[f,setF]=useState(blank);const[saving,setSaving]=useState(false);const[saved,setSaved]=useState(false);const[err,setErr]=useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const setUniRow=(i,field,val)=>{const u=f.uni_apps.map((r,idx)=>idx===i?{...r,[field]:val}:r);set("uni_apps",u);};
  const setLeadOutcome=(i,val)=>{const o=[...f.lead_outcomes];o[i]=val;set("lead_outcomes",o);};
  const totalApps=f.uni_apps.reduce((s,r)=>s+(parseInt(r.count)||0),0);
  const usedUnis=f.uni_apps.map(r=>r.university).filter(Boolean);
  const callsNum=parseInt(f.calls_made)||0;
  const activeOutcomes=f.lead_outcomes.slice(0,callsNum);
  const filledCount=activeOutcomes.filter(Boolean).length;
  const outcomeCounts={};LEAD_OUTCOMES.forEach(o=>{outcomeCounts[o.id]=activeOutcomes.filter(x=>x===o.id).length;});
  const submit=async()=>{
    if(!f.calls_made)return setErr("Please enter calls made.");
    const validApps=f.uni_apps.filter(r=>r.university&&parseInt(r.count)>0);
    if(!validApps.length)return setErr("Please add at least one application submission.");
    setErr("");setSaving(true);
    const outcomeSummary={};LEAD_OUTCOMES.forEach(o=>{outcomeSummary[o.id]=outcomeCounts[o.id]||0;});
    const{error}=await supabase.from("daily_reports").insert({agent_id:profile.id,agent_name:profile.full_name,date:f.date,channel:f.channel,lead_source:f.lead_source,leads_allocated:parseInt(f.leads_allocated)||20,calls_made:callsNum,hours_spent:parseFloat(f.hours_spent)||null,uni_apps:validApps,applications_submitted:validApps.reduce((s,r)=>s+(parseInt(r.count)||0),0),lead_outcomes:activeOutcomes,outcome_summary:outcomeSummary,blockers:f.blockers||null,follow_ups:f.follow_ups||null,notes:f.notes||null});
    setSaving(false);if(error)return setErr(error.message);
    setF(blank);setSaved(true);setTimeout(()=>setSaved(false),4000);onSaved?.();
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:26}}>
      {err&&<div style={{background:C.redSoft,border:`1px solid ${C.red}44`,borderRadius:10,padding:"10px 14px",color:C.red,fontSize:13}}>⚠ {err}</div>}
      <div style={{background:C.goldSoft,border:`1px solid ${C.gold}33`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}><Avatar name={profile.full_name} size={38}/><div><div style={{color:C.text,fontWeight:700}}>{profile.full_name}</div><div style={{color:C.muted,fontSize:12}}>Submitting as yourself · {fmtDate(f.date)}</div></div></div>
      <div><SHead icon="👤" label="Report Details" color={C.blue}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}><Field label="Date" required><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={iCss}/></Field><Field label="Channel"><select value={f.channel} onChange={e=>set("channel",e.target.value)} style={iCss}>{CHANNELS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Lead Source"><select value={f.lead_source} onChange={e=>set("lead_source",e.target.value)} style={iCss}><option value="">Select source…</option>{LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}</select></Field></div></div>
      <div><SHead icon="📞" label="Call Activity" color={C.teal}/><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}><Field label="Leads Allocated" hint="(target: 20)"><input type="number" min="0" value={f.leads_allocated} onChange={e=>set("leads_allocated",e.target.value)} style={iCss}/></Field><Field label="Calls Made" required><input type="number" min="0" value={f.calls_made} onChange={e=>set("calls_made",e.target.value)} placeholder="e.g. 18" style={iCss}/></Field><Field label="Hours Spent" hint="(target: 4hrs)"><input type="number" min="0" step="0.5" value={f.hours_spent} onChange={e=>set("hours_spent",e.target.value)} placeholder="e.g. 3.5" style={iCss}/></Field></div></div>
      <div><SHead icon="🎯" label="Call Outcomes — Lead by Lead" color={C.gold}/>
        {callsNum>0&&<div style={{marginBottom:14}}><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}><span style={{color:C.muted,fontSize:11,alignSelf:"center"}}>Summary:</span>{LEAD_OUTCOMES.filter(o=>outcomeCounts[o.id]>0).map(o=><span key={o.id} style={{background:o.color+"18",border:`1px solid ${o.color}33`,color:o.color,borderRadius:7,padding:"3px 10px",fontSize:11,fontWeight:700}}>{o.icon} {outcomeCounts[o.id]} {o.label}</span>)}</div><div style={{display:"flex",alignItems:"center",gap:8}}><ProgressBar value={filledCount} max={callsNum} color={filledCount===callsNum?C.green:C.gold}/><span style={{color:filledCount===callsNum?C.green:C.muted,fontSize:11,whiteSpace:"nowrap"}}>{filledCount}/{callsNum} logged {filledCount===callsNum?"✓":""}</span></div></div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{Array.from({length:callsNum},(_,i)=>{const val=f.lead_outcomes[i]||"";const def=LEAD_OUTCOMES.find(o=>o.id===val);return(<div key={i} style={{background:def?def.color+"15":C.surface,border:`1px solid ${def?def.color+"44":C.border}`,borderRadius:10,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,letterSpacing:0.8,marginBottom:6,fontWeight:700}}>LEAD #{i+1}</div><select value={val} onChange={e=>setLeadOutcome(i,e.target.value)} style={{width:"100%",background:"transparent",border:"none",color:def?def.color:C.muted,fontSize:12,fontWeight:def?700:400,outline:"none",cursor:"pointer",fontFamily:"inherit"}}><option value="">— Select —</option>{LEAD_OUTCOMES.map(o=><option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}</select>{def&&<div style={{fontSize:16,marginTop:4}}>{def.icon}</div>}</div>);})}</div>
        {callsNum===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px",border:`1px dashed ${C.border}`,borderRadius:10}}>Enter calls made above to log outcomes for each lead</div>}
      </div>
      <div><SHead icon="🎓" label="Applications" color={C.green}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:C.muted,fontSize:12}}>Total submitted today:</span><span style={{color:totalApps>=1?C.green:C.border,fontWeight:900,fontSize:20}}>{totalApps}</span>{totalApps>=1&&<span style={{color:C.green,fontSize:11}}>✓ Daily target met</span>}</div><button onClick={()=>set("uni_apps",[...f.uni_apps,{university:"",count:1}])} style={{background:C.greenSoft,border:`1px solid ${C.green}44`,color:C.green,borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add University</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{f.uni_apps.map((row,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px auto",gap:10,alignItems:"center",background:C.surface,border:`1px solid ${row.university?C.green+"33":C.border}`,borderRadius:11,padding:"12px 14px"}}><div><div style={{color:C.muted,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>University</div><select value={row.university} onChange={e=>setUniRow(i,"university",e.target.value)} style={{...iCss,background:"transparent",border:"none",padding:0,fontSize:13,fontWeight:600}}><option value="">Select university…</option>{UNIVERSITIES.filter(u=>u==="Other"||u===row.university||!usedUnis.includes(u)).map(u=><option key={u}>{u}</option>)}</select></div><div><div style={{color:C.muted,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>No. of Apps</div><input type="number" min="1" max="20" value={row.count} onChange={e=>setUniRow(i,"count",e.target.value)} style={{...iCss,background:"transparent",border:"none",padding:0,fontSize:18,fontWeight:900,color:C.gold}}/></div><div style={{display:"flex",flexDirection:"column",gap:4}}>{row.university&&<div style={{width:28,height:28,borderRadius:99,background:C.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✓</div>}{f.uni_apps.length>1&&<button onClick={()=>set("uni_apps",f.uni_apps.filter((_,idx)=>idx!==i))} style={{background:C.redSoft,border:"none",color:C.red,borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14}}>✕</button>}</div></div>))}</div>
      </div>
      <div><SHead icon="📝" label="Notes & Follow-Ups" color={C.purple}/><div style={{display:"flex",flexDirection:"column",gap:12}}>{[["Blockers / Issues Today","blockers","System issues…"],["Follow-Up Actions","follow_ups","Students to call back…"],["Daily Highlights","notes","Wins, strong leads…"]].map(([label,key,ph])=>(<Field key={key} label={label}><textarea value={f[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={{...iCss,resize:"vertical",minHeight:key==="notes"?56:68}}/></Field>))}</div></div>
      <button onClick={submit} disabled={saving} style={{background:saved?C.green:`linear-gradient(135deg,${C.gold},#D4600A)`,color:saved?"#fff":"#0A1020",border:"none",borderRadius:12,padding:"15px 28px",fontSize:14.5,fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.3s",opacity:saving?0.7:1}}>{saving?"Saving…":saved?"✅ Report Saved!":"Submit Daily Report →"}</button>
    </div>
  );
}

export default function App(){
  const[session,setSession]=useState(null);const[profile,setProfile]=useState(null);const[profiles,setProfiles]=useState([]);const[reports,setReports]=useState([]);const[tab,setTab]=useState("entry");const[loading,setLoading]=useState(true);
  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>{setSession(session);if(!session)setLoading(false);});const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe();},[]);
  useEffect(()=>{if(!session)return;(async()=>{setLoading(true);const{data:prof}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();setProfile(prof);const{data:profs}=await supabase.from("profiles").select("*").order("full_name");setProfiles(profs||[]);const{data:rpts}=await supabase.from("daily_reports").select("*").order("date",{ascending:false});setReports(rpts||[]);setLoading(false);})();},[session]);
  useEffect(()=>{if(!session)return;const ch=supabase.channel("reports-live").on("postgres_changes",{event:"INSERT",schema:"public",table:"daily_reports"},payload=>{setReports(prev=>[payload.new,...prev]);}).subscribe();return()=>supabase.removeChannel(ch);},[session]);
  const signOut=()=>supabase.auth.signOut();
  const isManager=profile?.role==="manager";
  if(!session)return<AuthScreen/>;
  if(loading||!profile)return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800;900&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}select option{background:#0C1A2E}`}</style><Spinner/></div>);
  const TABS=[...(isManager?[{id:"dashboard",label:"KPI Dashboard",icon:"📊"}]:[]),{id:"entry",label:"Submit Daily Report",icon:"✍️"},{id:"leads",label:"Leads",icon:"📋"},...(isManager?[{id:"log",label:"All Reports",icon:"📊"}]:[]),{id:"myreports",label:"My Reports",icon:"👤"}];
  const myReports=reports.filter(r=>r.agent_id===session.user.id||r.agent_name===profile.full_name);
  const wkStart2=weekStart(todayISO());
  const wkReports=reports.filter(r=>weekStart(r.date)===wkStart2);
  const totalCalls=wkReports.reduce((s,r)=>s+(r.calls_made||0),0);
  const totalApps2=wkReports.reduce((s,r)=>s+(r.applications_submitted||0),0);
  const b2c=wkReports.filter(r=>r.channel==="B2C").length;
  const b2a=wkReports.filter(r=>r.channel==="B2A").length;
  const dt5=[0,1,2,3,4].map(i=>{const dt=new Date(wkStart2);dt.setDate(new Date(wkStart2).getDate()+i);const iso=dt.toISOString().split("T")[0];const dr=wkReports.filter(r=>r.date===iso);return{day:DAY_LABELS[dt.getDay()],calls:dr.reduce((s,r)=>s+(r.calls_made||0),0),apps:dr.reduce((s,r)=>s+(r.applications_submitted||0),0)};});
  const agKPIs=profiles.map(p=>{const ar=wkReports.filter(r=>r.agent_id===p.id||r.agent_name===p.full_name);if(!ar.length)return null;const c=ar.reduce((s,r)=>s+(r.calls_made||0),0);const a=ar.reduce((s,r)=>s+(r.applications_submitted||0),0);const d=ar.length;const cp=Math.round((c/(d*20))*100);const ap=Math.round((a/d)*100);const kpi=Math.round(cp*0.4+Math.min(ap,140)*0.6);return{...p,calls:c,apps:a,days:d,callPct:cp,appPct:ap,kpi};}).filter(Boolean);
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}select option{background:#0C1A2E}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}input:focus,select:focus,textarea:focus{outline:none;border-color:rgba(0,201,192,0.5)!important;box-shadow:0 0 0 3px rgba(0,201,192,0.07)}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1300,margin:"0 auto",padding:"0 28px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:16,paddingBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${C.gold},#D4600A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎓</div><div><div style={{fontSize:17,fontWeight:900,color:C.text}}>Smartmove Education Group</div><div style={{fontSize:10.5,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Team Performance · Daily Reporting</div></div></div>
            <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={profile.full_name} size={30}/><div><div style={{color:C.text,fontSize:13,fontWeight:600}}>{profile.full_name}</div><div style={{color:isManager?C.gold:C.teal,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{isManager?"Manager":"Team Member"}</div></div></div><div style={{width:1,height:28,background:C.border}}/><button onClick={signOut} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button></div>
          </div>
          <div style={{display:"flex",gap:2}}>{TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?C.goldSoft:"transparent",border:`1px solid ${tab===t.id?C.gold+"44":"transparent"}`,borderBottom:"none",color:tab===t.id?C.gold:C.muted,padding:"9px 18px",borderRadius:"9px 9px 0 0",cursor:"pointer",fontSize:12.5,fontWeight:tab===t.id?700:500,fontFamily:"inherit",transition:"all 0.18s"}}>{t.icon} {t.label}</button>))}</div>
        </div>
      </div>
      <div style={{maxWidth:1300,margin:"0 auto",padding:"28px 28px 70px"}}>
        {tab==="dashboard"&&isManager&&(
          <div style={{display:"flex",flexDirection:"column",gap:22}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{[["📞","Total Calls",totalCalls,C.teal],["🎓","Applications",totalApps2,C.green],["📋","Reports",wkReports.length,C.blue],["📈","Conv Rate",totalCalls>0?((totalApps2/totalCalls)*100).toFixed(1)+"%":"0%",C.gold]].map(([icon,label,value,color])=>(<div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/><div style={{fontSize:22,marginBottom:6}}>{icon}</div><div style={{color:C.muted,fontSize:10,letterSpacing:1.2,textTransform:"uppercase",marginBottom:5}}>{label}</div><div style={{color:C.text,fontSize:30,fontWeight:900,lineHeight:1}}>{value}</div></div>))}</div>
            <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:16}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 20px 12px"}}><div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:16}}>Daily Calls vs Applications</div><ResponsiveContainer width="100%" height={190}><BarChart data={dt5} barGap={3}><CartesianGrid strokeDasharray="3 3" stroke={C.faint} vertical={false}/><XAxis dataKey="day" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12}}/><Bar dataKey="calls" name="Calls" fill={C.teal} radius={[4,4,0,0]} opacity={0.85}/><Bar dataKey="apps" name="Applications" fill={C.gold} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 20px 12px"}}><div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>Channel Split</div>{b2c+b2a>0?(<><ResponsiveContainer width="100%" height={140}><PieChart><Pie data={[{name:"B2C",value:b2c},{name:"B2A",value:b2a}]} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">{[C.teal,C.gold].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12}}/></PieChart></ResponsiveContainer>{[["B2C",b2c,C.teal],["B2A",b2a,C.gold]].map(([n,v,c])=>(<div key={n} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:C.muted}}>{n}</span><span style={{color:c,fontWeight:700}}>{b2c+b2a>0?Math.round((v/(b2c+b2a))*100):0}%</span></div>))}</>):<div style={{color:C.muted,fontSize:12,textAlign:"center",marginTop:40}}>No data</div>}</div>
            </div>
            {agKPIs.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}><div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:18}}>Team KPI Scorecard</div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}><thead><tr>{["Team Member","Calls","Apps","Call Rate","App Rate","KPI","Status"].map(h=><th key={h} style={{textAlign:"left",color:C.muted,fontSize:10,letterSpacing:1,textTransform:"uppercase",paddingBottom:12,borderBottom:`1px solid ${C.border}`,paddingRight:16,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{agKPIs.map(m=><tr key={m.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:"13px 16px 13px 0"}}><div style={{display:"flex",alignItems:"center",gap:9}}><Avatar name={m.full_name} size={30}/><span style={{color:C.text,fontWeight:600,fontSize:13}}>{m.full_name}</span></div></td><td style={{padding:"13px 16px 13px 0",color:C.teal,fontWeight:700}}>{m.calls}</td><td style={{padding:"13px 16px 13px 0",color:C.gold,fontWeight:800}}>{m.apps}</td><td style={{padding:"13px 16px 13px 0",minWidth:100}}><div style={{display:"flex",alignItems:"center",gap:6}}><ProgressBar value={m.callPct} color={m.callPct>=90?C.green:m.callPct>=70?C.gold:C.red}/><span style={{fontSize:11,minWidth:30}}>{m.callPct}%</span></div></td><td style={{padding:"13px 16px 13px 0",minWidth:100}}><div style={{display:"flex",alignItems:"center",gap:6}}><ProgressBar value={m.appPct} color={m.appPct>=100?C.green:m.appPct>=60?C.gold:C.red}/><span style={{fontSize:11,minWidth:30}}>{m.appPct}%</span></div></td><td style={{padding:"13px 16px 13px 0"}}><span style={{color:m.kpi>=80?C.green:m.kpi>=60?C.gold:C.red,fontWeight:900,fontSize:16}}>{m.kpi}</span></td><td style={{padding:"13px 0"}}><Tag label={m.kpi>=80?"Exceeding":m.kpi>=60?"On Track":"Below Target"} color={m.kpi>=80?C.green:m.kpi>=60?C.gold:C.red}/></td></tr>)}</tbody></table></div></div>}
          </div>
        )}
        {tab==="entry"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:24,alignItems:"start"}}><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}><div style={{marginBottom:22}}><div style={{fontSize:19,fontWeight:900,color:C.text}}>Daily Task Report</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>Submit by end of day. Your name is automatically attached.</div></div><EntryForm profile={profile} onSaved={()=>setTab("myreports")}/></div><div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{background:C.card,border:`1px solid ${C.gold}33`,borderRadius:16,padding:20}}><div style={{color:C.gold,fontWeight:700,fontSize:12,letterSpacing:0.8,marginBottom:14}}>📌 DAILY TARGETS</div>{[["📋 Leads Allocated","20 per day"],["📞 Calling Hours","4 hrs minimum"],["🎓 Applications","1 minimum/day"],["⏰ Report Deadline","End of business"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><span style={{color:C.muted}}>{l}</span><span style={{color:C.gold,fontWeight:700}}>{v}</span></div>))}</div></div></div>)}
        {tab==="leads"&&<LeadsView profile={profile} isManager={isManager}/>}
        {tab==="myreports"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",background:C.card,border:`1px solid ${C.border}`,borderRadius:14}}><Avatar name={profile.full_name} size={44}/><div><div style={{fontWeight:800,fontSize:17,color:C.text}}>{profile.full_name}</div><div style={{color:C.muted,fontSize:12}}>{myReports.length} reports submitted</div></div><div style={{marginLeft:"auto",display:"flex",gap:20}}>{[["Calls",myReports.reduce((s,r)=>s+(r.calls_made||0),0),C.teal],["Apps",myReports.reduce((s,r)=>s+(r.applications_submitted||0),0),C.gold]].map(([l,v,c])=>(<div key={l} style={{textAlign:"center"}}><div style={{color:c,fontWeight:900,fontSize:22}}>{v}</div><div style={{color:C.muted,fontSize:10,letterSpacing:0.8}}>{l.toUpperCase()}</div></div>))}</div></div>{myReports.length===0&&<div style={{color:C.muted,textAlign:"center",padding:"50px 0"}}>No reports yet. Submit your first daily report!</div>}{myReports.map(r=>{const apps=r.applications_submitted||0;return(<div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"130px 1fr 1fr 1fr auto",alignItems:"center",gap:12,padding:"14px 18px"}}><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{fmtDate(r.date)}</div><div style={{color:r.channel==="B2C"?C.teal:C.gold,fontSize:11,fontWeight:700,marginTop:3}}>{r.channel}</div></div><div><div style={{color:C.muted,fontSize:10,textTransform:"uppercase"}}>Calls</div><div style={{color:C.teal,fontWeight:700,fontSize:16}}>{r.calls_made||"—"}<span style={{color:C.muted,fontSize:11}}>/{r.leads_allocated}</span></div></div><div><div style={{color:C.muted,fontSize:10,textTransform:"uppercase"}}>Applications</div><div style={{color:apps>=1?C.gold:C.red,fontWeight:800,fontSize:16}}>{apps}</div>{r.uni_apps?.map((u,i)=><div key={i} style={{fontSize:10,color:C.muted}}><span style={{color:C.gold,fontWeight:700}}>{u.count}</span> × {u.university}</div>)}</div><div><div style={{color:C.muted,fontSize:10,textTransform:"uppercase"}}>Hours</div><div style={{color:C.text,fontSize:14}}>{r.hours_spent||"—"}h</div></div><Tag label={apps>=1?"Target Met":"Below Target"} color={apps>=1?C.green:C.red}/></div></div>);})}</div>)}
        {tab==="log"&&isManager&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{color:C.text,fontWeight:700,fontSize:16}}>All Reports <span style={{color:C.muted,fontWeight:400,fontSize:13}}>({reports.length} total)</span></div>{reports.map(r=>{const apps=r.applications_submitted||0;return(<div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px"}}><div style={{display:"grid",gridTemplateColumns:"170px 1fr 80px 80px 100px",alignItems:"center",gap:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={r.agent_name} size={28}/><span style={{color:C.text,fontSize:12.5,fontWeight:600}}>{r.agent_name}</span></div><div style={{color:C.muted,fontSize:12}}>{fmtDate(r.date)} · <span style={{color:r.channel==="B2C"?C.teal:C.gold}}>{r.channel}</span></div><div style={{color:C.teal,fontWeight:700,fontSize:13}}>📞 {r.calls_made||0}</div><div style={{color:apps>=1?C.gold:C.red,fontWeight:700,fontSize:13}}>🎓 {apps}</div><Tag label={apps>=1?"Target Met":"Below Target"} color={apps>=1?C.green:C.red}/></div></div>);})}</div>)}
      </div>
    </div>
  );
}
