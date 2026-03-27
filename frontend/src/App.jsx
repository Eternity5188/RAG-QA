import { useState, useRef, useEffect, useCallback } from "react"
import axios from "axios"
import { marked } from "marked"

const API = "http://localhost:8000"

marked.use({ breaks: true, gfm: true })

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Icons ─────────────────────────────────────────────────────────────────────
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
    chevronRight: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
    chevronLeft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
    chevronDown: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
    user: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    bot: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>,
    layers: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>,
    zap: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    copy: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
    bookOpen: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    gitBranch: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
    info: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  }
  return <span style={{ display: "inline-flex", alignItems: "center" }}>{icons[name] || null}</span>
}

// ── Global Styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #07080d;
    --bg2: #0d0f18;
    --bg3: #131520;
    --bg4: #191c2a;
    --bg5: #1f2233;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.10);
    --border3: rgba(255,255,255,0.16);
    --text: #dde1f0;
    --text2: #8890b0;
    --text3: #4a5070;
    --accent: #4f8cff;
    --accent2: #7eb3ff;
    --accent3: rgba(79,140,255,0.12);
    --accent4: rgba(79,140,255,0.06);
    --teal: #2dd4bf;
    --teal2: rgba(45,212,191,0.12);
    --amber: #fbbf24;
    --amber2: rgba(251,191,36,0.12);
    --green: #34d399;
    --green2: rgba(52,211,153,0.12);
    --red: #f87171;
    --red2: rgba(248,113,113,0.12);
    --purple: #a78bfa;
    --purple2: rgba(167,139,250,0.12);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.5);
    --shadow: 0 4px 24px rgba(0,0,0,0.6);
    --shadow-xl: 0 12px 48px rgba(0,0,0,0.8);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'Sora', system-ui, sans-serif;
  }

  html, body, #root {
    height: 100%;
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text3); }
  ::selection { background: rgba(79,140,255,0.25); }
  input, textarea, button { font-family: inherit; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }

  .fade-up { animation: fadeSlideUp 0.24s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .fade-in { animation: fadeIn 0.2s ease both; }
  .slide-in { animation: slideIn 0.2s ease both; }

  /* Message content typography */
  .msg-body { line-height: 1.75; }
  .msg-body p { margin: 0 0 10px 0; }
  .msg-body p:last-child { margin-bottom: 0; }
  .msg-body h1, .msg-body h2, .msg-body h3 { margin: 16px 0 8px 0; line-height: 1.4; font-weight: 600; }
  .msg-body h1 { font-size: 17px; }
  .msg-body h2 { font-size: 15px; color: var(--text2); }
  .msg-body h3 { font-size: 14px; color: var(--text2); }
  .msg-body ul, .msg-body ol { margin: 8px 0; padding-left: 20px; }
  .msg-body li { margin: 5px 0; }
  .msg-body code {
    background: rgba(79,140,255,0.1);
    border: 1px solid rgba(79,140,255,0.15);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--accent2);
  }
  .msg-body pre {
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border2);
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 10px 0;
  }
  .msg-body pre code {
    background: none;
    border: none;
    padding: 0;
    color: var(--text);
    font-size: 13px;
  }
  .msg-body blockquote {
    border-left: 3px solid var(--accent);
    margin: 10px 0;
    padding: 6px 14px;
    color: var(--text2);
    background: var(--accent4);
    border-radius: 0 6px 6px 0;
  }
  .msg-body table { border-collapse: collapse; margin: 10px 0; width: 100%; font-size: 13px; }
  .msg-body th, .msg-body td { border: 1px solid var(--border2); padding: 8px 12px; text-align: left; }
  .msg-body th { background: var(--bg4); font-weight: 600; color: var(--text2); }
  .msg-body a { color: var(--accent2); text-decoration: none; }
  .msg-body a:hover { text-decoration: underline; }
  .msg-body hr { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
  .msg-body strong { color: var(--text); font-weight: 600; }

  /* Cursor blink */
  .typing-cursor::after {
    content: '▋';
    display: inline-block;
    animation: blink 0.9s step-end infinite;
    color: var(--accent);
    font-size: 0.85em;
    margin-left: 2px;
    vertical-align: baseline;
  }

  /* Source badge */
  .src-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px 3px 7px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
    background: var(--bg4);
    border: 1px solid var(--border2);
    color: var(--text2);
    cursor: default;
    transition: all 0.15s;
    font-family: var(--mono);
  }
  .src-badge:hover {
    background: var(--bg5);
    border-color: var(--border3);
    color: var(--text);
  }

  /* Query pill */
  .query-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 11px;
    background: var(--teal2);
    border: 1px solid rgba(45,212,191,0.2);
    color: var(--teal);
    font-family: var(--mono);
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

