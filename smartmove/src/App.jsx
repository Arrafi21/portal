import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://pndxwrkxwknwtwkilyxv.supabase.co";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_F84YeHO7BdQQoNTtnmc_jA_lKYhVG4-";
const supabase      = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#07101F", surface: "#0C1A2E", card: "#101F35",
  border: "rgba(255,255,255,0.07)", borderAct: "rgba(245,166,35,0.45)",
  gold: "#F5A623", goldSoft: "rgba(245,166,35,0.12)",
  teal: "#00C9C0", tealSoft: "rgba(0,201,192,0.12)",
  green: "#10C98A", greenSoft: "rgba(16,201,138,0.12)",
  red: "#FF4F6A",  redSoft: "rgba(255,79,106,0.12)",
  blue: "#3D8EFF", purple: "#9B6EFF",
  text: "#EAF1FA", muted: "#6B82A0", faint: "#2A3F58",
};
const AVATAR_COLORS = [C.teal, C.gold, C.purple, C.blue, C.green, "#FF8A65", "#EC407A", "#26C6DA"];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const LEAD_SOURCES = ["Facebook Ads","Instagram Ads","TikTok Ads","Google Ads","Agent Referral","Student Referral","Old Students","Walk-In","Other"];
const UNIVERSITIES = ["University of Sunderland","University of Wolverhampton","ARU London","London Metropolitan University","Arden University","University of Wales Trinity Saint David","University of the West of Scotland","London School of Commerce","BPP University","LCCA","Other"];
const LEAD_OUTCOMES = [
  { id: "no_answer",    label: "No Answer",          icon: "📵", color: "#6B82A0" },
  { id: "voicemail",    label: "Voicemail Left",      icon: "📨", color: "#6B82A0" },
  { id: "wrong_number", label: "Wrong Number",        icon: "❌", color: "#FF4F6A" },
  { id: "not_eligible", label: "Not Eligible",        icon: "🚫", color: "#FF4F6A" },
  { id: "declined",     label: "Not Interested",      icon: "👎", color: "#FF8A65" },
  { id: "callback",     label: "Call Back Requested", icon: "🔄", color: "#F5A623" },
  { id: "interested",   label: "Interested",          icon: "✅", color: "#00C9C0" },
  { id: "app_started",  label: "Application Started", icon: "📝", color: "#3D8EFF" },
  { id: "app_submitted",label: "App Submitted",       icon: "🎓", color: "#10C98A" },
  { id: "duplicate",    label: "Duplicate Lead",      icon: "♻️", color: "#9B6EFF" },
  { id: "no_show",      label: "No Show / Ghosted",   icon: "👻", color: "#6B82A0" },
  { id: "language",     label: "Language Barrier",    icon: "🌐", color: "#FF8A65" },
];
const CHANNELS   = ["B2C", "B2A"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO  = () => new Date().toISOString().split("T")[0];
const fmtDate   = d => { if (!d) return "—"; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const weekStart = d => { const dt = new Date(d); dt.setDate(dt.getDate() - dt.getDay() + 1); return dt.toISOString().split("T")[0]; };
const initials  = n => n.trim().split(" ").map(w => w[0]?.toUpperCase()).join("").slice(0,2);
const avatarClr = n => AVATAR_COLORS[(n.charCodeAt(0)+(n.charCodeAt(1)||0)) % AVATAR_COLORS.length];

// ─── TINY UI COMPONENTS ───────────────────────────────────────────────────────
const Avatar = ({ name, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: 99, flexShrink: 0, background: avatarClr(name)+"22", border: `1.5px solid ${avatarClr(name)}55`, display: "flex", alignItems: "center", justifyContent: "center", color: avatarClr(name), fontWeight: 800, fontSize: size * 0.38 }}>
    {initials(name)}
  </div>
);
const Tag = ({ label, color }) => (
  <span style={{ background: color+"18", color, border: `1px solid ${color}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{label}</span>
);
const ProgressBar = ({ value, max = 100, color = C.teal, height = 5 }) => (
  <div style={{ height, background: C.faint, borderRadius: 99, overflow: "hidden", flexGrow: 1 }}>
    <div style={{ height: "100%", borderRadius: 99, transition: "width 0.6s ease", width: `${Math.min(100,(value/max)*100)}%`, background: color }} />
  </div>
);
const Field = ({ label, required, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ color: C.muted, fontSize: 10.5, letterSpacing: 1.1, textTransform: "uppercase", display: "flex", gap: 6, alignItems: "center" }}>
      {label} {required && <span style={{ color: C.gold }}>*</span>} {hint && <span style={{ color: C.faint, textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
    </label>
    {children}
  </div>
);
const SHead = ({ icon, label, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, color, fontWeight: 700, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
    {icon} {label}
  </div>
);
const iCss = {
  width: "100%", background: "#0C1A2E", border: `1px solid rgba(255,255,255,0.07)`,
  borderRadius: 10, padding: "10px 13px", color: "#EAF1FA", fontSize: 13.5,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s",
};
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.faint}`, borderTopColor: C.gold, borderRadius: 99, animation: "spin 0.8s linear infinite" }} />
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode,     setMode    ] = useState("login"); // login | signup | reset
  const [email,    setEmail   ] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading,  setLoading ] = useState(false);
  const [msg,      setMsg     ] = useState({ type: "", text: "" });

  const handle = async () => {
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        if (!fullName.trim()) throw new Error("Please enter your full name.");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName.trim(), role: "agent" } }
        });
        if (error) throw error;
        setMsg({ type: "ok", text: "✅ Account created! Check your email to confirm, then log in." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg({ type: "ok", text: "✅ Password reset email sent. Check your inbox." });
      }
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap'); * { box-sizing: border-box; margin:0; padding:0; } @keyframes spin { to { transform: rotate(360deg); } } select option { background: #0C1A2E; } input:focus, select:focus { outline: none; border-color: rgba(0,201,192,0.5) !important; box-shadow: 0 0 0 3px rgba(0,201,192,0.07); }`}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.gold}, #D4600A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🎓</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Smartmove Education Group</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4, letterSpacing: 0.8 }}>TEAM PERFORMANCE PORTAL</div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 22 }}>
            {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
          </div>

          {msg.text && (
            <div style={{ background: msg.type === "ok" ? C.greenSoft : C.redSoft, border: `1px solid ${msg.type === "ok" ? C.green : C.red}44`, borderRadius: 10, padding: "10px 14px", color: msg.type === "ok" ? C.green : C.red, fontSize: 13, marginBottom: 18 }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <Field label="Full Name" required>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" style={iCss} />
              </Field>
            )}
            <Field label="Company Email" required>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@smartmoveedu.com" style={iCss} />
            </Field>
            {mode !== "reset" && (
              <Field label="Password" required>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={iCss} onKeyDown={e => e.key === "Enter" && handle()} />
              </Field>
            )}

            <button onClick={handle} disabled={loading} style={{ background: `linear-gradient(135deg, ${C.gold}, #D4600A)`, color: "#0A1020", border: "none", borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : mode === "signup" ? "Create Account →" : "Send Reset Email →"}
            </button>
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            {mode === "login" && <>
              <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: C.teal, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Don't have an account? Sign up</button>
              <button onClick={() => setMode("reset")} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Forgot password?</button>
            </>}
            {mode !== "login" && (
              <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: C.teal, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Back to sign in</button>
            )}
          </div>
        </div>
        <div style={{ color: C.faint, fontSize: 11, textAlign: "center", marginTop: 20 }}>Secured by Supabase Auth · Data encrypted at rest</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DAILY ENTRY FORM
// ══════════════════════════════════════════════════════════════════════════════
function EntryForm({ profile, onSaved }) {
  const blank = {
    date: todayISO(), channel: "B2C", lead_source: "",
    leads_allocated: 20, calls_made: "", hours_spent: "",
    uni_apps: [{ university: "", count: 1 }],
    lead_outcomes: Array(20).fill(""),
    blockers: "", follow_ups: "", notes: "",
  };
  const [f, setF]     = useState(blank);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved ] = useState(false);
  const [err,    setErr   ] = useState("");

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setUniRow = (i, field, val) => {
    const u = f.uni_apps.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    set("uni_apps", u);
  };
  const setLeadOutcome = (i, val) => {
    const o = [...f.lead_outcomes]; o[i] = val; set("lead_outcomes", o);
  };

  const totalApps  = f.uni_apps.reduce((s, r) => s + (parseInt(r.count)||0), 0);
  const usedUnis   = f.uni_apps.map(r => r.university).filter(Boolean);
  const callsNum   = parseInt(f.calls_made) || 0;
  const activeOutcomes = f.lead_outcomes.slice(0, callsNum);
  const filledCount    = activeOutcomes.filter(Boolean).length;
  const outcomeCounts  = {};
  LEAD_OUTCOMES.forEach(o => { outcomeCounts[o.id] = activeOutcomes.filter(x => x === o.id).length; });

  const submit = async () => {
    if (!f.calls_made) return setErr("Please enter calls made.");
    const validApps = f.uni_apps.filter(r => r.university && parseInt(r.count) > 0);
    if (!validApps.length) return setErr("Please add at least one application submission.");
    setErr(""); setSaving(true);
    const outcomeSummary = {};
    LEAD_OUTCOMES.forEach(o => { outcomeSummary[o.id] = outcomeCounts[o.id] || 0; });
    const { error } = await supabase.from("daily_reports").insert({
      agent_id: profile.id,
      agent_name: profile.full_name,
      date: f.date,
      channel: f.channel,
      lead_source: f.lead_source,
      leads_allocated: parseInt(f.leads_allocated) || 20,
      calls_made: callsNum,
      hours_spent: parseFloat(f.hours_spent) || null,
      uni_apps: validApps,
      applications_submitted: validApps.reduce((s, r) => s + (parseInt(r.count)||0), 0),
      lead_outcomes: activeOutcomes,
      outcome_summary: outcomeSummary,
      blockers: f.blockers || null,
      follow_ups: f.follow_ups || null,
      notes: f.notes || null,
    });
    setSaving(false);
    if (error) return setErr(error.message);
    setF(blank); setSaved(true);
    setTimeout(() => setSaved(false), 4000);
    onSaved?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {err && <div style={{ background: C.redSoft, border: `1px solid ${C.red}44`, borderRadius: 10, padding: "10px 14px", color: C.red, fontSize: 13 }}>⚠ {err}</div>}

      {/* WHO */}
      <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={profile.full_name} size={38} />
        <div>
          <div style={{ color: C.text, fontWeight: 700 }}>{profile.full_name}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>Submitting as yourself · {fmtDate(f.date)}</div>
        </div>
      </div>

      {/* DATE & CHANNEL */}
      <div>
        <SHead icon="👤" label="Report Details" color={C.blue} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Field label="Date" required>
            <input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={iCss} />
          </Field>
          <Field label="Channel">
            <select value={f.channel} onChange={e => set("channel", e.target.value)} style={iCss}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Lead Source">
            <select value={f.lead_source} onChange={e => set("lead_source", e.target.value)} style={iCss}>
              <option value="">Select source…</option>
              {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* CALLS */}
      <div>
        <SHead icon="📞" label="Call Activity" color={C.teal} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <Field label="Leads Allocated" hint="(target: 20)">
            <input type="number" min="0" value={f.leads_allocated} onChange={e => set("leads_allocated", e.target.value)} style={iCss} />
          </Field>
          <Field label="Calls Made" required>
            <input type="number" min="0" value={f.calls_made} onChange={e => set("calls_made", e.target.value)} placeholder="e.g. 18" style={iCss} />
          </Field>
          <Field label="Hours Spent" hint="(target: 4hrs)">
            <input type="number" min="0" step="0.5" value={f.hours_spent} onChange={e => set("hours_spent", e.target.value)} placeholder="e.g. 3.5" style={iCss} />
          </Field>
        </div>
      </div>

      {/* LEAD OUTCOMES — per lead */}
      <div>
        <SHead icon="🎯" label="Call Outcomes — Lead by Lead" color={C.gold} />
        {callsNum > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              <span style={{ color: C.muted, fontSize: 11, alignSelf: "center" }}>Summary:</span>
              {LEAD_OUTCOMES.filter(o => outcomeCounts[o.id] > 0).map(o => (
                <span key={o.id} style={{ background: o.color+"18", border: `1px solid ${o.color}33`, color: o.color, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {o.icon} {outcomeCounts[o.id]} {o.label}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ProgressBar value={filledCount} max={callsNum} color={filledCount === callsNum ? C.green : C.gold} />
              <span style={{ color: filledCount === callsNum ? C.green : C.muted, fontSize: 11, whiteSpace: "nowrap" }}>
                {filledCount}/{callsNum} logged {filledCount === callsNum ? "✓" : ""}
              </span>
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Array.from({ length: callsNum }, (_, i) => {
            const val = f.lead_outcomes[i] || "";
            const def = LEAD_OUTCOMES.find(o => o.id === val);
            return (
              <div key={i} style={{ background: def ? def.color+"15" : C.surface, border: `1px solid ${def ? def.color+"44" : C.border}`, borderRadius: 10, padding: "10px 12px", transition: "all 0.15s" }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 0.8, marginBottom: 6, fontWeight: 700 }}>LEAD #{i+1}</div>
                <select value={val} onChange={e => setLeadOutcome(i, e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", color: def ? def.color : C.muted, fontSize: 12, fontWeight: def ? 700 : 400, outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <option value="">— Select —</option>
                  {LEAD_OUTCOMES.map(o => <option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}
                </select>
                {def && <div style={{ fontSize: 16, marginTop: 4 }}>{def.icon}</div>}
              </div>
            );
          })}
        </div>
        {callsNum === 0 && (
          <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px", border: `1px dashed ${C.border}`, borderRadius: 10 }}>
            Enter calls made above to log outcomes for each lead
          </div>
        )}
      </div>

      {/* APPLICATIONS */}
      <div>
        <SHead icon="🎓" label="Applications" color={C.green} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: C.muted, fontSize: 12 }}>Total submitted today:</span>
            <span style={{ color: totalApps >= 1 ? C.green : totalApps === 0 ? C.border : C.red, fontWeight: 900, fontSize: 20 }}>{totalApps}</span>
            {totalApps >= 1 && <span style={{ color: C.green, fontSize: 11 }}>✓ Daily target met</span>}
          </div>
          <button onClick={() => set("uni_apps", [...f.uni_apps, { university: "", count: 1 }])}
            style={{ background: C.greenSoft, border: `1px solid ${C.green}44`, color: C.green, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Add University
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {f.uni_apps.map((row, i) => {
            const def = LEAD_OUTCOMES.find(o => o.id === "app_submitted");
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "center", background: C.surface, border: `1px solid ${row.university ? C.green+"33" : C.border}`, borderRadius: 11, padding: "12px 14px" }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>University</div>
                  <select value={row.university} onChange={e => setUniRow(i, "university", e.target.value)}
                    style={{ ...iCss, background: "transparent", border: "none", padding: 0, fontSize: 13, fontWeight: 600 }}>
                    <option value="">Select university…</option>
                    {UNIVERSITIES.filter(u => u === "Other" || u === row.university || !usedUnis.includes(u)).map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>No. of Apps</div>
                  <input type="number" min="1" max="20" value={row.count} onChange={e => setUniRow(i, "count", e.target.value)}
                    style={{ ...iCss, background: "transparent", border: "none", padding: 0, fontSize: 18, fontWeight: 900, color: C.gold }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {row.university && <div style={{ width: 28, height: 28, borderRadius: 99, background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✓</div>}
                  {f.uni_apps.length > 1 && (
                    <button onClick={() => set("uni_apps", f.uni_apps.filter((_,idx) => idx !== i))}
                      style={{ background: C.redSoft, border: "none", color: C.red, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {f.uni_apps.some(r => r.university) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {f.uni_apps.filter(r => r.university).map((r, i) => (
              <div key={i} style={{ background: C.greenSoft, border: `1px solid ${C.green}33`, borderRadius: 8, padding: "4px 12px", fontSize: 12, color: C.green, display: "flex", gap: 6 }}>
                <span style={{ fontWeight: 700 }}>{r.count}</span>
                <span style={{ color: C.muted }}>×</span>
                <span>{r.university}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NOTES */}
      <div>
        <SHead icon="📝" label="Notes & Follow-Ups" color={C.purple} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["Blockers / Issues Today","blockers","System issues, bad leads, difficult conversations…"],
            ["Follow-Up Actions","follow_ups","Students to call back, docs awaited…"],
            ["Daily Highlights","notes","Wins, strong leads, any notable moments…"]].map(([label, key, ph]) => (
            <Field key={key} label={label}>
              <textarea value={f[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                style={{ ...iCss, resize: "vertical", minHeight: key === "notes" ? 56 : 68 }} />
            </Field>
          ))}
        </div>
      </div>

      <button onClick={submit} disabled={saving} style={{
        background: saved ? C.green : `linear-gradient(135deg, ${C.gold}, #D4600A)`,
        color: saved ? "#fff" : "#0A1020", border: "none", borderRadius: 12,
        padding: "15px 28px", fontSize: 14.5, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
        fontFamily: "inherit", transition: "all 0.3s", opacity: saving ? 0.7 : 1,
      }}>
        {saving ? "Saving…" : saved ? "✅ Report Saved!" : "Submit Daily Report →"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — manager view
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ reports, profiles }) {
  const [week, setWeek] = useState(() => weekStart(todayISO()));
  const weeks = [...new Set(reports.map(r => weekStart(r.date)))].sort().reverse();
  if (!weeks.includes(week) && weeks.length) setWeek(weeks[0]);

  const wkReports = reports.filter(r => weekStart(r.date) === week);
  const totalCalls = wkReports.reduce((s,r) => s+(r.calls_made||0), 0);
  const totalApps  = wkReports.reduce((s,r) => s+(r.applications_submitted||0), 0);
  const totalQual  = wkReports.reduce((s,r) => {
    const os = r.outcome_summary||{};
    return s+(os.interested||0)+(os.app_started||0)+(os.app_submitted||0);
  }, 0);
  const convRate   = totalCalls > 0 ? ((totalApps/totalCalls)*100).toFixed(1) : "0.0";

  // Outcome totals
  const weekOutcome = {};
  LEAD_OUTCOMES.forEach(o => { weekOutcome[o.id] = wkReports.reduce((s,r) => s+(r.outcome_summary?.[o.id]||0), 0); });

  // Daily trend
  const wkStart = new Date(week);
  const dailyTrend = [0,1,2,3,4].map(i => {
    const dt = new Date(wkStart); dt.setDate(wkStart.getDate()+i);
    const iso = dt.toISOString().split("T")[0];
    const dayR = wkReports.filter(r => r.date === iso);
    return { day: DAY_LABELS[dt.getDay()], calls: dayR.reduce((s,r)=>s+(r.calls_made||0),0), apps: dayR.reduce((s,r)=>s+(r.applications_submitted||0),0), target: profiles.length };
  });

  // Channel split
  const b2c = wkReports.filter(r => r.channel === "B2C").length;
  const b2a = wkReports.filter(r => r.channel === "B2A").length;

  // Per-agent KPIs
  const agentKPIs = profiles.map(p => {
    const ar = wkReports.filter(r => r.agent_id === p.id || r.agent_name === p.full_name);
    if (!ar.length) return null;
    const calls = ar.reduce((s,r)=>s+(r.calls_made||0),0);
    const apps  = ar.reduce((s,r)=>s+(r.applications_submitted||0),0);
    const hours = ar.reduce((s,r)=>s+(parseFloat(r.hours_spent)||0),0);
    const qual  = ar.reduce((s,r)=>{ const os=r.outcome_summary||{}; return s+(os.interested||0)+(os.app_started||0)+(os.app_submitted||0);},0);
    const days  = ar.length;
    const callPct = Math.round((calls/(days*20))*100);
    const appPct  = Math.round((apps/days)*100);
    const kpi     = Math.round(callPct*0.4 + Math.min(appPct,140)*0.6);
    return { ...p, calls, apps, hours: hours.toFixed(1), qual, days, callPct, appPct, kpi };
  }).filter(Boolean);

  const KCard = ({ icon, label, value, sub, color }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ color: C.text, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color, fontSize: 11, marginTop: 5, fontWeight: 600 }}>{sub}</div>}
    </div>
  );

  if (!reports.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: C.muted }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>No reports yet</div>
      <div>Once your team submits daily reports, the dashboard will populate here in real time.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: C.muted, fontSize: 12 }}>Week of:</div>
        <select value={week} onChange={e => setWeek(e.target.value)} style={{ ...iCss, width: "auto", fontSize: 12, padding: "7px 12px" }}>
          {weeks.map(w => <option key={w} value={w}>w/c {fmtDate(w)}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KCard icon="📞" label="Total Calls" value={totalCalls} sub={`${wkReports.length} reports submitted`} color={C.teal} />
        <KCard icon="🎓" label="Applications" value={totalApps} sub={totalApps >= profiles.length*5 ? "Weekly target met ✓" : `Target: ${profiles.length*5}`} color={C.green} />
        <KCard icon="⭐" label="Qualified Leads" value={totalQual} sub="Interested + started + submitted" color={C.blue} />
        <KCard icon="📈" label="Conversion Rate" value={`${convRate}%`} sub="Calls → Applications" color={C.gold} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 20px 12px" }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Daily Calls vs Applications</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={dailyTrend} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.faint} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 12 }} />
              <Bar dataKey="calls" name="Calls" fill={C.teal} radius={[4,4,0,0]} opacity={0.85} />
              <Bar dataKey="apps" name="Applications" fill={C.gold} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 20px 12px" }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Channel Split</div>
          {b2c+b2a > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={[{name:"B2C",value:b2c,color:C.teal},{name:"B2A",value:b2a,color:C.gold}]} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
                    {[C.teal,C.gold].map((c,i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              {[["B2C",b2c,C.teal],["B2A",b2a,C.gold]].map(([n,v,c]) => (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: C.muted, display: "flex", gap: 6, alignItems: "center" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: c, display: "inline-block" }} />{n}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{b2c+b2a>0?Math.round((v/(b2c+b2a))*100):0}%</span>
                </div>
              ))}
            </>
          ) : <div style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 40 }}>No data</div>}
        </div>
      </div>

      {/* Outcome Breakdown */}
      {Object.values(weekOutcome).some(v => v > 0) && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>📊 Team Call Outcome Breakdown — This Week</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
            {LEAD_OUTCOMES.map(o => {
              const n = weekOutcome[o.id]||0;
              const pct = totalCalls > 0 ? Math.round((n/totalCalls)*100) : 0;
              return (
                <div key={o.id} style={{ background: n>0?o.color+"12":C.surface, border: `1px solid ${n>0?o.color+"33":C.border}`, borderRadius: 11, padding: "12px 14px", opacity: n===0?0.45:1 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{o.icon}</div>
                  <div style={{ color: n>0?o.color:C.muted, fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{n}</div>
                  <div style={{ color: C.muted, fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{o.label}</div>
                  {n>0 && <><div style={{ color: o.color, fontSize: 10, fontWeight: 700, marginTop: 4 }}>{pct}% of calls</div>
                  <div style={{ height: 3, background: C.faint, borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: o.color, borderRadius: 99 }} />
                  </div></>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent KPI Table */}
      {agentKPIs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 18 }}>Team Member KPI Scorecard</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>{["Team Member","Days","Calls","Call Rate","Apps","App Rate","Hours","Qualified","KPI Score","Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: C.muted, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", paddingBottom: 12, borderBottom: `1px solid ${C.border}`, paddingRight: 16, whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {agentKPIs.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "13px 16px 13px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={m.full_name} size={30} />
                        <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{m.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px 13px 0", color: C.muted, fontSize: 12 }}>{m.days}</td>
                    <td style={{ padding: "13px 16px 13px 0", color: C.teal, fontWeight: 700, fontSize: 13 }}>{m.calls}</td>
                    <td style={{ padding: "13px 16px 13px 0", minWidth: 110 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProgressBar value={m.callPct} color={m.callPct>=90?C.green:m.callPct>=70?C.gold:C.red} />
                        <span style={{ color: C.text, fontSize: 11, minWidth: 32 }}>{m.callPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px 13px 0", color: C.gold, fontWeight: 800, fontSize: 14 }}>{m.apps}</td>
                    <td style={{ padding: "13px 16px 13px 0", minWidth: 110 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProgressBar value={m.appPct} color={m.appPct>=100?C.green:m.appPct>=60?C.gold:C.red} />
                        <span style={{ color: C.text, fontSize: 11, minWidth: 32 }}>{m.appPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px 13px 0", color: C.muted, fontSize: 12 }}>{m.hours}h</td>
                    <td style={{ padding: "13px 16px 13px 0", color: C.blue, fontWeight: 700, fontSize: 13 }}>{m.qual}</td>
                    <td style={{ padding: "13px 16px 13px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: m.kpi>=80?C.green:m.kpi>=60?C.gold:C.red, fontWeight: 900, fontSize: 16 }}>{m.kpi}</span>
                        <ProgressBar value={m.kpi} color={m.kpi>=80?C.green:m.kpi>=60?C.gold:C.red} />
                      </div>
                    </td>
                    <td style={{ padding: "13px 0" }}>
                      <Tag label={m.kpi>=80?"Exceeding":m.kpi>=60?"On Track":"Below Target"} color={m.kpi>=80?C.green:m.kpi>=60?C.gold:C.red} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[["KPI = 40% Call Rate + 60% App Rate",C.muted],["80–100: Exceeding",C.green],["60–79: On Track",C.gold],["0–59: Below Target",C.red]].map(([l,c]) => (
              <span key={l} style={{ color: c, fontSize: 11 }}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT VIEW — full individual team member performance report
// ══════════════════════════════════════════════════════════════════════════════
function AuditView({ reports, profiles }) {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo  ] = useState("");

  const agents = [...new Set(reports.map(r => r.agent_name))].sort();
  const profile = profiles.find(p => p.full_name === selectedAgent);

  const agentReports = reports
    .filter(r => r.agent_name === selectedAgent)
    .filter(r => !dateFrom || r.date >= dateFrom)
    .filter(r => !dateTo   || r.date <= dateTo)
    .sort((a,b) => b.date.localeCompare(a.date));

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalCalls  = agentReports.reduce((s,r)=>s+(r.calls_made||0),0);
  const totalLeads  = agentReports.reduce((s,r)=>s+(r.leads_allocated||20),0);
  const totalApps   = agentReports.reduce((s,r)=>s+(r.applications_submitted||0),0);
  const totalHours  = agentReports.reduce((s,r)=>s+(parseFloat(r.hours_spent)||0),0);
  const totalQual   = agentReports.reduce((s,r)=>{ const o=r.outcome_summary||{}; return s+(o.interested||0)+(o.app_started||0)+(o.app_submitted||0);},0);
  const daysTarget  = agentReports.length;
  const daysTargetMet = agentReports.filter(r=>(r.applications_submitted||0)>=1).length;
  const callRate    = totalLeads>0 ? Math.round((totalCalls/totalLeads)*100) : 0;
  const convRate    = totalCalls>0 ? ((totalApps/totalCalls)*100).toFixed(1) : "0.0";
  const avgCallsDay = daysTarget>0 ? Math.round(totalCalls/daysTarget) : 0;
  const avgAppsDay  = daysTarget>0 ? (totalApps/daysTarget).toFixed(1) : "0.0";
  const avgHrsDay   = daysTarget>0 ? (totalHours/daysTarget).toFixed(1) : "0.0";

  // KPI score
  const appPct = daysTarget>0 ? Math.round((totalApps/daysTarget)*100) : 0;
  const kpiScore = Math.round(callRate*0.4 + Math.min(appPct,140)*0.6);

  // University breakdown across all reports
  const uniTotals = {};
  agentReports.forEach(r => {
    (r.uni_apps||[]).forEach(u => {
      if (u.university) uniTotals[u.university] = (uniTotals[u.university]||0)+(parseInt(u.count)||0);
    });
  });
  const uniSorted = Object.entries(uniTotals).sort((a,b)=>b[1]-a[1]);

  // Outcome totals
  const outTotals = {};
  LEAD_OUTCOMES.forEach(o => { outTotals[o.id] = agentReports.reduce((s,r)=>s+(r.outcome_summary?.[o.id]||0),0); });

  // Channel split
  const b2cDays = agentReports.filter(r=>r.channel==="B2C").length;
  const b2aDays = agentReports.filter(r=>r.channel==="B2A").length;

  // Trend chart data — last 10 reports reversed to chronological
  const trendData = [...agentReports].reverse().slice(-10).map(r => ({
    day: fmtDate(r.date).slice(0,5),
    calls: r.calls_made||0,
    apps: r.applications_submitted||0,
    target: 1,
  }));

  const StatBox = ({label, value, sub, color, big}) => (
    <div style={{ background: C.surface, border:`1px solid ${color}22`, borderRadius:14, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:color }} />
      <div style={{ color:C.muted, fontSize:10, letterSpacing:1.1, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ color, fontWeight:900, fontSize: big?32:24, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ color:C.muted, fontSize:11, marginTop:5 }}>{sub}</div>}
    </div>
  );

  // ── SELECTION SCREEN ─────────────────────────────────────────────────────
  if (!selectedAgent) return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:4 }}>🔍 Team Member Audit</div>
        <div style={{ color:C.muted, fontSize:13 }}>Select a team member to view their full performance report and audit their activity.</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:14 }}>
        {agents.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>No reports submitted yet.</div>}
        {agents.map(name => {
          const ar = reports.filter(r=>r.agent_name===name);
          const calls = ar.reduce((s,r)=>s+(r.calls_made||0),0);
          const apps  = ar.reduce((s,r)=>s+(r.applications_submitted||0),0);
          const days  = ar.length;
          const kpi   = days>0 ? Math.round((Math.round((calls/(days*20))*100))*0.4 + Math.min(Math.round((apps/days)*100),140)*0.6) : 0;
          return (
            <div key={name} onClick={()=>setSelectedAgent(name)}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, cursor:"pointer", transition:"all 0.18s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"66"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <Avatar name={name} size={44} />
                <div>
                  <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>{name}</div>
                  <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{days} reports submitted</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[["Calls",calls,C.teal],["Apps",apps,C.gold],["KPI",kpi,kpi>=80?C.green:kpi>=60?C.gold:C.red]].map(([l,v,c])=>(
                  <div key={l} style={{ textAlign:"center", background:C.surface, borderRadius:9, padding:"8px 4px" }}>
                    <div style={{ color:c, fontWeight:900, fontSize:18 }}>{v}</div>
                    <div style={{ color:C.muted, fontSize:9, letterSpacing:0.8, textTransform:"uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ height:5, flex:1, background:C.faint, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(kpi,100)}%`, background:kpi>=80?C.green:kpi>=60?C.gold:C.red, borderRadius:99 }} />
                </div>
                <Tag label={kpi>=80?"Exceeding":kpi>=60?"On Track":"Below Target"} color={kpi>=80?C.green:kpi>=60?C.gold:C.red} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── FULL AUDIT REPORT ────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Back + header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={()=>{ setSelectedAgent(""); setDateFrom(""); setDateTo(""); }}
            style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.muted, borderRadius:9, padding:"8px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            ← Back
          </button>
          <Avatar name={selectedAgent} size={48} />
          <div>
            <div style={{ color:C.text, fontWeight:900, fontSize:20 }}>{selectedAgent}</div>
            <div style={{ color:C.muted, fontSize:12 }}>{agentReports.length} reports · Full Performance Audit</div>
          </div>
        </div>
        {/* Date range filter */}
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ color:C.muted, fontSize:12 }}>Period:</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ ...iCss, width:"auto", fontSize:12, padding:"7px 12px" }} />
          <span style={{ color:C.muted, fontSize:12 }}>to</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ ...iCss, width:"auto", fontSize:12, padding:"7px 12px" }} />
          {(dateFrom||dateTo) && <button onClick={()=>{ setDateFrom(""); setDateTo(""); }}
            style={{ background:C.redSoft, border:`1px solid ${C.red}33`, color:C.red, borderRadius:8, padding:"7px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Clear</button>}
        </div>
      </div>

      {agentReports.length === 0 && (
        <div style={{ textAlign:"center", color:C.muted, padding:"50px 0", fontSize:14 }}>No reports found for this period.</div>
      )}

      {agentReports.length > 0 && <>

        {/* ── KPI SCORE BANNER ── */}
        <div style={{ background:`linear-gradient(135deg, ${kpiScore>=80?C.green:kpiScore>=60?C.gold:C.red}22, transparent)`, border:`1px solid ${kpiScore>=80?C.green:kpiScore>=60?C.gold:C.red}44`, borderRadius:16, padding:"20px 24px", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:kpiScore>=80?C.green:kpiScore>=60?C.gold:C.red, fontWeight:900, fontSize:52, lineHeight:1 }}>{kpiScore}</div>
            <div style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase", marginTop:4 }}>KPI Score</div>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ color:C.muted, fontSize:12 }}>Overall Performance</span>
              <Tag label={kpiScore>=80?"Exceeding Target":kpiScore>=60?"On Track":"Below Target"} color={kpiScore>=80?C.green:kpiScore>=60?C.gold:C.red} />
            </div>
            <div style={{ height:10, background:C.faint, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(kpiScore,100)}%`, background:kpiScore>=80?C.green:kpiScore>=60?C.gold:C.red, borderRadius:99, transition:"width 1s ease" }} />
            </div>
            <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
              {[["Call Rate",`${callRate}%`,"40% weight",C.teal],["App Rate",`${appPct}%`,"60% weight",C.gold],["Days Reported",daysTarget,"total days",C.blue],["Target Days Met",daysTargetMet,`of ${daysTarget} days`,daysTargetMet===daysTarget?C.green:C.red]].map(([l,v,sub,c])=>(
                <div key={l}>
                  <div style={{ color:c, fontWeight:800, fontSize:15 }}>{v}</div>
                  <div style={{ color:C.muted, fontSize:10 }}>{l}</div>
                  <div style={{ color:C.faint, fontSize:10 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STAT GRID ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <StatBox label="Total Calls Made" value={totalCalls} sub={`Avg ${avgCallsDay}/day · ${callRate}% of leads`} color={C.teal} />
          <StatBox label="Applications Submitted" value={totalApps} sub={`Avg ${avgAppsDay}/day`} color={C.gold} big />
          <StatBox label="Hours Worked" value={`${totalHours.toFixed(1)}h`} sub={`Avg ${avgHrsDay}h/day`} color={C.blue} />
          <StatBox label="Qualified Leads" value={totalQual} sub="Interested + Started + Submitted" color={C.purple} />
        </div>

        {/* ── UNIVERSITY BREAKDOWN + CHANNEL ── */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>

          {/* University breakdown */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
            <div style={{ color:C.green, fontWeight:700, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>🎓 Applications by University — All Time</div>
            {uniSorted.length === 0 ? (
              <div style={{ color:C.muted, fontSize:13 }}>No applications recorded.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {uniSorted.map(([uni, count]) => {
                  const pct = totalApps>0 ? Math.round((count/totalApps)*100) : 0;
                  return (
                    <div key={uni}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>{uni}</span>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          <span style={{ color:C.muted, fontSize:11 }}>{pct}%</span>
                          <span style={{ color:C.gold, fontWeight:900, fontSize:16, minWidth:24, textAlign:"right" }}>{count}</span>
                        </div>
                      </div>
                      <div style={{ height:7, background:C.faint, borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${C.green},${C.gold})`, borderRadius:99 }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginTop:4, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Total Applications</span>
                  <span style={{ color:C.gold, fontWeight:900, fontSize:20 }}>{totalApps}</span>
                </div>
              </div>
            )}
          </div>

          {/* Channel + outcome summary */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
              <div style={{ color:C.teal, fontWeight:700, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Channel Split</div>
              {[["B2C",b2cDays,C.teal],["B2A",b2aDays,C.gold]].map(([ch,days,c])=>{
                const pct = daysTarget>0?Math.round((days/daysTarget)*100):0;
                return (
                  <div key={ch} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ color:c, fontWeight:700, fontSize:13 }}>{ch}</span>
                      <span style={{ color:C.muted, fontSize:12 }}>{days} days · {pct}%</span>
                    </div>
                    <div style={{ height:6, background:C.faint, borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, flex:1 }}>
              <div style={{ color:C.gold, fontWeight:700, fontSize:12, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Top Call Outcomes</div>
              {LEAD_OUTCOMES.filter(o=>outTotals[o.id]>0).sort((a,b)=>outTotals[b.id]-outTotals[a.id]).slice(0,6).map(o=>(
                <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:o.color, fontSize:12 }}>{o.icon} {o.label}</span>
                  <span style={{ color:o.color, fontWeight:800, fontSize:14 }}>{outTotals[o.id]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TREND CHART ── */}
        {trendData.length > 1 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
            <div style={{ color:C.text, fontWeight:700, fontSize:13, marginBottom:16 }}>📈 Performance Trend — Last {trendData.length} Reports</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.faint} vertical={false} />
                <XAxis dataKey="day" tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:C.muted, fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:12 }} />
                <Bar dataKey="calls" name="Calls" fill={C.teal} radius={[4,4,0,0]} opacity={0.8} />
                <Bar dataKey="apps" name="Applications" fill={C.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── DAILY REPORT LOG ── */}
        <div>
          <div style={{ color:C.text, fontWeight:800, fontSize:16, marginBottom:14 }}>📋 Daily Report Log — {agentReports.length} Entries</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {agentReports.map((r,idx) => {
              const apps = r.applications_submitted||0;
              const callPct = r.leads_allocated>0?Math.round((r.calls_made/r.leads_allocated)*100):0;
              return (
                <div key={r.id} style={{ background:C.card, border:`1px solid ${apps>=1?C.green+"33":C.border}`, borderRadius:14, overflow:"hidden" }}>

                  {/* Day header */}
                  <div style={{ background:apps>=1?C.greenSoft:"transparent", padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:32, height:32, borderRadius:99, background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontWeight:800, fontSize:12 }}>
                        {agentReports.length - idx}
                      </div>
                      <div>
                        <div style={{ color:C.text, fontWeight:800, fontSize:14 }}>{fmtDate(r.date)}</div>
                        <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>
                          <span style={{ color:r.channel==="B2C"?C.teal:C.gold, fontWeight:700 }}>{r.channel}</span>
                          {r.lead_source && <span> · {r.lead_source}</span>}
                          {r.submitted_at && <span> · Submitted {new Date(r.submitted_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>}
                        </div>
                      </div>
                    </div>
                    <Tag label={apps>=1?"✓ Daily Target Met":"✗ Target Missed"} color={apps>=1?C.green:C.red} />
                  </div>

                  {/* Stats row */}
                  <div style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, borderBottom:`1px solid ${C.border}` }}>
                    {/* Calls */}
                    <div style={{ background:C.surface, borderRadius:11, padding:"12px 14px" }}>
                      <div style={{ color:C.muted, fontSize:10, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>📞 Calls</div>
                      <div style={{ color:C.teal, fontWeight:900, fontSize:22 }}>{r.calls_made||0}<span style={{ color:C.faint, fontSize:13, fontWeight:400 }}>/{r.leads_allocated||20}</span></div>
                      <div style={{ marginTop:6 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginBottom:3 }}>
                          <span>Completion</span><span style={{ color:callPct>=90?C.green:callPct>=70?C.gold:C.red }}>{callPct}%</span>
                        </div>
                        <div style={{ height:4, background:C.faint, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(callPct,100)}%`, background:callPct>=90?C.green:callPct>=70?C.gold:C.red, borderRadius:99 }} />
                        </div>
                      </div>
                    </div>
                    {/* Hours */}
                    <div style={{ background:C.surface, borderRadius:11, padding:"12px 14px" }}>
                      <div style={{ color:C.muted, fontSize:10, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>⏱ Hours</div>
                      <div style={{ color:parseFloat(r.hours_spent)>=4?C.green:C.text, fontWeight:900, fontSize:22 }}>{r.hours_spent||"—"}<span style={{ color:C.faint, fontSize:13, fontWeight:400 }}>h</span></div>
                      <div style={{ color:C.muted, fontSize:10, marginTop:6 }}>Target: 4h minimum</div>
                    </div>
                    {/* Applications */}
                    <div style={{ background:C.surface, borderRadius:11, padding:"12px 14px" }}>
                      <div style={{ color:C.muted, fontSize:10, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>🎓 Applications</div>
                      <div style={{ color:apps>=1?C.gold:C.red, fontWeight:900, fontSize:22 }}>{apps}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:3, marginTop:6 }}>
                        {(r.uni_apps||[]).filter(u=>u.university).map((u,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:10 }}>
                            <span style={{ color:C.muted }}>{u.university.replace("University of ","Uni of ").replace("University","Uni")}</span>
                            <span style={{ color:C.gold, fontWeight:700 }}>{u.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Qualified */}
                    <div style={{ background:C.surface, borderRadius:11, padding:"12px 14px" }}>
                      <div style={{ color:C.muted, fontSize:10, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 }}>⭐ Qualified</div>
                      <div style={{ color:C.blue, fontWeight:900, fontSize:22 }}>
                        {r.outcome_summary?((r.outcome_summary.interested||0)+(r.outcome_summary.app_started||0)+(r.outcome_summary.app_submitted||0)):0}
                      </div>
                      <div style={{ color:C.muted, fontSize:10, marginTop:6 }}>Interested + Started + Submitted</div>
                    </div>
                  </div>

                  {/* Outcomes + notes */}
                  <div style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    {/* Call outcomes */}
                    {r.outcome_summary && Object.values(r.outcome_summary).some(v=>v>0) && (
                      <div>
                        <div style={{ color:C.gold, fontSize:10, letterSpacing:1, textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>🎯 Call Outcomes</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {LEAD_OUTCOMES.filter(o=>(r.outcome_summary[o.id]||0)>0).map(o=>(
                            <span key={o.id} style={{ background:o.color+"18", color:o.color, border:`1px solid ${o.color}33`, borderRadius:7, padding:"4px 10px", fontSize:11, fontWeight:700 }}>
                              {o.icon} {o.label} · {r.outcome_summary[o.id]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Notes, blockers, follow-ups */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {r.blockers && (
                        <div style={{ background:C.redSoft, border:`1px solid ${C.red}22`, borderRadius:9, padding:"9px 12px" }}>
                          <div style={{ color:C.red, fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>⚠ Blockers</div>
                          <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>{r.blockers}</div>
                        </div>
                      )}
                      {r.follow_ups && (
                        <div style={{ background:C.goldSoft, border:`1px solid ${C.gold}22`, borderRadius:9, padding:"9px 12px" }}>
                          <div style={{ color:C.gold, fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>🔄 Follow-Ups</div>
                          <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>{r.follow_ups}</div>
                        </div>
                      )}
                      {r.notes && (
                        <div style={{ background:C.tealSoft, border:`1px solid ${C.teal}22`, borderRadius:9, padding:"9px 12px" }}>
                          <div style={{ color:C.teal, fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>📝 Notes</div>
                          <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>{r.notes}</div>
                        </div>
                      )}
                      {!r.blockers && !r.follow_ups && !r.notes && (
                        <div style={{ color:C.faint, fontSize:12, fontStyle:"italic" }}>No notes or blockers recorded.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL REPORTS — detailed manager view
// ══════════════════════════════════════════════════════════════════════════════
function AllReportsView({ reports }) {
  const [expanded, setExpanded] = useState({});
  const [filterAgent, setFilterAgent] = useState("");
  const [filterDate,  setFilterDate ] = useState("");
  const [filterChan,  setFilterChan ] = useState("");

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const agents = [...new Set(reports.map(r => r.agent_name))].sort();

  const filtered = reports.filter(r =>
    (!filterAgent || r.agent_name === filterAgent) &&
    (!filterDate  || r.date === filterDate) &&
    (!filterChan  || r.channel === filterChan)
  ).sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);

  const totalCalls = filtered.reduce((s,r)=>s+(r.calls_made||0),0);
  const totalApps  = filtered.reduce((s,r)=>s+(r.applications_submitted||0),0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Header + filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>All Reports
            <span style={{ color: C.muted, fontWeight: 400, fontSize: 13, marginLeft: 10 }}>{filtered.length} reports · 📞 {totalCalls} calls · 🎓 {totalApps} apps</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
            style={{ ...iCss, width: "auto", fontSize: 12, padding: "7px 12px" }}>
            <option value="">All Team Members</option>
            {agents.map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={filterChan} onChange={e => setFilterChan(e.target.value)}
            style={{ ...iCss, width: "auto", fontSize: 12, padding: "7px 12px" }}>
            <option value="">All Channels</option>
            <option>B2C</option><option>B2A</option>
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ ...iCss, width: "auto", fontSize: 12, padding: "7px 12px" }} />
          {(filterAgent||filterDate||filterChan) && (
            <button onClick={() => { setFilterAgent(""); setFilterDate(""); setFilterChan(""); }}
              style={{ background: C.redSoft, border: `1px solid ${C.red}33`, color: C.red, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: C.muted, padding: "50px 0" }}>No reports match your filters.</div>
      )}

      {/* Report cards */}
      {filtered.map(r => {
        const apps = r.applications_submitted || 0;
        const isOpen = expanded[r.id];
        const qual = r.outcome_summary ? (r.outcome_summary.interested||0)+(r.outcome_summary.app_started||0)+(r.outcome_summary.app_submitted||0) : 0;
        const callPct = r.leads_allocated > 0 ? Math.round((r.calls_made / r.leads_allocated) * 100) : 0;

        return (
          <div key={r.id} style={{ background: C.card, border: `1px solid ${isOpen ? C.gold+"44" : C.border}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s" }}>

            {/* ── SUMMARY ROW (always visible) ── */}
            <div
              onClick={() => toggle(r.id)}
              style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
            >
              {/* Avatar + name + date */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                <Avatar name={r.agent_name} size={36} />
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{r.agent_name}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{fmtDate(r.date)}</div>
                </div>
              </div>

              {/* Channel + source */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                <span style={{ background: r.channel==="B2C"?C.tealSoft:C.goldSoft, color: r.channel==="B2C"?C.teal:C.gold, border: `1px solid ${r.channel==="B2C"?C.teal:C.gold}33`, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{r.channel}</span>
                {r.lead_source && <span style={{ color: C.muted, fontSize: 12 }}>{r.lead_source}</span>}
              </div>

              {/* Stats pills */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.teal, fontWeight: 800, fontSize: 18 }}>{r.calls_made||0}<span style={{ color: C.faint, fontSize: 11, fontWeight: 400 }}>/{r.leads_allocated||20}</span></div>
                  <div style={{ color: C.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" }}>Calls</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: r.hours_spent ? C.text : C.faint, fontWeight: 700, fontSize: 16 }}>{r.hours_spent||"—"}h</div>
                  <div style={{ color: C.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" }}>Hours</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: apps>=1?C.gold:C.red, fontWeight: 800, fontSize: 18 }}>{apps}</div>
                  <div style={{ color: C.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" }}>Apps</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.blue, fontWeight: 700, fontSize: 16 }}>{qual}</div>
                  <div style={{ color: C.muted, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" }}>Qualified</div>
                </div>
                <Tag label={apps>=1?"✓ Target Met":"✗ Below Target"} color={apps>=1?C.green:C.red} />
              </div>

              {/* Expand toggle */}
              <div style={{ color: C.muted, fontSize: 18, marginLeft: "auto", userSelect: "none" }}>{isOpen ? "▲" : "▼"}</div>
            </div>

            {/* ── EXPANDED DETAIL ── */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${C.border}` }}>

                {/* Call activity bar */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ color: C.teal, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>📞 Call Activity</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[["Leads Allocated", r.leads_allocated||20, C.muted],["Calls Made", r.calls_made||0, C.teal],["Hours Spent", (r.hours_spent||"—")+"h", C.text]].map(([l,v,c]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: C.muted }}>{l}</span>
                          <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                          <span>Call completion</span><span style={{ color: callPct>=90?C.green:callPct>=70?C.gold:C.red }}>{callPct}%</span>
                        </div>
                        <div style={{ height: 5, background: C.faint, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(callPct,100)}%`, background: callPct>=90?C.green:callPct>=70?C.gold:C.red, borderRadius: 99 }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* University applications */}
                  <div>
                    <div style={{ color: C.green, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>🎓 Applications Submitted</div>
                    {r.uni_apps && r.uni_apps.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {r.uni_apps.map((u, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.greenSoft, border: `1px solid ${C.green}22`, borderRadius: 9, padding: "8px 12px" }}>
                            <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{u.university}</span>
                            <span style={{ background: C.green, color: "#fff", borderRadius: 99, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>{u.count}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: 4, borderTop: `1px solid ${C.border}` }}>
                          <span style={{ color: C.muted }}>Total applications</span>
                          <span style={{ color: C.gold, fontWeight: 800, fontSize: 14 }}>{apps}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: C.muted, fontSize: 12 }}>No applications recorded</div>
                    )}
                  </div>

                  {/* Call outcomes */}
                  <div>
                    <div style={{ color: C.gold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>🎯 Call Outcomes</div>
                    {r.outcome_summary && Object.values(r.outcome_summary).some(v=>v>0) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {LEAD_OUTCOMES.filter(o => (r.outcome_summary[o.id]||0) > 0).map(o => (
                          <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ color: o.color, fontSize: 12 }}>{o.icon} {o.label}</span>
                            <span style={{ color: o.color, fontWeight: 800, fontSize: 13, minWidth: 20, textAlign: "right" }}>{r.outcome_summary[o.id]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: C.muted, fontSize: 12 }}>No outcomes logged</div>
                    )}
                  </div>
                </div>

                {/* Notes, blockers, follow-ups */}
                {(r.notes || r.blockers || r.follow_ups) && (
                  <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    {r.blockers && (
                      <div>
                        <div style={{ color: C.red, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>⚠ Blockers</div>
                        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, background: C.redSoft, border: `1px solid ${C.red}22`, borderRadius: 9, padding: "10px 12px" }}>{r.blockers}</div>
                      </div>
                    )}
                    {r.follow_ups && (
                      <div>
                        <div style={{ color: C.gold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>🔄 Follow-Ups</div>
                        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, background: C.goldSoft, border: `1px solid ${C.gold}22`, borderRadius: 9, padding: "10px 12px" }}>{r.follow_ups}</div>
                      </div>
                    )}
                    {r.notes && (
                      <div>
                        <div style={{ color: C.teal, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>📝 Notes</div>
                        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, background: C.tealSoft, border: `1px solid ${C.teal}22`, borderRadius: 9, padding: "10px 12px" }}>{r.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session,  setSession ] = useState(null);
  const [profile,  setProfile ] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [reports,  setReports ] = useState([]);
  const [tab,      setTab     ] = useState("entry");
  const [loading,  setLoading ] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load profile + data when session exists
  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoading(true);
      // Own profile
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      // All profiles (for manager view + KPI)
      const { data: profs } = await supabase.from("profiles").select("*").order("full_name");
      setProfiles(profs || []);
      // Reports — managers get all, agents get own
      const query = supabase.from("daily_reports").select("*").order("date", { ascending: false });
      const { data: rpts } = await query;
      setReports(rpts || []);
      setLoading(false);
    })();
  }, [session]);

  // Real-time subscription
  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel("reports-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "daily_reports" }, payload => {
        setReports(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [session]);

  const signOut = () => supabase.auth.signOut();
  const isManager = profile?.role === "manager";

  if (!session) return <AuthScreen />;
  if (loading || !profile) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800;900&display=swap'); @keyframes spin { to { transform: rotate(360deg); } } * { box-sizing:border-box; margin:0; padding:0; } select option { background: #0C1A2E; }`}</style>
      <Spinner />
    </div>
  );

  const TABS = [
    ...(isManager ? [{ id: "dashboard", label: "KPI Dashboard", icon: "📊" }] : []),
    { id: "entry", label: "Submit Daily Report", icon: "✍️" },
    ...(isManager ? [{ id: "log", label: "All Reports", icon: "📋" }] : []),
    ...(isManager ? [{ id: "audit", label: "Team Member Audit", icon: "🔍" }] : []),
    { id: "myreports", label: "My Reports", icon: "👤" },
  ];

  const myReports = reports.filter(r => r.agent_id === session.user.id || r.agent_name === profile.full_name);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; } select option { background: #0C1A2E; } ::-webkit-scrollbar { width:5px; height:5px; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius:99px; } input:focus, select:focus, textarea:focus { outline:none; border-color:rgba(0,201,192,0.5) !important; box-shadow:0 0 0 3px rgba(0,201,192,0.07); } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${C.gold}, #D4600A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>Smartmove Education Group</div>
                <div style={{ fontSize: 10.5, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Team Performance · Daily Reporting</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={profile.full_name} size={30} />
                <div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{profile.full_name}</div>
                  <div style={{ color: isManager ? C.gold : C.teal, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{isManager ? "Manager" : "Team Member"}</div>
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: C.border }} />
              <button onClick={signOut} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab===t.id ? C.goldSoft : "transparent",
                border: `1px solid ${tab===t.id ? C.gold+"44" : "transparent"}`,
                borderBottom: "none", color: tab===t.id ? C.gold : C.muted,
                padding: "9px 18px", borderRadius: "9px 9px 0 0",
                cursor: "pointer", fontSize: 12.5, fontWeight: tab===t.id ? 700 : 500,
                fontFamily: "inherit", transition: "all 0.18s",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 28px 70px" }}>

        {tab === "dashboard" && isManager && <Dashboard reports={reports} profiles={profiles} />}

        {tab === "entry" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28 }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: C.text }}>Daily Task Report</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Submit by end of day. Your name is automatically attached.</div>
              </div>
              <EntryForm profile={profile} onSaved={() => setTab("myreports")} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: C.card, border: `1px solid ${C.gold}33`, borderRadius: 16, padding: 20 }}>
                <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, letterSpacing: 0.8, marginBottom: 14 }}>📌 DAILY TARGETS</div>
                {[["📋 Leads Allocated","20 per day"],["📞 Calling Hours","4 hrs minimum"],["🎓 Applications","1 minimum/day"],["⏰ Report Deadline","End of business"]].map(([l,v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{l}</span>
                    <span style={{ color: C.gold, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ color: C.teal, fontWeight: 700, fontSize: 12, letterSpacing: 0.8, marginBottom: 12 }}>🔀 CHANNEL GUIDE</div>
                <div style={{ marginBottom: 10 }}><div style={{ color: C.teal, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>B2C — Direct Student</div><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>Inbound leads from social ad campaigns. Students age 21–60 seeking higher education.</div></div>
                <div><div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>B2A — Agent Network</div><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.7 }}>Remote agents and student referrals providing pre-qualified students.</div></div>
              </div>
            </div>
          </div>
        )}

        {tab === "myreports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}>
              <Avatar name={profile.full_name} size={44} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{profile.full_name}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{myReports.length} reports submitted</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
                {[["Calls", myReports.reduce((s,r)=>s+(r.calls_made||0),0), C.teal],["Apps", myReports.reduce((s,r)=>s+(r.applications_submitted||0),0), C.gold]].map(([l,v,c]) => (
                  <div key={l} style={{ textAlign: "center" }}><div style={{ color: c, fontWeight: 900, fontSize: 22 }}>{v}</div><div style={{ color: C.muted, fontSize: 10, letterSpacing: 0.8 }}>{l.toUpperCase()}</div></div>
                ))}
              </div>
            </div>
            {myReports.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: "50px 0" }}>No reports yet. Submit your first daily report!</div>}
            {myReports.map(r => {
              const apps = r.applications_submitted||0;
              return (
                <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 1fr 1fr auto", alignItems: "center", gap: 12, padding: "14px 18px" }}>
                    <div><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{fmtDate(r.date)}</div><div style={{ color: r.channel==="B2C"?C.teal:C.gold, fontSize: 11, fontWeight: 700, marginTop: 3 }}>{r.channel}</div></div>
                    <div><div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase" }}>Calls</div><div style={{ color: C.teal, fontWeight: 700, fontSize: 16 }}>{r.calls_made||"—"}<span style={{ color: C.muted, fontSize: 11 }}>/{r.leads_allocated}</span></div></div>
                    <div><div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase" }}>Applications</div>
                      <div style={{ color: apps>=1?C.gold:C.red, fontWeight: 800, fontSize: 16 }}>{apps}</div>
                      {r.uni_apps?.map((u,i) => <div key={i} style={{ fontSize: 10, color: C.muted }}><span style={{ color: C.gold, fontWeight: 700 }}>{u.count}</span> × {u.university}</div>)}
                    </div>
                    <div><div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase" }}>Hours</div><div style={{ color: C.text, fontSize: 14 }}>{r.hours_spent||"—"}h</div></div>
                    <div>
                      {r.outcome_summary && Object.values(r.outcome_summary).some(v=>v>0) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {LEAD_OUTCOMES.filter(o=>(r.outcome_summary[o.id]||0)>0).slice(0,3).map(o => (
                            <span key={o.id} style={{ background: o.color+"18", color: o.color, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>{o.icon} {r.outcome_summary[o.id]}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div><Tag label={apps>=1?"Target Met":"Below Target"} color={apps>=1?C.green:C.red} /></div>
                  </div>
                  {(r.notes||r.blockers||r.follow_ups) && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 18px", display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {r.notes && <div style={{ fontSize: 12, color: C.muted }}><span style={{ color: C.text, fontWeight: 600 }}>Notes:</span> {r.notes}</div>}
                      {r.blockers && <div style={{ fontSize: 12, color: C.muted }}><span style={{ color: C.red, fontWeight: 600 }}>Blockers:</span> {r.blockers}</div>}
                      {r.follow_ups && <div style={{ fontSize: 12, color: C.muted }}><span style={{ color: C.gold, fontWeight: 600 }}>Follow-Ups:</span> {r.follow_ups}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "log" && isManager && <AllReportsView reports={reports} />}

        {tab === "audit" && isManager && <AuditView reports={reports} profiles={profiles} />}
      </div>
    </div>
  );
}
