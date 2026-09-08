export const COMPANION_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #07080D; color: #C8D8E8; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  #app { display: flex; min-height: 100%; }

  .companion { width: 100%; max-width: 660px; margin: 0 auto; padding: 20px 16px 32px; display: flex; flex-direction: column; gap: 14px; }

  .comp-header { display: flex; justify-content: space-between; align-items: center; }
  .comp-logo { display: flex; align-items: center; gap: 10px; }
  .comp-logo-mark { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 13px; background: linear-gradient(135deg,#1A6B9A,#2A9FD6); color:#fff; padding: 4px 8px; border-radius: 6px; letter-spacing:.04em; }
  .comp-logo-text { font-size: 14px; font-weight: 600; color: #8BAFC8; letter-spacing:.02em; }
  .comp-meta { display: flex; align-items: center; gap: 10px; }
  .comp-date { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A5570; letter-spacing:.04em; }
  .comp-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; color: #5BC4F5; background: #081524; border: 1px solid #1A3A55; padding: 3px 10px; border-radius: 20px; letter-spacing:.08em; transition: all .2s; }

  .stepper { display: flex; align-items: center; padding: 0 2px; }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
  .step::after { content:''; position:absolute; top:9px; left:calc(50% + 9px); right:calc(-50% + 9px); height:1px; background:#1A2535; transition:background .3s; }
  .step:last-child::after { display:none; }
  .step-dot { width:18px; height:18px; border-radius:50%; border:1.5px solid #1A2535; background:#0C1018; display:flex; align-items:center; justify-content:center; font-size:8px; color:#2A3A4A; font-family:'JetBrains Mono',monospace; font-weight:600; transition:all .3s; z-index:1; }
  .step-label { font-size:9px; color:#2A3A4A; letter-spacing:.04em; font-family:'JetBrains Mono',monospace; transition:color .3s; }
  .step.done .step-dot { background:#0D2B1A; border-color:#2D7A4A; color:#3DD68C; }
  .step.done .step-label { color:#2D7A4A; }
  .step.done::after { background:#1A3A2A; }
  .step.active .step-dot { background:#0D2340; border-color:#2B6CB0; color:#5BC4F5; box-shadow:0 0 8px rgba(91,196,245,.3); }
  .step.active .step-label { color:#5BC4F5; }

  .display-shell { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .display-bezel { position:relative; width:100%; max-width:576px; border-radius:10px; overflow:hidden; border:1.5px solid #111D2E; box-shadow:0 0 0 3px #070A0F, 0 0 24px rgba(0,0,0,.6); background:#000; }
  .display-scanlines { position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.06) 2px,rgba(0,0,0,.06) 4px); pointer-events:none; z-index:2; }
  .display-img { display:block; width:100%; height:auto; image-rendering:pixelated; image-rendering:crisp-edges; }
  .display-label { font-family:'JetBrains Mono',monospace; font-size:10px; color:#202E3E; letter-spacing:.06em; }

  .comp-controls { display:grid; grid-template-columns:2fr 2fr 1fr 1fr; gap:8px; }
  .ctrl-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:12px 8px; border:1.5px solid transparent; border-radius:10px; cursor:pointer; font-family:'Inter',system-ui; transition:all .15s; user-select:none; }
  .ctrl-btn:active { transform:scale(.96); }
  .ctrl-primary { background:linear-gradient(160deg,#1558A8,#1A6CC0); border-color:#2B7FD4; color:#fff; box-shadow:0 2px 8px rgba(26,108,192,.3); }
  .ctrl-primary:hover { background:linear-gradient(160deg,#1A6CC0,#2280D4); }
  .ctrl-secondary { background:#0C1018; border-color:#1A2535; color:#8BAFC8; }
  .ctrl-secondary:hover { background:#111820; border-color:#253545; color:#A8C4D8; }
  .ctrl-icon { font-size:16px; line-height:1; }
  .ctrl-label { font-size:10px; font-weight:500; letter-spacing:.04em; opacity:.8; }
  .comp-hint { text-align:center; font-size:11px; color:#1E2D3D; letter-spacing:.02em; }
`