// ── Modal Shell ────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, footer, maxWidth = 480 }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose()
    if (isOpen) document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])
  if (!isOpen) return null
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
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

// ── Docs Modal ─────────────────────────────────────────────────────────────────
function DocsModal({ isOpen, onClose, kbId, kbName, docs, loading, onDelete }) {
  if (!isOpen) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 660, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {kbName} <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 13 }}>· {docs.length} 个片段</span>
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: 4, borderRadius: 6 }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {loading
            ? <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>加载中...</div>
            : docs.length === 0
              ? <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>暂无文档片段</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {docs.map((doc, i) => (
                    <div key={doc.id} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 11, fontFamily: "var(--mono)", flexShrink: 0, fontWeight: 600 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.source?.split("/").pop() || doc.source}
                          {doc.page != null && ` · p.${doc.page + 1}`}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, wordBreak: "break-word" }}>{doc.content}</div>
                      </div>
                      <button onClick={() => onDelete(kbId, doc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: 4, borderRadius: 6, flexShrink: 0, transition: "color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
                      ><Icon name="trash" size={15} /></button>
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>
    </div>
  )
}

// ── Delete KB Modal ────────────────────────────────────────────────────────────
function DeleteKbModal({ isOpen, onClose, kbId, kbName, onConfirm }) {
  if (!isOpen) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{ background: "var(--bg3)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "var(--shadow-xl)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>删除知识库</span>
        </div>
        <div style={{ padding: "22px 24px" }}>
          <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14 }}>
            确定要删除「<span style={{ color: "var(--text)", fontWeight: 500 }}>{kbName}</span>」？此操作将永久删除所有文档片段，无法恢复。
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

// ── Form Components ────────────────────────────────────────────────────────────
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

const inputStyle = {
  width: "100%", background: "var(--bg2)", border: "1px solid var(--border2)",
  borderRadius: "var(--radius-sm)", padding: "10px 14px",
  color: "var(--text)", fontSize: 14, outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
}
function TextInput(props) {
  return (
    <input style={inputStyle}
      onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent4)" }}
      onBlur={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none" }}
      {...props} />
  )
}
function Textarea(props) {
  return (
    <textarea style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
      onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent4)" }}
      onBlur={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none" }}
      {...props} />
  )
}

// ── Button ─────────────────────────────────────────────────────────────────────
function Btn({ children, variant = "primary", disabled, onClick, style: s, size = "md", ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontWeight: 500, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "var(--radius-sm)", transition: "all 0.15s", opacity: disabled ? 0.4 : 1,
    fontSize: size === "sm" ? 12.5 : 13.5, padding: size === "sm" ? "6px 13px" : "9px 17px",
    letterSpacing: "0.01em",
  }
  const variants = {
    primary: { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 10px rgba(79,140,255,0.35)" },
    ghost: { background: "transparent", color: "var(--text2)", border: "1px solid var(--border2)" },
    danger: { background: "var(--red2)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.25)" },
    subtle: { background: "var(--bg4)", color: "var(--text2)", border: "1px solid var(--border)" },
  }
  return (
    <button disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...s }}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === "primary") e.currentTarget.style.filter = "brightness(1.12)"
        else if (variant === "ghost") { e.currentTarget.style.background = "var(--bg4)"; e.currentTarget.style.color = "var(--text)" }
        else if (variant === "subtle") e.currentTarget.style.color = "var(--text)"
        else if (variant === "danger") e.currentTarget.style.background = "rgba(248,113,113,0.2)"
      }}
      onMouseLeave={e => {
        if (variant === "primary") e.currentTarget.style.filter = "none"
        else if (variant === "ghost") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)" }
        else if (variant === "subtle") e.currentTarget.style.color = "var(--text2)"
        else if (variant === "danger") e.currentTarget.style.background = "var(--red2)"
      }}
      {...rest}
    >{children}</button>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
