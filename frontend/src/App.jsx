import { useState, useRef, useEffect, useCallback } from "react"
import axios from "axios"
import { marked } from "marked"

const API = "http://localhost:8000"

marked.use({ breaks: true, gfm: true })

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const s = size
  const icons = {
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    plus: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
    trash: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    upload: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
    link: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    send: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
    menu: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
    database: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>,
    sparkles: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
    check: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    file: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    globe: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
    chevronDown: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
    chevronLeft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
    user: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    bot: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
    layers: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
    zap: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    copy: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
    bookOpen: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    info: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
    pencil: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
    loader: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    fileText: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
    alertCircle: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
    checkCircle: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    clock: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    arrowDown: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
    settings: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  }
  return <span style={{ display: "inline-flex", alignItems: "center" }}>{icons[name] || null}</span>
}

// ── Global Styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:    #07080d;
    --bg2:   #0d0f18;
    --bg3:   #131520;
    --bg4:   #191c2a;
    --bg5:   #1f2233;
    --border:  rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.10);
    --border3: rgba(255,255,255,0.18);
    --text:  #dde1f0;
    --text2: #8890b0;
    --text3: #4a5070;
    --accent:  #4f8cff;
    --accent2: #7eb3ff;
    --accent3: rgba(79,140,255,0.12);
    --accent4: rgba(79,140,255,0.06);
    --teal:  #2dd4bf;
    --teal2: rgba(45,212,191,0.12);
    --amber: #fbbf24;
    --amber2:rgba(251,191,36,0.12);
    --green: #34d399;
    --green2:rgba(52,211,153,0.12);
    --red:   #f87171;
    --red2:  rgba(248,113,113,0.12);
    --purple:#a78bfa;
    --purple2:rgba(167,139,250,0.12);
    --orange:#fb923c;
    --orange2:rgba(251,146,60,0.12);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.5);
    --shadow:    0 4px 24px rgba(0,0,0,0.6);
    --shadow-xl: 0 12px 48px rgba(0,0,0,0.8);
    --radius:    12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'Sora', system-ui, sans-serif;
  }

  html, body, #root { height: 100%; font-family: var(--sans); background: var(--bg); color: var(--text); font-size: 14px; -webkit-font-smoothing: antialiased; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text3); }
  ::selection { background: rgba(79,140,255,0.25); }
  input, textarea, button { font-family: inherit; }

  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes blink       { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes slideIn     { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse       { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes progress    { from { width: 5%; } to { width: 90%; } }

  .fade-up  { animation: fadeSlideUp 0.24s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .fade-in  { animation: fadeIn 0.2s ease both; }
  .slide-in { animation: slideIn 0.2s ease both; }
  .spin-anim { animation: spin 0.75s linear infinite; }

  /* Message body typography */
  .msg-body { line-height: 1.75; }
  .msg-body p { margin: 0 0 10px 0; }
  .msg-body p:last-child { margin-bottom: 0; }
  .msg-body h1,.msg-body h2,.msg-body h3 { margin: 16px 0 8px 0; line-height: 1.4; font-weight: 600; }
  .msg-body h1 { font-size: 17px; }
  .msg-body h2 { font-size: 15px; color: var(--text2); }
  .msg-body h3 { font-size: 14px; color: var(--text2); }
  .msg-body ul,.msg-body ol { margin: 8px 0; padding-left: 20px; }
  .msg-body li { margin: 5px 0; }
  .msg-body code { background: rgba(79,140,255,0.1); border: 1px solid rgba(79,140,255,0.15); padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 12.5px; color: var(--accent2); }
  .msg-body pre { background: rgba(0,0,0,0.4); border: 1px solid var(--border2); padding: 14px 16px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
  .msg-body pre code { background: none; border: none; padding: 0; color: var(--text); font-size: 13px; }
  .msg-body blockquote { border-left: 3px solid var(--accent); margin: 10px 0; padding: 6px 14px; color: var(--text2); background: var(--accent4); border-radius: 0 6px 6px 0; }
  .msg-body table { border-collapse: collapse; margin: 10px 0; width: 100%; font-size: 13px; }
  .msg-body th,.msg-body td { border: 1px solid var(--border2); padding: 8px 12px; text-align: left; }
  .msg-body th { background: var(--bg4); font-weight: 600; color: var(--text2); }
  .msg-body a { color: var(--accent2); text-decoration: none; }
  .msg-body a:hover { text-decoration: underline; }
  .msg-body hr { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
  .msg-body strong { color: var(--text); font-weight: 600; }

  .typing-cursor::after { content: '▋'; display: inline-block; animation: blink 0.9s step-end infinite; color: var(--accent); font-size: 0.85em; margin-left: 2px; vertical-align: baseline; }

  .src-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px 3px 7px; border-radius: 99px; font-size: 11px; font-weight: 500; background: var(--bg4); border: 1px solid var(--border2); color: var(--text2); cursor: default; transition: all 0.15s; font-family: var(--mono); }
  .src-badge:hover { background: var(--bg5); border-color: var(--border3); color: var(--text); }

  .query-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 11px; background: var(--teal2); border: 1px solid rgba(45,212,191,0.2); color: var(--teal); font-family: var(--mono); white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }

  .score-bar { height: 3px; border-radius: 99px; background: linear-gradient(to right, var(--accent), var(--teal)); opacity: 0.7; transition: width 0.4s ease; }

  /* Progress bar animation */
  .upload-progress { height: 3px; border-radius: 99px; background: var(--accent); animation: progress 8s ease-out forwards; }
`

// ── Utility ───────────────────────────────────────────────────────────────────
function fileTypeColor(ext) {
  const map = { pdf: "var(--red)", txt: "var(--text2)", md: "var(--green)", html: "var(--orange)",
    png: "var(--purple)", jpg: "var(--purple)", jpeg: "var(--purple)", webp: "var(--purple)",
    docx: "var(--accent)", xlsx: "var(--teal)", xls: "var(--teal)", csv: "var(--amber)" }
  return map[ext] || "var(--text3)"
}

function fileTypeBg(ext) {
  const map = { pdf: "var(--red2)", txt: "rgba(136,144,176,0.1)", md: "var(--green2)", html: "var(--orange2)",
    png: "var(--purple2)", jpg: "var(--purple2)", jpeg: "var(--purple2)", webp: "var(--purple2)",
    docx: "var(--accent3)", xlsx: "var(--teal2)", xls: "var(--teal2)", csv: "var(--amber2)" }
  return map[ext] || "var(--bg4)"
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, footer, maxWidth = 480 }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose()
    if (isOpen) document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])
  if (!isOpen) return null
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fade-up" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth, overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          ><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: "22px 24px" }}>{children}</div>
        {footer && <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>{footer}</div>}
      </div>
    </div>
  )
}

// ── Field / Input / Button ────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.02em" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--text3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputStyle = { width: "100%", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" }
const focusHandlers = { onFocus: e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent4)" }, onBlur: e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none" } }

function TextInput(props) { return <input style={inputStyle} {...focusHandlers} {...props} /> }
function Textarea(props) { return <textarea style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} {...focusHandlers} {...props} /> }

function Btn({ children, variant = "primary", disabled, onClick, style: s, size = "md", loading: lding, ...rest }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 500, border: "none", cursor: disabled || lding ? "not-allowed" : "pointer", borderRadius: "var(--radius-sm)", transition: "all 0.15s", opacity: disabled || lding ? 0.45 : 1, fontSize: size === "sm" ? 12.5 : 13.5, padding: size === "sm" ? "6px 13px" : "9px 17px", letterSpacing: "0.01em" }
  const variants = {
    primary: { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px rgba(79,140,255,0.35)" },
    ghost: { background: "transparent", color: "var(--text2)", border: "1px solid var(--border2)" },
    danger: { background: "var(--red2)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.25)" },
    subtle: { background: "var(--bg4)", color: "var(--text2)", border: "1px solid var(--border)" },
  }
  return (
    <button disabled={disabled || lding} onClick={onClick} style={{ ...base, ...variants[variant], ...s }}
      onMouseEnter={e => { if (disabled || lding) return; if (variant === "primary") e.currentTarget.style.filter = "brightness(1.12)"; else if (variant === "ghost") { e.currentTarget.style.background = "var(--bg4)"; e.currentTarget.style.color = "var(--text)" } else if (variant === "subtle") e.currentTarget.style.color = "var(--text)"; else if (variant === "danger") e.currentTarget.style.background = "rgba(248,113,113,0.2)" }}
      onMouseLeave={e => { if (variant === "primary") e.currentTarget.style.filter = "none"; else if (variant === "ghost") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)" } else if (variant === "subtle") e.currentTarget.style.color = "var(--text2)"; else if (variant === "danger") e.currentTarget.style.background = "var(--red2)" }}
      {...rest}
    >{lding ? <div className="spin-anim" style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff" }} /> : children}</button>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = "var(--accent)" }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.12)`, borderTopColor: color, animation: "spin 0.75s linear infinite", flexShrink: 0 }} />
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  const isErr = msg.type === "error"
  const isWarn = msg.type === "warn"
  const color = isErr ? "var(--red)" : isWarn ? "var(--amber)" : "var(--green)"
  const border = isErr ? "rgba(248,113,113,0.35)" : isWarn ? "rgba(251,191,36,0.35)" : "rgba(52,211,153,0.35)"
  const bg = isErr ? "rgba(40,10,10,0.95)" : isWarn ? "rgba(40,30,10,0.95)" : "rgba(10,30,20,0.95)"
  return (
    <div className="fade-up" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, background: bg, border: `1px solid ${border}`, borderRadius: "var(--radius)", padding: "10px 16px", color, fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow)", backdropFilter: "blur(12px)", maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      <Icon name={isErr ? "alertCircle" : isWarn ? "info" : "check"} size={14} />
      {msg.text}
    </div>
  )
}

