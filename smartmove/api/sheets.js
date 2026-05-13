// api/sheets.js — Vercel Serverless Function
// Handles all Google Sheets API calls server-side so credentials stay private

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Get JWT access token from service account ─────────────────────────────────
async function getAccessToken() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Build JWT — header.payload.signature
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header  = b64({ alg: "RS256", typ: "JWT" });
  const payload = b64(claim);
  const unsigned = `${header}.${payload}`;

  // Sign with private key using Node crypto
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const sig = sign.sign(creds.private_key, "base64url");
  const jwt = `${unsigned}.${sig}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get access token: " + JSON.stringify(data));
  return data.access_token;
}

// ── Read a sheet tab ──────────────────────────────────────────────────────────
async function readSheet(token, tabName, range = "A1:Z1000") {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName + "!" + range)}`;
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.values || [];
}

// ── Write to a sheet cell ─────────────────────────────────────────────────────
async function writeCell(token, tabName, cellRange, value) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName + "!" + cellRange)}?valueInputOption=USER_ENTERED`;
  const res  = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[value]] }),
  });
  return res.json();
}

// ── Parse rows into objects using header row ───────────────────────────────────
function parseRows(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0].map(h => (h||"").trim());
  return values.slice(1).map((row, rowIdx) => {
    const obj = { _rowIndex: rowIdx + 2 }; // 1-based, +1 for header
    headers.forEach((h, i) => { obj[h] = (row[i] || "").trim(); });
    return obj;
  }).filter(r => Object.values(r).some(v => v && v !== "" ));
}

// ── Tab configs — columns per sheet ──────────────────────────────────────────
// Team member tabs: Date, Status, Name, Phone, Email, Visa status, Course, Location, University, Comments, Call Day 2, Call Day 3
// Phoenix Leads:   Date, Councillor, Name, Phone, Email, Course, Visa, Location, Status, Call Day 2, Call Day 3
// XELM:            Contact, Phone, Email, Desired Course, Rafl Comments, Marketier Assigned, 2nd call, 3rd call, Comments

const TEAM_TABS   = ["Amir", "Kinza", "Mubarak", "Nourin", "Mahbuba", "Tanya"];
const SOURCE_TABS = ["Phoenix Leads", "XELM"];
const ALL_TABS    = [...TEAM_TABS, ...SOURCE_TABS];

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { action, tab, rowIndex, field, value } = req.method === "POST"
      ? req.body
      : req.query;

    const token = await getAccessToken();

    // ── GET: read one tab ──────────────────────────────────────────────────
    if (action === "getTab") {
      if (!ALL_TABS.includes(tab)) {
        return res.status(400).json({ error: `Unknown tab: ${tab}` });
      }
      const values = await readSheet(token, tab);
      const rows   = parseRows(values);
      return res.status(200).json({ tab, rows, total: rows.length });
    }

    // ── GET: read ALL team tabs at once ────────────────────────────────────
    if (action === "getAllTeamTabs") {
      const results = {};
      for (const t of TEAM_TABS) {
        try {
          const values   = await readSheet(token, t);
          results[t]     = parseRows(values);
        } catch (e) {
          results[t] = [];
        }
      }
      return res.status(200).json({ tabs: results });
    }

    // ── GET: read source lead tabs ─────────────────────────────────────────
    if (action === "getSourceTabs") {
      const results = {};
      for (const t of SOURCE_TABS) {
        try {
          const values = await readSheet(token, t);
          results[t]   = parseRows(values);
        } catch (e) {
          results[t] = [];
        }
      }
      return res.status(200).json({ tabs: results });
    }

    // ── POST: update a cell (write outcome back) ───────────────────────────
    if (action === "updateCell" && req.method === "POST") {
      if (!TEAM_TABS.includes(tab)) {
        return res.status(400).json({ error: "Can only write to team tabs" });
      }
      // Find the column letter for the field
      const values  = await readSheet(token, tab, "1:1");
      const headers = (values[0] || []).map(h => (h||"").trim());
      const colIdx  = headers.findIndex(h => h.toLowerCase() === (field||"").toLowerCase());
      if (colIdx === -1) return res.status(400).json({ error: `Column "${field}" not found` });
      const colLetter = String.fromCharCode(65 + colIdx);
      const cellRange = `${colLetter}${rowIndex}`;
      await writeCell(token, tab, cellRange, value);
      return res.status(200).json({ ok: true, tab, cell: cellRange, value });
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (err) {
    console.error("Sheets API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