function Dropzone({ loading, onChange, fileRef }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={e => { e.preventDefault(); setHover(false); const files = Array.from(e.dataTransfer.files); if (onChange && files.length) onChange({ target: { files } }) }}
      style={{ border: `1.5px dashed ${hover ? "var(--accent)" : "var(--border2)"}`, borderRadius: "var(--radius)", padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: hover ? "var(--accent4)" : "var(--bg2)" }}>
      <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.html,.png,.jpg,.jpeg" style={{ display: "none" }} multiple onChange={onChange} />
      {loading
        ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text2)" }}>处理中…</span>
          </div>
        : <>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: hover ? "var(--accent)" : "var(--text3)", transition: "color 0.2s" }}>
              <Icon name="upload" size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>拖放或点击上传</div>
            <div style={{ fontSize: 11.5, color: "var(--text3)", fontFamily: "var(--mono)" }}>PDF · TXT · MD · HTML · PNG · JPG</div>
          </>
      }
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null
  const isErr = msg.type === "error"
  return (
    <div className="fade-up" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, background: isErr ? "rgba(40,10,10,0.95)" : "rgba(10,30,20,0.95)", border: `1px solid ${isErr ? "rgba(248,113,113,0.35)" : "rgba(52,211,153,0.35)"}`, borderRadius: "var(--radius)", padding: "10px 16px", color: isErr ? "var(--red)" : "var(--green)", fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow)", backdropFilter: "blur(12px)" }}>
      <Icon name={isErr ? "x" : "check"} size={14} />
      {msg.text}
    </div>
  )
}

// ── Create KB Dialog ──────────────────────────────────────────────────────────
function CreateKBDialog({ isOpen, onClose, onCreate, loading }) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const handleCreate = () => { if (name.trim()) { onCreate(name, url.split("\n").filter(Boolean)); setName(""); setUrl("") } }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建知识库"
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>取消</Btn>
          <Btn onClick={handleCreate} disabled={!name.trim() || loading} style={{ flex: 1 }}>
            {loading ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />创建中</> : <><Icon name="plus" size={15} />创建</>}
          </Btn>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="知识库名称">
          <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="如：产品文档、研究论文…" autoFocus onKeyDown={e => e.key === "Enter" && handleCreate()} />
        </Field>
        <Field label="初始网页" hint="可选，每行一个 URL">
          <Textarea value={url} onChange={e => setUrl(e.target.value)} placeholder={"https://example.com/docs\nhttps://..."} rows={3} />
        </Field>
      </div>
    </Modal>
  )
}

// ── Add Content Dialog ────────────────────────────────────────────────────────
function AddContentDialog({ isOpen, onClose, kb, onSuccess }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef()
  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3000) }

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setLoading(true)
    try {
      for (const file of files) {
        const fd = new FormData(); fd.append("file", file)
        await axios.post(`${API}/upload?kb_id=${kb.id}`, fd)
      }
      showToast({ type: "success", text: `${files.length} 个文件上传成功` })
      onSuccess()
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || err.message })
    } finally { setLoading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  const handleUrl = async () => {
    const urls = url.split("\n").filter(Boolean)
    if (!urls.length) return
    setLoading(true)
    try {
      await axios.post(`${API}/add-url`, { urls, kb_id: kb.id })
      showToast({ type: "success", text: "网页添加成功" }); setUrl(""); onSuccess()
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || err.message })
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`向 "${kb?.name}" 添加内容`}
      footer={<Btn variant="subtle" onClick={onClose} style={{ width: "100%" }}>完成</Btn>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Field label="上传文档">
          <Dropzone loading={loading} onChange={handleFile} fileRef={fileRef} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11.5, color: "var(--text3)", fontFamily: "var(--mono)" }}>OR</span>
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

