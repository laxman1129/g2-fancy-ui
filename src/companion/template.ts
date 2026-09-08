export const COMPANION_TEMPLATE = `
<div class="companion">
  <header class="comp-header">
    <div class="comp-logo">
      <span class="comp-logo-mark">A1</span>
      <span class="comp-logo-text">Disruption Optimizer</span>
    </div>
    <div class="comp-meta">
      <span class="comp-date" id="compDate">— · GOI</span>
      <span class="comp-badge" id="screenBadge">HOME</span>
    </div>
  </header>

  <div class="stepper" id="stepper"></div>

  <div class="display-shell">
    <div class="display-bezel">
      <div class="display-scanlines"></div>
      <img class="display-img" id="displayImg" alt="G2 display" />
    </div>
    <div class="display-label">G2  ·  576 × 288  ·  UPNG-rendered  ·  gray4  ·  <span id="voiceStatus">VOICE ···</span></div>
  </div>

  <div class="comp-controls">
    <button class="ctrl-btn ctrl-primary"   id="btnTap">    <span class="ctrl-icon">→</span><span class="ctrl-label">Tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDouble"> <span class="ctrl-icon">↩</span><span class="ctrl-label">Double-tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnUp">     <span class="ctrl-icon">↑</span><span class="ctrl-label">Scroll up</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDown">   <span class="ctrl-icon">↓</span><span class="ctrl-label">Scroll down</span></button>
  </div>
  <p class="comp-hint">Buttons simulate G2 ring gestures  ·  Voice: ok=tap, back=double-tap, next=scroll up, previous=scroll down · also: options, strategy b, publish, confirm</p>
</div>
`