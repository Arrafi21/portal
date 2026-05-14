const SHEET_ID = "185jtGeHdyihieh2cDqYby8pPrrVN7edsw9t4i7kn6ts";
const XELM_ID  = "1C1ElshfhSbodvgWqSBIbPXP8lxlfyLSMONp0cMo3k0M";
const ALL_MEMBERS = ["Amir","Kinza","Mubarak","Nourin","Mahbuba","Tanya"];

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action } = req.method === "POST" ? req.body : req.query;

  try {
    if (action === "getAllTeamTabs") {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
      const { headers, rows } = parseCSV(await response.text());
      const assignedCol = headers.find(h =>
        ["councillor","marketing office","marketier assigned","assigned","agent"]
          .includes(h.toLowerCase().trim())
      ) || null;
      const grouped = {};
      ALL_MEMBERS.forEach(m => { grouped[m] = []; });
      grouped["Unassigned"] = [];
      rows.forEach(row => {
        const raw = assignedCol ? (row[assignedCol] || "") : "";
        const match = ALL_MEMBERS.find(m =>
          raw.trim().toLowerCase() === m.toLowerCase() ||
          raw.trim().toLowerCase().startsWith(m.toLowerCase())
        );
        if (match) grouped[match].push(row);
        else grouped["Unassigned"].push(row);
      });
      return res.status(200).json({ tabs: grouped, headers, total: rows.length });
    }

    if (action === "getSourceTabs") {
      const results = {};
      try {
        const url = `https://docs.google.com/spreadsheets/d/${XELM_ID}/export?format=csv&gid=0`;
        const r = await fetch(url);
        results["XELM"] = r.ok ? parseCSV(await r.text()).rows : [];
      } catch(e) { results["XELM"] = []; }
      results["Phoenix Leads"] = [];
      return res.status(200).json({ tabs: results });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