// ── Source Panel ───────────────────────────────────────────────────────────────
// 显示检索到的来源，支持展开/收起
function SourcePanel({ sources, expandedQueries }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null

  // 去重 sources
  const uniqueSources = sources.filter((s, i, arr) => arr.findIndex(x => x.source === s.source) === i)

  return (
    <div style={{ marginBottom: 8 }}>
      {/* 展开/收起 trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 11.5, padding: "3px 0", transition: "color 0.15s", fontFamily: "var(--mono)" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}
      >
        <Icon name="bookOpen" size={12} />
        <span>检索了 {uniqueSources.length} 个来源</span>
        {expandedQueries?.length > 1 && (
          <span style={{ color: "var(--teal)", marginLeft: 2 }}>· 查询已扩展</span>
        )}
        <span style={{ transition: "transform 0.2s", display: "inline-flex", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
          <Icon name="chevronDown" size={11} />
        </span>
      </button>

      {/* 展开内容 */}
      {open && (
        <div className="slide-in" style={{ marginTop: 8, padding: 12, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 扩展查询 */}
          {expandedQueries?.length > 1 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--mono)" }}>检索策略</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {expandedQueries.map((q, i) => (
                  <span key={i} className="query-pill" title={q}>
                    {i === 0 ? "●" : "◦"} {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 来源列表 */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--mono)" }}>引用来源</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {uniqueSources.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--accent)", background: "var(--accent3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    [{s.index ?? i + 1}]
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.label || s.source?.split("/").pop() || s.source}
                    {s.page != null && <span style={{ color: "var(--text3)" }}> · p.{s.page + 1}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Message ────────────────────────────────────────────────────────────────────
function Message({ role, content, sources, expandedQueries, msgKey: externalKey, isStreaming }) {
  const isUser = role === "user"
  const isError = content?.startsWith("❌")
  const [copied, setCopied] = useState(false)

  const copyContent = () => {
    navigator.clipboard.writeText(content)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const msgId = externalKey || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  return (
    <div className="fade-up" style={{ display: "flex", gap: 12, flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start" }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "var(--accent)" : "var(--bg4)",
        border: isUser ? "none" : "1px solid var(--border2)",
        color: isUser ? "#fff" : "var(--accent2)",
        boxShadow: isUser ? "0 2px 10px rgba(79,140,255,0.4)" : "none",
        marginTop: 2,
      }}>
        <Icon name={isUser ? "user" : "bot"} size={14} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 5, alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Source panel (only for AI messages, before bubble) */}
        {!isUser && !isError && (sources?.length > 0 || expandedQueries?.length > 1) && (
          <div style={{ width: "100%" }}>
            <SourcePanel sources={sources} expandedQueries={expandedQueries} />
          </div>
        )}

        {/* Bubble */}
        <div style={{
          padding: "11px 15px",
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          background: isUser ? "var(--accent)" : isError ? "var(--red2)" : "var(--bg3)",
          border: isUser ? "none" : `1px solid ${isError ? "rgba(248,113,113,0.2)" : "var(--border)"}`,
          color: isUser ? "#fff" : isError ? "var(--red)" : "var(--text)",
          fontSize: 14, lineHeight: 1.65, fontWeight: 400,
          boxShadow: isUser ? "0 2px 10px rgba(79,140,255,0.25)" : "none",
        }}>
          {isUser
            ? <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
            : isError
              ? <span>{content?.replace(/^❌\s*/, '')}</span>
              : <div
                  id={msgId}
                  className={`msg-body${isStreaming ? " typing-cursor" : ""}`}
                  dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}
                />
          }
        </div>

        {/* Copy btn */}
        {!isUser && content && !isError && !isStreaming && (
          <button onClick={copyContent} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: copied ? "var(--green)" : "var(--text3)", fontSize: 11.5, padding: "2px 4px", borderRadius: 4, transition: "color 0.15s", fontFamily: "var(--mono)" }}>
            <Icon name={copied ? "check" : "copy"} size={11} />
            {copied ? "已复制" : "复制"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="fade-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg4)", border: "1px solid var(--border2)", color: "var(--accent2)", marginTop: 2 }}>
        <Icon name="bot" size={14} />
      </div>
      <div style={{ padding: "13px 16px", borderRadius: "4px 14px 14px 14px", background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 140, 280].map(delay => (
          <span key={delay} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent2)", display: "block", animation: `pulse 1.1s ${delay}ms ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse, knowledgeBases, activeKB, onSelectKB, onCreateKB, onDeleteKB }) {
  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 40 }} className="lg-hide" />
      )}
      <aside style={{
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
        width: collapsed ? 60 : 256,
        background: "var(--bg2)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "width 0.22s cubic-bezier(0.22,1,0.36,1), transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        overflow: "hidden",
      }} className="sidebar">

        {/* Header */}
        <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 10, minHeight: 60 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #4f8cff, #7eb3ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(79,140,255,0.4)" }}>
                <Icon name="layers" size={15} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em", whiteSpace: "nowrap", color: "var(--text)" }}>RAG QA</span>
            </div>
          )}
          <button onClick={onToggleCollapse} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 7, padding: 6, cursor: "pointer", color: "var(--text3)", display: "flex", flexShrink: 0, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border2)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)" }}
          ><Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={14} /></button>
        </div>

        {/* New KB button */}
        <div style={{ padding: collapsed ? "10px 8px" : "10px 10px 4px" }}>
          {!collapsed
            ? <button onClick={onCreateKB} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: "var(--accent4)", border: "1px dashed rgba(79,140,255,0.35)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--accent2)", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent3)"; e.currentTarget.style.borderColor = "var(--accent)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--accent4)"; e.currentTarget.style.borderColor = "rgba(79,140,255,0.35)" }}>
                <Icon name="plus" size={14} />新建知识库
              </button>
            : <div style={{ display: "flex", justifyContent: "center" }}>
                <button onClick={onCreateKB} title="新建知识库" style={{ background: "var(--accent4)", border: "1px dashed rgba(79,140,255,0.35)", borderRadius: 8, padding: 7, cursor: "pointer", color: "var(--accent2)", display: "flex", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--accent3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--accent4)"}>
                  <Icon name="plus" size={15} />
                </button>
              </div>
          }
        </div>

        {/* KB List */}
        <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "4px 8px" : "4px 10px" }}>
          {!collapsed && knowledgeBases.length > 0 && (
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 4px 5px", fontFamily: "var(--mono)" }}>知识库</div>
          )}
          {!collapsed && knowledgeBases.length === 0 && (
            <div style={{ padding: "20px 4px", textAlign: "center", color: "var(--text3)", fontSize: 12.5 }}>暂无知识库</div>
          )}
          {knowledgeBases.map(kb => {
            const active = activeKB === kb.id
            return (
              <div key={kb.id} title={collapsed ? kb.name : undefined} onClick={() => { onSelectKB(kb.id); onClose() }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: collapsed ? "8px" : "8px 9px", borderRadius: "var(--radius-sm)", cursor: "pointer", marginBottom: 2, background: active ? "var(--accent3)" : "transparent", border: `1px solid ${active ? "rgba(79,140,255,0.2)" : "transparent"}`, color: active ? "var(--accent2)" : "var(--text2)", transition: "all 0.13s", justifyContent: collapsed ? "center" : undefined }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg4)"; e.currentTarget.style.color = "var(--text)" } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)" } }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "rgba(79,140,255,0.18)" : "var(--bg3)", border: "1px solid var(--border)" }}>
                  <Icon name="database" size={12} />
                </div>
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kb.name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 1, fontFamily: "var(--mono)" }}>{kb.doc_count ?? 0} 片段</div>
                  </div>
                )}
                {!collapsed && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteKB(kb.id) }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "transparent", display: "flex", padding: 4, borderRadius: 4, flexShrink: 0, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                    onMouseLeave={e => e.currentTarget.style.color = "transparent"}>
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10.5, color: "var(--text3)", textAlign: "center", fontFamily: "var(--mono)" }}>
              查询扩展 · MMR 检索 · 重排序
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  "这份文档主要讲了什么？",
  "请总结文档的核心观点",
  "有哪些关键数据或结论？",
  "文档中提到了哪些方法？",
]