// ── Docs Modal ────────────────────────────────────────────────────────────────
function DocsModal({ isOpen, onClose, kbId, kbName, docs, loading, onDelete, total, page, pages, onPageChange }) {
  if (!isOpen) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 680, maxHeight: "84vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {kbName} <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 13, fontFamily: "var(--mono)" }}>· {total} 片段</span>
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          ><Icon name="x" size={17} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {loading
            ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
            : docs.length === 0
              ? <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>暂无文档片段</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {docs.map((doc, i) => {
                    const ext = (doc.source || "").split(".").pop()?.toLowerCase() || ""
                    return (
                      <div key={doc.id} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: fileTypeBg(ext), display: "flex", alignItems: "center", justifyContent: "center", color: fileTypeColor(ext), fontSize: 8, fontFamily: "var(--mono)", flexShrink: 0, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                          {ext || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.source?.split("/").pop() || doc.source}
                              {doc.page != null && ` · p.${doc.page + 1}`}
                            </span>
                            {doc.char_count && <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", flexShrink: 0 }}>{doc.char_count} 字</span>}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, wordBreak: "break-word" }}>{doc.content}</div>
                        </div>
                        <button onClick={() => onDelete(kbId, doc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: 4, borderRadius: 6, flexShrink: 0, transition: "color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
                        ><Icon name="trash" size={15} /></button>
                      </div>
                    )
                  })}
                </div>
          }
        </div>
        {pages > 1 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Btn>
            <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>{page} / {pages}</span>
            <Btn size="sm" variant="ghost" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>下一页</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Delete KB Modal ───────────────────────────────────────────────────────────
function DeleteKbModal({ isOpen, onClose, kbId, kbName, onConfirm }) {
  if (!isOpen) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{ background: "var(--bg3)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--red)" }}>删除知识库</span>
        </div>
        <div style={{ padding: "22px 24px" }}>
          <p style={{ color: "var(--text2)", lineHeight: 1.75, fontSize: 14 }}>
            确定删除「<span style={{ color: "var(--text)", fontWeight: 600 }}>{kbName}</span>」？此操作将永久删除所有文档片段，无法恢复。
          </p>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn variant="danger" onClick={() => onConfirm(kbId)}>确认删除</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Rename KB Modal ───────────────────────────────────────────────────────────
function RenameKbModal({ isOpen, onClose, kb, onRename }) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [loading, setLoading] = useState(false)
  useEffect(() => { if (kb) { setName(kb.name || ""); setDesc(kb.description || "") } }, [kb])
  const handle = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onRename(kb.id, name.trim(), desc.trim())
    setLoading(false)
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑知识库"
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>取消</Btn>
          <Btn onClick={handle} disabled={!name.trim()} loading={loading} style={{ flex: 1 }}>保存</Btn>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="名称">
          <TextInput value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handle()} />
        </Field>
        <Field label="描述" hint="可选">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="描述此知识库的用途…" />
        </Field>
      </div>
    </Modal>
  )
}

// ── Create KB Dialog ──────────────────────────────────────────────────────────
function CreateKBDialog({ isOpen, onClose, onCreate, loading }) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const handle = () => { if (name.trim()) { onCreate(name, url.split("\n").filter(Boolean)); setName(""); setUrl("") } }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建知识库"
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>取消</Btn>
          <Btn onClick={handle} disabled={!name.trim()} loading={loading} style={{ flex: 1 }}>
            <Icon name="plus" size={15} />创建
          </Btn>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="知识库名称">
          <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="如：产品文档、研究论文…" autoFocus onKeyDown={e => e.key === "Enter" && handle()} />
        </Field>
        <Field label="初始网页" hint="可选，每行一个 URL">
          <Textarea value={url} onChange={e => setUrl(e.target.value)} placeholder={"https://example.com/docs\nhttps://..."} rows={3} />
        </Field>
      </div>
    </Modal>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
const ACCEPTED = ".pdf,.txt,.md,.html,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.xls,.csv"
const ACCEPTED_LABELS = "PDF · TXT · MD · HTML · DOCX · XLSX · CSV · PNG · JPG"

function Dropzone({ loading, onChange, fileRef, progress }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={e => { e.preventDefault(); setHover(false); const files = Array.from(e.dataTransfer.files); if (onChange && files.length) onChange({ target: { files } }) }}
      style={{ border: `1.5px dashed ${hover ? "var(--accent)" : "var(--border2)"}`, borderRadius: "var(--radius)", padding: "24px 20px", textAlign: "center", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", background: hover ? "var(--accent4)" : "var(--bg2)", position: "relative", overflow: "hidden" }}>
      {loading && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "var(--bg3)" }}>
          <div className="upload-progress" />
        </div>
      )}
      <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: "none" }} multiple onChange={onChange} />
      {loading
        ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Spinner size={20} />
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{progress || "处理中…"}</span>
          </div>
        : <>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: hover ? "var(--accent)" : "var(--text3)", transition: "color 0.2s" }}>
              <Icon name="upload" size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>拖放或点击上传</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{ACCEPTED_LABELS}</div>
          </>
      }
    </div>
  )
}

