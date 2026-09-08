import {
  waitForEvenAppBridge,
  TextContainerProperty,
  ImageContainerProperty,
  ImageRawDataUpdate,
  CreateStartUpPageContainer,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import { DW, DH, QW, QH, QUADS } from './constants'
import { state } from './state'
import { fmtDateShort } from './helpers'
import { toGray4, toPngUrl } from './rendering'
import { drawHome } from './screens/home'
import { drawOptions } from './screens/options'
import { drawComparison, comparisonMaxScroll } from './screens/comparison'
import { drawReview, reviewMaxScroll } from './screens/review'
import { drawPublish } from './screens/publish'
import { drawDone } from './screens/done'
import { STRATEGIES } from './data'

// ─── Event capture ─────────────────────────────────────────────────────────
// The G2 firmware allows only ONE event-capturing container per page, so a
// single full-screen invisible text container receives every ring gesture.
// A tap therefore performs the current screen's primary action (i.e. the
// drawn CTA button), which is the highest-fidelity "button" available here.
const C_GESTURE = 9

// ─── Render pipeline ───────────────────────────────────────────────────────

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = DW; c.height = DH
  return c
}

// Mapping of screen name → its drawing function
const DRAWERS: Record<typeof state.screen, (ctx: CanvasRenderingContext2D) => void> = {
  HOME:       drawHome,
  OPTIONS:    drawOptions,
  COMPARISON: drawComparison,
  REVIEW:     drawReview,
  PUBLISH:    drawPublish,
  DONE:       drawDone,
}

function drawCurrentScreen(): HTMLCanvasElement {
  const c = makeCanvas()
  const ctx = c.getContext('2d')!
  DRAWERS[state.screen](ctx)
  return c
}

// Split the 576×288 canvas into 4 quadrant canvases (288×144 each)
function splitQuadrants(src: HTMLCanvasElement): HTMLCanvasElement[] {
  return QUADS.map(q => {
    const qc  = document.createElement('canvas')
    qc.width  = QW; qc.height = QH
    const qctx = qc.getContext('2d')!
    qctx.drawImage(src, q.x, q.y, QW, QH, 0, 0, QW, QH)
    return qc
  })
}

// ─── Bridge ────────────────────────────────────────────────────────────────
const bridge = await waitForEvenAppBridge()

// All four image containers created once at startup; thereafter only pixel data is pushed
const imageContainers = QUADS.map(q => new ImageContainerProperty({
  xPosition: q.x, yPosition: q.y, width: QW, height: QH,
  containerID: q.id, containerName: q.name,
}))

// Thin off-screen capture container to receive ring gestures (tap / scroll)
const gestureContainer = new TextContainerProperty({
  xPosition: 0, yPosition: 0, width: DW, height: DH,
  borderWidth: 0, borderColor: 0, paddingLength: 0,
  containerID: C_GESTURE, containerName: 'gesture',
  content: '', isEventCapture: 1,
})

const created = await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 5,            // 4 image + 1 gesture-capture text
    textObject:  [gestureContainer],
    imageObject: imageContainers,
  }),
)
if (created !== 0) console.error('createStartUpPageContainer failed:', created)

// ─── Rendering ─────────────────────────────────────────────────────────────
let rendering: Promise<unknown> = Promise.resolve()

async function render() {
  rendering = rendering.then(async () => {
    const full  = drawCurrentScreen()
    const quads = splitQuadrants(full)
    for (let i = 0; i < QUADS.length; i++) {
      await bridge.updateImageRawData(new ImageRawDataUpdate({
        containerID:   QUADS[i].id,
        containerName: QUADS[i].name,
        imageData:     toGray4(quads[i]),
      }))
    }
  })
  await rendering
  mirrorCompanion()
}

await render()

// ─── Interaction handlers ──────────────────────────────────────────────────
function handleTap() {
  switch (state.screen) {
    case 'HOME':       state.screen = 'OPTIONS';    state.strategyIdx = 0; break
    case 'OPTIONS':    state.screen = 'COMPARISON'; state.compScroll = 0; break
    case 'COMPARISON': state.screen = 'REVIEW';     state.exScroll = 0; break
    case 'REVIEW':     state.screen = 'PUBLISH';    break
    case 'PUBLISH':    if (!state.published) { state.published = true; state.screen = 'DONE' } break
    case 'DONE': break
  }
  render().catch(console.error)
}

function handleDoubleTap() {
  switch (state.screen) {
    case 'HOME':
      bridge.shutDownPageContainer(1)
      cleanup()
      return
    case 'OPTIONS':    state.screen = 'HOME';       break
    case 'COMPARISON': state.screen = 'OPTIONS';    break
    case 'REVIEW':     state.screen = 'COMPARISON'; break
    case 'PUBLISH':    state.screen = 'REVIEW';     break
    case 'DONE':       state.screen = 'HOME'; state.published = false; break
  }
  render().catch(console.error)
}