function EmptyState({ hasKBs, currentKB, onCreate, onSend }) {
  if (!hasKBs) {
    return (
      <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 18, padding: 40, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, rgba(79,140,255,0.12), rgba(126,179,255,0.08))", border: "1px solid rgba(79,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)" }}>
          <Icon name="layers" size={26} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.025em" }}>RAG 智能问答</h2>
          <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.7, maxWidth: 300 }}>上传文档，构建知识库，开始与您的文档对话</p>
        </div>
        <Btn onClick={onCreate}><Icon name="plus" size={14} />创建知识库</Btn>
      </div>
    )
  }
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, padding: "40px 20px", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)" }}>
          <Icon name="sparkles" size={20} />
        </div>
        <p style={{ fontSize: 15, color: "var(--text2)", fontWeight: 500 }}>向 <span style={{ color: "var(--accent2)" }}>{currentKB?.name}</span> 提问</p>
        <p style={{ fontSize: 12.5, color: "var(--text3)" }}>已启用查询扩展 · MMR 多样性检索 · 相关性重排</p>
      </div>
      {/* 快捷建议 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500 }}>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button key={i} onClick={() => onSend(q)}
            style={{ padding: "7px 13px", borderRadius: 99, background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)", fontSize: 12.5, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--sans)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg4)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border3)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.borderColor = "var(--border2)" }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddContent, setShowAddContent] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('rag_session_id')
    if (saved) return saved
    const id = randomId()
    localStorage.setItem('rag_session_id', id)
    return id
  })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState(null)
  const [kbs, setKbs] = useState([])
  const [activeKB, setActiveKB] = useState("default")
  const [toast, setToast] = useState(null)
  const [showDocs, setShowDocs] = useState(false)
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [showDeleteKB, setShowDeleteKB] = useState(null)
  const bottomRef = useRef()
  const inputRef = useRef()
  const textareaRef = useRef()

  useEffect(() => { fetchKBs() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [])

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 3200) }

  const fetchKBs = async () => {
    try {
      const { data } = await axios.get(`${API}/kb/list`)
      setKbs(data.knowledge_bases || [])
    } catch { }
  }

  const handleCreateKB = async (name, urls) => {
    setCreating(true)
    try {
      const { data } = await axios.post(`${API}/kb/create`, { name, description: "" })
      const kbId = data.kb_id
      if (urls?.length) await axios.post(`${API}/add-url`, { urls, kb_id: kbId })
      await fetchKBs()
      setActiveKB(kbId)
      setShowCreate(false)
      showToast({ type: "success", text: "知识库创建成功" })
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || "创建失败" })
    } finally { setCreating(false) }
  }

  const handleDeleteKB = async (kbId) => {
    try {
      await axios.delete(`${API}/kb/${kbId}`)
      await fetchKBs()
      if (activeKB === kbId) setActiveKB("default")
      setShowDeleteKB(null)
      showToast({ type: "success", text: "知识库已删除" })
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || "删除失败" })
    }
  }

  const fetchDocs = async (kbId) => {
    setDocsLoading(true); setShowDocs(true)
    try {
      const { data } = await axios.get(`${API}/kb/${kbId}/docs`)
      setDocs(data.documents || [])
    } catch { setDocs([]) }
    finally { setDocsLoading(false) }
  }

  const handleDeleteDoc = async (kbId, docId) => {
    try {
      await axios.delete(`${API}/kb/${kbId}/docs/${docId}`)
      await fetchDocs(kbId); await fetchKBs()
      showToast({ type: "success", text: "文档片段已删除" })
    } catch (err) {
      showToast({ type: "error", text: err.response?.data?.detail || "删除失败" })
    }
  }

  const sendMessage = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question, kb_id: activeKB }),
      })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = "", sources = [], expandedQueries = []
      const msgKey = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      setStreamingId(msgKey)
      setMessages(prev => [...prev, { role: "ai", content: "", id: msgKey, sources: [], expandedQueries: [], msgKey }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split("\n").filter(Boolean)
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === "sources") {
              sources = d.sources || []
              expandedQueries = d.expanded_queries || []
              setMessages(prev => prev.map(m => m.id === msgKey ? { ...m, sources, expandedQueries } : m))
            } else if (d.type === "content") {
              full += d.content
              setMessages(prev => prev.map(m => m.id === msgKey ? { ...m, content: full } : m))
            } else if (d.type === "done") {
              setMessages(prev => prev.map(m => m.id === msgKey ? { ...m, sources, expandedQueries } : m))
            } else if (d.type === "error") {
              setMessages(prev => prev.map(m => m.id === msgKey ? { ...m, content: `❌ ${d.error || '请求失败'}` } : m))
            }
          } catch { }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: `❌ 请求失败: ${err.message}` }])
    } finally {
      setLoading(false)
      setStreamingId(null)
    }
  }

  const clearSession = async () => {
    if (!confirm("确定清空当前对话？")) return
    try { await axios.delete(`${API}/session/${sessionId}`); setMessages([]) } catch { }
  }

  const currentKB = kbs.find(kb => kb.id === activeKB) || { id: "default", name: "默认知识库", doc_count: 0 }
  const sidebarWidth = sidebarCollapsed ? 60 : 256

  const handleInputChange = (e) => {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px" }
  }

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <style>{`
        @media (min-width: 1024px) {
          .sidebar { transform: translateX(0) !important; position: relative !important; height: 100vh; }
          .lg-hide { display: none !important; }
        }
        .app-layout { display: flex; height: 100vh; overflow: hidden; }
        .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
      `}</style>

      <div className="app-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          knowledgeBases={kbs}
          activeKB={activeKB}
          onSelectKB={setActiveKB}
          onCreateKB={() => setShowCreate(true)}
          onDeleteKB={(id) => setShowDeleteKB(id)}
        />

        <main className="main-area">
          {/* Header */}
          <header style={{ height: 60, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
            <button className="lg-hide" onClick={() => setSidebarOpen(true)} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--text2)", display: "flex" }}>
              <Icon name="menu" size={17} />
            </button>

            {/* KB info */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent3)", border: "1px solid rgba(79,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent2)" }}>
                <Icon name="database" size={12} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{currentKB.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--text3)", fontFamily: "var(--mono)" }}>{currentKB.doc_count ?? 0} 个片段</div>
              </div>
            </div>

            {/* RAG 状态标签 */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "var(--teal2)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 99, fontSize: 10.5, color: "var(--teal)", fontFamily: "var(--mono)" }}>
              <Icon name="zap" size={10} />查询扩展已启用
            </div>

            {/* Actions */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
              <Btn variant="ghost" size="sm" onClick={() => fetchDocs(activeKB)}>
                <Icon name="file" size={13} />文档
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => setShowAddContent(true)}>
                <Icon name="upload" size={13} />上传
              </Btn>
              {messages.length > 0 && (
                <button onClick={clearSession} title="清空对话"
                  style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 7px", cursor: "pointer", color: "var(--text3)", display: "flex", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)" }}>
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          </header>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 18px" }}>
            <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, minHeight: "100%" }}>
              {messages.length === 0
                ? <EmptyState hasKBs={kbs.length > 0} currentKB={currentKB} onCreate={() => setShowCreate(true)} onSend={sendMessage} />
                : messages.map((m, i) => (
                    <Message
                      key={m.id || i}
                      role={m.role}
                      content={m.content}
                      sources={m.sources}
                      expandedQueries={m.expandedQueries}
                      msgKey={m.msgKey}
                      isStreaming={m.id === streamingId}
                    />
                  ))
              }
              {loading && !streamingId && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, padding: "14px 18px 18px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <div
                style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 16, padding: "7px 8px 7px 14px", transition: "border-color 0.15s, box-shadow 0.15s" }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(79,140,255,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,140,255,0.08)" }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.boxShadow = "none" }}
              >
                <textarea
                  ref={el => { inputRef.current = el; textareaRef.current = el }}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="输入问题，Enter 发送 · Shift+Enter 换行…"
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
                    ? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite" }} />
                    : <Icon name="send" size={15} />
                  }
                </button>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text3)", textAlign: "center", marginTop: 7, fontFamily: "var(--mono)" }}>
                {currentKB.name} · 查询扩展 + MMR 检索
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateKBDialog isOpen={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreateKB} loading={creating} />
      <AddContentDialog isOpen={showAddContent} onClose={() => setShowAddContent(false)} kb={currentKB} onSuccess={fetchKBs} />
      <DocsModal isOpen={showDocs} onClose={() => setShowDocs(false)} kbId={activeKB} kbName={currentKB.name} docs={docs} loading={docsLoading} onDelete={handleDeleteDoc} />
      <DeleteKbModal isOpen={!!showDeleteKB} onClose={() => setShowDeleteKB(null)} kbId={showDeleteKB} kbName={kbs.find(k => k.id === showDeleteKB)?.name || ""} onConfirm={handleDeleteKB} />
      <Toast msg={toast} />
    </>
  )
}