// ── Add Content Dialog ────────────────────────────────────────────────────────
function AddContentDialog({ isOpen, onClose, kb, onSuccess }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [taskStatus, setTaskStatus] = useState(null) // {status, message}
  const [toast, setToast] = useState(null)
  const fileRef = useRef()
  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 4000) }

  // Poll upload task status
  const pollTask = async (taskId) => {
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 1500))
      try {
        const res = await axios.get(`${API}/upload/task/${taskId}`)
        const t = res.data
        setTaskStatus(t)
        setUploadProgress(t.message)
        if (t.status === "done") {
          showToast({ type: "success", text: t.message })
          onSuccess()
          setLoading(false)
          return
        }
        if (t.status === "error") {
          showToast({ type: "error", text: t.message })
          setLoading(false)
          return
        }
      } catch {
        break
      }
    }
    setLoading(false)
    showToast({ type: "warn", text: "处理超时，请稍后刷新" })
  }

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setLoading(true)
    setTaskStatus(null)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        setUploadProgress(`正在上传 ${file.name}…`)
        const res = await axios.post(`${API}/upload?kb_id=${kb.id}&async_mode=true`, fd)
        if (res.data.task_id) {
          setUploadProgress("已加入处理队列，正在向量化…")
          await pollTask(res.data.task_id)
        }
      }
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || err.message })
      setLoading(false)
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleUrl = async () => {
    const urls = url.split("\n").filter(Boolean)
    if (!urls.length) return
    setLoading(true)
    setUploadProgress("正在抓取网页…")
    try {
      const res = await axios.post(`${API}/add-url`, { urls, kb_id: kb.id })
      const errs = res.data.errors || []
      if (errs.length) showToast({ type: "warn", text: `部分网页抓取失败：${errs[0]}` })
      else showToast({ type: "success", text: `已添加 ${res.data.message}` })
      setUrl("")
      onSuccess()
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || err.message })
    } finally { setLoading(false) }
  }

  const taskIcon = taskStatus?.status === "done" ? "checkCircle" : taskStatus?.status === "error" ? "alertCircle" : taskStatus?.status === "processing" ? "loader" : "clock"
  const taskColor = taskStatus?.status === "done" ? "var(--green)" : taskStatus?.status === "error" ? "var(--red)" : "var(--accent)"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`向「${kb?.name}」添加内容`}
      footer={<Btn variant="subtle" onClick={onClose} style={{ width: "100%" }}>完成</Btn>}
      maxWidth={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Field label="上传文档">
          <Dropzone loading={loading} onChange={handleFile} fileRef={fileRef} progress={uploadProgress} />
        </Field>
        {taskStatus && (
          <div className="fade-in" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
            <span style={{ color: taskColor, display: "flex" }}><Icon name={taskIcon} size={15} /></span>
            <span style={{ color: "var(--text2)" }}>{taskStatus.message}</span>
            {taskStatus.chunk_count && <span style={{ color: "var(--text3)", marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11 }}>{taskStatus.chunk_count} 片段</span>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <Field label="添加网页">
          <Textarea value={url} onChange={e => setUrl(e.target.value)} placeholder={"https://example.com\nhttps://..."} rows={3} />
          <Btn onClick={handleUrl} disabled={!url.trim() || loading} variant="ghost" style={{ marginTop: 8, width: "100%" }}>
            <Icon name="globe" size={14} />抓取网页
          </Btn>
        </Field>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ── Source Panel ──────────────────────────────────────────────────────────────
function SourcePanel({ sources, expandedQueries }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null
  const uniqueSources = sources.filter((s, i, arr) => arr.findIndex(x => x.source === s.source) === i)
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 11.5, padding: "3px 0", transition: "color 0.15s", fontFamily: "var(--mono)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
      >
        <Icon name="bookOpen" size={12} />
        <span>检索了 {uniqueSources.length} 个来源</span>
        {expandedQueries?.length > 1 && <span style={{ color: "var(--teal)" }}>· 查询已扩展</span>}
        <span style={{ transition: "transform 0.2s", display: "inline-flex", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
          <Icon name="chevronDown" size={11} />
        </span>
      </button>

      {open && (
        <div className="slide-in" style={{ marginTop: 8, padding: 12, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 12 }}>
          {expandedQueries?.length > 1 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7, fontFamily: "var(--mono)" }}>检索策略</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {expandedQueries.map((q, i) => (
                  <span key={i} className="query-pill" title={q}>{i === 0 ? "●" : "◦"} {q}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7, fontFamily: "var(--mono)" }}>引用来源</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {uniqueSources.map((s, i) => {
                const ext = s.label?.split(".").pop()?.toLowerCase() || ""
                const score = s.score != null ? Math.round(s.score * 100) : null
                return (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: score != null ? 3 : 0 }}>
                      <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--accent)", background: "var(--accent3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>[{s.index ?? i + 1}]</span>
                      <span style={{ fontSize: 11, color: fileTypeColor(ext), background: fileTypeBg(ext), borderRadius: 4, padding: "1px 5px", flexShrink: 0, fontFamily: "var(--mono)", textTransform: "uppercase", fontWeight: 700 }}>{ext || "?"}</span>
                      <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.label || s.source?.split("/").pop() || s.source}
                        {s.page != null && <span style={{ color: "var(--text3)" }}> · p.{s.page + 1}</span>}
                      </span>
                      {score != null && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", flexShrink: 0 }}>{score}%</span>}
                    </div>
                    {score != null && (
                      <div style={{ marginLeft: 50, height: 2, background: "var(--bg5)", borderRadius: 99 }}>
                        <div className="score-bar" style={{ width: `${Math.max(score, 5)}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--bg4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
        <Icon name="bot" size={14} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "4px 12px 12px 12px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text3)", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ role, content, sources, expandedQueries, isStreaming }) {
  const [copied, setCopied] = useState(false)
  const isUser = role === "user"

  const copy = () => {
    navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (isUser) {
    return (
      <div className="fade-up" style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ maxWidth: "80%", background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.18)", borderRadius: "12px 4px 12px 12px", padding: "11px 15px", fontSize: 14, lineHeight: 1.65, color: "var(--text)", wordBreak: "break-word" }}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--bg4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>
        <Icon name="sparkles" size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SourcePanel sources={sources} expandedQueries={expandedQueries} />
        <div
          className={`msg-body${isStreaming ? " typing-cursor" : ""}`}
          style={{ fontSize: 14, color: "var(--text)" }}
          dangerouslySetInnerHTML={{ __html: marked.parse(content || "") }}
        />
        {!isStreaming && content && (
          <button
            onClick={copy}
            style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text3)", fontSize: 11, fontFamily: "var(--mono)", padding: "3px 0", transition: "color 0.15s" }}
            onMouseEnter={e => !copied && (e.currentTarget.style.color = "var(--text2)")}
            onMouseLeave={e => !copied && (e.currentTarget.style.color = "var(--text3)")}
          >
            <Icon name={copied ? "check" : "copy"} size={12} />
            {copied ? "已复制" : "复制"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ hasKBs, currentKB, onCreate, onSend }) {
  const suggestions = ["这个文档主要讲了什么？", "请列出关键概念", "有哪些重要数据或结论？", "总结一下核心观点"]
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 24 }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)" }}>
        <Icon name="sparkles" size={26} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.02em" }}>
          {hasKBs ? `向「${currentKB?.name}」提问` : "创建第一个知识库"}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.7, maxWidth: 320 }}>
          {hasKBs
            ? "上传文档后，我会基于文档内容回答您的问题，并注明引用来源"
            : "建立知识库，上传 PDF、Word、Excel 等文档，然后与文档对话"}
        </div>
      </div>
      {hasKBs && currentKB?.chunk_count > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 400 }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSend(s)}
              style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", cursor: "pointer", fontSize: 12.5, color: "var(--text2)", textAlign: "left", lineHeight: 1.5, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border3)"; e.currentTarget.style.color = "var(--text)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)" }}
            >{s}</button>
          ))}
        </div>
      ) : !hasKBs ? (
        <Btn onClick={onCreate}><Icon name="plus" size={15} />新建知识库</Btn>
      ) : null}
    </div>
  )
}

// ── KB Item ───────────────────────────────────────────────────────────────────
function KBItem({ kb, active, onSelect, onDelete, onRename }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => onSelect(kb.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.15s", background: active ? "var(--accent3)" : hovered ? "var(--bg4)" : "transparent", border: `1px solid ${active ? "rgba(79,140,255,0.2)" : "transparent"}` }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? "var(--accent3)" : "var(--bg5)", border: `1px solid ${active ? "rgba(79,140,255,0.25)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: active ? "var(--accent2)" : "var(--text3)", flexShrink: 0, transition: "all 0.15s" }}>
        <Icon name="database" size={12} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>{kb.name}</div>
        <div style={{ fontSize: 10.5, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 1 }}>
          {kb.chunk_count ?? kb.doc_count ?? 0} 片段
          {kb.updated_at && <span style={{ marginLeft: 5 }}>· {new Date(kb.updated_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>}
        </div>
      </div>
      {hovered && (
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onRename(kb) }}
            style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", borderRadius: 5, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent2)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          ><Icon name="pencil" size={12} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(kb.id) }}
            style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", borderRadius: 5, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
          ><Icon name="trash" size={12} /></button>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  // Inject styles
  useEffect(() => {
    const el = document.createElement("style")
    el.textContent = GLOBAL_STYLES
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  const [kbs, setKbs] = useState([])
  const [activeKB, setActiveKB] = useState("default")
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState(null)
  const [sessionId] = useState(randomId)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [showDeleteKB, setShowDeleteKB] = useState(null)
  const [showRenameKB, setShowRenameKB] = useState(null)
  const [creating, setCreating] = useState(false)

  // Docs pagination
  const [docs, setDocs] = useState([])
  const [docsTotal, setDocsTotal] = useState(0)
  const [docsPage, setDocsPage] = useState(1)
  const [docsPages, setDocsPages] = useState(1)
  const [docsLoading, setDocsLoading] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  const showToast = useCallback((t) => { setToast(t); setTimeout(() => setToast(null), 3500) }, [])
  const currentKB = kbs.find(k => k.id === activeKB) || { name: "知识库", id: activeKB }

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px"
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const fetchKBs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/kb/list`)
      const list = res.data.knowledge_bases || []
      setKbs(list)
      if (list.length > 0 && !list.find(k => k.id === activeKB)) {
        setActiveKB(list[0].id)
      }
    } catch (e) {
      showToast({ type: "error", text: "无法连接后端，请确认服务已启动" })
    }
  }, [activeKB, showToast])

  useEffect(() => { fetchKBs() }, [])

  const fetchDocs = async (kbId, pg = 1) => {
    setShowDocs(true)
    setDocsLoading(true)
    setDocsPage(pg)
    try {
      const res = await axios.get(`${API}/kb/${kbId}/docs?page=${pg}&page_size=50`)
      setDocs(res.data.documents || [])
      setDocsTotal(res.data.total || 0)
      setDocsPages(res.data.pages || 1)
    } catch { showToast({ type: "error", text: "加载文档失败" }) }
    finally { setDocsLoading(false) }
  }

  const handleCreateKB = async (name, urls) => {
    setCreating(true)
    try {
      const res = await axios.post(`${API}/kb/create`, { name, description: "" })
      const kbId = res.data.kb_id
      if (urls?.length) {
        await axios.post(`${API}/add-url`, { urls, kb_id: kbId })
      }
      await fetchKBs()
      setActiveKB(kbId)
      setMessages([])
      setShowCreate(false)
      showToast({ type: "success", text: `知识库「${name}」已创建` })
    } catch (e) {
      showToast({ type: "error", text: e.response?.data?.detail || e.message })
    } finally { setCreating(false) }
  }

  const handleDeleteKB = async (kbId) => {
    try {
      await axios.delete(`${API}/kb/${kbId}`)
      await fetchKBs()
      setShowDeleteKB(null)
      if (activeKB === kbId) { setActiveKB(kbs.find(k => k.id !== kbId)?.id || "default"); setMessages([]) }
      showToast({ type: "success", text: "知识库已删除" })
    } catch { showToast({ type: "error", text: "删除失败" }) }
  }

  const handleRenameKB = async (kbId, name, description) => {
    try {
      await axios.put(`${API}/kb/${kbId}`, { name, description })
      await fetchKBs()
      showToast({ type: "success", text: "已保存" })
    } catch { showToast({ type: "error", text: "保存失败" }) }
  }

  const handleDeleteDoc = async (kbId, docId) => {
    try {
      await axios.delete(`${API}/kb/${kbId}/docs/${docId}`)
      await fetchDocs(kbId, docsPage)
      await fetchKBs()
      showToast({ type: "success", text: "文档片段已删除" })
    } catch { showToast({ type: "error", text: "删除失败" }) }
  }

  const clearSession = async () => {
    try { await axios.delete(`${API}/session/${sessionId}`) } catch {}
    setMessages([])
  }

  const sendMessage = useCallback(async (text) => {
    const q = typeof text === "string" ? text : input.trim()
    if (!q || loading) return
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    const userMsg = { id: randomId(), role: "user", content: q }
    const botId = randomId()
    const botMsg = { id: botId, role: "assistant", content: "", sources: null, expandedQueries: null }

    setMessages(prev => [...prev, userMsg, botMsg])
    setLoading(true)
    setStreamingId(botId)

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: q, kb_id: activeKB, stream: true }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "服务错误" }))
        throw new Error(err.detail || "服务错误")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "sources") {
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, sources: data.sources, expandedQueries: data.expanded_queries } : m))
            } else if (data.type === "content") {
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: m.content + data.content } : m))
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr
          }
        }
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: `> ⚠ 错误：${e.message}` } : m))
    } finally {
      setLoading(false)
      setStreamingId(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, sessionId, activeKB])

  const switchKB = (kbId) => {
    setActiveKB(kbId)
    setMessages([])
    setSidebarOpen(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ height: "100%", display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside style={{
          width: 256,
          flexShrink: 0,
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 50,
          "@media (max-width: 768px)": { position: "fixed" },
          ...(window.innerWidth <= 768 ? {
            position: "fixed", top: 0, left: 0, bottom: 0,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          } : {})
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)" }}>
                <Icon name="layers" size={13} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>RAG 知识库</span>
            </div>
            <button onClick={() => setShowCreate(true)} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.2)", borderRadius: 7, cursor: "pointer", color: "var(--accent)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff" }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--accent3)"; e.currentTarget.style.color = "var(--accent)" }}
              title="新建知识库"
            ><Icon name="plus" size={13} /></button>
          </div>

          {/* KB list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {kbs.length === 0
              ? <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                  <div style={{ marginBottom: 12 }}><Icon name="database" size={24} /></div>
                  暂无知识库<br />
                  <button onClick={() => setShowCreate(true)} style={{ marginTop: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>+ 新建一个</button>
                </div>
              : kbs.map(kb => (
                  <KBItem key={kb.id} kb={kb} active={kb.id === activeKB}
                    onSelect={switchKB}
                    onDelete={(id) => setShowDeleteKB(id)}
                    onRename={(kb) => setShowRenameKB(kb)}
                  />
                ))
            }
          </div>

          {/* Sidebar footer */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "var(--teal2)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8, fontSize: 11, color: "var(--teal)", fontFamily: "var(--mono)" }}>
              <Icon name="zap" size={10} />
              <span>查询扩展 · MMR 检索</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Header */}
          <header style={{ height: 58, flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
            {window.innerWidth <= 768 && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--text2)", display: "flex" }}>
                <Icon name="menu" size={16} />
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)", flexShrink: 0 }}>
                <Icon name="database" size={12} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentKB.name}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                  {currentKB.chunk_count ?? 0} 片段 · {currentKB.doc_count ?? 0} 文档
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <Btn variant="ghost" size="sm" onClick={() => fetchDocs(activeKB, 1)}>
                <Icon name="fileText" size={13} />文档
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => setShowAddContent(true)}>
                <Icon name="upload" size={13} />上传
              </Btn>
              {messages.length > 0 && (
                <button onClick={clearSession} title="清空对话"
                  style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: "var(--text3)", display: "flex", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)" }}
                ><Icon name="trash" size={13} /></button>
              )}
            </div>
          </header>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, minHeight: "100%" }}>
              {messages.length === 0
                ? <EmptyState hasKBs={kbs.length > 0} currentKB={currentKB} onCreate={() => setShowCreate(true)} onSend={sendMessage} />
                : messages.map((m, i) => (
                    <Message
                      key={m.id || i}
                      role={m.role}
                      content={m.content}
                      sources={m.sources}
                      expandedQueries={m.expandedQueries}
                      isStreaming={m.id === streamingId}
                    />
                  ))
              }
              {loading && !streamingId && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div
                style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 16, padding: "7px 8px 7px 14px", transition: "border-color 0.15s, box-shadow 0.15s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(79,140,255,0.35)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,140,255,0.07)" }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.boxShadow = "none" }}
              >
                <textarea
                  ref={el => { inputRef.current = el; textareaRef.current = el }}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="输入问题… Enter 发送，Shift+Enter 换行"
                  disabled={loading}
                  rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 14, lineHeight: 1.6, resize: "none", maxHeight: 160, overflowY: "auto", paddingTop: 5, paddingBottom: 5 }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{ width: 36, height: 36, borderRadius: 10, border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", background: input.trim() && !loading ? "var(--accent)" : "var(--bg4)", color: input.trim() && !loading ? "#fff" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", boxShadow: input.trim() && !loading ? "0 2px 10px rgba(79,140,255,0.4)" : "none" }}
                >
                  {loading && streamingId
                    ? <Spinner size={14} color="rgba(255,255,255,0.5)" />
                    : <Icon name="send" size={15} />
                  }
                </button>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text3)", textAlign: "center", marginTop: 6, fontFamily: "var(--mono)" }}>
                v4.0 · {currentKB.name} · 查询扩展 + MMR · 支持 PDF/DOCX/XLSX/CSV/图片
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateKBDialog isOpen={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreateKB} loading={creating} />
      <AddContentDialog isOpen={showAddContent} onClose={() => setShowAddContent(false)} kb={currentKB} onSuccess={fetchKBs} />
      <DocsModal
        isOpen={showDocs} onClose={() => setShowDocs(false)}
        kbId={activeKB} kbName={currentKB.name}
        docs={docs} loading={docsLoading} onDelete={handleDeleteDoc}
        total={docsTotal} page={docsPage} pages={docsPages}
        onPageChange={(p) => fetchDocs(activeKB, p)}
      />
      <DeleteKbModal isOpen={!!showDeleteKB} onClose={() => setShowDeleteKB(null)} kbId={showDeleteKB} kbName={kbs.find(k => k.id === showDeleteKB)?.name || ""} onConfirm={handleDeleteKB} />
      <RenameKbModal isOpen={!!showRenameKB} onClose={() => setShowRenameKB(null)} kb={showRenameKB} onRename={handleRenameKB} />
      <Toast msg={toast} />
    </>
  )
}