const loadAll = async () => {
    setLoading(true); setError("");
    try {
      const url = `https://docs.google.com/spreadsheets/d/185jtGeHdyihieh2cDqYby8pPrrVN7edsw9t4i7kn6ts/export?format=csv&gid=0`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);
      const splitLine = line => { const r=[]; let c=""; let q=false; for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){r.push(c.trim());c="";}else c+=ch;} r.push(c.trim()); return r; };
      const headers = splitLine(lines[0]);
      const rows = lines.slice(1).map((l,i)=>{ const v=splitLine(l); const o={_rowIndex:i+2}; headers.forEach((h,j)=>{o[h]=(v[j]||"").trim();}); return o; }).filter(r=>Object.entries(r).filter(([k])=>k!=='_rowIndex').some(([,v])=>v));
      const assignedCol = headers.find(h=>["councillor","marketing office","marketier assigned"].includes(h.toLowerCase().trim()))||null;
      const grouped = {}; ALL_MEMBERS.forEach(m=>{grouped[m]=[];}); grouped["Unassigned"]=[];
      rows.forEach(row=>{ const raw=assignedCol?(row[assignedCol]||""):""; const match=ALL_MEMBERS.find(m=>raw.trim().toLowerCase()===m.toLowerCase()||raw.trim().toLowerCase().startsWith(m.toLowerCase())); if(match)grouped[match].push(row); else grouped["Unassigned"].push(row); });
      setData({...grouped,"XELM":[],"Phoenix Leads":[]});
      setLastRefresh(new Date());
    } catch (e) { setError("Could not load leads: " + e.message); }
    setLoading(false);
  };
