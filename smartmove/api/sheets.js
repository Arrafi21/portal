// api/sheets.js — Uses Google Sheets public CSV export (no API key needed)
// Works because sheet is shared as "Anyone with the link"

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const XELM_ID  = process.env.GOOGLE_XELM_SHEET_ID;
const ALL_MEMBERS = ["Amir","Kinza","Mubarak","Nourin","Mahbuba","Tanya"];

// Fetch sheet as CSV and parse it
async function fetchSheetCSV(sheetId, gid = "0") {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res  = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current  = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim()); current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows    = lines.slice(1).map((line, i) => {
    const vals = parseRow(line);
    const obj  = { _rowIndex: i + 2 };
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").trim(); });
    return obj;
  }).filter(r =>
    Object.entries(r).filter(([k]) => k !== "_rowIndex").some(([, v]) => v !== "")
  );

  return { headers, rows };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SHEET_ID) return res.status(500).json({ error: "GOOGLE_SHEET_ID env var missing" });

  try {
    const params = req.method === "POST" ? req.body : req.query;
    const { action } = params;

    // ── Read all team leads from main sheet ───────────────────────────────
    if (action === "getAllTeamTabs") {
      const { headers, rows } = await fetchSheetCSV(SHEET_ID, "0");

      // Find the assigned-to column
      const assignedCol = headers.find(h =>
        ["councillor","marketing office","marketier assigned","assigned","agent"]
          .includes(h.toLowerCase())
      ) || null;

      // Group rows by team member name
      const grouped = {};
      ALL_MEMBERS.forEach(m => { grouped[m] = []; });
      grouped["Unassigned"] = [];

      rows.forEach(row => {
        const raw   = assignedCol ? (row[assignedCol] || "") : "";
        const match = ALL_MEMBERS.find(m =>
          raw.trim().toLowerCase() === m.toLowerCase() ||
          raw.trim().toLowerCase().startsWith(m.toLowerCase())
        );
        if (match) grouped[match].push(row);
        else       grouped["Unassigned"].push(row);
      });

      return res.status(200).json({ tabs: grouped, headers, total: rows.length });
    }

    // ── Read XELM + Phoenix Leads ─────────────────────────────────────────
    if (action === "getSourceTabs") {
      const results = {};

      // XELM — separate sheet
      if (XELM_ID) {
        try {
          const { rows } = await fetchSheetCSV(XELM_ID, "0");
          results["XELM"] = rows;
        } catch(e) {
          results["XELM"] = [];
        }
      } else {
        results["XELM"] = [];
      }

      // Phoenix Leads — try gid=1 (second tab) or gid=2
      // Try common gids for Phoenix Leads tab
      let found = false;
      for (const gid of ["1","2","3","4","5","6"]) {
        try {
          const { headers, rows } = await fetchSheetCSV(SHEET_ID, gid);
          // Check if this looks like a Phoenix Leads tab
          if (rows.length > 0 && headers.some(h =>
            ["councillor","name","contact","status"].includes(h.toLowerCase())
          )) {
            results["Phoenix Leads"] = rows;
            found = true;
            break;
          }
        } catch(e) { /* try next gid */ }
      }
      if (!found) results["Phoenix Leads"] = [];

      return res.status(200).json({ tabs: results });
    }

    // ── Write not supported without service account ───────────────────────
    if (action === "updateCell") {
      return res.status(200).json({
        ok:      false,
        message: "Write-back requires service account — reads are working via CSV export"
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("Sheets error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