function handleScrollUp() {
  if (state.screen === 'OPTIONS' && state.strategyIdx > 0) {
    state.strategyIdx--
    render().catch(console.error)
  } else if (state.screen === 'COMPARISON' && state.compScroll > 0) {
    state.compScroll = Math.max(0, state.compScroll - 46)
    render().catch(console.error)
  } else if (state.screen === 'REVIEW' && state.exScroll > 0) {
    state.exScroll = Math.max(0, state.exScroll - 93)
    render().catch(console.error)
  }
}

function handleScrollDown() {
  if (state.screen === 'OPTIONS' && state.strategyIdx < STRATEGIES.length - 1) {
    state.strategyIdx++
    render().catch(console.error)
  } else if (state.screen === 'COMPARISON') {
    const maxOffset = comparisonMaxScroll()
    if (state.compScroll < maxOffset) {
      state.compScroll = Math.min(maxOffset, state.compScroll + 46)
      render().catch(console.error)
    }
  } else if (state.screen === 'REVIEW') {
    const maxOffset = reviewMaxScroll()
    if (state.exScroll < maxOffset) {
      state.exScroll = Math.min(maxOffset, state.exScroll + 93)
      render().catch(console.error)
    }
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────
let cleanedUp = false
function cleanup() {
  if (cleanedUp) return
  cleanedUp = true
  unsubscribe()
}

function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

const unsubscribe = bridge.onEvenHubEvent(event => {
  const sysType  = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)

  if (
    sysType  === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    textType === OsEventTypeList.DOUBLE_CLICK_EVENT
  ) { handleDoubleTap(); return }

  if (sysType === OsEventTypeList.SCROLL_TOP_EVENT    || textType === OsEventTypeList.SCROLL_TOP_EVENT)
    { handleScrollUp();   return }
  if (sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT || textType === OsEventTypeList.SCROLL_BOTTOM_EVENT)
    { handleScrollDown(); return }

  if (
    sysType  === OsEventTypeList.CLICK_EVENT ||
    textType === OsEventTypeList.CLICK_EVENT
  ) { handleTap(); return }

  if (
    sysType === OsEventTypeList.SYSTEM_EXIT_EVENT ||
    sysType === OsEventTypeList.ABNORMAL_EXIT_EVENT
  ) { cleanup() }
})

window.addEventListener('beforeunload', cleanup)

// ─── Companion web UI ──────────────────────────────────────────────────────
const STEPS: typeof state.screen[] = ['HOME', 'OPTIONS', 'COMPARISON', 'REVIEW', 'PUBLISH', 'DONE']

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
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
    <div class="display-label">G2  ·  576 × 288  ·  UPNG-rendered  ·  gray4</div>
  </div>

  <div class="comp-controls">
    <button class="ctrl-btn ctrl-primary"   id="btnTap">    <span class="ctrl-icon">→</span><span class="ctrl-label">Tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDouble"> <span class="ctrl-icon">↩</span><span class="ctrl-label">Double-tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnUp">     <span class="ctrl-icon">↑</span><span class="ctrl-label">Scroll up</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDown">   <span class="ctrl-icon">↓</span><span class="ctrl-label">Scroll down</span></button>
  </div>
  <p class="comp-hint">Buttons simulate G2 ring gestures</p>
</div>
`

const style = document.createElement('style')
style.textContent = `
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
document.head.appendChild(style)

const compDate = document.getElementById('compDate')
if (compDate) compDate.textContent = `${fmtDateShort()} ${new Date().getUTCFullYear()}  ·  GOI`

document.getElementById('btnTap')!   .addEventListener('click', handleTap)
document.getElementById('btnDouble')!.addEventListener('click', handleDoubleTap)
document.getElementById('btnUp')!    .addEventListener('click', handleScrollUp)
document.getElementById('btnDown')!  .addEventListener('click', handleScrollDown)

// ─── Companion mirror ──────────────────────────────────────────────────────
function mirrorCompanion() {
  const badge   = document.getElementById('screenBadge') as HTMLElement | null
  const dispImg = document.getElementById('displayImg')  as HTMLImageElement | null
  const stepper = document.getElementById('stepper')     as HTMLElement | null
  if (!badge || !dispImg || !stepper) return

  badge.textContent = state.screen

  // Render full canvas and encode via UPNG for the companion preview
  dispImg.src = toPngUrl(drawCurrentScreen())

  const activeIdx = STEPS.indexOf(state.screen)
  stepper.innerHTML = STEPS.map((s, i) => {
    const cls = i < activeIdx ? 'step done' : i === activeIdx ? 'step active' : 'step'
    const dot = i < activeIdx ? '✓' : `${i + 1}`
    return `<div class="${cls}"><div class="step-dot">${dot}</div><div class="step-label">${s}</div></div>`
  }).join('')
}

mirrorCompanion()