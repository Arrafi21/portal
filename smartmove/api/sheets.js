// api/sheets.js — Vercel Serverless Function
// Single sheet "Arrafi_leads 2026" filtered by Councillor column

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is missing");
  const creds = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: creds.client_email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = b64({ alg: "RS256", typ: "JWT" });
  const payload = b64(claim);
  const unsigned = `${header}.${payload}`;
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const sig = sign.sign(creds.private_key, "base64url");
  const jwt = `${unsigned}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

async function readRange(token, sheetId, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.error) throw new Error(`Sheets API: ${data.error.message}`);
  return data.values || [];
}

async function writeCell(token, sheetId, range, value) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[value]] }),
  });
  return res.json();
}

function parseRows(values) {
  if (!values || values.length < 2) return { headers: [], rows: [] };
  const headers = values[0].map(h => (h || "").trim());
  const rows = values.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, idx) => { obj[h] = (row[idx] || "").trim(); });
    return obj;
  }).filter(r => Object.entries(r).filter(([k]) => k !== "_rowIndex").some(([, v]) => v !== ""));
  return { headers, rows };
}

const ALL_MEMBERS = ["Amir", "Kinza", "Mubarak", "Nourin", "Mahbuba", "Tanya"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const params = req.method === "POST" ? req.body : req.query;
    const { action, rowIndex, value } = params;
    const token = await getAccessToken();

    if (action === "getAllTeamTabs") {
      const values = await readRange(token, SHEET_ID, "A:Z");
      const { headers, rows } = parseRows(values);

      // Find the column that holds the team member name
      const assignedCol = headers.find(h =>
        ["councillor","marketing office","marketier assigned","assigned","agent"].includes(h.toLowerCase())
      ) || null;

      // Group rows by team member
      const grouped = {};
      ALL_MEMBERS.forEach(m => { grouped[m] = []; });
      grouped["Unassigned"] = [];

      rows.forEach(row => {
        const raw = assignedCol ? (row[assignedCol] || "") : "";
        const match = ALL_MEMBERS.find(m => raw.toLowerCase().startsWith(m.toLowerCase()));
        if (match) grouped[match].push(row);
        else grouped["Unassigned"].push(row);
      });

      return res.status(200).json({ tabs: grouped, headers, total: rows.length });
    }

    if (action === "getSourceTabs") {
      const results = {};
      // Try XELM as a separate sheet if env var set
      const xelmId = process.env.GOOGLE_XELM_SHEET_ID;
      if (xelmId) {
        try {
          const vals = await readRange(token, xelmId, "A:Z");
          results["XELM"] = parseRows(vals).rows;
        } catch { results["XELM"] = []; }
      } else {
        results["XELM"] = [];
      }
      // Phoenix Leads tab
      try {
        const vals = await readRange(token, SHEET_ID, "Phoenix Leads!A:Z");
        results["Phoenix Leads"] = parseRows(vals).rows;
      } catch { results["Phoenix Leads"] = []; }
      return res.status(200).json({ tabs: results });
    }

    if (action === "updateCell" && req.method === "POST") {
      if (!rowIndex || !value) return res.status(400).json({ error: "rowIndex and value required" });
      const headerRow = await readRange(token, SHEET_ID, "1:1");
      const headers = (headerRow[0] || []).map(h => (h || "").trim());
      const statusIdx = headers.findIndex(h => h.toLowerCase() === "status");
      if (statusIdx === -1) return res.status(400).json({ error: "Status column not found" });
      const col = String.fromCharCode(65 + statusIdx);
      await writeCell(token, SHEET_ID, `${col}${rowIndex}`, value);
      return res.status(200).json({ ok: true, cell: `${col}${rowIndex}`, value });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("Sheets error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
